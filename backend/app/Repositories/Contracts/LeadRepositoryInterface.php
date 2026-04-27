<?php

namespace App\Repositories\Contracts;

use App\Models\Lead;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface LeadRepositoryInterface
{
    public function paginate(array $filters, int $perPage): LengthAwarePaginator;
    public function findOrFail(int $id): Lead;
    public function create(array $data): Lead;
    public function update(Lead $lead, array $data): Lead;
    public function delete(Lead $lead): void;
}
