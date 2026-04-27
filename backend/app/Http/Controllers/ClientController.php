<?php

namespace App\Http\Controllers;

use App\Http\Requests\Client\StoreClientRequest;
use App\Http\Requests\Client\UpdateClientRequest;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\ApplicantResource;
use App\Http\Resources\ClientResource;
use App\Http\Resources\DocumentResource;
use App\Models\Applicant;
use App\Models\Client;
use App\Repositories\Contracts\ClientRepositoryInterface;
use App\Services\ClientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClientController extends Controller
{
    public function __construct(
        private readonly ClientRepositoryInterface $clients,
        private readonly ClientService $service,
    ) {}

    // ── CRUD ──────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Client::class);

        $filters   = $request->only(['search', 'case_status', 'service_type', 'consultant_id', 'type', 'is_active']);
        $paginator = $this->clients->paginate($filters, $request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => ClientResource::collection($paginator),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(StoreClientRequest $request): JsonResponse
    {
        $this->authorize('create', Client::class);

        $validated      = $request->validated();
        $primaryContact = $validated['primary_contact'] ?? null;
        unset($validated['primary_contact']);

        $client = $this->service->create($validated, $primaryContact);

        return response()->json([
            'success' => true,
            'message' => 'Client created successfully.',
            'data'    => new ClientResource($client),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $client = $this->clients->findOrFail($id);
        $this->authorize('view', $client);

        return response()->json(['success' => true, 'data' => new ClientResource($client)]);
    }

    public function update(UpdateClientRequest $request, int $id): JsonResponse
    {
        $client = $this->clients->findOrFail($id);
        $this->authorize('update', $client);

        $client = $this->clients->update($client, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Client updated successfully.',
            'data'    => new ClientResource($client),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $client = $this->clients->findOrFail($id);
        $this->authorize('delete', $client);

        $this->clients->delete($client);

        return response()->json(['success' => true, 'message' => 'Client deleted successfully.']);
    }

    // ── Sub-resources ─────────────────────────────────────────────────────────

    public function applicants(Request $request, int $id): JsonResponse
    {
        $client = $this->clients->findOrFail($id);
        $this->authorize('view', $client);

        return response()->json([
            'success' => true,
            'data'    => ApplicantResource::collection($client->applicants()->latest()->get()),
        ]);
    }

    public function storeApplicant(Request $request, int $id): JsonResponse
    {
        $client = $this->clients->findOrFail($id);
        $this->authorize('update', $client);

        $validated = $request->validate([
            'first_name'         => 'required|string|max:100',
            'last_name'          => 'required|string|max:100',
            'email'              => 'nullable|email|max:255',
            'phone'              => 'nullable|string|max:30',
            'date_of_birth'      => 'nullable|date|before:today',
            'nationality'        => 'nullable|string|max:100',
            'passport_number'    => 'nullable|string|max:50',
            'passport_expiry'    => 'nullable|date|after:today',
            'current_address'    => 'nullable|string|max:500',
            'relationship'       => ['nullable', Rule::in(['primary','spouse','child','dependent','other'])],
            'visa_type'          => 'nullable|string|max:50',
            'application_id'     => 'nullable|string|max:100',
            'immigration_status' => 'nullable|string|max:50',
            'submission_date'    => 'nullable|date',
            'notes'              => 'nullable|string|max:5000',
        ]);

        $applicant = Applicant::create(array_merge(
            $validated,
            ['client_id' => $client->id, 'created_by' => auth()->id()]
        ));

        return response()->json([
            'success' => true,
            'message' => 'Applicant added to client.',
            'data'    => new ApplicantResource($applicant),
        ], 201);
    }

    public function linkApplicant(Request $request, int $id, int $applicantId): JsonResponse
    {
        $client = $this->clients->findOrFail($id);
        $this->authorize('update', $client);

        $applicant = Applicant::findOrFail($applicantId);

        if ($applicant->client_id && $applicant->client_id !== $client->id) {
            return response()->json([
                'success' => false,
                'message' => 'This applicant is already linked to another client.',
            ], 422);
        }

        $this->clients->linkApplicant($client, $applicantId);

        return response()->json([
            'success' => true,
            'message' => 'Applicant linked successfully.',
            'data'    => new ApplicantResource($applicant->fresh()),
        ]);
    }

    public function unlinkApplicant(int $id, int $applicantId): JsonResponse
    {
        $client = $this->clients->findOrFail($id);
        $this->authorize('update', $client);

        $applicant = Applicant::where('id', $applicantId)->where('client_id', $client->id)->firstOrFail();

        if ($applicant->relationship === 'primary') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot unlink the primary applicant. Reassign the role first.',
            ], 422);
        }

        $this->clients->unlinkApplicant($client, $applicantId);

        return response()->json(['success' => true, 'message' => 'Applicant unlinked successfully.']);
    }

    public function activities(Request $request, int $id): JsonResponse
    {
        $client = $this->clients->findOrFail($id);
        $this->authorize('view', $client);

        $query = $client->activities()
            ->with('assignedTo:id,first_name,last_name')
            ->latest();

        if ($request->filled('type')) {
            $types = array_filter(explode(',', $request->input('type')));
            if (count($types) === 1) {
                $query->byType($types[0]);
            } elseif (count($types) > 1) {
                $query->whereIn('type', $types);
            }
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
        $client = $this->clients->findOrFail($id);
        $this->authorize('update', $client);

        $validated = $request->validate([
            'type'              => ['required', Rule::in(['client_call','email','meeting','gov_submission','internal_task','document_request','sms','note'])],
            'subject'           => 'required|string|max:300',
            'notes'             => 'nullable|string|max:5000',
            'due_date'          => 'nullable|date',
            'due_time'          => 'nullable|date_format:H:i',
            'status'            => ['nullable', Rule::in(['pending','scheduled','in_progress','completed','cancelled'])],
            'application_stage' => 'nullable|string|max:100',
            'assigned_to'       => 'nullable|exists:users,id',
        ]);

        if (empty($validated['status']))      $validated['status']      = 'pending';
        if (empty($validated['assigned_to'])) $validated['assigned_to'] = auth()->id();

        $activity = $client->activities()->create(array_merge(
            $validated,
            [
                'relatable_type' => Client::class,
                'relatable_id'   => $client->id,
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

    public function documents(Request $request, int $id): JsonResponse
    {
        $client = $this->clients->findOrFail($id);
        $this->authorize('view', $client);

        $documents = $client->documents()
            ->with('uploadedBy:id,first_name,last_name')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data'    => DocumentResource::collection($documents),
        ]);
    }

    public function payments(int $id): JsonResponse
    {
        $client = $this->clients->findOrFail($id);
        $this->authorize('view', $client);

        return response()->json([
            'success' => true,
            'data'    => $client->payments()->latest()->get()->map(fn ($p) => [
                'id'          => $p->id,
                'amount'      => (float) $p->amount,
                'currency'    => $p->currency,
                'status'      => $p->status,
                'description' => $p->description,
                'paid_at'     => $p->paid_at?->toDateString(),
            ]),
        ]);
    }

    public function addNote(Request $request, int $id): JsonResponse
    {
        $request->validate(['content' => 'required|string|max:5000']);

        $client = $this->clients->findOrFail($id);
        $this->authorize('update', $client);

        $existing  = $client->notes ?? '';
        $timestamp = now()->format('Y-m-d H:i');
        $author    = auth()->user()->full_name;

        $this->clients->update($client, [
            'notes' => trim("{$existing}\n\n[{$timestamp} — {$author}]\n{$request->content}"),
        ]);

        return response()->json(['success' => true, 'message' => 'Note added successfully.']);
    }
}
