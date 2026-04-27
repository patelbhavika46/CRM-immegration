<?php

namespace App\Http\Controllers;

use App\Http\Requests\Opportunity\OpportunityFilterRequest;
use App\Http\Requests\Opportunity\StoreOpportunityRequest;
use App\Http\Requests\Opportunity\UpdateOpportunityRequest;
use App\Http\Requests\Opportunity\UpdateStageRequest;
use App\Http\Resources\OpportunityResource;
use App\Models\Opportunity;
use App\Repositories\Contracts\OpportunityRepositoryInterface;
use Illuminate\Http\JsonResponse;

class OpportunityController extends Controller
{
    public function __construct(
        private readonly OpportunityRepositoryInterface $repo,
    ) {}

    // ── GET /opportunities ────────────────────────────────────────────────────

    /**
     * Paginated list with full filter / sort support.
     *
     * Query params:
     *   stage, owner_id, client_id, search, open_only, overdue,
     *   closing_from, closing_to, min_amount, max_amount,
     *   sort, sort_dir, per_page, page
     */
    public function index(OpportunityFilterRequest $request): JsonResponse
    {
        $this->authorize('viewAny', Opportunity::class);

        $paginator = $this->repo->paginate(
            $request->filters(),
            $request->integer('per_page', 20),
        );

        return response()->json([
            'success' => true,
            'data'    => OpportunityResource::collection($paginator),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    // ── GET /opportunities/kanban ─────────────────────────────────────────────

    /**
     * Returns all open opportunities grouped by stage for Kanban rendering.
     * Accepts owner_id and client_id filters — no pagination.
     *
     * Response shape:
     * [
     *   { stage, label, total_value, items: OpportunityResource[] },
     *   ...
     * ]
     */
    public function kanban(OpportunityFilterRequest $request): JsonResponse
    {
        $this->authorize('viewAny', Opportunity::class);

        $columns = $this->repo->allGroupedByStage($request->only(['owner_id', 'client_id']));

        $response = array_map(function (array $col) {
            return [
                'stage'       => $col['stage'],
                'label'       => $col['label'],
                'total_value' => $col['total_value'],
                'items'       => OpportunityResource::collection($col['items']),
            ];
        }, $columns);

        return response()->json(['success' => true, 'data' => $response]);
    }

    // ── POST /opportunities ───────────────────────────────────────────────────

    public function store(StoreOpportunityRequest $request): JsonResponse
    {
        $this->authorize('create', Opportunity::class);

        $opportunity = $this->repo->create(
            array_merge($request->validated(), ['created_by' => auth()->id()])
        );

        return response()->json([
            'success' => true,
            'message' => 'Opportunity created successfully.',
            'data'    => new OpportunityResource($opportunity),
        ], 201);
    }

    // ── GET /opportunities/{id} ───────────────────────────────────────────────

    public function show(int $id): JsonResponse
    {
        $opportunity = $this->repo->findOrFail($id);
        $this->authorize('view', $opportunity);

        return response()->json([
            'success' => true,
            'data'    => new OpportunityResource($opportunity),
        ]);
    }

    // ── PUT /opportunities/{id} ───────────────────────────────────────────────

    public function update(UpdateOpportunityRequest $request, int $id): JsonResponse
    {
        $opportunity = $this->repo->findOrFail($id);
        $this->authorize('update', $opportunity);

        // If a stage change is smuggled into a full update, route it through
        // the proper transition logic to keep history consistent.
        $data = $request->validated();

        if (isset($data['stage']) && $data['stage'] !== $opportunity->stage) {
            $this->guardTransition($opportunity, $data['stage']);
            $opportunity = $this->repo->updateStage(
                $opportunity,
                $data['stage'],
                'Stage updated via record edit.',
            );
            unset($data['stage'], $data['probability']);
        }

        if (!empty($data)) {
            $opportunity = $this->repo->update($opportunity, $data);
        }

        return response()->json([
            'success' => true,
            'message' => 'Opportunity updated successfully.',
            'data'    => new OpportunityResource($opportunity),
        ]);
    }

    // ── DELETE /opportunities/{id} ────────────────────────────────────────────

    public function destroy(int $id): JsonResponse
    {
        $opportunity = $this->repo->findOrFail($id);
        $this->authorize('delete', $opportunity);

        $this->repo->delete($opportunity);

        return response()->json([
            'success' => true,
            'message' => 'Opportunity deleted successfully.',
        ]);
    }

    // ── PATCH /opportunities/{id}/stage ───────────────────────────────────────

    /**
     * Dedicated stage-transition endpoint for drag-and-drop Kanban moves.
     *
     * Body: { stage: string, note?: string }
     *
     * Validates the requested stage is a legal transition from the current one,
     * auto-sets probability, writes stage history, and returns the updated record.
     */
    public function updateStage(UpdateStageRequest $request, int $id): JsonResponse
    {
        $opportunity = $this->repo->findOrFail($id);
        $this->authorize('updateStage', $opportunity);

        $targetStage = $request->getStage();

        // Guard: no-op if already on the requested stage
        if ($opportunity->stage === $targetStage) {
            return response()->json([
                'success' => true,
                'message' => 'Opportunity is already in that stage.',
                'data'    => new OpportunityResource($opportunity),
            ]);
        }

        // Guard: transition rules
        $this->guardTransition($opportunity, $targetStage);

        $opportunity = $this->repo->updateStage($opportunity, $targetStage, $request->getNote());

        return response()->json([
            'success' => true,
            'message' => "Opportunity moved to \"{$this->stageLabel($targetStage)}\".",
            'data'    => new OpportunityResource($opportunity),
        ]);
    }

    // ── GET /opportunities/pipeline-summary ───────────────────────────────────

    /**
     * Aggregated weighted-value summary per stage — used for Dashboard KPI cards.
     * Accessible via: GET /api/v1/reports/pipeline (wired in ReportController).
     * Exposed here for convenience as an additional endpoint.
     */
    public function pipelineSummary(): JsonResponse
    {
        $this->authorize('viewAny', Opportunity::class);

        $ownerId = auth()->user()?->hasRole('consultant') ? auth()->id() : null;

        return response()->json([
            'success' => true,
            'data'    => $this->repo->pipelineSummary($ownerId),
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function guardTransition(Opportunity $opportunity, string $targetStage): void
    {
        if (!Opportunity::isValidTransition($opportunity->stage, $targetStage)) {
            abort(422, sprintf(
                'Cannot move opportunity from "%s" to "%s". Closed opportunities cannot be re-opened.',
                $opportunity->stage,
                $targetStage,
            ));
        }
    }

    private function stageLabel(string $stage): string
    {
        return match ($stage) {
            'prospecting'   => 'Prospecting',
            'qualification' => 'Qualification',
            'proposal'      => 'Proposal',
            'negotiation'   => 'Negotiation',
            'closed_won'    => 'Closed Won',
            'closed_lost'   => 'Closed Lost',
            default         => ucfirst($stage),
        };
    }
}
