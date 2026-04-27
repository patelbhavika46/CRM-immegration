// ── Step data shapes ────────────────────────────────────────────────────────

export type ClientType = 'individual' | 'family' | 'corporate';
export type ServiceType =
  | 'pr_application' | 'work_permit' | 'study_permit' | 'visitor_visa'
  | 'family_sponsorship' | 'citizenship' | 'visa_extension' | 'refugee_claim' | 'other';

export type VisaType =
  | 'express_entry_pr' | 'provincial_nominee' | 'work_permit'
  | 'study_permit' | 'visitor_visa' | 'dependent' | 'citizenship' | 'other';

export interface Step1ClientValues {
  name: string;
  type: ClientType;
  service_type: ServiceType;
  country_of_destination: string;
  consultant_id?: number | null;
  notes?: string;
}

export interface Step2ApplicantValues {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  passport_number?: string;
  passport_expiry?: string;
  current_address?: string;
  visa_type?: VisaType;
  application_id?: string;
}

export interface Step3OpportunityValues {
  create_opportunity: boolean;
  name?: string;
  amount?: number | '';
  currency: string;
  close_date?: string;
  description?: string;
}

// ── Accumulated wizard state ─────────────────────────────────────────────────

export interface WizardFormData {
  step1: Step1ClientValues | null;
  step2: Step2ApplicantValues | null;
  step3: Step3OpportunityValues | null;
}

// ── API payload / response ───────────────────────────────────────────────────

export interface ConvertLeadPayload {
  client: Step1ClientValues;
  applicant: Step2ApplicantValues;
  create_opportunity: boolean;
  opportunity?: Omit<Step3OpportunityValues, 'create_opportunity'>;
}

export interface ConversionResult {
  client: {
    id: number;
    name: string;
    type: ClientType;
    service_type: ServiceType;
    case_status: string;
    case_reference: string;
    consultant: { id: number; full_name: string } | null;
  };
  applicant: {
    id: number;
    full_name: string;
    email: string | null;
    visa_type: VisaType | null;
    relationship: string;
  };
  opportunity: {
    id: number;
    name: string;
    stage: string;
    amount: number | null;
    currency: string;
  } | null;
}
