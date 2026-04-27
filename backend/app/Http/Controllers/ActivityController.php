<?php

namespace App\Http\Controllers;

use App\Http\Requests\Activity\StoreActivityRequest;
use App\Http\Requests\Activity\UpdateActivityRequest;
use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use App\Repositories\Contracts\ActivityRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function __construct(
        private readonly ActivityRepositoryInterface $activities,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Activity::class);

        $filters = $request->only([
            'type', 'status', 'assigned_to', 'relatable_type', 'relatable_id',
            'due_date_from', 'due_date_to', 'overdue', 'search',
        ]);
        $paginator = $this->activities->paginate($filters, $request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => ActivityResource::collection($paginator),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(StoreActivityRequest $request): JsonResponse
    {
        $this->authorize('create', Activity::class);

        $activity = $this->activities->create(
            array_merge($request->validated(), ['created_by' => auth()->id()])
        );

        return response()->json([
            'success' => true,
            'message' => 'Activity created successfully.',
            'data'    => new ActivityResource($activity),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $activity = $this->activities->findOrFail($id);
        $this->authorize('view', $activity);

        return response()->json(['success' => true, 'data' => new ActivityResource($activity)]);
    }

    public function update(UpdateActivityRequest $request, int $id): JsonResponse
    {
        $activity = $this->activities->findOrFail($id);
        $this->authorize('update', $activity);

        $activity = $this->activities->update($activity, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Activity updated successfully.',
            'data'    => new ActivityResource($activity),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $activity = $this->activities->findOrFail($id);
        $this->authorize('delete', $activity);

        $this->activities->delete($activity);

        return response()->json(['success' => true, 'message' => 'Activity deleted successfully.']);
    }

    public function complete(Request $request, int $id): JsonResponse
    {
        $request->validate(['outcome' => 'nullable|string|max:5000']);

        $activity = $this->activities->findOrFail($id);
        $this->authorize('complete', $activity);

        if ($activity->status === 'completed') {
            return response()->json(['success' => false, 'message' => 'Activity is already completed.'], 422);
        }

        $activity = $this->activities->complete($activity, $request->outcome);

        return response()->json([
            'success' => true,
            'message' => 'Activity marked as completed.',
            'data'    => new ActivityResource($activity),
        ]);
    }
}
