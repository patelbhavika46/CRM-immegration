<?php

namespace App\Repositories\Eloquent;

use App\Models\Activity;
use App\Repositories\Contracts\ActivityRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ActivityRepository implements ActivityRepositoryInterface
{
    public function paginate(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = Activity::query()
            ->with(['assignedTo:id,first_name,last_name', 'relatable']);

        if (!empty($filters['type'])) {
            $query->byType($filters['type']);
        }
        if (!empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }
        if (!empty($filters['assigned_to'])) {
            $query->where('assigned_to', (int) $filters['assigned_to']);
        }
        if (!empty($filters['relatable_type']) && !empty($filters['relatable_id'])) {
            $query->where('relatable_type', $filters['relatable_type'])
                  ->where('relatable_id',   (int) $filters['relatable_id']);
        }
        if (!empty($filters['due_date_from'])) {
            $query->whereDate('due_date', '>=', $filters['due_date_from']);
        }
        if (!empty($filters['due_date_to'])) {
            $query->whereDate('due_date', '<=', $filters['due_date_to']);
        }
        if (!empty($filters['overdue'])) {
            $query->overdue();
        }
        if (!empty($filters['search'])) {
            $query->where('subject', 'LIKE', "%{$filters['search']}%");
        }

        if (auth()->user()?->hasRole('consultant')) {
            $query->where(fn ($q) => $q
                ->where('assigned_to', auth()->id())
                ->orWhere('created_by', auth()->id())
            );
        }

        return $query->orderBy('due_date')->orderBy('due_time')->paginate($perPage);
    }

    public function findOrFail(int $id): Activity
    {
        return Activity::with([
            'assignedTo:id,first_name,last_name',
            'createdBy:id,first_name,last_name',
            'relatable',
        ])->findOrFail($id);
    }

    public function create(array $data): Activity
    {
        return Activity::create($data)
            ->load('assignedTo:id,first_name,last_name');
    }

    public function update(Activity $activity, array $data): Activity
    {
        $activity->update($data);
        return $activity->fresh('assignedTo:id,first_name,last_name');
    }

    public function delete(Activity $activity): void
    {
        $activity->delete();
    }

    public function complete(Activity $activity, ?string $outcome): Activity
    {
        $activity->update([
            'status'       => 'completed',
            'completed_at' => now(),
            'outcome'      => $outcome,
        ]);
        return $activity->fresh('assignedTo:id,first_name,last_name');
    }

    public function upcomingForUser(int $userId, int $limit = 5): Collection
    {
        return Activity::query()
            ->with(['relatable'])
            ->where('assigned_to', $userId)
            ->whereIn('status', ['pending', 'scheduled'])
            ->whereDate('due_date', '>=', now()->toDateString())
            ->orderBy('due_date')
            ->orderBy('due_time')
            ->limit($limit)
            ->get();
    }
}
