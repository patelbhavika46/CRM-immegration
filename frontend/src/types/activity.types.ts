export type ActivityType =
  | 'client_call' | 'email' | 'meeting' | 'gov_submission'
  | 'internal_task' | 'document_request' | 'sms' | 'note';

export type ActivityStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  client_call:      'Client Call',
  email:            'Email',
  meeting:          'Meeting',
  gov_submission:   'Gov. Submission',
  internal_task:    'Internal Task',
  document_request: 'Document Request',
  sms:              'SMS',
  note:             'Note',
};

export const STATUS_COLORS: Record<ActivityStatus, string> = {
  pending:     'bg-yellow-100 text-yellow-700',
  scheduled:   'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-slate-100 text-slate-500',
};

export interface Activity {
  id: number;
  type: ActivityType;
  subject: string;
  notes: string | null;
  outcome: string | null;
  status: ActivityStatus;
  due_date: string | null;
  due_time: string | null;
  completed_at: string | null;
  application_stage: string | null;
  relatable_type: string | null;
  relatable_id: number | null;
  is_overdue: boolean;
  assigned_to: { id: number; full_name: string } | null;
  relatable: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityFilters {
  type?: ActivityType;
  status?: ActivityStatus;
  assigned_to?: number;
  relatable_type?: string;
  relatable_id?: number;
  due_date_from?: string;
  due_date_to?: string;
  overdue?: boolean;
  search?: string;
}

export interface CreateActivityPayload {
  type: ActivityType;
  subject: string;
  notes?: string;
  relatable_type: string;
  relatable_id: number;
  due_date?: string;
  due_time?: string;
  status?: ActivityStatus;
  application_stage?: string;
  assigned_to?: number;
}
