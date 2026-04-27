<?php

namespace App\Policies;

use App\Models\Applicant;
use App\Models\User;

class ApplicantPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('applicants.view');
    }

    public function view(User $user, Applicant $applicant): bool
    {
        if ($user->hasRole('consultant')) {
            return $applicant->client?->consultant_id === $user->id
                || $applicant->created_by === $user->id;
        }
        return $user->hasPermission('applicants.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('applicants.create');
    }

    public function update(User $user, Applicant $applicant): bool
    {
        if ($user->hasRole('consultant')) {
            return $applicant->client?->consultant_id === $user->id;
        }
        return $user->hasPermission('applicants.edit');
    }

    public function delete(User $user, Applicant $applicant): bool
    {
        return $user->hasPermission('applicants.delete')
            && !in_array($user->role?->slug, ['consultant']);
    }
}
