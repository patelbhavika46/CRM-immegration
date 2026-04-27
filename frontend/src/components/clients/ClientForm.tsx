import { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Client, ClientType, ServiceType, CaseStatus, CreateClientPayload, UpdateClientPayload } from '../../types/client.types';
import { useUsers } from '../../hooks/useUsers';
import { useCreateClient, useUpdateClient } from '../../hooks/useClients';

interface FormValues {
  name: string;
  type: ClientType;
  service_type: ServiceType;
  case_status: CaseStatus;
  country_of_origin: string;
  country_of_destination: string;
  date_opened: string;
  consultant_id: string;
  notes: string;
  pc_first_name: string;
  pc_last_name: string;
  pc_email: string;
  pc_phone: string;
  pc_address: string;
}

interface Props {
  client?: Client;
  onClose: () => void;
  onSuccess?: (client: Client) => void;
}

const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: 'pr_application',     label: 'PR Application'     },
  { value: 'work_permit',        label: 'Work Permit'        },
  { value: 'study_permit',       label: 'Study Permit'       },
  { value: 'visitor_visa',       label: 'Visitor Visa'       },
  { value: 'family_sponsorship', label: 'Family Sponsorship' },
  { value: 'citizenship',        label: 'Citizenship'        },
  { value: 'visa_extension',     label: 'Visa Extension'     },
  { value: 'refugee_claim',      label: 'Refugee Claim'      },
  { value: 'other',              label: 'Other'              },
];

const STATUS_OPTIONS: { value: CaseStatus; label: string }[] = [
  { value: 'new',               label: 'New'           },
  { value: 'in_progress',       label: 'In Progress'   },
  { value: 'documents_pending', label: 'Docs Pending'  },
  { value: 'submitted',         label: 'Submitted'     },
  { value: 'under_review',      label: 'Under Review'  },
  { value: 'approved',          label: 'Approved'      },
  { value: 'rejected',          label: 'Rejected'      },
  { value: 'closed',            label: 'Closed'        },
];

