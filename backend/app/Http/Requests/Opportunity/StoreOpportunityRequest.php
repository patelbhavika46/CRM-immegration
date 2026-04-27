<?php

namespace App\Http\Requests\Opportunity;

use App\Models\Opportunity;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOpportunityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'         => 'required|string|max:200',
            'client_id'    => 'required|exists:clients,id',
            'applicant_id' => 'nullable|exists:applicants,id',
            'stage'        => ['nullable', Rule::in(Opportunity::STAGES)],
            'amount'       => 'nullable|numeric|min:0|max:99999999.99',
            'currency'     => 'nullable|string|size:3',
            'probability'  => 'nullable|integer|min:0|max:100',
            'close_date'   => 'nullable|date|after:today',
            'owner_id'     => 'nullable|exists:users,id',
            'description'  => 'nullable|string|max:5000',
        ];
    }

    public function messages(): array
    {
        return [
            'client_id.required' => 'An associated client is required.',
            'close_date.after'   => 'The expected close date must be a future date.',
            'stage.in'           => 'Invalid pipeline stage.',
        ];
    }

    protected function prepareForValidation(): void
    {
        // Default stage and probability when not provided
        if (!$this->filled('stage')) {
            $this->merge(['stage' => 'prospecting']);
        }

        if (!$this->filled('probability') && $this->filled('stage')) {
            $this->merge([
                'probability' => Opportunity::STAGE_PROBABILITY[$this->stage] ?? 10,
            ]);
        }

        if (!$this->filled('currency')) {
            $this->merge(['currency' => 'CAD']);
        }

        // Default owner to authenticated user
        if (!$this->filled('owner_id')) {
            $this->merge(['owner_id' => auth()->id()]);
        }
    }
}
