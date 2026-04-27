<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\User;

class ClientPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('clients.view');
    }

    public function view(User $user, Client $client): bool
    {
        if ($user->hasRole('consultant')) {
            return $client->consultant_id === $user->id
                || $client->created_by === $user->id;
        }
        return $user->hasPermission('clients.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('clients.create');
    }

    public function update(User $user, Client $client): bool
    {
        if ($user->hasRole('consultant')) {
            return $client->consultant_id === $user->id;
        }
        return $user->hasPermission('clients.edit');
    }

    public function delete(User $user, Client $client): bool
    {
        return $user->hasPermission('clients.delete')
            && !in_array($user->role?->slug, ['consultant']);
    }
}
