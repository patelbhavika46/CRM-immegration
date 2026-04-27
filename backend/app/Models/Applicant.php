<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Builder;

class Applicant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'client_id', 'first_name', 'last_name', 'email', 'phone',
        'date_of_birth', 'nationality', 'passport_number', 'passport_expiry',
        'current_address', 'relationship', 'visa_type', 'application_id',
        'immigration_status', 'submission_date', 'notes', 'created_by',
    ];

    protected $casts = [
        'date_of_birth'    => 'date',
        'passport_expiry'  => 'date',
        'submission_date'  => 'date',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function activities(): MorphMany
    {
        return $this->morphMany(Activity::class, 'relatable');
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function (Builder $q) use ($term) {
            $q->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$term}%"])
              ->orWhere('email', 'LIKE', "%{$term}%")
              ->orWhere('application_id', 'LIKE', "%{$term}%")
              ->orWhere('passport_number', 'LIKE', "%{$term}%");
        });
    }
}
