<?php

namespace App\Http\Controllers;

use App\Http\Requests\Document\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    private const MORPH_MAP = [
        'client'    => \App\Models\Client::class,
        'applicant' => \App\Models\Applicant::class,
        'lead'      => \App\Models\Lead::class,
    ];

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'documentable_type' => 'nullable|in:client,applicant,lead',
            'documentable_id'   => 'nullable|integer',
        ]);

        $query = Document::with('uploadedBy:id,first_name,last_name')->latest();

        if ($request->filled('documentable_type') && $request->filled('documentable_id')) {
            $query->where('documentable_type', self::MORPH_MAP[$request->documentable_type])
                  ->where('documentable_id', $request->integer('documentable_id'));
        }

        return response()->json([
            'success' => true,
            'data'    => DocumentResource::collection($query->paginate($request->integer('per_page', 20))),
        ]);
    }

    public function store(StoreDocumentRequest $request): JsonResponse
    {
        $file  = $request->file('file');
        $type  = $request->input('documentable_type');
        $id    = $request->integer('documentable_id');

        $path = $file->store("documents/{$type}/{$id}", 'local');

        $document = Document::create([
            'name'              => $request->input('name', $file->getClientOriginalName()),
            'original_name'     => $file->getClientOriginalName(),
            'document_type'     => $request->input('document_type'),
            'file_path'         => $path,
            'file_size'         => $file->getSize(),
            'mime_type'         => $file->getMimeType(),
            'documentable_type' => self::MORPH_MAP[$type],
            'documentable_id'   => $id,
            'uploaded_by'       => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded successfully.',
            'data'    => new DocumentResource($document->load('uploadedBy')),
        ], 201);
    }

    public function destroy(int $id): JsonResponse
    {
        $document = Document::findOrFail($id);

        // Only the uploader, admins, or managers can delete
        $user = auth()->user();
        if ($document->uploaded_by !== $user->id && !$user->hasRole(['admin', 'super_admin', 'manager'])) {
            abort(403, 'You do not have permission to delete this document.');
        }

        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        return response()->json(['success' => true, 'message' => 'Document deleted successfully.']);
    }

    public function download(int $id): \Illuminate\Http\Response|JsonResponse
    {
        $document = Document::findOrFail($id);

        if (!Storage::disk('local')->exists($document->file_path)) {
            return response()->json(['success' => false, 'message' => 'File not found on storage.'], 404);
        }

        return response()->download(
            Storage::disk('local')->path($document->file_path),
            $document->original_name ?? $document->name,
            ['Content-Type' => $document->mime_type ?? 'application/octet-stream']
        );
    }
}
