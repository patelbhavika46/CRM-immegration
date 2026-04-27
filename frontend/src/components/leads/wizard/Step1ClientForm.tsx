import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Step1ClientValues, ClientType, ServiceType } from '../../../types/leadConversion.types';
import { Lead } from '../../../types/lead.types';
import FieldError from './shared/FieldError';
import FormField from './shared/FormField';

const schema = z.object({
  name: z.string().min(1, 'Client name is required').max(200),
  type: z.enum(['individual', 'family', 'corporate']),
  service_type: z.enum([
    'pr_application', 'work_permit', 'study_permit', 'visitor_visa',
    'family_sponsorship', 'citizenship', 'visa_extension', 'refugee_claim', 'other',
  ]),
  country_of_destination: z.string().min(1, 'Destination country is required').max(100),
  consultant_id: z.coerce.number().nullable().optional(),
  notes: z.string().max(5000).optional(),
});

const CLIENT_TYPES: { value: ClientType; label: string }[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'family',     label: 'Family' },
  { value: 'corporate',  label: 'Corporate' },
];

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'pr_application',   label: 'PR Application' },
  { value: 'work_permit',      label: 'Work Permit' },
  { value: 'study_permit',     label: 'Study Permit' },
  { value: 'visitor_visa',     label: 'Visitor Visa' },
  { value: 'family_sponsorship', label: 'Family Sponsorship' },
  { value: 'citizenship',      label: 'Citizenship' },
  { value: 'visa_extension',   label: 'Visa Extension' },
  { value: 'refugee_claim',    label: 'Refugee Claim' },
  { value: 'other',            label: 'Other' },
];

interface Props {
  lead: Lead;
  defaultValues?: Step1ClientValues | null;
  onNext: (values: Step1ClientValues) => void;
}

export default function Step1ClientForm({ lead, defaultValues, onNext }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<Step1ClientValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      name:                   lead.company ?? lead.full_name,
      type:                   'individual',
      service_type:           'pr_application',
      country_of_destination: 'Canada',
      consultant_id:          lead.owner?.id ?? null,
      notes:                  '',
    },
  });

  return (
    <form id="wizard-step-1" onSubmit={handleSubmit(onNext)} noValidate>
      <div className="space-y-5">
        <FormField label="Contact / Account Name" required>
          <input
            {...register('name')}
            className="input"
            placeholder="e.g. Smith Family or Acme Corp"
          />
          <FieldError message={errors.name?.message} />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Contact Type" required>
            <select {...register('type')} className="input">
              {CLIENT_TYPES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <FieldError message={errors.type?.message} />
          </FormField>

          <FormField label="Service Type" required>
            <select {...register('service_type')} className="input">
              {SERVICE_TYPES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <FieldError message={errors.service_type?.message} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Country of Origin">
            <input
              readOnly
              value={lead.country_of_origin ?? ''}
              className="input bg-slate-50 cursor-not-allowed"
              tabIndex={-1}
            />
            <p className="mt-1 text-xs text-slate-400">Inherited from lead</p>
          </FormField>

          <FormField label="Country of Destination" required>
            <input
              {...register('country_of_destination')}
              className="input"
              placeholder="Canada"
            />
            <FieldError message={errors.country_of_destination?.message} />
          </FormField>
        </div>

        <FormField label="Internal Notes">
          <textarea
            {...register('notes')}
            rows={3}
            className="input resize-none"
            placeholder="Initial consultation notes, eligibility summary…"
          />
          <FieldError message={errors.notes?.message} />
        </FormField>
      </div>
    </form>
  );
}
