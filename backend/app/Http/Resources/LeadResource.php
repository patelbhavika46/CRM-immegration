<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'first_name'        => $this->first_name,
            'last_name'         => $this->last_name,
            'full_name'         => $this->full_name,
            'email'             => $this->email,
            'phone'             => $this->phone,
            'company'           => $this->company,
            'visa_interest'     => $this->visa_interest,
            'country_of_origin' => $this->country_of_origin,
            'status'            => $this->status,
            'source'            => $this->source,
            'notes'             => $this->notes,
            'is_converted'      => $this->isConverted(),
            'converted_at'      => $this->converted_at?->toISOString(),
            'owner'             => $this->whenLoaded('owner', fn () => [
                'id'        => $this->owner->id,
                'full_name' => $this->owner->full_name,
            ]),
            'created_at'        => $this->created_at?->toISOString(),
            'updated_at'        => $this->updated_at?->toISOString(),
        ];
    }
}
