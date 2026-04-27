export type OpportunityStage =
  | 'prospecting' | 'qualification' | 'proposal'
  | 'negotiation' | 'closed_won' | 'closed_lost';

export const STAGE_LABELS: Record<OpportunityStage, string> = {
  prospecting:   'Prospecting',
  qualification: 'Qualification',
  proposal:      'Proposal',
  negotiation:   'Negotiation',
  closed_won:    'Closed Won',
  closed_lost:   'Closed Lost',
};

export const OPEN_STAGES: OpportunityStage[] = [
  'prospecting', 'qualification', 'proposal', 'negotiation',
];

export interface Opportunity {
  id: number;
  name: string;
  stage: OpportunityStage;
  stage_label: string;
  probability: number;
  amount: number | null;
  currency: string;
  weighted_amount: number | null;
  close_date: string | null;
  is_overdue: boolean;
  is_open: boolean;
  is_won: boolean;
  is_lost: boolean;
  description: string | null;
  client: { id: number; name: string; case_reference: string; case_status: string } | null;
  applicant: { id: number; full_name: string; visa_type: string | null } | null;
  owner: { id: number; full_name: string } | null;
  stage_history: StageHistoryEntry[] | null;
  available_transitions: OpportunityStage[];
  created_at: string;
  updated_at: string;
}

export interface StageHistoryEntry {
  id: number;
  from_stage: OpportunityStage | null;
  to_stage: OpportunityStage;
  note: string | null;
  changed_by: { id: number; full_name: string } | null;
  changed_at: string;
}

export interface KanbanColumn {
  stage: OpportunityStage;
  label: string;
  total_value: number;
  items: Opportunity[];
}

export interface OpportunityFilters {
  stage?: string;
  owner_id?: number;
  client_id?: number;
  search?: string;
  open_only?: boolean;
}

export interface CreateOpportunityPayload {
  name: string;
  client_id: number;
  applicant_id?: number;
  stage?: OpportunityStage;
  amount?: number;
  currency?: string;
  close_date?: string;
  owner_id?: number;
  description?: string;
}
