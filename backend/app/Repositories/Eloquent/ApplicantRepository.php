<?php

namespace App\Repositories\Eloquent;

use App\Models\Applicant;
use App\Repositories\Contracts\ApplicantRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ApplicantRepository implements ApplicantRepositoryInterface
{
    public function paginate(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = Applicant::query()
            ->withCount(['documents', 'activities'])
            ->with(['client:id,name,case_reference']);

        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }
        if (!empty($filters['client_id'])) {
            $query->where('client_id', (int) $filters['client_id']);
        }
        if (!empty($filters['visa_type'])) {
            $query->where('visa_type', $filters['visa_type']);
        }
        if (!empty($filters['immigration_status'])) {
            $query->where('immigration_status', $filters['immigration_status']);
        }
        if (!empty($filters['relationship'])) {
            $query->where('relationship', $filters['relationship']);
        }

        if (auth()->user()?->hasRole('consultant')) {
            $query->whereHas('client', fn ($q) => $q->where('consultant_id', auth()->id()));
        }

        return $query->latest()->paginate($perPage);
    }

    public function findOrFail(int $id): Applicant
    {
        return Applicant::with([
            'client:id,name,case_reference,case_status',
            'documents.uploadedBy:id,first_name,last_name',
            'activities.assignedTo:id,first_name,last_name',
        ])->findOrFail($id);
    }

    public function create(array $data): Applicant
    {
        return Applicant::create($data)->load('client:id,name,case_reference');
    }

    public function update(Applicant $applicant, array $data): Applicant
    {
        $applicant->update($data);
        return $applicant->fresh('client:id,name,case_reference');
    }

    public function delete(Applicant $applicant): void
    {
        $applicant->delete();
    }
}
