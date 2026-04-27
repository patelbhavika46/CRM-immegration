<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ApplicantController;
use App\Http\Controllers\OpportunityController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\DashboardController;

Route::prefix('v1')->group(function () {

    // ── Public ──────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login']);
        Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('reset-password', [AuthController::class, 'resetPassword']);
    });

    // ── Authenticated ────────────────────────────────────────
    Route::middleware('auth:api')->group(function () {

        Route::prefix('auth')->group(function () {
            Route::post('logout',          [AuthController::class, 'logout']);
            Route::post('refresh',         [AuthController::class, 'refresh']);
            Route::get('me',               [AuthController::class, 'me']);
            Route::put('profile',          [AuthController::class, 'updateProfile']);
            Route::post('change-password', [AuthController::class, 'changePassword']);
        });

        // Dashboard
        Route::get('dashboard', [DashboardController::class, 'index']);

        // Global Search
        Route::get('search', [SearchController::class, 'index']);

        // Notifications
        Route::prefix('notifications')->group(function () {
            Route::get('/',                [NotificationController::class, 'index']);
            Route::patch('{id}/read',      [NotificationController::class, 'markRead']);
            Route::post('mark-all-read',   [NotificationController::class, 'markAllRead']);
            Route::delete('{id}',          [NotificationController::class, 'destroy']);
        });

        // Leads
        Route::prefix('leads')->group(function () {
            Route::get('/',              [LeadController::class, 'index']);
            Route::post('/',             [LeadController::class, 'store']);
            Route::get('{id}',           [LeadController::class, 'show']);
            Route::put('{id}',           [LeadController::class, 'update']);
            Route::delete('{id}',        [LeadController::class, 'destroy']);
            Route::post('{id}/convert',  [LeadController::class, 'convert']);
            Route::patch('{id}/assign',  [LeadController::class, 'assign']);
        });

        // Clients
        Route::prefix('clients')->group(function () {
            Route::get('/',                                         [ClientController::class, 'index']);
            Route::post('/',                                        [ClientController::class, 'store']);
            Route::get('{id}',                                      [ClientController::class, 'show']);
            Route::put('{id}',                                      [ClientController::class, 'update']);
            Route::delete('{id}',                                   [ClientController::class, 'destroy']);

            // Associated applicants
            Route::get('{id}/applicants',                           [ClientController::class, 'applicants']);
            Route::post('{id}/applicants',                          [ClientController::class, 'storeApplicant']);
            Route::patch('{id}/applicants/{applicant_id}/link',     [ClientController::class, 'linkApplicant']);
            Route::delete('{id}/applicants/{applicant_id}/unlink',  [ClientController::class, 'unlinkApplicant']);

            // Communications timeline
            Route::get('{id}/activities',                           [ClientController::class, 'activities']);
            Route::post('{id}/activities',                          [ClientController::class, 'storeActivity']);

            // Documents
            Route::get('{id}/documents',                            [ClientController::class, 'documents']);

            // Payments
            Route::get('{id}/payments',                             [ClientController::class, 'payments']);

            // Notes
            Route::post('{id}/notes',                               [ClientController::class, 'addNote']);
        });

        // Applicants
        Route::prefix('applicants')->group(function () {
            Route::get('/',                [ApplicantController::class, 'index']);
            Route::post('/',               [ApplicantController::class, 'store']);
            Route::get('{id}',             [ApplicantController::class, 'show']);
            Route::put('{id}',             [ApplicantController::class, 'update']);
            Route::delete('{id}',          [ApplicantController::class, 'destroy']);
            Route::get('{id}/activities',  [ApplicantController::class, 'activities']);
            Route::post('{id}/activities', [ApplicantController::class, 'storeActivity']);
            Route::get('{id}/documents',   [ApplicantController::class, 'documents']);
        });

        // Opportunities
        Route::prefix('opportunities')->group(function () {
            Route::get('/',               [OpportunityController::class, 'index']);
            Route::get('kanban',          [OpportunityController::class, 'kanban']);
            Route::post('/',              [OpportunityController::class, 'store']);
            Route::get('{id}',            [OpportunityController::class, 'show']);
            Route::put('{id}',            [OpportunityController::class, 'update']);
            Route::delete('{id}',         [OpportunityController::class, 'destroy']);
            Route::patch('{id}/stage',    [OpportunityController::class, 'updateStage']);
        });

        // Activities
        Route::prefix('activities')->group(function () {
            Route::get('/',               [ActivityController::class, 'index']);
            Route::post('/',              [ActivityController::class, 'store']);
            Route::get('{id}',            [ActivityController::class, 'show']);
            Route::put('{id}',            [ActivityController::class, 'update']);
            Route::delete('{id}',         [ActivityController::class, 'destroy']);
            Route::patch('{id}/complete', [ActivityController::class, 'complete']);
        });

        // Documents (generic upload endpoint + download)
        Route::prefix('documents')->group(function () {
            Route::get('/',              [DocumentController::class, 'index']);
            Route::post('/',             [DocumentController::class, 'store']);
            Route::delete('{id}',        [DocumentController::class, 'destroy']);
            Route::get('{id}/download',  [DocumentController::class, 'download']);
        });

        // Payments
        Route::prefix('payments')->group(function () {
            Route::get('/',              [PaymentController::class, 'index']);
            Route::post('/',             [PaymentController::class, 'store']);
            Route::get('{id}',           [PaymentController::class, 'show']);
            Route::post('{id}/refund',   [PaymentController::class, 'refund']);
        });

        // Reports
        Route::prefix('reports')->group(function () {
            Route::get('dashboard',         [ReportController::class, 'dashboard']);
            Route::get('pipeline',          [ReportController::class, 'pipeline']);
            Route::get('lead-sources',      [ReportController::class, 'leadSources']);
            Route::get('sales-performance', [ReportController::class, 'salesPerformance']);
            Route::get('case-statuses',     [ReportController::class, 'caseStatuses']);
            Route::get('activities-summary',[ReportController::class, 'activitiesSummary']);
        });

        // Integrations
        Route::prefix('integrations')->group(function () {
            Route::get('/',                     [IntegrationController::class, 'index']);
            Route::post('{type}/connect',       [IntegrationController::class, 'connect']);
            Route::delete('{type}/disconnect',  [IntegrationController::class, 'disconnect']);
            Route::put('{type}/configure',      [IntegrationController::class, 'configure']);
        });

        // Users (admin+)
        Route::middleware('permission:users.view')->group(function () {
            Route::get('users',      [UserController::class, 'index']);
            Route::get('users/{id}', [UserController::class, 'show']);
        });
        Route::middleware('permission:users.manage')->group(function () {
            Route::post('users',                        [UserController::class, 'store']);
            Route::put('users/{id}',                    [UserController::class, 'update']);
            Route::delete('users/{id}',                 [UserController::class, 'destroy']);
            Route::patch('users/{id}/toggle-status',    [UserController::class, 'toggleStatus']);
        });

        // Roles & Permissions (admin+)
        Route::middleware('permission:roles.manage')->group(function () {
            Route::apiResource('roles', RoleController::class);
            Route::get('permissions', [RoleController::class, 'permissions']);
        });
    });
});
