<?php

namespace App\Http\Controllers;

use App\Http\Requests\Lead\StoreLeadRequest;
use App\Http\Requests\Lead\UpdateLeadRequest;
use App\Http\Requests\Lead\ConvertLeadRequest;
use App\Http\Resources\ConversionResource;
use App\Http\Resources\LeadResource;
use App\Models\Lead;
use App\Repositories\Contracts\LeadRepositoryInterface;
use App\Services\LeadConversion\LeadConversionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function __construct(
        private readonly LeadRepositoryInterface $leads,
        private readonly LeadConversionService $conversionService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Lead::class);

        $filters = $request->only(['status', 'source', 'owner_id', 'search', 'sort_by', 'sort_dir']);
        $leads   = $this->leads->paginate($filters, $request->integer('per_page', 20));

        return \response()->json([
            'success' => true,
            'data'    => LeadResource::collection($leads),
            'meta'    => [
                'current_page' => $leads->currentPage(),
                'per_page'     => $leads->perPage(),
                'total'        => $leads->total(),
                'last_page'    => $leads->lastPage(),
            ],
        ]);
    }

    public function store(StoreLeadRequest $request): JsonResponse
    {
        $this->authorize('create', Lead::class);

        $lead = $this->leads->create(
            array_merge($request->validated(), ['created_by' => auth()->id()])
        );

        return \response()->json([
            'success' => true,
            'message' => 'Lead created successfully.',
            'data'    => new LeadResource($lead),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $lead = $this->leads->findOrFail($id);
        $this->authorize('view', $lead);

        return \response()->json(['success' => true, 'data' => new LeadResource($lead)]);
    }

    public function update(UpdateLeadRequest $request, int $id): JsonResponse
    {
        $lead = $this->leads->findOrFail($id);
        $this->authorize('update', $lead);

        $lead = $this->leads->update($lead, $request->validated());

        return \response()->json([
            'success' => true,
            'message' => 'Lead updated successfully.',
            'data'    => new LeadResource($lead),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $lead = $this->leads->findOrFail($id);
        $this->authorize('delete', $lead);

        $this->leads->delete($lead);

        return \response()->json(['success' => true, 'message' => 'Lead deleted successfully.']);
    }

    public function convert(ConvertLeadRequest $request, int $id): JsonResponse
    {
        $lead = $this->leads->findOrFail($id);
        $this->authorize('convert', $lead);

        try {
            $result = $this->conversionService->convert($lead, $request->validated());
        } catch (\RuntimeException $e) {
            return \response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'code'    => 422,
            ], 422);
        }

        return \response()->json([
            'success' => true,
            'message' => 'Lead converted successfully.',
            'data'    => (new ConversionResource($result))->toArray($request),
        ], 201);
    }

    public function assign(Request $request, int $id): JsonResponse
    {
        $request->validate(['owner_id' => 'required|exists:users,id']);

        $lead = $this->leads->findOrFail($id);
        $this->authorize('assign', $lead);

        $lead = $this->leads->update($lead, ['owner_id' => $request->owner_id]);

        return \response()->json([
            'success' => true,
            'message' => 'Lead assigned successfully.',
            'data'    => new LeadResource($lead),
        ]);
    }
}
