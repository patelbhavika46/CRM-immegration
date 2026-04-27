import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApplicant, useDeleteApplicant } from '../../hooks/useApplicants';
import { useAuthStore } from '../../store/authStore';
import {
  Applicant,
  VISA_TYPE_LABELS,
  IMMIGRATION_STATUS_LABELS,
  IMMIGRATION_STATUS_COLORS,
  RELATIONSHIP_LABELS,
  RELATIONSHIP_COLORS,
  ImmigrationStatus,
  VisaType,
  ApplicantRelationship,
} from '../../types/applicant.types';
import ApplicantForm       from '../../components/applicants/ApplicantForm';
import CommunicationsTab   from '../../components/applicants/tabs/CommunicationsTab';
import DocumentsTab        from '../../components/applicants/tabs/DocumentsTab';
import TasksTab            from '../../components/applicants/tabs/TasksTab';
import CaseHistoryTab      from '../../components/applicants/tabs/CaseHistoryTab';

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function fmt(iso: string | null | undefined, style: 'date' | 'short' = 'date') {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-CA', style === 'short'
    ? { month: 'short', day: 'numeric', year: 'numeric' }
    : { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <div className="text-sm font-medium text-slate-800">{children}</div>
    </div>
  );
}

function Divider() {
  return <hr className="border-slate-100" />;
}

function DeleteModal({ applicant, onConfirm, onCancel }: {
  applicant: Applicant; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-900 text-center mb-1">Delete Applicant?</h3>
        <p className="text-sm text-slate-500 text-center mb-5">
          <span className="font-medium text-slate-700">{applicant.full_name}</span> will be soft-deleted.
          Documents and activities are retained.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-32 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="h-56 bg-white rounded-2xl border border-slate-200" />
        <div className="h-56 bg-white rounded-2xl border border-slate-200" />
      </div>
      <div className="h-80 bg-white rounded-2xl border border-slate-200" />
    </div>
  );
}

// ── Tabs config ───────────────────────────────────────────────────────────────

type TabId = 'communications' | 'documents' | 'tasks' | 'history';

