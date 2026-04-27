<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Lead;
use App\Models\Opportunity;
use App\Repositories\Contracts\ActivityRepositoryInterface;
use App\Repositories\Contracts\OpportunityRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct(
        private readonly ActivityRepositoryInterface $activities,
        private readonly OpportunityRepositoryInterface $opportunities,
    ) {}

    public function index(): JsonResponse
    {
        $user    = auth()->user();
        $isAdmin = $user->hasRole('admin') || $user->hasRole('super_admin') || $user->hasRole('manager');
        $cacheKey = "dashboard:{$user->id}:" . now()->format('YmdH');

        $data = Cache::remember($cacheKey, 300, function () use ($user, $isAdmin) {
            return [
                'kpis'             => $this->buildKpis($user->id, $isAdmin),
                'pipeline_summary' => $this->opportunities->pipelineSummary($isAdmin ? null : $user->id),
                'recent_activities'=> $this->buildRecentActivities($user->id, $isAdmin),
                'upcoming_tasks'   => $this->activities->upcomingForUser($user->id, 5),
                'lead_sources'     => $this->buildLeadSources($user->id, $isAdmin),
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    private function buildKpis(int $userId, bool $isAdmin): array
    {
        $leadQuery  = Lead::query();
        $clientQuery = Client::query();
        $oppQuery   = Opportunity::query();
        $actQuery   = Activity::query();

        if (!$isAdmin) {
            $leadQuery->where('owner_id', $userId);
            $clientQuery->where('consultant_id', $userId);
            $oppQuery->where('owner_id', $userId);
            $actQuery->where('assigned_to', $userId);
        }

        $thisMonth = [now()->startOfMonth(), now()->endOfMonth()];

        return [
            'total_leads'            => $leadQuery->count(),
            'new_leads_this_month'   => (clone $leadQuery)->whereBetween('created_at', $thisMonth)->count(),
            'total_clients'          => $clientQuery->count(),
            'active_clients'         => (clone $clientQuery)->whereIn('case_status', ['new','in_progress','documents_pending','submitted','under_review'])->count(),
            'open_opportunities'     => (clone $oppQuery)->open()->count(),
            'pipeline_value'         => (float) ((clone $oppQuery)->open()->sum('amount') ?? 0),
            'won_this_month'         => (clone $oppQuery)->where('stage', 'closed_won')->whereBetween('updated_at', $thisMonth)->count(),
            'overdue_activities'     => (clone $actQuery)->overdue()->count(),
            'pending_activities'     => (clone $actQuery)->whereIn('status', ['pending', 'scheduled'])->count(),
        ];
    }

    private function buildRecentActivities(int $userId, bool $isAdmin): array
    {
        $query = Activity::query()
            ->with(['assignedTo:id,first_name,last_name', 'relatable'])
            ->latest()
            ->limit(8);

        if (!$isAdmin) {
            $query->where(fn ($q) => $q
                ->where('assigned_to', $userId)
                ->orWhere('created_by', $userId)
            );
        }

        return $query->get()->map(fn ($a) => [
            'id'             => $a->id,
            'type'           => $a->type,
            'subject'        => $a->subject,
            'status'         => $a->status,
            'due_date'       => $a->due_date?->toDateString(),
            'related_name'   => $a->relatable
                ? (method_exists($a->relatable, 'getFullNameAttribute') ? $a->relatable->full_name : $a->relatable->name)
                : null,
            'assigned_to'    => $a->assignedTo?->full_name,
        ])->all();
    }

    private function buildLeadSources(int $userId, bool $isAdmin): array
    {
        $query = Lead::query()
            ->select('source', DB::raw('COUNT(*) as count'))
            ->groupBy('source');

        if (!$isAdmin) {
            $query->where('owner_id', $userId);
        }

        return $query->get()
            ->map(fn ($r) => ['source' => $r->source, 'count' => (int) $r->count])
            ->all();
    }
}
