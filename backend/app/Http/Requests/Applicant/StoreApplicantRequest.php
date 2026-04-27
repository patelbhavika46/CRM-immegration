<?php

namespace App\Http\Requests\Applicant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreApplicantRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'client_id'       => 'required|exists:clients,id',
            'first_name'      => 'required|string|max:100',
            'last_name'       => 'required|string|max:100',
            'email'           => 'nullable|email|max:255',
            'phone'           => 'nullable|string|max:30',
            'date_of_birth'   => 'nullable|date|before:today',
            'nationality'     => 'nullable|string|max:100',
            'passport_number' => 'nullable|string|max:50',
            'passport_expiry' => 'nullable|date|after:today',
            'current_address' => 'nullable|string|max:500',
            'relationship'    => ['nullable', Rule::in(['primary','spouse','child','dependent','other'])],
            'visa_type'       => ['nullable', Rule::in(['express_entry_pr','provincial_nominee','work_permit','study_permit','visitor_visa','dependent','citizenship','other'])],
            'application_id'  => 'nullable|string|max:100',
            'immigration_status' => ['nullable', Rule::in(['awaiting_ita','profile_created','application_submitted','biometrics_requested','medical_requested','approved','rejected','landed','other'])],
            'submission_date' => 'nullable|date',
            'notes'           => 'nullable|string|max:5000',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (!$this->filled('relationship')) $this->merge(['relationship' => 'primary']);
    }
}
