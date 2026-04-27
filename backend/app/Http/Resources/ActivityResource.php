<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'type'              => $this->type,
            'subject'           => $this->subject,
            'notes'             => $this->notes,
            'outcome'           => $this->outcome,
            'status'            => $this->status,
            'due_date'          => $this->due_date?->toDateString(),
            'due_time'          => $this->due_time,
            'completed_at'      => $this->completed_at?->toISOString(),
            'application_stage' => $this->application_stage,
            'relatable_type'    => $this->relatable_type,
            'relatable_id'      => $this->relatable_id,

            'assigned_to' => $this->whenLoaded('assignedTo', fn () => $this->assignedTo ? [
                'id'        => $this->assignedTo->id,
                'full_name' => $this->assignedTo->full_name,
            ] : null),

            'relatable' => $this->whenLoaded('relatable', fn () => $this->relatable ? [
                'id'   => $this->relatable->id,
                'name' => method_exists($this->relatable, 'getFullNameAttribute')
                    ? $this->relatable->full_name
                    : $this->relatable->name,
            ] : null),

            'is_overdue' => $this->due_date
                && $this->due_date->isPast()
                && !in_array($this->status, ['completed', 'cancelled']),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
