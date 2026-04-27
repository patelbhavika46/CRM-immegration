import apiClient, { ApiResponse } from './client';

export interface DashboardData {
  kpis: {
    total_leads: number;
    new_leads_this_month: number;
    total_clients: number;
    active_clients: number;
    open_opportunities: number;
    pipeline_value: number;
    won_this_month: number;
    overdue_activities: number;
    pending_activities: number;
  };
  pipeline_summary: { stage: string; label: string; count: number; total_amount: number; weighted_amount: number }[];
  recent_activities: { id: number; type: string; subject: string; status: string; due_date: string | null; related_name: string | null; assigned_to: string | null }[];
  upcoming_tasks: unknown[];
  lead_sources: { source: string; count: number }[];
}

export const dashboardApi = {
  get: () => apiClient.get<ApiResponse<DashboardData>>('/dashboard'),
};
