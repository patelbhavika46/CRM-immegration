<?php

namespace App\Http\Controllers;

use App\Models\Applicant;
use App\Models\Client;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    private const LIMIT = 5;

    public function index(Request $request): JsonResponse
    {
        $request->validate(['q' => 'required|string|min:2|max:100']);

        $term = $request->string('q')->toString();
        $user = auth()->user();

        return response()->json([
            'success' => true,
            'data'    => [
                'clients'    => $this->searchClients($term, $user),
                'applicants' => $this->searchApplicants($term, $user),
                'leads'      => $this->searchLeads($term, $user),
            ],
        ]);
    }

    private function searchClients(string $term, $user): array
    {
        $query = Client::query()->search($term)->limit(self::LIMIT);

        if ($user->hasRole('consultant')) {
            $query->where('consultant_id', $user->id);
        }

        return $query->get(['id', 'name', 'case_reference', 'case_status'])->map(fn ($c) => [
            'id'    => $c->id,
            'label' => $c->name,
            'sub'   => $c->case_reference,
            'type'  => 'client',
            'url'   => "/clients/{$c->id}",
        ])->all();
    }

    private function searchApplicants(string $term, $user): array
    {
        $query = Applicant::query()->search($term)->limit(self::LIMIT);

        if ($user->hasRole('consultant')) {
            $query->whereHas('client', fn ($q) => $q->where('consultant_id', $user->id));
        }

        return $query->get(['id', 'first_name', 'last_name', 'application_id'])->map(fn ($a) => [
            'id'    => $a->id,
            'label' => $a->full_name,
            'sub'   => $a->application_id,
            'type'  => 'applicant',
            'url'   => "/applicants/{$a->id}",
        ])->all();
    }

    private function searchLeads(string $term, $user): array
    {
        $query = Lead::query()->search($term)->limit(self::LIMIT);

        if ($user->hasRole('consultant')) {
            $query->where(fn ($q) => $q
                ->where('owner_id', $user->id)
                ->orWhere('created_by', $user->id)
            );
        }

        return $query->get(['id', 'first_name', 'last_name', 'company', 'status'])->map(fn ($l) => [
            'id'    => $l->id,
            'label' => $l->full_name,
            'sub'   => $l->company,
            'type'  => 'lead',
            'url'   => "/leads/{$l->id}",
        ])->all();
    }
}
