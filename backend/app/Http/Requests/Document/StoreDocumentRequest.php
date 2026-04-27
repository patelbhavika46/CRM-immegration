<?php

namespace App\Http\Requests\Document;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'file'              => 'required|file|max:51200', // 50 MB
            'name'              => 'nullable|string|max:300',
            'document_type'     => 'nullable|string|max:100',
            'documentable_type' => ['required', Rule::in(['client', 'applicant', 'lead'])],
            'documentable_id'   => 'required|integer|min:1',
        ];
    }
}
