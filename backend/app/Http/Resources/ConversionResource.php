<?php

namespace App\Http\Resources;

use App\Services\LeadConversion\LeadConversionResult;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Wraps a LeadConversionResult into a consistent API shape.
 */
class ConversionResource extends JsonResource
{
    public function __construct(private readonly LeadConversionResult $result) {}

    public function toArray(Request $request): array
    {
        $c = $this->result->client->load('consultant:id,first_name,last_name');
        $a = $this->result->applicant;
        $o = $this->result->opportunity;

        return [
            'client' => [
                'id'             => $c->id,
                'name'           => $c->name,
                'type'           => $c->type,
                'service_type'   => $c->service_type,
                'case_status'    => $c->case_status,
                'case_reference' => $c->case_reference,
                'consultant'     => $c->consultant
                    ? ['id' => $c->consultant->id, 'full_name' => $c->consultant->full_name]
                    : null,
            ],
            'applicant' => [
                'id'         => $a->id,
                'full_name'  => $a->full_name,
                'email'      => $a->email,
                'visa_type'  => $a->visa_type,
                'relationship' => $a->relationship,
            ],
            'opportunity' => $o ? [
                'id'     => $o->id,
                'name'   => $o->name,
                'stage'  => $o->stage,
                'amount' => $o->amount,
                'currency' => $o->currency,
            ] : null,
        ];
    }
}
