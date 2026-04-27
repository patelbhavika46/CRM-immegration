<?php

namespace App\Repositories\Eloquent;

use App\Models\Lead;
use App\Repositories\Contracts\LeadRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class LeadRepository implements LeadRepositoryInterface
{
    public function paginate(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = Lead::query()->with(['owner:id,first_name,last_name']);

        if (!empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        if (!empty($filters['source'])) {
            $query->bySource($filters['source']);
        }

        if (!empty($filters['owner_id'])) {
            $query->byOwner((int) $filters['owner_id']);
        }

        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        // Scope to own leads for consultants
        if (auth()->user()->hasRole('consultant')) {
            $query->where('owner_id', auth()->id())
                  ->orWhere('created_by', auth()->id());
        }

        // Sorting
        $allowedSorts = ['first_name', 'company', 'status', 'source', 'created_at'];
        $sortBy  = in_array($filters['sort_by'] ?? '', $allowedSorts) ? $filters['sort_by'] : 'created_at';
        $sortDir = ($filters['sort_dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        if ($sortBy === 'first_name') {
            $query->orderByRaw("CONCAT(first_name, ' ', last_name) {$sortDir}");
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        return $query->paginate($perPage);
    }

    public function findOrFail(int $id): Lead
    {
        return Lead::with(['owner:id,first_name,last_name'])->findOrFail($id);
    }

    public function create(array $data): Lead
    {
        return Lead::create($data);
    }

    public function update(Lead $lead, array $data): Lead
    {
        $lead->update($data);
        return $lead->fresh();
    }

    public function delete(Lead $lead): void
    {
        $lead->delete();
    }
}
