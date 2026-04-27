import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Step2ApplicantValues, VisaType } from '../../../types/leadConversion.types';
import { Lead } from '../../../types/lead.types';
import FieldError from './shared/FieldError';
import FormField from './shared/FormField';

const schema = z.object({
  first_name:      z.string().min(1, 'First name is required').max(100),
  last_name:       z.string().min(1, 'Last name is required').max(100),
  email:           z.string().email('Invalid email').max(255).or(z.literal('')).optional(),
  phone:           z.string().max(30).optional(),
  date_of_birth:   z.string().optional().refine(
    (v) => !v || new Date(v) < new Date(),
    'Date of birth must be in the past',
  ),
  nationality:     z.string().max(100).optional(),
  passport_number: z.string().max(50).optional(),
  passport_expiry: z.string().optional().refine(
    (v) => !v || new Date(v) > new Date(),
    'Passport must not be expired',
  ),
  current_address: z.string().max(500).optional(),
  visa_type:       z.enum([
    'express_entry_pr', 'provincial_nominee', 'work_permit',
    'study_permit', 'visitor_visa', 'dependent', 'citizenship', 'other',
  ]).or(z.literal('')).optional(),
  application_id:  z.string().max(100).optional(),
});

const VISA_TYPES: { value: VisaType; label: string }[] = [
  { value: 'express_entry_pr', label: 'PR – Express Entry' },
  { value: 'provincial_nominee', label: 'Provincial Nominee' },
  { value: 'work_permit',     label: 'Work Permit' },
  { value: 'study_permit',    label: 'Study Permit' },
  { value: 'visitor_visa',    label: 'Visitor Visa' },
  { value: 'dependent',       label: 'Dependent' },
  { value: 'citizenship',     label: 'Citizenship' },
  { value: 'other',           label: 'Other' },
];

interface Props {
  lead: Lead;
  defaultValues?: Step2ApplicantValues | null;
  onNext: (values: Step2ApplicantValues) => void;
  onBack: () => void;
}

export default function Step2ApplicantForm({ lead, defaultValues, onNext, onBack }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<Step2ApplicantValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      first_name:      lead.first_name,
      last_name:       lead.last_name,
      email:           lead.email ?? '',
      phone:           lead.phone ?? '',
      nationality:     lead.country_of_origin ?? '',
      visa_type:       (lead.visa_interest as VisaType) ?? undefined,
      date_of_birth:   '',
      passport_number: '',
      passport_expiry: '',
      current_address: '',
      application_id:  '',
    },
  });

  return (
    <form id="wizard-step-2" onSubmit={handleSubmit(onNext)} noValidate>
      <div className="space-y-5">
        {/* Personal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="First Name" required>
            <input {...register('first_name')} className="input" />
            <FieldError message={errors.first_name?.message} />
          </FormField>
          <FormField label="Last Name" required>
            <input {...register('last_name')} className="input" />
            <FieldError message={errors.last_name?.message} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Email">
            <input type="email" {...register('email')} className="input" placeholder="applicant@example.com" />
            <FieldError message={errors.email?.message} />
          </FormField>
          <FormField label="Phone">
            <input type="tel" {...register('phone')} className="input" placeholder="+1 (555) 000-0000" />
            <FieldError message={errors.phone?.message} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Date of Birth">
            <input type="date" {...register('date_of_birth')} className="input" />
            <FieldError message={errors.date_of_birth?.message} />
          </FormField>
          <FormField label="Nationality">
            <input {...register('nationality')} className="input" placeholder="e.g. Indian" />
            <FieldError message={errors.nationality?.message} />
          </FormField>
        </div>

        {/* Travel document */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Travel Document</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Passport Number">
              <input {...register('passport_number')} className="input" placeholder="A1234567" />
              <FieldError message={errors.passport_number?.message} />
            </FormField>
            <FormField label="Passport Expiry">
              <input type="date" {...register('passport_expiry')} className="input" />
              <FieldError message={errors.passport_expiry?.message} />
            </FormField>
          </div>
        </div>

        {/* Immigration */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Immigration Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Visa Type">
              <select {...register('visa_type')} className="input">
                <option value="">— Select —</option>
                {VISA_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <FieldError message={errors.visa_type?.message} />
            </FormField>
            <FormField label="Application ID">
              <input {...register('application_id')} className="input" placeholder="e.g. EE12345" />
              <FieldError message={errors.application_id?.message} />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label="Current Address">
              <textarea
                {...register('current_address')}
                rows={2}
                className="input resize-none"
                placeholder="Street, City, Country"
              />
              <FieldError message={errors.current_address?.message} />
            </FormField>
          </div>
        </div>
      </div>
    </form>
  );
}
