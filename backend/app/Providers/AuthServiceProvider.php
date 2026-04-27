<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        \App\Models\Client::class    => \App\Policies\ClientPolicy::class,
        \App\Models\Applicant::class => \App\Policies\ApplicantPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