function Field({ label, error, required, children }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const errorCls = `${inputCls} border-red-300 focus:ring-red-400`;

export default function ClientForm({ client, onClose, onSuccess }: Props) {
  const isEdit = Boolean(client);
  const { data: usersData } = useUsers({ per_page: 100 });
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient(client?.id ?? 0);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      name:                   client?.name ?? '',
      type:                   client?.type ?? 'individual',
      service_type:           client?.service_type ?? 'pr_application',
      case_status:            client?.case_status ?? 'new',
      country_of_origin:      client?.country_of_origin ?? '',
      country_of_destination: client?.country_of_destination ?? 'Canada',
      date_opened:            client?.date_opened ?? new Date().toISOString().split('T')[0],
      consultant_id:          client?.consultant?.id?.toString() ?? '',
      notes:                  client?.notes ?? '',
      pc_first_name: '', pc_last_name: '', pc_email: '', pc_phone: '', pc_address: '',
    },
  });

  useEffect(() => {
    if (client) {
      reset({
        name:                   client.name,
        type:                   client.type,
        service_type:           client.service_type,
        case_status:            client.case_status,
        country_of_origin:      client.country_of_origin ?? '',
        country_of_destination: client.country_of_destination,
        date_opened:            client.date_opened ?? '',
        consultant_id:          client.consultant?.id?.toString() ?? '',
        notes:                  client.notes ?? '',
      });
    }
  }, [client, reset]);

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      if (isEdit && client) {
        const payload: UpdateClientPayload = {
          name:                   values.name,
          type:                   values.type,
          service_type:           values.service_type,
          case_status:            values.case_status,
          country_of_origin:      values.country_of_origin || undefined,
          country_of_destination: values.country_of_destination,
          date_opened:            values.date_opened || undefined,
          consultant_id:          values.consultant_id ? Number(values.consultant_id) : null,
          notes:                  values.notes || undefined,
        };
        const updated = await updateMutation.mutateAsync(payload);
        onSuccess?.(updated);
      } else {
        const payload: CreateClientPayload = {
          name:                   values.name,
          type:                   values.type,
          service_type:           values.service_type,
          case_status:            values.case_status,
          country_of_origin:      values.country_of_origin || undefined,
          country_of_destination: values.country_of_destination,
          date_opened:            values.date_opened || undefined,
          consultant_id:          values.consultant_id ? Number(values.consultant_id) : null,
          notes:                  values.notes || undefined,
          primary_contact: values.pc_first_name ? {
            first_name:      values.pc_first_name || undefined,
            last_name:       values.pc_last_name  || undefined,
            email:           values.pc_email      || undefined,
            phone:           values.pc_phone      || undefined,
            current_address: values.pc_address    || undefined,
          } : undefined,
        };
        const created = await createMutation.mutateAsync(payload);
        onSuccess?.(created);
      }
      onClose();
    } catch {
      // error shown via mutation state
    }
  };

  const mutationError = (isEdit ? updateMutation : createMutation).error as { response?: { data?: { message?: string } } } | null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edit Client' : 'New Client'}
          </h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {mutationError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {mutationError.response?.data?.message ?? 'Something went wrong. Please try again.'}
            </div>
          )}

          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Case Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <Field label="Client / File Name" required error={errors.name?.message}>
                <input {...register('name', { required: 'Required' })} className={errors.name ? errorCls : inputCls}
                  placeholder="e.g. Smith Family or Acme Corp" />
              </Field>

              <Field label="Client Type" required>
                <select {...register('type', { required: true })} className={inputCls}>
                  <option value="individual">Individual</option>
                  <option value="family">Family</option>
                  <option value="corporate">Corporate</option>
                </select>
              </Field>

              <Field label="Service Type" required>
                <select {...register('service_type', { required: true })} className={inputCls}>
                  {SERVICE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>

              <Field label="Case Status">
                <select {...register('case_status')} className={inputCls}>
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>

              <Field label="Country of Origin">
                <input {...register('country_of_origin')} className={inputCls} placeholder="e.g. India" />
              </Field>

              <Field label="Country of Destination" required>
                <input {...register('country_of_destination', { required: true })} className={inputCls} placeholder="e.g. Canada" />
              </Field>

              <Field label="Date Opened">
                <input type="date" {...register('date_opened')} className={inputCls} />
              </Field>

              <Field label="Assigned Consultant">
                <select {...register('consultant_id')} className={inputCls}>
                  <option value="">— Unassigned —</option>
                  {usersData?.data.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              </Field>

            </div>

            <div className="mt-4">
              <Field label="Notes">
                <textarea {...register('notes')} rows={3} className={inputCls} placeholder="Internal notes about this case…" />
              </Field>
            </div>
          </section>

          {!isEdit && (
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Primary Contact</h3>
              <p className="text-xs text-slate-400 mb-3">Optional — creates a linked primary applicant.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <Field label="First Name">
                  <input {...register('pc_first_name')} className={inputCls} placeholder="First name" />
                </Field>

                <Field label="Last Name">
                  <input {...register('pc_last_name')} className={inputCls} placeholder="Last name" />
                </Field>

                <Field label="Email" error={errors.pc_email?.message}>
                  <input type="email"
                    {...register('pc_email', { validate: v => !v || /\S+@\S+\.\S+/.test(v) || 'Invalid email' })}
                    className={errors.pc_email ? errorCls : inputCls}
                    placeholder="contact@example.com"
                  />
                </Field>

                <Field label="Phone">
                  <input {...register('pc_phone')} className={inputCls} placeholder="+1 (555) 000-0000" />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Address">
                    <input {...register('pc_address')} className={inputCls} placeholder="Street, City, Province, Country" />
                  </Field>
                </div>

              </div>
            </section>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Client'}
          </button>
        </div>
      </div>
    </div>
  );
}
