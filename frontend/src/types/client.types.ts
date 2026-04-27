export type ClientType = 'individual' | 'family' | 'corporate';

export type CaseStatus =
  | 'new' | 'in_progress' | 'documents_pending' | 'submitted'
  | 'under_review' | 'approved' | 'rejected' | 'closed';

export type ServiceType =
  | 'pr_application' | 'work_permit' | 'study_permit' | 'visitor_visa'
  | 'family_sponsorship' | 'citizenship' | 'visa_extension' | 'refugee_claim' | 'other';

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  individual: 'Individual',
  family:     'Family',
  corporate:  'Corporate',
};

export const CLIENT_TYPE_COLORS: Record<ClientType, string> = {
  individual: 'bg-blue-100 text-blue-700',
  family:     'bg-purple-100 text-purple-700',
  corporate:  'bg-amber-100 text-amber-700',
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  new:               'New',
  in_progress:       'In Progress',
  documents_pending: 'Docs Pending',
  submitted:         'Submitted',
  under_review:      'Under Review',
  approved:          'Approved',
  rejected:          'Rejected',
  closed:            'Closed',
};

export const CASE_STATUS_COLORS: Record<CaseStatus, string> = {
  new:               'bg-slate-100 text-slate-600',
  in_progress:       'bg-blue-100 text-blue-700',
  documents_pending: 'bg-yellow-100 text-yellow-700',
  submitted:         'bg-indigo-100 text-indigo-700',
  under_review:      'bg-purple-100 text-purple-700',
  approved:          'bg-green-100 text-green-700',
  rejected:          'bg-red-100 text-red-700',
  closed:            'bg-slate-200 text-slate-500',
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  pr_application:     'PR Application',
  work_permit:        'Work Permit',
  study_permit:       'Study Permit',
  visitor_visa:       'Visitor Visa',
  family_sponsorship: 'Family Sponsorship',
  citizenship:        'Citizenship',
  visa_extension:     'Visa Extension',
  refugee_claim:      'Refugee Claim',
  other:              'Other',
};

export interface ClientApplicant {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  current_address: string | null;
  relationship: string;
  visa_type: string | null;
  application_id: string | null;
  immigration_status: string | null;
  submission_date: string | null;
  notes: string | null;
  client: { id: number; name: string; case_reference: string } | null;
  documents_count?: number;
  activities_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ClientDocument {
  id: number;
  name: string;
  original_name: string | null;
  document_type: string | null;
  file_size: number | null;
  file_size_formatted: string;
  mime_type: string | null;
  uploaded_by: { id: number; full_name: string } | null;
  created_at: string;
}

export interface Client {
  id: number;
  name: string;
  type: ClientType;
  service_type: ServiceType;
  case_status: CaseStatus;
  is_active: boolean;
  case_reference: string;
  country_of_origin: string | null;
  country_of_destination: string;
  date_opened: string | null;
  date_closed: string | null;
  notes: string | null;
  lead_id: number | null;
  consultant: { id: number; full_name: string } | null;
  primary_applicant: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  primary_contact_address: string | null;
  applicants_count?: number;
  activities_count?: number;
  documents_count?: number;
  opportunities_count?: number;
  applicants?: ClientApplicant[];
  documents?: ClientDocument[];
  created_at: string;
  updated_at: string;
}

export interface ClientFilters {
  search?: string;
  case_status?: CaseStatus;
  service_type?: ServiceType;
  consultant_id?: number;
  type?: ClientType;
  is_active?: boolean;
}

export interface CreateClientPayload {
  name: string;
  type: ClientType;
  service_type: ServiceType;
  case_status?: CaseStatus;
  country_of_origin?: string;
  country_of_destination?: string;
  date_opened?: string;
  consultant_id?: number | null;
  notes?: string;
  primary_contact?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    current_address?: string;
    nationality?: string;
    date_of_birth?: string;
  };
}

export interface UpdateClientPayload {
  name?: string;
  type?: ClientType;
  service_type?: ServiceType;
  case_status?: CaseStatus;
  country_of_origin?: string;
  country_of_destination?: string;
  date_opened?: string;
  date_closed?: string | null;
  consultant_id?: number | null;
  notes?: string;
}
