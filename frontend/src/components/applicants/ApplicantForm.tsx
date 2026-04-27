import { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { useCreateApplicant, useUpdateApplicant } from '../../hooks/useApplicants';
import type { Applicant, VisaType, ImmigrationStatus, ApplicantRelationship } from '../../types/applicant.types';
import { VISA_TYPE_LABELS, IMMIGRATION_STATUS_LABELS, RELATIONSHIP_LABELS } from '../../types/applicant.types';

interface FormValues {
  client_id:          string;
  first_name:         string;
  last_name:          string;
  email:              string;
  phone:              string;
  date_of_birth:      string;
  nationality:        string;
  passport_number:    string;
  passport_expiry:    string;
  current_address:    string;
  relationship:       ApplicantRelationship;
  visa_type:          VisaType | '';
  application_id:     string;
  immigration_status: ImmigrationStatus | '';
  submission_date:    string;
  notes:              string;
}

interface Props {
  applicant?: Applicant;
  defaultClientId?: number;
  onClose: () => void;
  onSuccess?: (a: Applicant) => void;
}

function useClients() {
  return useQuery({
    queryKey: ['clients-picker'],
    queryFn: () =>
      apiClient.get('/clients', { params: { per_page: 200 } })
        .then(r => (r.data as any).data as { id: number; name: string }[]),
    staleTime: 60_000,
  });
}

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function ApplicantForm({ applicant, defaultClientId, onClose, onSuccess }: Props) {
  const isEdit     = !!applicant;
  const create     = useCreateApplicant();
  const update     = useUpdateApplicant(applicant?.id ?? 0);
  const { data: clients } = useClients();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      client_id:          String(defaultClientId ?? applicant?.client?.id ?? ''),
      first_name:         applicant?.first_name         ?? '',
      last_name:          applicant?.last_name          ?? '',
      email:              applicant?.email              ?? '',
      phone:              applicant?.phone              ?? '',
      date_of_birth:      applicant?.date_of_birth      ?? '',
      nationality:        applicant?.nationality        ?? '',
      passport_number:    applicant?.passport_number    ?? '',
      passport_expiry:    applicant?.passport_expiry    ?? '',
      current_address:    applicant?.current_address    ?? '',
      relationship:       applicant?.relationship       ?? 'primary',
      visa_type:          (applicant?.visa_type         ?? '') as VisaType | '',
      application_id:     applicant?.application_id     ?? '',
      immigration_status: (applicant?.immigration_status ?? '') as ImmigrationStatus | '',
      submission_date:    applicant?.submission_date    ?? '',
      notes:              applicant?.notes              ?? '',
    },
  });

  useEffect(() => { if (!isEdit) reset(); }, [isEdit, reset]);

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const payload = {
      client_id:          Number(values.client_id),
      first_name:         values.first_name,
      last_name:          values.last_name,
      email:              values.email        || undefined,
      phone:              values.phone        || undefined,
      date_of_birth:      values.date_of_birth      || undefined,
      nationality:        values.nationality        || undefined,
      passport_number:    values.passport_number    || undefined,
      passport_expiry:    values.passport_expiry    || undefined,
      current_address:    values.current_address    || undefined,
      relationship:       values.relationship,
      visa_type:          (values.visa_type          || undefined) as VisaType | undefined,
      application_id:     values.application_id     || undefined,
      immigration_status: (values.immigration_status || undefined) as ImmigrationStatus | undefined,
      submission_date:    values.submission_date     || undefined,
      notes:              values.notes              || undefined,
    };

    let result: Applicant;
    if (isEdit) {
      const { client_id: _, ...rest } = payload;
      result = await update.mutateAsync(rest);
    } else {
      result = await create.mutateAsync(payload);
    }
    onSuccess?.(result);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            {isEdit ? 'Edit Applicant' : 'New Applicant'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form id="applicant-form" onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Section: Client */}
          {!isEdit && (
            <div>
              <SectionHeader title="Associated Client" />
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Client <span className="text-red-500">*</span>
                </label>
                <select {...register('client_id', { required: 'Client is required' })} className={inputCls}>
                  <option value="">— Select client —</option>
                  {clients?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.client_id && <Err msg={errors.client_id.message!} />}
              </div>
            </div>
          )}

          {/* Section: Personal Information */}
          <div>
            <SectionHeader title="Personal Information" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input {...register('first_name', { required: 'Required' })} className={inputCls} placeholder="Jane" />
                {errors.first_name && <Err msg={errors.first_name.message!} />}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input {...register('last_name', { required: 'Required' })} className={inputCls} placeholder="Doe" />
                {errors.last_name && <Err msg={errors.last_name.message!} />}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date of Birth</label>
                <input type="date" {...register('date_of_birth')} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nationality</label>
                <input {...register('nationality')} className={inputCls} placeholder="e.g. Indian" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input type="email" {...register('email')} className={inputCls} placeholder="jane@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                <input {...register('phone')} className={inputCls} placeholder="+1 555-000-0000" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Current Address</label>
                <input {...register('current_address')} className={inputCls} placeholder="Street, City, Province, Postal Code" />
              </div>
            </div>
          </div>

          {/* Section: Travel Document */}
          <div>
            <SectionHeader title="Travel Document" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Passport Number</label>
                <input {...register('passport_number')} className={inputCls} placeholder="AB1234567" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Passport Expiry</label>
                <input type="date" {...register('passport_expiry')} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Section: Immigration Details */}
          <div>
            <SectionHeader title="Immigration Details" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Relationship to Case</label>
                <select {...register('relationship')} className={inputCls}>
                  {(Object.entries(RELATIONSHIP_LABELS) as [ApplicantRelationship, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Visa Type</label>
                <select {...register('visa_type')} className={inputCls}>
                  <option value="">— Select —</option>
                  {(Object.entries(VISA_TYPE_LABELS) as [VisaType, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Application ID</label>
                <input {...register('application_id')} className={inputCls} placeholder="e.g. 2024-IMM-00123" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Current Status</label>
                <select {...register('immigration_status')} className={inputCls}>
                  <option value="">— Select —</option>
                  {(Object.entries(IMMIGRATION_STATUS_LABELS) as [ImmigrationStatus, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Submission Date</label>
                <input type="date" {...register('submission_date')} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea {...register('notes')} rows={3} className={inputCls}
              placeholder="Any additional notes about this applicant…" />
          </div>

        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button form="applicant-form" type="submit" disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Applicant'}
          </button>
        </div>

      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
      {title}
    </h3>
  );
}

function Err({ msg }: { msg: string }) {
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}
