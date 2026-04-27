import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Opportunity } from '../../types/opportunity.types';
import { useUpdateOpportunity } from '../../hooks/useOpportunities';
import FormField from '../leads/wizard/shared/FormField';
import FieldError from '../leads/wizard/shared/FieldError';

const CURRENCIES = ['CAD', 'USD', 'EUR', 'GBP', 'AUD', 'INR'];

const schema = z.object({
  name:        z.string().min(1, 'Name is required').max(200),
  amount:      z.preprocess(
    v => (v === '' || v === undefined || v === null) ? undefined : Number(v),
    z.number({ invalid_type_error: 'Must be a number' }).positive('Must be positive').optional(),
  ),
  currency:    z.string().min(1),
  close_date:  z.string().optional(),
  description: z.string().max(1000, 'Max 1000 characters').optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  opportunity: Opportunity;
  onClose: () => void;
}

export default function OpportunityEditModal({ opportunity, onClose }: Props) {
  const update = useUpdateOpportunity();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:        opportunity.name,
      amount:      opportunity.amount ?? undefined,
      currency:    opportunity.currency || 'CAD',
      close_date:  opportunity.close_date?.slice(0, 10) ?? '',
      description: opportunity.description ?? '',
    },
  });

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onSubmit = async (values: FormValues) => {
    await update.mutateAsync({ id: opportunity.id, ...values });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />

      {/* Panel */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-card-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Edit Opportunity</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[300px]">{opportunity.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <FormField label="Name" required>
            <input
              {...register('name')}
              className="input"
              placeholder="Opportunity name"
              autoFocus
            />
            <FieldError message={errors.name?.message} />
          </FormField>

          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3">
              <FormField label="Amount">
                <input
                  {...register('amount')}
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  placeholder="0.00"
                />
                <FieldError message={errors.amount?.message} />
              </FormField>
            </div>
            <div className="col-span-2">
              <FormField label="Currency">
                <select {...register('currency')} className="input">
                  {CURRENCIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          <FormField label="Close Date">
            <input {...register('close_date')} type="date" className="input" />
          </FormField>

          <FormField label="Description">
            <textarea
              {...register('description')}
              rows={3}
              className="input resize-none"
              placeholder="Add notes…"
            />
            <FieldError message={errors.description?.message} />
          </FormField>

          {update.isError && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
              Failed to save changes. Please try again.
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={update.isPending}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700
                disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-colors
                inline-flex items-center gap-2"
            >
              {update.isPending && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {update.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
