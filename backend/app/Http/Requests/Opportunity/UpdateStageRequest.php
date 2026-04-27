<?php

namespace App\Http\Requests\Opportunity;

use App\Models\Opportunity;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'stage' => ['required', Rule::in(Opportunity::STAGES)],
            'note'  => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'stage.required' => 'A target pipeline stage is required.',
            'stage.in'       => 'Invalid stage. Must be one of: ' . implode(', ', Opportunity::STAGES) . '.',
        ];
    }

    /**
     * Validate that the transition is allowed after basic validation passes.
     * Called by the controller after findOrFail — cannot run here because we
     * do not have the model instance yet.
     */
    public function getStage(): string
    {
        return $this->validated('stage');
    }

    public function getNote(): ?string
    {
        return $this->validated('note');
    }
}
