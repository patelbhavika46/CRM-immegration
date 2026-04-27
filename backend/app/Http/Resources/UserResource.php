<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'first_name'            => $this->first_name,
            'last_name'             => $this->last_name,
            'full_name'             => $this->full_name,
            'email'                 => $this->email,
            'phone'                 => $this->phone,
            'avatar_url'            => $this->avatar_path
                                        ? \Storage::url($this->avatar_path)
                                        : null,
            'is_active'             => $this->is_active,
            'email_notifications'   => $this->email_notifications,
            'in_app_notifications'  => $this->in_app_notifications,
            'last_login_at'         => $this->last_login_at?->toISOString(),
            'role'                  => $this->whenLoaded('role', fn () => [
                'id'   => $this->role->id,
                'name' => $this->role->name,
                'slug' => $this->role->slug,
            ]),
            'permissions'           => $this->whenLoaded('role', fn () =>
                $this->role->permissions->pluck('slug')
            ),
            'created_at'            => $this->created_at?->toISOString(),
        ];
    }
}
