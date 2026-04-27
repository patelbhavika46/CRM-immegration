import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useClientApplicants, useAddApplicant, useLinkApplicant, useUnlinkApplicant } from '../../hooks/useClients';
import { ClientApplicant } from '../../types/client.types';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';

const REL_COLORS: Record<string, string> = {
  primary: 'bg-indigo-100 text-indigo-700',
  spouse:  'bg-pink-100 text-pink-700',
  child:   'bg-cyan-100 text-cyan-700',
  parent:  'bg-amber-100 text-amber-700',
  sibling: 'bg-purple-100 text-purple-700',
  other:   'bg-slate-100 text-slate-600',
};

interface NewApplicantFormValues {
  first_name: string; last_name: string; email: string; phone: string;
  relationship: string; nationality: string; visa_type: string; current_address: string;
}

function AddApplicantModal({ clientId, onClose }: { clientId: number; onClose: () => void }) {
  const addApplicant = useAddApplicant(clientId);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NewApplicantFormValues>({
    defaultValues: { first_name: '', last_name: '', email: '', phone: '', relationship: 'primary', nationality: '', visa_type: '', current_address: '' },
  });

  const onSubmit: SubmitHandler<NewApplicantFormValues> = async (values) => {
    await addApplicant.mutateAsync(values as Record<string, unknown>);
    onClose();
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Add Applicant</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">First Name <span className="text-red-500">*</span></label>
              <input {...register('first_name', { required: 'Required' })} className={inputCls} placeholder="Jane" />
              {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Last Name <span className="text-red-500">*</span></label>
              <input {...register('last_name', { required: 'Required' })} className={inputCls} placeholder="Doe" />
              {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input type="email" {...register('email')} className={inputCls} placeholder="jane@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <input {...register('phone')} className={inputCls} placeholder="+1 555-000-0000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Relationship</label>
              <select {...register('relationship')} className={inputCls}>
                <option value="primary">Primary Applicant</option>
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nationality</label>
              <input {...register('nationality')} className={inputCls} placeholder="e.g. Indian" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Visa Type</label>
            <input {...register('visa_type')} className={inputCls} placeholder="e.g. Work Permit" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
            <input {...register('current_address')} className={inputCls} placeholder="Current address" />
          </div>
        </form>
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-200">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {isSubmitting ? 'Adding…' : 'Add Applicant'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LinkApplicantModal({ clientId, onClose }: { clientId: number; onClose: () => void }) {
  const [search, setSearch]       = useState('');
  const [results, setResults]     = useState<ClientApplicant[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError]         = useState('');
  const linkMutation = useLinkApplicant(clientId);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true); setError('');
    try {
      const res = await apiClient.get('/applicants', { params: { search, per_page: 10 } });
      setResults(res.data.data ?? []);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleLink = async (applicantId: number) => {
    try {
      await linkMutation.mutateAsync(applicantId);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Link failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Link Existing Applicant</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="flex gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search by name, email, passport…"
            />
            <button onClick={handleSearch} disabled={searching}
              className="px-3 py-2 text-sm font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50">
              {searching ? '…' : 'Search'}
            </button>
          </div>
          {results.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-indigo-300">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.full_name}</p>
                    <p className="text-xs text-slate-400">
                      {a.email ?? '—'} · {a.visa_type ?? 'No visa type'}
                      {a.client && ` · Linked to ${a.client.name}`}
                    </p>
                  </div>
                  <button onClick={() => handleLink(a.id)} disabled={linkMutation.isPending}
                    className="px-3 py-1 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    Link
                  </button>
                </div>
              ))}
            </div>
          )}
          {results.length === 0 && search && !searching && (
            <p className="text-center text-sm text-slate-400 py-4">No applicants found for "{search}"</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ApplicantRow({ applicant, clientId, canEdit }: { applicant: ClientApplicant; clientId: number; canEdit: boolean }) {
  const navigate       = useNavigate();
  const unlinkMutation = useUnlinkApplicant(clientId);
  const relColor = REL_COLORS[applicant.relationship] ?? REL_COLORS.other;

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <button onClick={() => navigate(`/applicants/${applicant.id}`)}
          className="font-medium text-indigo-600 hover:underline text-left">
          {applicant.full_name}
        </button>
        {applicant.email && <p className="text-xs text-slate-400 mt-0.5">{applicant.email}</p>}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${relColor}`}>
          {applicant.relationship}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{applicant.visa_type?.replace(/_/g, ' ') ?? '—'}</td>
      <td className="px-4 py-3 text-sm font-mono text-slate-400 text-xs">{applicant.application_id ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{applicant.immigration_status?.replace(/_/g, ' ') ?? '—'}</td>
      <td className="px-4 py-3">
        {canEdit && applicant.relationship !== 'primary' && (
          <button
            onClick={() => {
              if (window.confirm(`Unlink ${applicant.full_name} from this client?`)) {
                unlinkMutation.mutate(applicant.id);
              }
            }}
            className="text-xs text-slate-400 hover:text-red-600 transition-colors"
          >
            Unlink
          </button>
        )}
      </td>
    </tr>
  );
}

interface Props { clientId: number }

export default function ClientApplicantsSection({ clientId }: Props) {
  const [addOpen, setAddOpen]   = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const { can } = useAuthStore();
  const { data: applicants, isLoading } = useClientApplicants(clientId);
  const canEdit = can('clients.edit');

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Associated Applicants
          {applicants && <span className="ml-2 text-slate-400 font-normal normal-case">({applicants.length})</span>}
        </h2>
        {canEdit && (
          <div className="flex gap-2">
            <button onClick={() => setLinkOpen(true)}
              className="px-3 py-1 text-xs font-medium border border-slate-300 rounded-lg hover:bg-white text-slate-600 transition-colors">
              Link Existing
            </button>
            <button onClick={() => setAddOpen(true)}
              className="px-3 py-1 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              + Add Applicant
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !applicants?.length ? (
        <div className="text-center py-10">
          <p className="text-slate-400 text-sm">No applicants linked to this client.</p>
          {canEdit && (
            <button onClick={() => setAddOpen(true)} className="mt-2 text-sm text-indigo-600 hover:underline">
              Add the primary applicant →
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Applicant</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Relationship</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Visa Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Application ID</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {applicants.map(a => (
                <ApplicantRow key={a.id} applicant={a} clientId={clientId} canEdit={canEdit} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {addOpen  && <AddApplicantModal  clientId={clientId} onClose={() => setAddOpen(false)}  />}
      {linkOpen && <LinkApplicantModal clientId={clientId} onClose={() => setLinkOpen(false)} />}
    </div>
  );
}
