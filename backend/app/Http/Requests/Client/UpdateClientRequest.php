<?php

namespace App\Http\Requests\Client;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClientRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'                   => 'sometimes|required|string|max:200',
            'type'                   => ['sometimes', Rule::in(['individual','family','corporate'])],
            'service_type'           => ['sometimes', Rule::in(['pr_application','work_permit','study_permit','visitor_visa','family_sponsorship','citizenship','visa_extension','refugee_claim','other'])],
            'case_status'            => ['sometimes', Rule::in(['new','in_progress','documents_pending','submitted','under_review','approved','rejected','closed'])],
            'country_of_origin'      => 'nullable|string|max:100',
            'country_of_destination' => 'sometimes|required|string|max:100',
            'date_opened'            => 'nullable|date',
            'date_closed'            => 'nullable|date|after_or_equal:date_opened',
            'consultant_id'          => 'nullable|exists:users,id',
            'notes'                  => 'nullable|string|max:5000',
        ];
    }
}
