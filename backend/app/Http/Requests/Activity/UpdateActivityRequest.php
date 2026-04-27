<?php

namespace App\Http\Requests\Activity;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateActivityRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'type'              => ['sometimes', Rule::in(['client_call','email','meeting','gov_submission','internal_task','document_request','sms','note'])],
            'subject'           => 'sometimes|required|string|max:300',
            'notes'             => 'nullable|string|max:5000',
            'due_date'          => 'nullable|date',
            'due_time'          => 'nullable|date_format:H:i',
            'status'            => ['nullable', Rule::in(['pending','scheduled','in_progress','completed','cancelled'])],
            'application_stage' => 'nullable|string|max:100',
            'assigned_to'       => 'nullable|exists:users,id',
            'outcome'           => 'nullable|string|max:5000',
        ];
    }
}
