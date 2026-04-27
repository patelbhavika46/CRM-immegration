import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Step3OpportunityValues } from '../../../types/leadConversion.types';
import { Step1ClientValues } from '../../../types/leadConversion.types';
import FieldError from './shared/FieldError';
import FormField from './shared/FormField';

const schema = z.object({
  create_opportunity: z.boolean(),
  name:         z.string().max(200).optional(),
  amount:       z.union([z.coerce.number().min(0), z.literal('')]).optional(),
  currency:     z.string().length(3),
  close_date:   z.string().optional().refine(
    (v) => !v || new Date(v) > new Date(),
    'Close date must be in the future',
  ),
  description:  z.string().max(2000).optional(),
}).superRefine((v, ctx) => {
  if (v.create_opportunity && !v.name?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Opportunity name is required', path: ['name'] });
  }
});

const CURRENCIES = ['CAD', 'USD', 'GBP', 'EUR', 'INR', 'AUD'];

interface Props {
  client: Step1ClientValues;
  defaultValues?: Step3OpportunityValues | null;
  onNext: (values: Step3OpportunityValues) => void;
  onBack: () => void;
}

export default function Step3OpportunityForm({ client, defaultValues, onNext, onBack }: Props) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<Step3OpportunityValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      create_opportunity: false,
      name:         `Opportunity – ${client.name}`,
      amount:       '',
      currency:     'CAD',
      close_date:   '',
      description:  '',
    },
  });

  const creating = useWatch({ control, name: 'create_opportunity' });

  return (
    <form id="wizard-step-3" onSubmit={handleSubmit(onNext)} noValidate>
      <div className="space-y-5">
        {/* Toggle */}
        <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-slate-200 hover:border-indigo-300 cursor-pointer transition-colors has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
          <input
            type="checkbox"
            {...register('create_opportunity')}
            className="mt-0.5 w-4 h-4 accent-indigo-600"
          />
          <div>
            <p className="text-sm font-semibold text-slate-800">Create an Opportunity</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Track this case as a billable opportunity in the sales pipeline.
            </p>
          </div>
        </label>

        {creating && (
          <div className="space-y-5 pl-1 animate-in slide-in-from-top-2 duration-200">
            <FormField label="Opportunity Name" required>
              <input {...register('name')} className="input" />
              <FieldError message={errors.name?.message} />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="Amount">
                <div className="relative">
                  <select
                    {...register('currency')}
                    className="absolute left-0 top-0 h-full border-r border-slate-300 bg-slate-50 rounded-l-md px-2 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('amount')}
                    className="input pl-20"
                    placeholder="0.00"
                  />
                </div>
                <FieldError message={errors.amount?.message} />
              </FormField>

              <FormField label="Expected Close Date">
                <input type="date" {...register('close_date')} className="input" />
                <FieldError message={errors.close_date?.message} />
              </FormField>
            </div>

            <FormField label="Notes">
              <textarea
                {...register('description')}
                rows={3}
                className="input resize-none"
                placeholder="Scope of work, fee structure…"
              />
              <FieldError message={errors.description?.message} />
            </FormField>
          </div>
        )}
      </div>
    </form>
  );
}
