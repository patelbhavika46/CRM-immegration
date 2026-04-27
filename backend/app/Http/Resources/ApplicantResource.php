<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'first_name'         => $this->first_name,
            'last_name'          => $this->last_name,
            'full_name'          => $this->full_name,
            'email'              => $this->email,
            'phone'              => $this->phone,
            'date_of_birth'      => $this->date_of_birth?->toDateString(),
            'nationality'        => $this->nationality,
            'passport_number'    => $this->passport_number,
            'passport_expiry'    => $this->passport_expiry?->toDateString(),
            'current_address'    => $this->current_address,
            'relationship'       => $this->relationship,
            'visa_type'          => $this->visa_type,
            'application_id'     => $this->application_id,
            'immigration_status' => $this->immigration_status,
            'submission_date'    => $this->submission_date?->toDateString(),
            'notes'              => $this->notes,

            'client' => $this->whenLoaded('client', fn () => $this->client ? [
                'id'             => $this->client->id,
                'name'           => $this->client->name,
                'case_reference' => $this->client->case_reference,
            ] : null),

            'documents_count'  => $this->whenCounted('documents'),
            'activities_count' => $this->whenCounted('activities'),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
