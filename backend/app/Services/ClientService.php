<?php

namespace App\Services;

use App\Models\Applicant;
use App\Models\Client;
use App\Repositories\Contracts\ClientRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ClientService
{
    public function __construct(
        private readonly ClientRepositoryInterface $clients,
    ) {}

    public function create(array $clientData, ?array $primaryContact): Client
    {
        return DB::transaction(function () use ($clientData, $primaryContact) {
            $client = $this->clients->create(array_merge($clientData, [
                'case_reference' => 'CLT-' . strtoupper(Str::random(8)),
                'created_by'     => auth()->id(),
            ]));

            if (!empty($primaryContact['first_name'])) {
                Applicant::create(array_merge(
                    array_filter($primaryContact, fn ($v) => $v !== null),
                    [
                        'client_id'    => $client->id,
                        'relationship' => 'primary',
                        'created_by'   => auth()->id(),
                    ]
                ));
            }

            return $client->load([
                'consultant:id,first_name,last_name',
                'applicants' => fn ($q) => $q->where('relationship', 'primary'),
            ]);
        });
    }
}
