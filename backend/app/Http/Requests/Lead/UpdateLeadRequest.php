<?php

namespace App\Http\Requests\Lead;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name'        => 'sometimes|string|max:100',
            'last_name'         => 'sometimes|string|max:100',
            'email'             => 'nullable|email|max:255',
            'phone'             => 'nullable|string|max:30',
            'company'           => 'nullable|string|max:200',
            'visa_interest'     => 'nullable|string|max:100',
            'country_of_origin' => 'nullable|string|max:100',
            'status'            => 'nullable|in:new,contacted,qualified,disqualified,converted',
            'source'            => 'nullable|in:web,referral,cold_call,event,social_media,other',
            'owner_id'          => 'nullable|exists:users,id',
            'notes'             => 'nullable|string|max:5000',
        ];
    }
}
