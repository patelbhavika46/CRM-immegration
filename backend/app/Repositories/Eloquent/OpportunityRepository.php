<?php

namespace App\Repositories\Eloquent;

use App\Models\Opportunity;
use App\Models\OpportunityStageHistory;
use App\Repositories\Contracts\OpportunityRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class OpportunityRepository implements OpportunityRepositoryInterface
{
    public function paginate(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = Opportunity::query()->withSummaryRelations();

        $this->applyFilters($query, $filters);

        $sortField = $this->resolveSortField($filters['sort'] ?? 'created_at');
        $sortDir   = strtolower($filters['sort_dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sortField, $sortDir)->paginate($perPage);
    }

    public function allGroupedByStage(array $filters): array
    {
        $query = Opportunity::query()
            ->withSummaryRelations()
            ->open();                  // Kanban only shows open stages

        // Scope to owner for consultants
        if (!empty($filters['owner_id'])) {
            $query->byOwner((int) $filters['owner_id']);
        }

        if (!empty($filters['client_id'])) {
            $query->byClient((int) $filters['client_id']);
        }

        $opps = $query->orderBy('updated_at', 'desc')->get();

        // Build the ordered columns including all stages
        $grouped = [];
        foreach (Opportunity::STAGES as $stage) {
            if (in_array($stage, Opportunity::CLOSED_STAGES, true)) {
                continue; // Closed stages are not shown on the Kanban board
            }
            $grouped[$stage] = [
                'stage'       => $stage,
                'label'       => $this->stageLabel($stage),
                'total_value' => 0.0,
                'items'       => [],
            ];
        }

        foreach ($opps as $opp) {
            if (!isset($grouped[$opp->stage])) {
                continue;
            }
            $grouped[$opp->stage]['items'][]      = $opp;
            $grouped[$opp->stage]['total_value'] += (float) ($opp->amount ?? 0);
        }

        return array_values($grouped);
    }

    public function findOrFail(int $id): Opportunity
    {
        return Opportunity::with([
            'client:id,name,case_reference,case_status',
            'applicant:id,first_name,last_name,visa_type',
            'owner:id,first_name,last_name',
            'lead:id,first_name,last_name',
            'stageHistory.changedBy:id,first_name,last_name',
        ])->findOrFail($id);
    }

    public function create(array $data): Opportunity
    {
        $opp = Opportunity::create($data);

        // Record initial stage in history
        OpportunityStageHistory::create([
            'opportunity_id' => $opp->id,
            'from_stage'     => null,
            'to_stage'       => $opp->stage,
            'note'           => 'Opportunity created.',
            'changed_by'     => auth()->id(),
            'changed_at'     => now(),
        ]);

        return $opp->load(['client:id,name', 'owner:id,first_name,last_name']);
    }

    public function update(Opportunity $opportunity, array $data): Opportunity
    {
        $opportunity->update($data);

        return $opportunity->fresh(['client:id,name', 'owner:id,first_name,last_name']);
    }

    public function delete(Opportunity $opportunity): void
    {
        $opportunity->delete();
    }

    public function updateStage(Opportunity $opportunity, string $stage, ?string $note): Opportunity
    {
        $previousStage = $opportunity->stage;

        $opportunity->update([
            'stage'       => $stage,
            'probability' => Opportunity::STAGE_PROBABILITY[$stage],
        ]);

        OpportunityStageHistory::create([
            'opportunity_id' => $opportunity->id,
            'from_stage'     => $previousStage,
            'to_stage'       => $stage,
            'note'           => $note,
            'changed_by'     => auth()->id(),
            'changed_at'     => now(),
        ]);

        return $opportunity->fresh([
            'client:id,name',
            'owner:id,first_name,last_name',
            'stageHistory.changedBy:id,first_name,last_name',
        ]);
    }

    public function pipelineSummary(?int $ownerId = null): array
    {
        $query = Opportunity::query()
            ->open()
            ->select([
                'stage',
                DB::raw('COUNT(*) as count'),
                DB::raw('COALESCE(SUM(amount), 0) as total_amount'),
                DB::raw('COALESCE(SUM(amount * probability / 100), 0) as weighted_amount'),
            ])
            ->groupBy('stage');

        if ($ownerId) {
            $query->byOwner($ownerId);
        }

        $rows = $query->get()->keyBy('stage');

        return collect(Opportunity::STAGES)
            ->filter(fn ($s) => !in_array($s, Opportunity::CLOSED_STAGES, true))
            ->map(fn ($stage) => [
                'stage'           => $stage,
                'label'           => $this->stageLabel($stage),
                'count'           => (int) ($rows[$stage]->count ?? 0),
                'total_amount'    => (float) ($rows[$stage]->total_amount ?? 0),
                'weighted_amount' => (float) ($rows[$stage]->weighted_amount ?? 0),
            ])
            ->values()
            ->all();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function applyFilters($query, array $filters): void
    {
        if (!empty($filters['stage'])) {
            // Accept a single stage or comma-separated list (for multi-filter)
            $stages = array_filter(explode(',', $filters['stage']));
            $query->byStages($stages);
        }

        if (!empty($filters['owner_id'])) {
            $query->byOwner((int) $filters['owner_id']);
        }

        if (!empty($filters['client_id'])) {
            $query->byClient((int) $filters['client_id']);
        }

        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        if (!empty($filters['open_only'])) {
            $query->open();
        }

        if (!empty($filters['overdue'])) {
            $query->overdue();
        }

        if (!empty($filters['closing_from']) && !empty($filters['closing_to'])) {
            $query->closingBetween($filters['closing_from'], $filters['closing_to']);
        }

        if (!empty($filters['min_amount'])) {
            $query->where('amount', '>=', (float) $filters['min_amount']);
        }

        if (!empty($filters['max_amount'])) {
            $query->where('amount', '<=', (float) $filters['max_amount']);
        }

        // Consultants only see their own records
        if (auth()->user()?->hasRole('consultant')) {
            $query->where(function ($q) {
                $q->where('owner_id', auth()->id())
                  ->orWhere('created_by', auth()->id());
            });
        }
    }

    private function resolveSortField(string $field): string
    {
        return match ($field) {
            'name'       => 'name',
            'amount'     => 'amount',
            'close_date' => 'close_date',
            'stage'      => 'stage',
            'probability'=> 'probability',
            default      => 'created_at',
        };
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
