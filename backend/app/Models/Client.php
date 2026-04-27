<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Builder;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'clients';

    protected $fillable = [
        'name', 'type', 'service_type', 'case_status', 'case_reference',
        'country_of_origin', 'country_of_destination', 'date_opened',
        'date_closed', 'consultant_id', 'lead_id', 'notes', 'created_by',
    ];

    protected $casts = [
        'date_opened' => 'date',
        'date_closed' => 'date',
    ];

    public function consultant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'consultant_id');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function applicants(): HasMany
    {
        return $this->hasMany(Applicant::class, 'client_id');
    }

    public function opportunities(): HasMany
    {
        return $this->hasMany(Opportunity::class, 'client_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'client_id');
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function activities(): MorphMany
    {
        return $this->morphMany(Activity::class, 'relatable');
    }

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('case_status', $status);
    }

    public function scopeByServiceType(Builder $query, string $type): Builder
    {
        return $query->where('service_type', $type);
    }

    public function scopeByConsultant(Builder $query, int $consultantId): Builder
    {
        return $query->where('consultant_id', $consultantId);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function (Builder $q) use ($term) {
            $q->where('name', 'LIKE', "%{$term}%")
              ->orWhere('case_reference', 'LIKE', "%{$term}%");
        });
    }
}
