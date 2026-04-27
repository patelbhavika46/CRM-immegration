<?php

namespace App\Http\Requests\Activity;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreActivityRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'type'              => ['required', Rule::in(['client_call','email','meeting','gov_submission','internal_task','document_request','sms','note'])],
            'subject'           => 'required|string|max:300',
            'notes'             => 'nullable|string|max:5000',
            'relatable_type'    => ['required', Rule::in(['client', 'applicant', 'lead'])],
            'relatable_id'      => 'required|integer',
            'due_date'          => 'nullable|date',
            'due_time'          => 'nullable|date_format:H:i',
            'status'            => ['nullable', Rule::in(['pending','scheduled','in_progress','completed','cancelled'])],
            'application_stage' => 'nullable|string|max:100',
            'assigned_to'       => 'nullable|exists:users,id',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (!$this->filled('status')) {
            $this->merge(['status' => 'pending']);
        }
        if (!$this->filled('assigned_to')) {
            $this->merge(['assigned_to' => auth()->id()]);
        }
    }
}
