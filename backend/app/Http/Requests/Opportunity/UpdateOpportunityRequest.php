<?php

namespace App\Http\Requests\Opportunity;

use App\Models\Opportunity;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOpportunityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'         => 'sometimes|required|string|max:200',
            'client_id'    => 'sometimes|required|exists:clients,id',
            'applicant_id' => 'nullable|exists:applicants,id',
            'stage'        => ['sometimes', Rule::in(Opportunity::STAGES)],
            'amount'       => 'nullable|numeric|min:0|max:99999999.99',
            'currency'     => 'nullable|string|size:3',
            'probability'  => 'nullable|integer|min:0|max:100',
            'close_date'   => 'nullable|date',
            'owner_id'     => 'nullable|exists:users,id',
            'description'  => 'nullable|string|max:5000',
        ];
    }

    protected function prepareForValidation(): void
    {
        // Keep probability in sync if stage changes but probability is not explicitly set
        if ($this->filled('stage') && !$this->filled('probability')) {
            $this->merge([
                'probability' => Opportunity::STAGE_PROBABILITY[$this->stage] ?? null,
            ]);
        }
    }
}
