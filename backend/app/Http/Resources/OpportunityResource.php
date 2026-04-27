<?php

namespace App\Http\Resources;

use App\Models\Opportunity;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OpportunityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'stage'       => $this->stage,
            'stage_label' => $this->stageLabelFor($this->stage),
            'probability' => $this->probability,
            'amount'      => $this->amount ? (float) $this->amount : null,
            'currency'    => $this->currency,

            // Weighted pipeline value (amount × probability%)
            'weighted_amount' => $this->amount
                ? round((float) $this->amount * $this->probability / 100, 2)
                : null,

            'close_date'  => $this->close_date?->toDateString(),
            'is_overdue'  => $this->isOverdue(),
            'is_open'     => $this->isOpen(),
            'is_won'      => $this->isWon(),
            'is_lost'     => $this->isLost(),
            'description' => $this->description,

            'client' => $this->whenLoaded('client', fn () => [
                'id'             => $this->client->id,
                'name'           => $this->client->name,
                'case_reference' => $this->client->case_reference,
                'case_status'    => $this->client->case_status,
            ]),

            'applicant' => $this->whenLoaded('applicant', fn () => $this->applicant ? [
                'id'        => $this->applicant->id,
                'full_name' => $this->applicant->full_name,
                'visa_type' => $this->applicant->visa_type,
            ] : null),

            'owner' => $this->whenLoaded('owner', fn () => $this->owner ? [
                'id'        => $this->owner->id,
                'full_name' => $this->owner->full_name,
            ] : null),

            'stage_history' => $this->whenLoaded('stageHistory', fn () =>
                $this->stageHistory->map(fn ($h) => [
                    'id'         => $h->id,
                    'from_stage' => $h->from_stage,
                    'to_stage'   => $h->to_stage,
                    'note'       => $h->note,
                    'changed_by' => $h->changedBy
                        ? ['id' => $h->changedBy->id, 'full_name' => $h->changedBy->full_name]
                        : null,
                    'changed_at' => $h->changed_at?->toISOString(),
                ])
            ),

            'available_transitions' => $this->availableTransitions(),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }

    private function stageLabelFor(string $stage): string
    {
        return match ($stage) {
            'prospecting'   => 'Prospecting',
            'qualification' => 'Qualification',
            'proposal'      => 'Proposal',
            'negotiation'   => 'Negotiation',
            'closed_won'    => 'Closed Won',
            'closed_lost'   => 'Closed Lost',
            default         => ucfirst($stage),
        };
    }

    /** Stages the frontend can legally transition to from the current one. */
    private function availableTransitions(): array
    {
        if (!$this->isOpen()) {
            return [];   // Closed records cannot be moved
        }

        return collect(Opportunity::STAGES)
            ->filter(fn ($s) => $s !== $this->stage && Opportunity::isValidTransition($this->stage, $s))
            ->values()
            ->all();
    }
}
