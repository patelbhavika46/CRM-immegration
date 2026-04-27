export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'disqualified' | 'converted';
export type LeadSource = 'web' | 'referral' | 'cold_call' | 'event' | 'social_media' | 'other';

export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  visa_interest: string | null;
  country_of_origin: string | null;
  status: LeadStatus;
  source: LeadSource;
  notes: string | null;
  is_converted: boolean;
  converted_at: string | null;
  owner: { id: number; full_name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  owner_id?: number;
  search?: string;
  sort_by?: 'full_name' | 'company' | 'status' | 'source' | 'created_at';
  sort_dir?: 'asc' | 'desc';
}

export type CreateLeadPayload = Pick<Lead,
  'first_name' | 'last_name'
> & Partial<Pick<Lead,
  'email' | 'phone' | 'company' | 'visa_interest' | 'country_of_origin' | 'status' | 'source' | 'notes'
>> & { owner_id?: number };

export type UpdateLeadPayload = Partial<CreateLeadPayload>;

export interface ConvertLeadPayload {
  client: {
    name?: string;
    type?: 'individual' | 'family' | 'corporate';
    service_type?: string;
    country_of_destination?: string;
  };
  applicant?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  create_opportunity?: boolean;
  opportunity?: {
    name?: string;
    amount?: number;
    currency?: string;
  };
}
