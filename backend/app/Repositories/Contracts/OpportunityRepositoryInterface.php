<?php

namespace App\Repositories\Contracts;

use App\Models\Opportunity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface OpportunityRepositoryInterface
{
    public function paginate(array $filters, int $perPage): LengthAwarePaginator;

    /** All open opportunities grouped by stage — for Kanban. No pagination. */
    public function allGroupedByStage(array $filters): array;

    public function findOrFail(int $id): Opportunity;

    public function create(array $data): Opportunity;

    public function update(Opportunity $opportunity, array $data): Opportunity;

    public function delete(Opportunity $opportunity): void;

    public function updateStage(Opportunity $opportunity, string $stage, ?string $note): Opportunity;

    /** Pipeline value summary — total weighted amount per stage. */
    public function pipelineSummary(?int $ownerId = null): array;
}
