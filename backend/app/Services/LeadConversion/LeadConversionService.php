<?php

namespace App\Services\LeadConversion;

use App\Models\Applicant;
use App\Models\AuditLog;
use App\Models\Client;
use App\Models\Lead;
use App\Models\Notification;
use App\Models\Opportunity;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class LeadConversionService
{
    /**
     * Convert a lead into Client + Applicant + (optional) Opportunity.
     * The entire operation runs inside a single DB transaction. Any exception
     * triggers a full rollback and re-throws, so the caller always gets a clean
     * failure or a complete success — never a partial state.
     */
    public function convert(Lead $lead, array $validated): LeadConversionResult
    {
        if ($lead->isConverted()) {
            throw new RuntimeException('This lead has already been converted.');
        }

        $data = LeadConversionData::fromValidated($validated);

        return DB::transaction(function () use ($lead, $data): LeadConversionResult {
            $client      = $this->persistClient($lead, $data->client);
            $applicant   = $this->persistApplicant($lead, $client, $data->applicant);
            $opportunity = $data->createOpportunity && $data->opportunity !== null
                ? $this->persistOpportunity($lead, $client, $applicant, $data->opportunity)
                : null;

            $lead->update([
                'status'       => 'converted',
                'converted_at' => now(),
            ]);

            $this->writeAuditLog($lead, $client, $applicant, $opportunity);
            $this->dispatchNotifications($lead, $client, $opportunity);

            return new LeadConversionResult($client, $applicant, $opportunity);
        });
    }

    // ── Persistence ───────────────────────────────────────────────────────────

    private function persistClient(Lead $lead, ClientData $data): Client
    {
        return Client::create([
            'name'                   => $data->name,
            'type'                   => $data->type,
            'service_type'           => $data->serviceType,
            'case_status'            => 'new',
            'case_reference'         => 'CLT-' . strtoupper(Str::random(8)),
            'country_of_origin'      => $lead->country_of_origin,
            'country_of_destination' => $data->countryOfDestination,
            'consultant_id'          => $data->consultantId ?? $lead->owner_id,
            'lead_id'                => $lead->id,
            'notes'                  => $data->notes,
            'date_opened'            => now()->toDateString(),
            'created_by'             => auth()->id(),
        ]);
    }

    private function persistApplicant(Lead $lead, Client $client, ApplicantData $data): Applicant
    {
        return Applicant::create([
            'client_id'       => $client->id,
            'first_name'      => $data->firstName,
            'last_name'       => $data->lastName,
            'email'           => $data->email,
            'phone'           => $data->phone,
            'date_of_birth'   => $data->dateOfBirth,
            'nationality'     => $data->nationality ?? $lead->country_of_origin,
            'passport_number' => $data->passportNumber,
            'passport_expiry' => $data->passportExpiry,
            'current_address' => $data->currentAddress,
            'relationship'    => 'primary',
            'visa_type'       => $data->visaType ?? $lead->visa_interest,
            'application_id'  => $data->applicationId,
            'created_by'      => auth()->id(),
        ]);
    }

    private function persistOpportunity(
        Lead $lead,
        Client $client,
        Applicant $applicant,
        OpportunityData $data,
    ): Opportunity {
        return Opportunity::create([
            'name'         => $data->name,
            'client_id'    => $client->id,
            'applicant_id' => $applicant->id,
            'stage'        => 'prospecting',
            'amount'       => $data->amount,
            'currency'     => $data->currency,
            'probability'  => 10,
            'close_date'   => $data->closeDate,
            'description'  => $data->description,
            'owner_id'     => $lead->owner_id,
            'lead_id'      => $lead->id,
            'created_by'   => auth()->id(),
        ]);
    }

    // ── Side-effects (still inside transaction so they roll back too) ─────────

    private function writeAuditLog(
        Lead $lead,
        Client $client,
        Applicant $applicant,
        ?Opportunity $opportunity,
    ): void {
        AuditLog::create([
            'user_id'      => auth()->id(),
            'action'       => 'lead_converted',
            'subject_type' => Lead::class,
            'subject_id'   => $lead->id,
            'new_values'   => [
                'client_id'      => $client->id,
                'applicant_id'   => $applicant->id,
                'opportunity_id' => $opportunity?->id,
            ],
            'ip_address'   => request()->ip(),
            'user_agent'   => request()->userAgent(),
        ]);
    }

    private function dispatchNotifications(Lead $lead, Client $client, ?Opportunity $opportunity): void
    {
        // Notify the lead owner if different from the actor
        if ($lead->owner_id && $lead->owner_id !== auth()->id()) {
            Notification::create([
                'user_id'         => $lead->owner_id,
                'title'           => 'Lead Converted',
                'message'         => "Lead \"{$lead->full_name}\" has been converted to client \"{$client->name}\".",
                'type'            => 'lead_converted',
                'notifiable_type' => Client::class,
                'notifiable_id'   => $client->id,
            ]);
        }

        // Notify assigned consultant if they differ
        if ($client->consultant_id && $client->consultant_id !== auth()->id() && $client->consultant_id !== $lead->owner_id) {
            Notification::create([
                'user_id'         => $client->consultant_id,
                'title'           => 'New Client Assigned',
                'message'         => "You have been assigned to client \"{$client->name}\"" .
                    ($opportunity ? " with opportunity \"{$opportunity->name}\"." : '.'),
                'type'            => 'client_assigned',
                'notifiable_type' => Client::class,
                'notifiable_id'   => $client->id,
            ]);
        }
    }
}
