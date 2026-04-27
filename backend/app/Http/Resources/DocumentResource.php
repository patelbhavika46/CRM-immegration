<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'original_name' => $this->original_name,
            'document_type' => $this->document_type,
            'file_size'     => $this->file_size,
            'file_size_formatted' => $this->file_size_formatted,
            'mime_type'     => $this->mime_type,
            'uploaded_by'   => $this->whenLoaded('uploadedBy', fn () => $this->uploadedBy ? [
                'id'        => $this->uploadedBy->id,
                'full_name' => $this->uploadedBy->full_name,
            ] : null),
            'created_at'    => $this->created_at?->toISOString(),
        ];
    }
}
