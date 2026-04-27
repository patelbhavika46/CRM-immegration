<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $primaryApplicant = $this->whenLoaded('applicants', fn () =>
            $this->applicants->firstWhere('relationship', 'primary')
        );

        return [
            'id'                     => $this->id,
            'name'                   => $this->name,
            'type'                   => $this->type,
            'service_type'           => $this->service_type,
            'case_status'            => $this->case_status,
            'is_active'              => !in_array($this->case_status, ['rejected', 'closed']),
            'case_reference'         => $this->case_reference,
            'country_of_origin'      => $this->country_of_origin,
            'country_of_destination' => $this->country_of_destination,
            'date_opened'            => $this->date_opened?->toDateString(),
            'date_closed'            => $this->date_closed?->toDateString(),
            'notes'                  => $this->notes,
            'lead_id'                => $this->lead_id,

            'consultant' => $this->whenLoaded('consultant', fn () => $this->consultant ? [
                'id'        => $this->consultant->id,
                'full_name' => $this->consultant->full_name,
            ] : null),

            'primary_applicant'       => $this->whenLoaded('applicants', fn () => $primaryApplicant?->full_name),
            'primary_contact_email'   => $this->whenLoaded('applicants', fn () => $primaryApplicant?->email),
            'primary_contact_phone'   => $this->whenLoaded('applicants', fn () => $primaryApplicant?->phone),
            'primary_contact_address' => $this->whenLoaded('applicants', fn () => $primaryApplicant?->current_address),

            'applicants_count'    => $this->whenCounted('applicants'),
            'activities_count'    => $this->whenCounted('activities'),
            'documents_count'     => $this->whenCounted('documents'),
            'opportunities_count' => $this->whenCounted('opportunities'),

            'applicants'    => $this->whenLoaded('applicants',    fn () => ApplicantResource::collection($this->applicants)),
            'activities'    => $this->whenLoaded('activities',    fn () => ActivityResource::collection($this->activities)),
            'documents'     => $this->whenLoaded('documents',     fn () => DocumentResource::collection($this->documents)),
            'opportunities' => $this->whenLoaded('opportunities', fn () => OpportunityResource::collection($this->opportunities)),
            'payments'      => $this->whenLoaded('payments',      fn () => $this->payments->map(fn ($p) => [
                'id'       => $p->id,
                'amount'   => (float) $p->amount,
                'currency' => $p->currency,
                'status'   => $p->status,
                'paid_at'  => $p->paid_at?->toDateString(),
            ])),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
