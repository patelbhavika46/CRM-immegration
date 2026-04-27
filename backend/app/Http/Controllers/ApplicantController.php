<?php

namespace App\Http\Controllers;

use App\Http\Requests\Applicant\StoreApplicantRequest;
use App\Http\Requests\Applicant\UpdateApplicantRequest;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\ApplicantResource;
use App\Http\Resources\DocumentResource;
use App\Models\Applicant;
use App\Repositories\Contracts\ApplicantRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ApplicantController extends Controller
{
    public function __construct(
        private readonly ApplicantRepositoryInterface $applicants,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Applicant::class);

        $filters   = $request->only(['search', 'client_id', 'visa_type', 'immigration_status', 'relationship']);
        $paginator = $this->applicants->paginate($filters, $request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => ApplicantResource::collection($paginator),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(StoreApplicantRequest $request): JsonResponse
    {
        $this->authorize('create', Applicant::class);

        $applicant = $this->applicants->create(
            array_merge($request->validated(), ['created_by' => auth()->id()])
        );

        return response()->json([
            'success' => true,
            'message' => 'Applicant created successfully.',
            'data'    => new ApplicantResource($applicant),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $applicant = $this->applicants->findOrFail($id);
        $this->authorize('view', $applicant);

        return response()->json(['success' => true, 'data' => new ApplicantResource($applicant)]);
    }

    public function update(UpdateApplicantRequest $request, int $id): JsonResponse
    {
        $applicant = $this->applicants->findOrFail($id);
        $this->authorize('update', $applicant);

        $applicant = $this->applicants->update($applicant, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Applicant updated successfully.',
            'data'    => new ApplicantResource($applicant),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $applicant = $this->applicants->findOrFail($id);
        $this->authorize('delete', $applicant);

        $this->applicants->delete($applicant);

        return response()->json(['success' => true, 'message' => 'Applicant deleted successfully.']);
    }

    public function activities(Request $request, int $id): JsonResponse
    {
        $applicant = $this->applicants->findOrFail($id);
        $this->authorize('view', $applicant);

        $query = $applicant->activities()
            ->with('assignedTo:id,first_name,last_name')
            ->latest();

        // Optional type filter (comma-separated)
        if ($request->filled('type')) {
            $types = explode(',', $request->string('type'));
            count($types) === 1
                ? $query->where('type', $types[0])
                : $query->whereIn('type', $types);
        }

        $activities = $query->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => ActivityResource::collection($activities),
            'meta'    => [
                'current_page' => $activities->currentPage(),
                'per_page'     => $activities->perPage(),
                'total'        => $activities->total(),
                'last_page'    => $activities->lastPage(),
            ],
        ]);
    }

    public function storeActivity(Request $request, int $id): JsonResponse
    {
        $applicant = $this->applicants->findOrFail($id);
        $this->authorize('update', $applicant);

        $validated = $request->validate([
            'type'    => ['required', Rule::in(['client_call','email','meeting','gov_submission','internal_task','document_request','sms','note'])],
            'subject' => 'required|string|max:300',
            'notes'   => 'nullable|string|max:5000',
            'due_date'          => 'nullable|date',
            'due_time'          => 'nullable|date_format:H:i',
            'status'            => ['nullable', Rule::in(['pending','scheduled','in_progress','completed','cancelled'])],
            'application_stage' => 'nullable|string|max:100',
            'assigned_to'       => 'nullable|exists:users,id',
        ]);

        if (empty($validated['status']))      $validated['status']      = 'pending';
        if (empty($validated['assigned_to'])) $validated['assigned_to'] = auth()->id();

        $activity = $applicant->activities()->create(array_merge(
            $validated,
            [
                'relatable_type' => Applicant::class,
                'relatable_id'   => $applicant->id,
                'created_by'     => auth()->id(),
            ]
        ));

        $activity->load('assignedTo:id,first_name,last_name');

        return response()->json([
            'success' => true,
            'message' => 'Activity logged successfully.',
            'data'    => new ActivityResource($activity),
        ], 201);
    }

    public function documents(int $id): JsonResponse
    {
        $applicant = $this->applicants->findOrFail($id);
        $this->authorize('view', $applicant);

        return response()->json([
            'success' => true,
            'data'    => DocumentResource::collection(
                $applicant->documents()->with('uploadedBy:id,first_name,last_name')->get()
            ),
        ]);
    }
}
