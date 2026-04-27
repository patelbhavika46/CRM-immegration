<?php

namespace App\Http\Requests\Lead;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConvertLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $serviceTypes = [
            'pr_application', 'work_permit', 'study_permit', 'visitor_visa',
            'family_sponsorship', 'citizenship', 'visa_extension', 'refugee_claim', 'other',
        ];

        $visaTypes = [
            'express_entry_pr', 'provincial_nominee', 'work_permit',
            'study_permit', 'visitor_visa', 'dependent', 'citizenship', 'other',
        ];

        return [
            // ── Step 1: Client ──────────────────────────────────────
            'client'                          => 'required|array',
            'client.name'                     => 'required|string|max:200',
            'client.type'                     => ['required', Rule::in(['individual', 'family', 'corporate'])],
            'client.service_type'             => ['required', Rule::in($serviceTypes)],
            'client.country_of_destination'   => 'required|string|max:100',
            'client.consultant_id'            => 'nullable|exists:users,id',
            'client.notes'                    => 'nullable|string|max:5000',

            // ── Step 2: Applicant ────────────────────────────────────
            'applicant'                       => 'required|array',
            'applicant.first_name'            => 'required|string|max:100',
            'applicant.last_name'             => 'required|string|max:100',
            'applicant.email'                 => 'nullable|email|max:255',
            'applicant.phone'                 => 'nullable|string|max:30',
            'applicant.date_of_birth'         => 'nullable|date|before:today',
            'applicant.nationality'           => 'nullable|string|max:100',
            'applicant.passport_number'       => 'nullable|string|max:50',
            'applicant.passport_expiry'       => 'nullable|date|after:today',
            'applicant.current_address'       => 'nullable|string|max:500',
            'applicant.visa_type'             => ['nullable', Rule::in($visaTypes)],
            'applicant.application_id'        => 'nullable|string|max:100',

            // ── Step 3: Opportunity (optional) ───────────────────────
            'create_opportunity'              => 'boolean',
            'opportunity'                     => 'nullable|array',
            'opportunity.name'                => 'required_if:create_opportunity,true|nullable|string|max:200',
            'opportunity.amount'              => 'nullable|numeric|min:0|max:9999999.99',
            'opportunity.currency'            => 'nullable|string|size:3',
            'opportunity.close_date'          => 'nullable|date|after:today',
            'opportunity.description'         => 'nullable|string|max:2000',
        ];
    }

    public function messages(): array
    {
        return [
            'client.name.required'           => 'Client name is required.',
            'client.type.required'           => 'Client type is required.',
            'client.service_type.required'   => 'Service type is required.',
            'client.country_of_destination.required' => 'Destination country is required.',
            'applicant.first_name.required'  => 'Applicant first name is required.',
            'applicant.last_name.required'   => 'Applicant last name is required.',
            'applicant.date_of_birth.before' => 'Date of birth must be in the past.',
            'applicant.passport_expiry.after'=> 'Passport expiry must be a future date.',
            'opportunity.name.required_if'   => 'Opportunity name is required when creating an opportunity.',
            'opportunity.close_date.after'   => 'Close date must be a future date.',
        ];
    }
}
