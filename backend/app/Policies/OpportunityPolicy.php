<?php

namespace App\Policies;

use App\Models\Opportunity;
use App\Models\User;

class OpportunityPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('opportunities.view');
    }

    public function view(User $user, Opportunity $opportunity): bool
    {
        if ($user->hasRole('consultant')) {
            return $opportunity->owner_id === $user->id
                || $opportunity->created_by === $user->id;
        }

        return $user->hasPermission('opportunities.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('opportunities.create');
    }

    public function update(User $user, Opportunity $opportunity): bool
    {
        if ($user->hasRole('consultant')) {
            return $opportunity->owner_id === $user->id;
        }

        return $user->hasPermission('opportunities.edit');
    }

    public function updateStage(User $user, Opportunity $opportunity): bool
    {
        // Same rule as update — owner or sufficient permission
        return $this->update($user, $opportunity);
    }

    public function delete(User $user, Opportunity $opportunity): bool
    {
        if ($user->hasRole('consultant')) {
            return false; // Consultants cannot delete pipeline records
        }

        return $user->hasPermission('opportunities.delete');
    }
}
