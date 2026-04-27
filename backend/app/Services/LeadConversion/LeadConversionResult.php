<?php

namespace App\Services\LeadConversion;

use App\Models\Applicant;
use App\Models\Client;
use App\Models\Opportunity;

final class LeadConversionResult
{
    public function __construct(
        public readonly Client $client,
        public readonly Applicant $applicant,
        public readonly ?Opportunity $opportunity,
    ) {}
}
