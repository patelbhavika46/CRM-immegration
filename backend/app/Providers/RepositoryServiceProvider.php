<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $bindings = [
            \App\Repositories\Contracts\LeadRepositoryInterface::class        => \App\Repositories\Eloquent\LeadRepository::class,
            \App\Repositories\Contracts\OpportunityRepositoryInterface::class => \App\Repositories\Eloquent\OpportunityRepository::class,
            \App\Repositories\Contracts\ClientRepositoryInterface::class      => \App\Repositories\Eloquent\ClientRepository::class,
            \App\Repositories\Contracts\ApplicantRepositoryInterface::class   => \App\Repositories\Eloquent\ApplicantRepository::class,
            \App\Repositories\Contracts\ActivityRepositoryInterface::class    => \App\Repositories\Eloquent\ActivityRepository::class,
        ];

        foreach ($bindings as $abstract => $concrete) {
            $this->app->bind($abstract, $concrete);
        }
    }
}
