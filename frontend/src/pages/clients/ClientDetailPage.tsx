import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClient, useDeleteClient } from '../../hooks/useClients';
import { useAuthStore } from '../../store/authStore';
import {
  Client,
  CASE_STATUS_LABELS,
  CASE_STATUS_COLORS,
  CLIENT_TYPE_LABELS,
  CLIENT_TYPE_COLORS,
  SERVICE_TYPE_LABELS,
} from '../../types/client.types';
import ClientForm from '../../components/clients/ClientForm';
import ClientApplicantsSection from '../../components/clients/ClientApplicantsSection';
import CommunicationsTab from '../../components/clients/tabs/CommunicationsTab';
import DocumentsTab from '../../components/clients/tabs/DocumentsTab';
import TasksTab from '../../components/clients/tabs/TasksTab';
import CaseHistoryTab from '../../components/clients/tabs/CaseHistoryTab';

// ── Shared primitives ────────────────────────────────────────────────────────

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
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
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

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse space-y-5">
      <div className="h-7 w-48 bg-slate-200 rounded" />
      <div className="h-10 w-80 bg-slate-200 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 bg-white rounded-xl border border-slate-200" />
          <div className="h-32 bg-white rounded-xl border border-slate-200" />
          <div className="h-40 bg-white rounded-xl border border-slate-200" />
        </div>
        <div className="space-y-4">
          <div className="h-52 bg-white rounded-xl border border-slate-200" />
          <div className="h-32 bg-white rounded-xl border border-slate-200" />
        </div>
      </div>
    </div>
  );
}

// ── Tab definitions ───────────────────────────────────────────────────────────

type TabId = 'communications' | 'documents' | 'tasks' | 'history';

