<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Lead;
use App\Models\Opportunity;
use App\Repositories\Contracts\OpportunityRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function __construct(
        private readonly OpportunityRepositoryInterface $opportunities,
    ) {}

    public function dashboard(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $this->opportunities->pipelineSummary(),
        ]);
    }

    public function pipeline(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to'   => 'nullable|date|after_or_equal:date_from',
        ]);

        $query = Opportunity::query()
            ->select('stage', DB::raw('COUNT(*) as count'), DB::raw('COALESCE(SUM(amount),0) as total_amount'))
            ->groupBy('stage');

        if ($request->filled('date_from')) $query->where('created_at', '>=', $request->date_from);
        if ($request->filled('date_to'))   $query->where('created_at', '<=', $request->date_to);

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function leadSources(Request $request): JsonResponse
    {
        $query = Lead::query()
            ->select('source', DB::raw('COUNT(*) as count'))
            ->groupBy('source');

        if ($request->filled('date_from')) $query->where('created_at', '>=', $request->date_from);
        if ($request->filled('date_to'))   $query->where('created_at', '<=', $request->date_to);

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function salesPerformance(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to'   => 'nullable|date',
            'user_id'   => 'nullable|exists:users,id',
        ]);

        $query = Opportunity::query()
            ->where('stage', 'closed_won')
            ->join('users', 'opportunities.owner_id', '=', 'users.id')
            ->select(
                'users.id',
                DB::raw("CONCAT(users.first_name,' ',users.last_name) as name"),
                DB::raw('COUNT(*) as deals_won'),
                DB::raw('COALESCE(SUM(opportunities.amount),0) as total_amount'),
            )
            ->groupBy('users.id', 'users.first_name', 'users.last_name');

        if ($request->filled('date_from')) $query->where('opportunities.updated_at', '>=', $request->date_from);
        if ($request->filled('date_to'))   $query->where('opportunities.updated_at', '<=', $request->date_to);
        if ($request->filled('user_id'))   $query->where('opportunities.owner_id', $request->user_id);

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function caseStatuses(): JsonResponse
    {
        $data = Client::query()
            ->select('case_status', DB::raw('COUNT(*) as count'))
            ->groupBy('case_status')
            ->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function activitiesSummary(Request $request): JsonResponse
    {
        $query = Activity::query()
            ->select('type', 'status', DB::raw('COUNT(*) as count'))
            ->groupBy('type', 'status');

        if ($request->filled('date_from')) $query->whereDate('due_date', '>=', $request->date_from);
        if ($request->filled('date_to'))   $query->whereDate('due_date', '<=', $request->date_to);

        return response()->json(['success' => true, 'data' => $query->get()]);
    }
}
