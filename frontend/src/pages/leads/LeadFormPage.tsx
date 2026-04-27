import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateLead, useUpdateLead, useLead } from '../../hooks/useLeads';
import { useUsers } from '../../hooks/useUsers';
import { useAuthStore } from '../../store/authStore';

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  first_name:        z.string().min(1, 'First name is required').max(100),
  last_name:         z.string().min(1, 'Last name is required').max(100),
  email:             z.string().email('Invalid email address').max(255).or(z.literal('')).optional(),
  phone:             z.string().max(30).optional(),
  company:           z.string().max(200).optional(),
  visa_interest:     z.string().max(100).optional(),
  country_of_origin: z.string().max(100).optional(),
  status:            z.enum(['new', 'contacted', 'qualified', 'disqualified']),
  source:            z.enum(['web', 'referral', 'cold_call', 'event', 'social_media', 'other']),
  owner_id:          z.coerce.number().nullable().optional(),
  notes:             z.string().max(5000).optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'new',          label: 'New' },
  { value: 'contacted',    label: 'Contacted' },
  { value: 'qualified',    label: 'Qualified' },
  { value: 'disqualified', label: 'Disqualified' },
];

const SOURCE_OPTIONS = [
  { value: 'web',          label: 'Web / Online' },
  { value: 'referral',     label: 'Referral' },
  { value: 'cold_call',    label: 'Cold Call' },
  { value: 'event',        label: 'Event' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'other',        label: 'Other' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="pt-2 border-t border-slate-100">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeadFormPage() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const { can }    = useAuthStore();
  const isEdit     = !!id;
  const leadId     = isEdit ? Number(id) : 0;

  const { data: lead, isLoading: leadLoading } = useLead(leadId);
  const createLead = useCreateLead();
  const updateLead = useUpdateLead(leadId);

  const canManageOwner = can('users.view') || can('users.manage');
  const { data: usersData } = useUsers({ enabled: canManageOwner });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'new', source: 'web' },
  });

  // Pre-fill when editing
  useEffect(() => {
    if (isEdit && lead) {
      reset({
        first_name:        lead.first_name,
        last_name:         lead.last_name,
        email:             lead.email ?? '',
        phone:             lead.phone ?? '',
        company:           lead.company ?? '',
        visa_interest:     lead.visa_interest ?? '',
        country_of_origin: lead.country_of_origin ?? '',
        status:            lead.status === 'converted' ? 'qualified' : lead.status as FormValues['status'],
        source:            lead.source,
        owner_id:          lead.owner?.id ?? null,
        notes:             lead.notes ?? '',
      });
    }
  }, [lead, isEdit, reset]);

  // ── Submit ────────────────────────────────────────────────────────────────

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      email:             values.email             || undefined,
      phone:             values.phone             || undefined,
      company:           values.company           || undefined,
      visa_interest:     values.visa_interest     || undefined,
      country_of_origin: values.country_of_origin || undefined,
      notes:             values.notes             || undefined,
      owner_id:          values.owner_id          || undefined,
    };

    try {
      if (isEdit) {
        await updateLead.mutateAsync(payload);
        navigate(`/leads/${id}`);
      } else {
        const newLead = await createLead.mutateAsync(payload);
        navigate(`/leads/${newLead.id}`);
      }
    } catch {
      // Errors are shown via mutation state below
    }
  };

  const isBusy = isSubmitting || createLead.isPending || updateLead.isPending;
  const mutationError =
    (createLead.error as any)?.response?.data?.message ??
    (updateLead.error as any)?.response?.data?.message;

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (isEdit && leadLoading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(isEdit ? `/leads/${id}` : '/leads')}
          className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1 transition-colors"
        >
          ← {isEdit ? 'Back to Lead' : 'Back to Leads'}
        </button>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? 'Edit Lead' : 'New Lead'}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {isEdit ? 'Update the details for this lead.' : 'Fill in the details to create a new lead.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">

          {/* API error */}
          {mutationError && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              {mutationError}
            </div>
          )}

          {/* ── Personal ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="First Name" required error={errors.first_name?.message}>
              <input
                {...register('first_name')}
                className="input"
                placeholder="e.g. John"
                autoFocus
              />
            </Field>
            <Field label="Last Name" required error={errors.last_name?.message}>
              <input
                {...register('last_name')}
                className="input"
                placeholder="e.g. Smith"
              />
            </Field>
          </div>

          <Field label="Company / Organisation" error={errors.company?.message}>
            <input
              {...register('company')}
              className="input"
              placeholder="e.g. Acme Corp"
            />
          </Field>

          <SectionHeader title="Contact Information" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Email" error={errors.email?.message}>
              <input
                type="email"
                {...register('email')}
                className="input"
                placeholder="john@example.com"
              />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input
                type="tel"
                {...register('phone')}
                className="input"
                placeholder="+1 (555) 000-0000"
              />
            </Field>
          </div>

          <SectionHeader title="Lead Details" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Status" error={errors.status?.message}>
              <select {...register('status')} className="input">
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Lead Source" error={errors.source?.message}>
              <select {...register('source')} className="input">
                {SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <SectionHeader title="Immigration Details" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Visa Interest" error={errors.visa_interest?.message}>
              <input
                {...register('visa_interest')}
                className="input"
                placeholder="e.g. PR – Express Entry"
              />
            </Field>
            <Field label="Country of Origin" error={errors.country_of_origin?.message}>
              <input
                {...register('country_of_origin')}
                className="input"
                placeholder="e.g. India"
              />
            </Field>
          </div>

          {/* Owner assignment — only for users with permission */}
          {canManageOwner && (
            <>
              <SectionHeader title="Assignment" />
              <Field label="Assigned Owner" error={errors.owner_id?.message}>
                <select {...register('owner_id')} className="input">
                  <option value="">— Unassigned —</option>
                  {usersData?.data.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name}
                      {u.role ? ` (${u.role.name})` : ''}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}

          <SectionHeader title="Notes" />

          <Field label="Internal Notes" error={errors.notes?.message}>
            <textarea
              {...register('notes')}
              rows={4}
              className="input resize-none"
              placeholder="Any relevant context, qualification notes, or follow-up reminders…"
            />
          </Field>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => navigate(isEdit ? `/leads/${id}` : '/leads')}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isBusy}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isBusy && (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {isBusy
              ? isEdit ? 'Saving…' : 'Creating…'
              : isEdit ? 'Save Changes' : 'Create Lead'}
          </button>
        </div>
      </form>
    </div>
  );
}