const TABS: { id: TabId; label: string; countKey?: keyof Client }[] = [
  { id: 'communications', label: 'Communications', countKey: 'activities_count' },
  { id: 'documents',      label: 'Documents',      countKey: 'documents_count'  },
  { id: 'tasks',          label: 'Tasks'                                         },
  { id: 'history',        label: 'Case History',   countKey: 'opportunities_count' },
];

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteModal({ client, onConfirm, onCancel }: {
  client: Client;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-2">Delete Client?</h3>
        <p className="text-sm text-slate-500 mb-5">
          <strong>{client.name}</strong> will be soft-deleted. This action can be reversed by an administrator.
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can }  = useAuthStore();

  const clientId = Number(id);
  const { data: client, isLoading, isError } = useClient(clientId);

  const [activeTab,   setActiveTab]   = useState<TabId>('communications');
  const [editOpen,    setEditOpen]    = useState(false);
  const [deleteOpen,  setDeleteOpen]  = useState(false);

  const deleteMutation = useDeleteClient();

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(clientId);
    navigate('/clients');
  };

  // ── Loading / Error ───────────────────────────────────────────────────────

  if (isLoading) return <Skeleton />;

  if (isError || !client) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-600 font-medium">Failed to load client.</p>
        <button onClick={() => navigate('/clients')} className="mt-4 text-sm text-indigo-600 hover:underline">
          ← Back to Clients
        </button>
      </div>
    );
  }

  const statusColor = CASE_STATUS_COLORS[client.case_status];
  const typeColor   = CLIENT_TYPE_COLORS[client.type];

  const activeApplicants  = (client.applicants_count ?? 0);
  const totalOpps         = (client.opportunities_count ?? 0);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Breadcrumb ── */}
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Clients
        </button>

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 truncate">{client.name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${typeColor}`}>
                {CLIENT_TYPE_LABELS[client.type]}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                {CASE_STATUS_LABELS[client.case_status]}
              </span>
              {!client.is_active && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-500">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 font-mono mt-1">{client.case_reference}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {can('clients.edit') && (
              <button
                onClick={() => setEditOpen(true)}
                className="px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
              >
                Edit
              </button>
            )}
            {can('clients.delete') && (
              <button
                onClick={() => setDeleteOpen(true)}
                className="px-3 py-1.5 text-sm font-medium border border-red-200 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* ── Main 3-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left (2/3) ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Client Overview */}
            <InfoCard title="Client Overview">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <DetailItem label="Service Type"           value={SERVICE_TYPE_LABELS[client.service_type]} />
                <DetailItem label="Country of Origin"      value={client.country_of_origin} />
                <DetailItem label="Country of Destination" value={client.country_of_destination} />
                <DetailItem label="Date Opened"            value={client.date_opened
                  ? new Date(client.date_opened).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
                  : null}
                />
                {client.date_closed && (
                  <DetailItem label="Date Closed" value={new Date(client.date_closed).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })} />
                )}
                <DetailItem label="Assigned Consultant" value={client.consultant?.full_name} />
              </dl>
            </InfoCard>

            {/* Primary Contact */}
            {(client.primary_applicant || client.primary_contact_email || client.primary_contact_phone) && (
              <InfoCard title="Primary Contact">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <DetailItem label="Name"    value={client.primary_applicant} />
                  <DetailItem label="Email"   value={client.primary_contact_email} />
                  <DetailItem label="Phone"   value={client.primary_contact_phone} />
                  <DetailItem label="Address" value={client.primary_contact_address} />
                </dl>
              </InfoCard>
            )}

            {/* Notes */}
            {client.notes && (
              <InfoCard title="Notes">
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{client.notes}</p>
              </InfoCard>
            )}

            {/* Associated Applicants */}
            <ClientApplicantsSection clientId={clientId} />

          </div>

          {/* ── Right sidebar (1/3) ── */}
          <div className="space-y-5">

            {/* Case Summary stats */}
            <InfoCard title="Case Summary">
              <div className="grid grid-cols-2 gap-3">
                <StatPill label="Applicants"    value={client.applicants_count ?? 0}    color="bg-indigo-50 text-indigo-700" />
                <StatPill label="Opportunities" value={totalOpps}                       color="bg-purple-50 text-purple-700" />
                <StatPill label="Documents"     value={client.documents_count ?? 0}     color="bg-teal-50 text-teal-700" />
                <StatPill label="Activities"    value={client.activities_count ?? 0}    color="bg-amber-50 text-amber-700" />
              </div>
            </InfoCard>

            {/* At a glance */}
            <InfoCard title="At a Glance">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                    {CASE_STATUS_LABELS[client.case_status]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Type</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeColor}`}>
                    {CLIENT_TYPE_LABELS[client.type]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Consultant</span>
                  <span className="font-medium text-slate-800 text-right truncate max-w-[130px]">
                    {client.consultant?.full_name ?? <span className="text-slate-300">Unassigned</span>}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Service</span>
                  <span className="font-medium text-slate-700 text-right text-xs">
                    {SERVICE_TYPE_LABELS[client.service_type]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Active</span>
                  <span className={`font-semibold ${client.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                    {client.is_active ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </InfoCard>

            {/* Conversion source */}
            {client.lead_id && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Lead Conversion</p>
                <p className="text-sm text-indigo-700">
                  Created from Lead #{client.lead_id}.
                </p>
                <button
                  onClick={() => navigate(`/leads/${client.lead_id}`)}
                  className="mt-2 text-xs text-indigo-600 hover:underline font-medium"
                >
                  View source lead →
                </button>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-slate-400 space-y-1 px-1">
              <p>Created {new Date(client.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              <p>Updated {new Date(client.updated_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* ── Tabs section ── */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {TABS.map(tab => {
              const count = tab.countKey ? (client[tab.countKey] as number | undefined) : undefined;
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

          {/* Tab panels */}
          <div className="p-5">
            {activeTab === 'communications' && <CommunicationsTab clientId={clientId} />}
            {activeTab === 'documents'      && <DocumentsTab      clientId={clientId} />}
            {activeTab === 'tasks'          && <TasksTab          clientId={clientId} />}
            {activeTab === 'history'        && <CaseHistoryTab    clientId={clientId} />}
          </div>
        </div>

      </div>

      {/* ── Modals ── */}
      {editOpen && (
        <ClientForm
          client={client}
          onClose={() => setEditOpen(false)}
        />
      )}

      {deleteOpen && (
        <DeleteModal
          client={client}
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </>
  );
}
