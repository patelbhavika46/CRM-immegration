import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import ApplicantForm from '../../components/applicants/ApplicantForm';
import CommunicationsTab from '../../components/applicants/tabs/CommunicationsTab';
import DocumentsTab       from '../../components/applicants/tabs/DocumentsTab';
import TasksTab           from '../../components/applicants/tabs/TasksTab';
import CaseHistoryTab     from '../../components/applicants/tabs/CaseHistoryTab';

// ── Primitives ────────────────────────────────────────────────────────────────

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function InfoCard({ title, children, action }: {
  title: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h2>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl p-3 ${color}`}>
      <span className="text-xl font-bold">{value}</span>
      <span className="text-xs font-medium opacity-70 mt-0.5 text-center leading-tight">{label}</span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse space-y-5">
      <div className="h-5 w-32 bg-slate-200 rounded" />
      <div className="h-9 w-64 bg-slate-200 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 bg-white rounded-xl border border-slate-200" />
          <div className="h-36 bg-white rounded-xl border border-slate-200" />
        </div>
        <div className="space-y-4">
          <div className="h-52 bg-white rounded-xl border border-slate-200" />
        </div>
      </div>
    </div>
  );
}

// ── Delete modal ──────────────────────────────────────────────────────────────

function DeleteModal({ applicant, onConfirm, onCancel }: {
  applicant: Applicant; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-2">Delete Applicant?</h3>
        <p className="text-sm text-slate-500 mb-5">
          <strong>{applicant.full_name}</strong> will be soft-deleted. Associated documents and
          activities are retained and can be restored by an administrator.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type TabId = 'communications' | 'documents' | 'tasks' | 'history';

const TABS: { id: TabId; label: string; countKey?: keyof Applicant }[] = [
  { id: 'communications', label: 'Communications', countKey: 'activities_count' },
  { id: 'documents',      label: 'Documents',      countKey: 'documents_count'  },
  { id: 'tasks',          label: 'Tasks'                                         },
  { id: 'history',        label: 'Case History'                                  },
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
      <div className="py-20 text-center">
        <p className="text-red-600 font-medium">Failed to load applicant.</p>
        <button onClick={() => navigate('/applicants')} className="mt-4 text-sm text-indigo-600 hover:underline">
          ← Back to Applicants
        </button>
      </div>
    );
  }

  const statusColor   = applicant.immigration_status
    ? IMMIGRATION_STATUS_COLORS[applicant.immigration_status as ImmigrationStatus]
    : 'bg-slate-100 text-slate-500';
  const relColor      = RELATIONSHIP_COLORS[applicant.relationship as ApplicantRelationship] ?? 'bg-slate-100 text-slate-600';

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/applicants')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Applicants
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 truncate">{applicant.full_name}</h1>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${relColor}`}>
                {RELATIONSHIP_LABELS[applicant.relationship as ApplicantRelationship]}
              </span>
              {applicant.immigration_status && (
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                  {IMMIGRATION_STATUS_LABELS[applicant.immigration_status as ImmigrationStatus]}
                </span>
              )}
            </div>
            {applicant.application_id && (
              <p className="text-sm text-slate-400 font-mono mt-1">{applicant.application_id}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {can('applicants.edit') && (
              <button onClick={() => setEditOpen(true)}
                className="px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors">
                Edit
              </button>
            )}
            {can('applicants.delete') && (
              <button onClick={() => setDeleteOpen(true)}
                className="px-3 py-1.5 text-sm font-medium border border-red-200 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Main 3-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left (2/3) */}
          <div className="lg:col-span-2 space-y-5">

            {/* Personal Information */}
            <InfoCard title="Personal Information">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <DetailItem label="First Name"   value={applicant.first_name} />
                <DetailItem label="Last Name"    value={applicant.last_name} />
                <DetailItem label="Date of Birth" value={applicant.date_of_birth
                  ? new Date(applicant.date_of_birth).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
                  : null} />
                <DetailItem label="Nationality"  value={applicant.nationality} />
                <DetailItem label="Email"        value={applicant.email} />
                <DetailItem label="Phone"        value={applicant.phone} />
                <div className="sm:col-span-2">
                  <DetailItem label="Current Address" value={applicant.current_address} />
                </div>
              </dl>
            </InfoCard>

            {/* Immigration Details */}
            <InfoCard title="Immigration Details">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <DetailItem
                  label="Visa Type"
                  value={applicant.visa_type ? VISA_TYPE_LABELS[applicant.visa_type as VisaType] : null}
                />
                <DetailItem label="Application ID" value={applicant.application_id} />
                <div>
                  <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">Current Status</dt>
                  <dd className="mt-1">
                    {applicant.immigration_status ? (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                        {IMMIGRATION_STATUS_LABELS[applicant.immigration_status as ImmigrationStatus]}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </dd>
                </div>
                <DetailItem label="Submission Date" value={applicant.submission_date
                  ? new Date(applicant.submission_date).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
                  : null} />
                <DetailItem label="Passport Number" value={applicant.passport_number} />
                <DetailItem label="Passport Expiry" value={applicant.passport_expiry
                  ? new Date(applicant.passport_expiry).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
                  : null} />
              </dl>
            </InfoCard>

            {/* Notes */}
            {applicant.notes && (
              <InfoCard title="Notes">
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{applicant.notes}</p>
              </InfoCard>
            )}

          </div>

          {/* Right sidebar (1/3) */}
          <div className="space-y-5">

            {/* Quick Stats */}
            <InfoCard title="Overview">
              <div className="grid grid-cols-2 gap-3">
                <StatPill label="Documents"  value={applicant.documents_count ?? 0}  color="bg-teal-50 text-teal-700" />
                <StatPill label="Activities" value={applicant.activities_count ?? 0} color="bg-amber-50 text-amber-700" />
              </div>
            </InfoCard>

            {/* At a Glance */}
            <InfoCard title="At a Glance">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Relationship</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${relColor}`}>
                    {RELATIONSHIP_LABELS[applicant.relationship as ApplicantRelationship]}
                  </span>
                </div>
                {applicant.visa_type && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Visa Type</span>
                    <span className="font-medium text-slate-800 text-right text-xs max-w-[140px] truncate">
                      {VISA_TYPE_LABELS[applicant.visa_type as VisaType]}
                    </span>
                  </div>
                )}
                {applicant.immigration_status && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                      {IMMIGRATION_STATUS_LABELS[applicant.immigration_status as ImmigrationStatus]}
                    </span>
                  </div>
                )}
                {applicant.nationality && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Nationality</span>
                    <span className="font-medium text-slate-800">{applicant.nationality}</span>
                  </div>
                )}
              </div>
            </InfoCard>

            {/* Associated Client */}
            {applicant.client && (
              <InfoCard title="Associated Client">
                <div className="space-y-1">
                  <button
                    onClick={() => navigate(`/clients/${applicant.client!.id}`)}
                    className="text-sm font-semibold text-indigo-600 hover:underline text-left"
                  >
                    {applicant.client.name}
                  </button>
                  <p className="text-xs text-slate-400 font-mono">{applicant.client.case_reference}</p>
                  {applicant.client.case_status && (
                    <p className="text-xs text-slate-500 capitalize">{applicant.client.case_status.replace(/_/g, ' ')}</p>
                  )}
                </div>
              </InfoCard>
            )}

            {/* Timestamps */}
            <div className="text-xs text-slate-400 space-y-1 px-1">
              <p>Created {new Date(applicant.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              <p>Updated {new Date(applicant.updated_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>

          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {TABS.map(tab => {
              const count = tab.countKey ? (applicant[tab.countKey] as number | undefined) : undefined;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {tab.label}
                  {count !== undefined && count > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-semibold ${
                      activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

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
        <ApplicantForm
          applicant={applicant}
          onClose={() => setEditOpen(false)}
        />
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
