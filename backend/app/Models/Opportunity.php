<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Opportunity extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'client_id', 'applicant_id', 'stage', 'amount', 'currency',
        'probability', 'close_date', 'owner_id', 'description', 'lead_id', 'created_by',
    ];

    protected $casts = [
        'amount'     => 'decimal:2',
        'close_date' => 'date',
    ];

    // Pipeline order — used for transition validation and Kanban column ordering.
    public const STAGES = [
        'prospecting',
        'qualification',
        'proposal',
        'negotiation',
        'closed_won',
        'closed_lost',
    ];

    // Default win-probability per stage. Auto-applied on stage transitions.
    public const STAGE_PROBABILITY = [
        'prospecting'   => 10,
        'qualification' => 25,
        'proposal'      => 50,
        'negotiation'   => 75,
        'closed_won'    => 100,
        'closed_lost'   => 0,
    ];

    public const CLOSED_STAGES = ['closed_won', 'closed_lost'];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function applicant(): BelongsTo
    {
        return $this->belongsTo(Applicant::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function stageHistory(): HasMany
    {
        return $this->hasMany(OpportunityStageHistory::class)->latest();
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public function isOpen(): bool
    {
        return !in_array($this->stage, self::CLOSED_STAGES, true);
    }

    public function isWon(): bool
    {
        return $this->stage === 'closed_won';
    }

    public function isLost(): bool
    {
        return $this->stage === 'closed_lost';
    }

    public function isOverdue(): bool
    {
        return $this->close_date !== null
            && $this->close_date->isPast()
            && $this->isOpen();
    }

    // ── Stage transitions ─────────────────────────────────────────────────────

    /**
     * Returns true when moving from $current to $next is a valid pipeline move.
     * Forward moves and lateral moves (any stage → lost) are always allowed.
     * Backward moves are allowed only if not moving out of a closed stage.
     */
    public static function isValidTransition(string $from, string $to): bool
    {
        if (!in_array($from, self::STAGES, true) || !in_array($to, self::STAGES, true)) {
            return false;
        }

        // Cannot re-open a closed opportunity via a simple stage patch
        if (in_array($from, self::CLOSED_STAGES, true)) {
            return false;
        }

        return true;
    }

    // ── Query Scopes ──────────────────────────────────────────────────────────

    public function scopeByStage(Builder $query, string $stage): Builder
    {
        return $query->where('stage', $stage);
    }

    public function scopeByStages(Builder $query, array $stages): Builder
    {
        return $query->whereIn('stage', $stages);
    }

    public function scopeByOwner(Builder $query, int $ownerId): Builder
    {
        return $query->where('owner_id', $ownerId);
    }

    public function scopeByClient(Builder $query, int $clientId): Builder
    {
        return $query->where('client_id', $clientId);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereNotIn('stage', self::CLOSED_STAGES);
    }

    public function scopeClosed(Builder $query): Builder
    {
        return $query->whereIn('stage', self::CLOSED_STAGES);
    }

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->open()->whereDate('close_date', '<', now());
    }

    public function scopeClosingThisMonth(Builder $query): Builder
    {
        return $query->open()
            ->whereMonth('close_date', now()->month)
            ->whereYear('close_date', now()->year);
    }

    public function scopeClosingBetween(Builder $query, string $from, string $to): Builder
    {
        return $query->whereBetween('close_date', [$from, $to]);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function (Builder $q) use ($term) {
            $q->where('name', 'LIKE', "%{$term}%")
              ->orWhereHas('client', fn (Builder $c) => $c->where('name', 'LIKE', "%{$term}%"));
        });
    }

    public function scopeWithSummaryRelations(Builder $query): Builder
    {
        return $query->with([
            'client:id,name,case_reference,case_status',
            'owner:id,first_name,last_name',
            'applicant:id,first_name,last_name,visa_type',
        ]);
    }
}