const TABS: { id: TabId; label: string; icon: React.ReactNode; countKey?: keyof Applicant }[] = [
  {
    id: 'communications', label: 'Communications', countKey: 'activities_count',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    id: 'documents', label: 'Documents', countKey: 'documents_count',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'tasks', label: 'Tasks',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'history', label: 'Case History',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ApplicantDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can }  = useAuthStore();

  const applicantId = Number(id);
  const { data: applicant, isLoading, isError } = useApplicant(applicantId);

  const [activeTab,  setActiveTab]  = useState<TabId>('communications');
  const [editOpen,   setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useDeleteApplicant();

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(applicantId);
    navigate('/applicants');
  };

  if (isLoading) return <Skeleton />;

  if (isError || !applicant) {
    return (
      <div className="py-24 text-center">
        <p className="text-red-600 font-medium mb-3">Applicant not found.</p>
        <button onClick={() => navigate('/applicants')}
          className="text-sm text-indigo-600 hover:underline">← Back to Applicants</button>
      </div>
    );
  }

  const statusColor = applicant.immigration_status
    ? IMMIGRATION_STATUS_COLORS[applicant.immigration_status as ImmigrationStatus]
    : 'bg-slate-100 text-slate-500';
  const relColor = RELATIONSHIP_COLORS[applicant.relationship as ApplicantRelationship] ?? 'bg-slate-100 text-slate-600';

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-5 pb-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-400">
          <Link to="/applicants" className="hover:text-slate-600 transition-colors">Applicants</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-700 font-medium truncate max-w-[200px]">{applicant.full_name}</span>
        </nav>

        {/* ── Hero Card ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

          {/* Accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

          <div className="px-6 py-5">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">

              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white text-xl font-bold tracking-wide">
                  {initials(applicant.full_name)}
                </span>
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-slate-900 leading-tight">{applicant.full_name}</h1>
                {applicant.application_id && (
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{applicant.application_id}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${relColor}`}>
                    {RELATIONSHIP_LABELS[applicant.relationship as ApplicantRelationship]}
                  </span>
                  {applicant.immigration_status && (
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                      {IMMIGRATION_STATUS_LABELS[applicant.immigration_status as ImmigrationStatus]}
                    </span>
                  )}
                  {applicant.visa_type && (
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                      {VISA_TYPE_LABELS[applicant.visa_type as VisaType]}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {can('applicants.edit') && (
                  <button onClick={() => setEditOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                )}
                {can('applicants.delete') && (
                  <button onClick={() => setDeleteOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Stats bar */}
            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Documents',   value: applicant.documents_count  ?? 0, color: 'text-teal-600',   bg: 'bg-teal-50'   },
                { label: 'Activities',  value: applicant.activities_count ?? 0, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Nationality', value: applicant.nationality ?? '—',    color: 'text-slate-700',  bg: 'bg-slate-50'  },
                { label: 'Added',       value: fmt(applicant.created_at, 'short'), color: 'text-slate-700', bg: 'bg-slate-50' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl px-3 py-2.5 ${s.bg}`}>
                  <p className={`text-sm font-bold truncate ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Info Grid ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* A. Personal Information */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100">
              <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Personal Information</h2>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name">
                  <span>{applicant.full_name}</span>
                </Field>
                <Field label="Date of Birth">
                  <span>{fmt(applicant.date_of_birth)}</span>
                </Field>
              </div>
              <Divider />
              <Field label="Nationality">
                <span>{applicant.nationality ?? '—'}</span>
              </Field>
              <Divider />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Email">
                  {applicant.email
                    ? <a href={`mailto:${applicant.email}`} className="text-indigo-600 hover:underline truncate block">{applicant.email}</a>
                    : <span className="text-slate-400">—</span>
                  }
                </Field>
                <Field label="Phone">
                  {applicant.phone
                    ? <a href={`tel:${applicant.phone}`} className="text-indigo-600 hover:underline">{applicant.phone}</a>
                    : <span className="text-slate-400">—</span>
                  }
                </Field>
              </div>
              <Divider />
              <Field label="Current Address">
                <span className="text-slate-700 leading-relaxed">
                  {applicant.current_address ?? '—'}
                </span>
              </Field>
              {(applicant.passport_number || applicant.passport_expiry) && (
                <>
                  <Divider />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Passport No.">
                      <span className="font-mono text-slate-700">{applicant.passport_number ?? '—'}</span>
                    </Field>
                    <Field label="Passport Expiry">
                      <span>{fmt(applicant.passport_expiry)}</span>
                    </Field>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* B. Immigration Details */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100">
              <div className="w-6 h-6 rounded-md bg-violet-50 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-slate-800">Immigration Details</h2>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Visa Type">
                  <span>{applicant.visa_type ? VISA_TYPE_LABELS[applicant.visa_type as VisaType] : '—'}</span>
                </Field>
                <Field label="Application ID">
                  <span className="font-mono text-slate-700">{applicant.application_id ?? '—'}</span>
                </Field>
              </div>
              <Divider />
              <Field label="Current Status">
                {applicant.immigration_status ? (
                  <span className={`inline-flex mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                    {IMMIGRATION_STATUS_LABELS[applicant.immigration_status as ImmigrationStatus]}
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </Field>
              <Divider />
              <Field label="Submission Date">
                <span>{fmt(applicant.submission_date)}</span>
              </Field>
              <Divider />
              <Field label="Associated Client">
                {applicant.client ? (
                  <div className="mt-0.5">
                    <Link to={`/clients/${applicant.client.id}`}
                      className="text-indigo-600 hover:underline font-semibold">
                      {applicant.client.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-slate-400">{applicant.client.case_reference}</span>
                      {applicant.client.case_status && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded capitalize">
                          {applicant.client.case_status.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </Field>
              {applicant.notes && (
                <>
                  <Divider />
                  <Field label="Notes">
                    <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line mt-0.5">
                      {applicant.notes}
                    </p>
                  </Field>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs Panel ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

          {/* Tab bar */}
          <div className="flex items-center border-b border-slate-200 overflow-x-auto gap-0 px-1">
            {TABS.map(tab => {
              const count = tab.countKey ? (applicant[tab.countKey] as number | undefined) : undefined;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'text-indigo-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className={active ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600'}>
                    {tab.icon}
                  </span>
                  {tab.label}
                  {count !== undefined && count > 0 && (
                    <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold inline-flex items-center justify-center ${
                      active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  )}
                  {/* Active underline */}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {activeTab === 'communications' && <CommunicationsTab applicantId={applicantId} />}
            {activeTab === 'documents'      && <DocumentsTab      applicantId={applicantId} />}
            {activeTab === 'tasks'          && <TasksTab          applicantId={applicantId} />}
            {activeTab === 'history'        && <CaseHistoryTab    applicantId={applicantId} />}
          </div>
        </div>

      </div>

      {/* Modals */}
      {editOpen && (
        <ApplicantForm applicant={applicant} onClose={() => setEditOpen(false)} />
      )}
      {deleteOpen && (
        <DeleteModal
          applicant={applicant}
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </>
  );
}
