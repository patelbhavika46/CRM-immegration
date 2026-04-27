<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'first_name'           => 'sometimes|required|string|max:100',
            'last_name'            => 'sometimes|required|string|max:100',
            'phone'                => 'nullable|string|max:30',
            'email'                => ['sometimes', 'required', 'email', Rule::unique('users')->ignore(auth()->id())],
            'avatar'               => 'nullable|image|max:2048',
            'email_notifications'  => 'nullable|boolean',
            'in_app_notifications' => 'nullable|boolean',
        ];
    }
}
