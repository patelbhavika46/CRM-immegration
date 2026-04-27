<?php

namespace App\Services\LeadConversion;

/**
 * Typed value object. Keeps the service free of raw array access.
 */
final class LeadConversionData
{
    public function __construct(
        public readonly ClientData $client,
        public readonly ApplicantData $applicant,
        public readonly bool $createOpportunity,
        public readonly ?OpportunityData $opportunity,
    ) {}

    public static function fromValidated(array $data): self
    {
        return new self(
            client: ClientData::fromArray($data['client']),
            applicant: ApplicantData::fromArray($data['applicant']),
            createOpportunity: (bool) ($data['create_opportunity'] ?? false),
            opportunity: !empty($data['create_opportunity']) && isset($data['opportunity'])
                ? OpportunityData::fromArray($data['opportunity'])
                : null,
        );
    }
}


final class ClientData
{
    public function __construct(
        public readonly string $name,
        public readonly string $type,
        public readonly string $serviceType,
        public readonly string $countryOfDestination,
        public readonly ?int $consultantId,
        public readonly ?string $notes,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            type: $data['type'],
            serviceType: $data['service_type'],
            countryOfDestination: $data['country_of_destination'],
            consultantId: isset($data['consultant_id']) ? (int) $data['consultant_id'] : null,
            notes: $data['notes'] ?? null,
        );
    }
}


final class ApplicantData
{
    public function __construct(
        public readonly string $firstName,
        public readonly string $lastName,
        public readonly ?string $email,
        public readonly ?string $phone,
        public readonly ?string $dateOfBirth,
        public readonly ?string $nationality,
        public readonly ?string $passportNumber,
        public readonly ?string $passportExpiry,
        public readonly ?string $currentAddress,
        public readonly ?string $visaType,
        public readonly ?string $applicationId,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            firstName: $data['first_name'],
            lastName: $data['last_name'],
            email: $data['email'] ?? null,
            phone: $data['phone'] ?? null,
            dateOfBirth: $data['date_of_birth'] ?? null,
            nationality: $data['nationality'] ?? null,
            passportNumber: $data['passport_number'] ?? null,
            passportExpiry: $data['passport_expiry'] ?? null,
            currentAddress: $data['current_address'] ?? null,
            visaType: $data['visa_type'] ?? null,
            applicationId: $data['application_id'] ?? null,
        );
    }
}


final class OpportunityData
{
    public function __construct(
        public readonly string $name,
        public readonly ?float $amount,
        public readonly string $currency,
        public readonly ?string $closeDate,
        public readonly ?string $description,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            amount: isset($data['amount']) ? (float) $data['amount'] : null,
            currency: $data['currency'] ?? 'CAD',
            closeDate: $data['close_date'] ?? null,
            description: $data['description'] ?? null,
        );
    }
}
