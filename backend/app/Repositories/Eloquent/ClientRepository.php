<?php

namespace App\Repositories\Eloquent;

use App\Models\Applicant;
use App\Models\Client;
use App\Repositories\Contracts\ClientRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ClientRepository implements ClientRepositoryInterface
{
    public function paginate(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = Client::query()
            ->withCount(['applicants', 'activities', 'documents', 'opportunities'])
            ->with([
                'consultant:id,first_name,last_name',
                'applicants' => fn ($q) => $q->where('relationship', 'primary')
                    ->select('id', 'client_id', 'first_name', 'last_name', 'email', 'phone', 'relationship'),
            ]);

        if (!empty($filters['search']))        $query->search($filters['search']);
        if (!empty($filters['case_status']))   $query->byStatus($filters['case_status']);
        if (!empty($filters['service_type']))  $query->byServiceType($filters['service_type']);
        if (!empty($filters['consultant_id'])) $query->byConsultant((int) $filters['consultant_id']);
        if (!empty($filters['type']))          $query->where('type', $filters['type']);

        if (isset($filters['is_active'])) {
            $inactive = ['rejected', 'closed'];
            filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN)
                ? $query->whereNotIn('case_status', $inactive)
                : $query->whereIn('case_status', $inactive);
        }

        if (auth()->user()?->hasRole('consultant')) {
            $query->where('consultant_id', auth()->id());
        }

        return $query->latest()->paginate($perPage);
    }

    public function findOrFail(int $id): Client
    {
        return Client::with([
            'consultant:id,first_name,last_name',
            'applicants',
            'opportunities.owner:id,first_name,last_name',
            'documents.uploadedBy:id,first_name,last_name',
            'payments',
        ])->findOrFail($id);
    }

    public function create(array $data): Client
    {
        return Client::create($data);
    }

    public function update(Client $client, array $data): Client
    {
        $client->update($data);
        return $client->fresh(['consultant:id,first_name,last_name', 'applicants']);
    }

    public function delete(Client $client): void
    {
        $client->delete();
    }

    public function linkApplicant(Client $client, int $applicantId): void
    {
        Applicant::where('id', $applicantId)->update(['client_id' => $client->id]);
    }

    public function unlinkApplicant(Client $client, int $applicantId): void
    {
        Applicant::where('id', $applicantId)
            ->where('client_id', $client->id)
            ->update(['client_id' => null]);
    }
}
