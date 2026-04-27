export type VisaType =
  | 'express_entry_pr'
  | 'provincial_nominee'
  | 'work_permit'
  | 'study_permit'
  | 'visitor_visa'
  | 'dependent'
  | 'citizenship'
  | 'other';

export type ImmigrationStatus =
  | 'awaiting_ita'
  | 'profile_created'
  | 'application_submitted'
  | 'biometrics_requested'
  | 'medical_requested'
  | 'approved'
  | 'rejected'
  | 'landed'
  | 'other';

export type ApplicantRelationship = 'primary' | 'spouse' | 'child' | 'dependent' | 'other';

export const VISA_TYPE_LABELS: Record<VisaType, string> = {
  express_entry_pr:   'PR – Express Entry',
  provincial_nominee: 'Provincial Nominee',
  work_permit:        'Work Permit',
  study_permit:       'Study Permit',
  visitor_visa:       'Visitor Visa',
  dependent:          'Dependent',
  citizenship:        'Citizenship',
  other:              'Other',
};

export const IMMIGRATION_STATUS_LABELS: Record<ImmigrationStatus, string> = {
  awaiting_ita:          'Awaiting ITA',
  profile_created:       'Profile Created',
  application_submitted: 'Application Submitted',
  biometrics_requested:  'Biometrics Requested',
  medical_requested:     'Medical Requested',
  approved:              'Approved',
  rejected:              'Rejected',
  landed:                'Landed',
  other:                 'Other',
};

export const IMMIGRATION_STATUS_COLORS: Record<ImmigrationStatus, string> = {
  approved:              'bg-green-100 text-green-700',
  landed:                'bg-emerald-100 text-emerald-700',
  rejected:              'bg-red-100 text-red-700',
  application_submitted: 'bg-indigo-100 text-indigo-700',
  awaiting_ita:          'bg-yellow-100 text-yellow-700',
  profile_created:       'bg-blue-100 text-blue-700',
  biometrics_requested:  'bg-purple-100 text-purple-700',
  medical_requested:     'bg-orange-100 text-orange-700',
  other:                 'bg-slate-100 text-slate-500',
};

export const RELATIONSHIP_LABELS: Record<ApplicantRelationship, string> = {
  primary:   'Primary Applicant',
  spouse:    'Spouse',
  child:     'Child',
  dependent: 'Dependent',
  other:     'Other',
};

export const RELATIONSHIP_COLORS: Record<ApplicantRelationship, string> = {
  primary:   'bg-indigo-100 text-indigo-700',
  spouse:    'bg-pink-100 text-pink-700',
  child:     'bg-cyan-100 text-cyan-700',
  dependent: 'bg-amber-100 text-amber-700',
  other:     'bg-slate-100 text-slate-600',
};

export interface Applicant {
  id:               number;
  first_name:       string;
  last_name:        string;
  full_name:        string;
  email:            string | null;
  phone:            string | null;
  date_of_birth:    string | null;
  nationality:      string | null;
  passport_number:  string | null;
  passport_expiry:  string | null;
  current_address:  string | null;
  relationship:     ApplicantRelationship;
  visa_type:        VisaType | null;
  application_id:   string | null;
  immigration_status: ImmigrationStatus | null;
  submission_date:  string | null;
  notes:            string | null;
  client:           { id: number; name: string; case_reference: string; case_status?: string } | null;
  documents_count?: number;
  activities_count?: number;
  created_at:       string;
  updated_at:       string;
}

export interface ApplicantFilters {
  search?:            string;
  client_id?:         number;
  visa_type?:         VisaType;
  immigration_status?: ImmigrationStatus;
  relationship?:      ApplicantRelationship;
}

export interface CreateApplicantPayload {
  client_id:          number;
  first_name:         string;
  last_name:          string;
  email?:             string;
  phone?:             string;
  date_of_birth?:     string;
  nationality?:       string;
  passport_number?:   string;
  passport_expiry?:   string;
  current_address?:   string;
  relationship?:      ApplicantRelationship;
  visa_type?:         VisaType;
  application_id?:    string;
  immigration_status?: ImmigrationStatus;
  submission_date?:   string;
  notes?:             string;
}

export type UpdateApplicantPayload = Partial<Omit<CreateApplicantPayload, 'client_id'>>;
