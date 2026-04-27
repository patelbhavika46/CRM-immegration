<?php

namespace App\Repositories\Contracts;

use App\Models\Activity;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ActivityRepositoryInterface
{
    public function paginate(array $filters, int $perPage): LengthAwarePaginator;
    public function findOrFail(int $id): Activity;
    public function create(array $data): Activity;
    public function update(Activity $activity, array $data): Activity;
    public function delete(Activity $activity): void;
    public function complete(Activity $activity, ?string $outcome): Activity;
    public function upcomingForUser(int $userId, int $limit): \Illuminate\Database\Eloquent\Collection;
}
