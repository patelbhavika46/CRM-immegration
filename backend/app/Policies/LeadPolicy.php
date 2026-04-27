<?php

namespace App\Policies;

use App\Models\Lead;
use App\Models\User;

class LeadPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('leads.view');
    }

    public function view(User $user, Lead $lead): bool
    {
        if ($user->hasRole('consultant')) {
            return $lead->owner_id === $user->id || $lead->created_by === $user->id;
        }
        return $user->hasPermission('leads.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('leads.create');
    }

    public function update(User $user, Lead $lead): bool
    {
        if ($user->hasRole('consultant')) {
            return $lead->owner_id === $user->id;
        }
        return $user->hasPermission('leads.edit');
    }

    public function delete(User $user, Lead $lead): bool
    {
        return $user->hasPermission('leads.delete');
    }

    public function convert(User $user, Lead $lead): bool
    {
        return $user->hasPermission('leads.convert');
    }

    public function assign(User $user, Lead $lead): bool
    {
        return $user->hasRole('admin') || $user->hasRole('manager') || $user->hasRole('super_admin');
    }
}
