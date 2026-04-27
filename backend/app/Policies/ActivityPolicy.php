<?php

namespace App\Policies;

use App\Models\Activity;
use App\Models\User;

class ActivityPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('activities.view');
    }

    public function view(User $user, Activity $activity): bool
    {
        if ($user->hasRole('consultant')) {
            return $activity->assigned_to === $user->id
                || $activity->created_by === $user->id;
        }
        return $user->hasPermission('activities.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('activities.create');
    }

    public function update(User $user, Activity $activity): bool
    {
        if ($user->hasRole('consultant')) {
            return $activity->assigned_to === $user->id
                || $activity->created_by === $user->id;
        }
        return $user->hasPermission('activities.edit');
    }

    public function complete(User $user, Activity $activity): bool
    {
        return $this->update($user, $activity);
    }

    public function delete(User $user, Activity $activity): bool
    {
        return $user->hasPermission('activities.delete');
    }
}
