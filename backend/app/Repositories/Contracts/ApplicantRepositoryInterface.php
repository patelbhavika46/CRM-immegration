<?php

namespace App\Repositories\Contracts;

use App\Models\Applicant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ApplicantRepositoryInterface
{
    public function paginate(array $filters, int $perPage): LengthAwarePaginator;
    public function findOrFail(int $id): Applicant;
    public function create(array $data): Applicant;
    public function update(Applicant $applicant, array $data): Applicant;
    public function delete(Applicant $applicant): void;
}
