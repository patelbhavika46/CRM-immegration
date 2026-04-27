<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'role_id', 'first_name', 'last_name', 'email', 'password',
        'phone', 'avatar_path', 'is_active', 'email_notifications',
        'in_app_notifications', 'last_login_at', 'email_verified_at',
    ];

    protected $hidden = ['password', 'remember_token', 'password_reset_token'];

    protected $casts = [
        'is_active'             => 'boolean',
        'email_notifications'   => 'boolean',
        'in_app_notifications'  => 'boolean',
        'last_login_at'         => 'datetime',
        'email_verified_at'     => 'datetime',
    ];

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'role' => $this->role?->slug,
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'owner_id');
    }

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class, 'consultant_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class, 'assigned_to');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function hasPermission(string $slug): bool
    {
        return $this->role?->permissions()->where('slug', $slug)->exists() ?? false;
    }

    public function hasRole(string $slug): bool
    {
        return $this->role?->slug === $slug;
    }
}
