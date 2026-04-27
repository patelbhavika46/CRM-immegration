<?php

namespace App\Http\Requests\Client;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClientRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            // Case / file information
            'name'                   => 'required|string|max:200',
            'type'                   => ['required', Rule::in(['individual', 'family', 'corporate'])],
            'service_type'           => ['required', Rule::in(['pr_application', 'work_permit', 'study_permit', 'visitor_visa', 'family_sponsorship', 'citizenship', 'visa_extension', 'refugee_claim', 'other'])],
            'case_status'            => ['nullable', Rule::in(['new', 'in_progress', 'documents_pending', 'submitted', 'under_review', 'approved', 'rejected', 'closed'])],
            'country_of_origin'      => 'nullable|string|max:100',
            'country_of_destination' => 'required|string|max:100',
            'date_opened'            => 'nullable|date',
            'consultant_id'          => 'nullable|exists:users,id',
            'notes'                  => 'nullable|string|max:5000',

            // Optional primary contact (creates a primary Applicant linked to the client)
            'primary_contact'                  => 'nullable|array',
            'primary_contact.first_name'       => 'nullable|string|max:100',
            'primary_contact.last_name'        => 'nullable|string|max:100',
            'primary_contact.email'            => 'nullable|email|max:255',
            'primary_contact.phone'            => 'nullable|string|max:30',
            'primary_contact.current_address'  => 'nullable|string|max:500',
            'primary_contact.nationality'      => 'nullable|string|max:100',
            'primary_contact.date_of_birth'    => 'nullable|date',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (!$this->filled('case_status'))            $this->merge(['case_status' => 'new']);
        if (!$this->filled('country_of_destination')) $this->merge(['country_of_destination' => 'Canada']);
        if (!$this->filled('date_opened'))            $this->merge(['date_opened' => now()->toDateString()]);
    }
}
