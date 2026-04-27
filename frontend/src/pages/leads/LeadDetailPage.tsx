import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLead } from '../../hooks/useLeads';
import { useAuthStore } from '../../store/authStore';
import LeadConvertWizard from '../../components/leads/wizard/LeadConvertWizard';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  new:          'bg-blue-100 text-blue-700 ring-blue-200',
  contacted:    'bg-yellow-100 text-yellow-700 ring-yellow-200',
  qualified:    'bg-green-100 text-green-700 ring-green-200',
  disqualified: 'bg-red-100 text-red-700 ring-red-200',
  converted:    'bg-purple-100 text-purple-700 ring-purple-200',
};

const SOURCE_LABEL: Record<string, string> = {
  web:          'Web / Online',
  referral:     'Referral',
  cold_call:    'Cold Call',
  event:        'Event',
  social_media: 'Social Media',
  other:        'Other',
};

// Placeholder activities for the timeline (until Activities API is wired)
const PLACEHOLDER_ACTIVITIES = [
  { id: 1, type: 'note', label: 'Lead created', time: null, icon: '📋' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const { can }     = useAuthStore();
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data: lead, isLoading, isError } = useLead(Number(id));

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-8 w-64 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 bg-white rounded-xl border border-slate-200" />
            <div className="h-32 bg-white rounded-xl border border-slate-200" />
          </div>
          <div className="h-64 bg-white rounded-xl border border-slate-200" />
        </div>
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="py-16 text-center">
        <p className="text-red-600 font-medium">Failed to load lead.</p>
        <button
          onClick={() => navigate('/leads')}
          className="mt-4 text-sm text-indigo-600 hover:underline"
        >
          Back to Leads
        </button>
      </div>
    );
  }

  const statusBadgeClass = STATUS_BADGE[lead.status] ?? 'bg-slate-100 text-slate-600 ring-slate-200';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-5">

        {/* ── Breadcrumb + header ── */}
        <div>
          <button
            onClick={() => navigate('/leads')}
            className="text-sm text-slate-500 hover:text-slate-700 mb-3 flex items-center gap-1 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Leads
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 truncate">{lead.full_name}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ring-1 ${statusBadgeClass}`}>
                  {lead.status}
                </span>
              </div>
              {lead.company && (
                <p className="text-sm text-slate-500 mt-1">{lead.company}</p>
              )}
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {can('leads.edit') && !lead.is_converted && (
                <button
                  onClick={() => navigate(`/leads/${lead.id}/edit`)}
                  className="px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  Edit
                </button>
              )}
              {can('leads.convert') && lead.status === 'qualified' && !lead.is_converted && (
                <button
                  onClick={() => setWizardOpen(true)}
                  className="px-4 py-1.5 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Convert Lead →
                </button>
              )}
              {lead.status !== 'qualified' && !lead.is_converted && (
                <span
                  title="Lead must be Qualified to convert"
                  className="px-3 py-1.5 text-sm bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed"
                >
                  Convert Lead
                </span>
              )}
              {lead.is_converted && (
                <span className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg font-medium">
                  ✓ Converted
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left column (2/3) ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Contact + Details */}
            <InfoCard title="Lead Information">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <DetailItem label="Email"             value={lead.email} />
                <DetailItem label="Phone"             value={lead.phone} />
                <DetailItem label="Company"           value={lead.company} />
                <DetailItem label="Lead Source"       value={SOURCE_LABEL[lead.source] ?? lead.source} />
                <DetailItem label="Visa Interest"     value={lead.visa_interest} />
                <DetailItem label="Country of Origin" value={lead.country_of_origin} />
                <DetailItem label="Owner"             value={lead.owner?.full_name} />
                {lead.is_converted && lead.converted_at && (
                  <DetailItem
                    label="Converted At"
                    value={new Date(lead.converted_at).toLocaleDateString('en-CA', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  />
                )}
                <DetailItem
                  label="Created"
                  value={new Date(lead.created_at).toLocaleDateString('en-CA', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                />
              </dl>
              {lead.notes && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Notes</dt>
                  <dd className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{lead.notes}</dd>
                </div>
              )}
            </InfoCard>

            {/* Activity Timeline */}
            <InfoCard title="Activity Timeline">
              <div className="relative">
                {/* Timeline connector */}
                <div className="absolute left-3.5 top-4 bottom-0 w-px bg-slate-100" />

                <div className="space-y-4">
                  {PLACEHOLDER_ACTIVITIES.map((act) => (
                    <div key={act.id} className="flex gap-3 relative">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm flex-shrink-0 z-10">
                        {act.icon}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm font-medium text-slate-700">{act.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(lead.created_at).toLocaleDateString('en-CA', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* CTA to log activity */}
                  <div className="flex gap-3 relative">
                    <div className="w-7 h-7 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center flex-shrink-0 z-10 bg-white">
                      <span className="text-slate-400 text-sm">+</span>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <button
                        onClick={() => navigate(`/activities`)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                      >
                        Log an activity
                      </button>
                      <p className="text-xs text-slate-400 mt-0.5">Call, email, meeting, or note</p>
                    </div>
                  </div>
                </div>
              </div>
            </InfoCard>
          </div>

          {/* ── Right column (1/3) ── */}
          <div className="space-y-5">

            {/* Quick stats */}
            <InfoCard title="At a Glance">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ring-1 ${statusBadgeClass}`}>
                    {lead.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Source</span>
                  <span className="text-slate-700 font-medium">
                    {SOURCE_LABEL[lead.source] ?? lead.source}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Owner</span>
                  <span className="text-slate-700 font-medium">
                    {lead.owner?.full_name ?? <span className="text-slate-400">Unassigned</span>}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Converted</span>
                  <span className={`font-semibold ${lead.is_converted ? 'text-purple-600' : 'text-slate-400'}`}>
                    {lead.is_converted ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </InfoCard>

            {/* Conversion status / CTA */}
            {!lead.is_converted && (
              <div className={`rounded-xl border p-4 ${
                lead.status === 'qualified'
                  ? 'border-indigo-200 bg-indigo-50'
                  : 'border-slate-200 bg-slate-50'
              }`}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1 ${
                  lead.status === 'qualified' ? 'text-indigo-600' : 'text-slate-500'
                }">
                  {lead.status === 'qualified' ? 'Ready to Convert' : 'Conversion'}
                </p>
                {lead.status === 'qualified' ? (
                  <>
                    <p className="text-sm text-indigo-700 mb-3">
                      This lead is qualified. Convert it into a Contact, Applicant, and (optionally) an Opportunity.
                    </p>
                    {can('leads.convert') && (
                      <button
                        onClick={() => setWizardOpen(true)}
                        className="w-full py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Start Conversion →
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    Change status to <strong>Qualified</strong> to unlock conversion.
                  </p>
                )}
              </div>
            )}

            {/* Converted records summary */}
            {lead.is_converted && (
              <InfoCard title="Converted Records">
                <div className="space-y-2 text-sm">
                  <button
                    onClick={() => navigate('/clients')}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                  >
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Client</p>
                    <p className="font-medium text-slate-800 group-hover:text-indigo-700 mt-0.5">
                      {lead.company ?? lead.full_name}
                    </p>
                  </button>
                  <button
                    onClick={() => navigate('/applicants')}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                  >
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Applicant</p>
                    <p className="font-medium text-slate-800 group-hover:text-indigo-700 mt-0.5">
                      {lead.full_name}
                    </p>
                  </button>
                  <button
                    onClick={() => navigate('/opportunities')}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                  >
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Pipeline</p>
                    <p className="text-slate-500 text-xs group-hover:text-indigo-600 mt-0.5">
                      View in Opportunities →
                    </p>
                  </button>
                </div>
              </InfoCard>
            )}

            {/* Timestamps */}
            <div className="text-xs text-slate-400 space-y-1 px-1">
              <p>Created {new Date(lead.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              <p>Updated {new Date(lead.updated_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion wizard modal */}
      {wizardOpen && (
        <LeadConvertWizard
          lead={lead}
          onClose={() => setWizardOpen(false)}
        />
      )}
    </>
  );
}
