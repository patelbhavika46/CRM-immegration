<?php

namespace App\Http\Requests\Opportunity;

use App\Models\Opportunity;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OpportunityFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'stage'        => 'nullable|string',   // single value or comma-separated
            'owner_id'     => 'nullable|integer|exists:users,id',
            'client_id'    => 'nullable|integer|exists:clients,id',
            'search'       => 'nullable|string|max:100',
            'open_only'    => 'nullable|boolean',
            'overdue'      => 'nullable|boolean',
            'closing_from' => 'nullable|date',
            'closing_to'   => 'nullable|date|after_or_equal:closing_from',
            'min_amount'   => 'nullable|numeric|min:0',
            'max_amount'   => 'nullable|numeric|min:0|gte:min_amount',
            'sort'         => ['nullable', Rule::in(['name', 'amount', 'close_date', 'stage', 'probability', 'created_at'])],
            'sort_dir'     => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page'     => 'nullable|integer|min:5|max:100',
        ];
    }

    public function filters(): array
    {
        return $this->only([
            'stage', 'owner_id', 'client_id', 'search',
            'open_only', 'overdue', 'closing_from', 'closing_to',
            'min_amount', 'max_amount', 'sort', 'sort_dir',
        ]);
    }
}
