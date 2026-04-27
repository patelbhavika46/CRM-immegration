import { useApplicantActivities } from '../../../hooks/useApplicants';
import { useApplicant } from '../../../hooks/useApplicants';
import { Activity } from '../../../types/activity.types';
import {
  IMMIGRATION_STATUS_LABELS,
  IMMIGRATION_STATUS_COLORS,
  VISA_TYPE_LABELS,
  ImmigrationStatus,
  VisaType,
} from '../../../types/applicant.types';

const MILESTONE_TYPES = 'gov_submission,document_request,meeting';

const STAGE_ORDER: ImmigrationStatus[] = [
  'profile_created',
  'awaiting_ita',
  'application_submitted',
  'biometrics_requested',
  'medical_requested',
  'approved',
  'landed',
];

function StatusProgressBar({ current }: { current: ImmigrationStatus | null }) {
  const idx = current ? STAGE_ORDER.indexOf(current) : -1;
  return (
    <div className="flex items-center gap-0.5 mt-2">
      {STAGE_ORDER.map((s, i) => (
        <div
          key={s}
          title={IMMIGRATION_STATUS_LABELS[s]}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i <= idx
              ? IMMIGRATION_STATUS_COLORS[s].split(' ')[0].replace('bg-', 'bg-')
              : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );
}

function MilestoneItem({ activity }: { activity: Activity }) {
  const ICONS: Record<string, string> = {
    gov_submission:   '🏛️',
    document_request: '📄',
    meeting:          '📅',
    note:             '📝',
  };

  const date = new Date(activity.created_at);

  return (
    <div className="flex gap-3 items-start py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-sm flex-shrink-0">
        {ICONS[activity.type] ?? '📌'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{activity.subject}</p>
        {activity.notes && <p className="text-xs text-slate-500 mt-0.5">{activity.notes}</p>}
        <p className="text-xs text-slate-400 mt-1">
          {date.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
          {activity.application_stage && ` · Stage: ${activity.application_stage}`}
        </p>
      </div>
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
        activity.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
      }`}>
        {activity.status.replace('_', ' ')}
      </span>
    </div>
  );
}

interface Props { applicantId: number }

export default function CaseHistoryTab({ applicantId }: Props) {
  const { data: applicant, isLoading: loadingApplicant } = useApplicant(applicantId);
  const { data: milestones, isLoading: loadingMilestones } = useApplicantActivities(
    applicantId,
    { type: MILESTONE_TYPES, per_page: 50 }
  );

  if (loadingApplicant || loadingMilestones) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const status = applicant?.immigration_status ?? null;

  return (
    <div className="space-y-6">

      {/* Current Status Overview */}
      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Application Progress</p>
        {status && STAGE_ORDER.includes(status) ? (
          <>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-slate-800">
                {IMMIGRATION_STATUS_LABELS[status]}
              </span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${IMMIGRATION_STATUS_COLORS[status]}`}>
                Current
              </span>
            </div>
            <StatusProgressBar current={status} />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-400">{IMMIGRATION_STATUS_LABELS['profile_created']}</span>
              <span className="text-xs text-slate-400">{IMMIGRATION_STATUS_LABELS['landed']}</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">No immigration status set.</p>
        )}
      </div>

      {/* Key Details */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          label="Visa Type"
          value={applicant?.visa_type ? VISA_TYPE_LABELS[applicant.visa_type as VisaType] : '—'}
          color="bg-indigo-50 text-indigo-700"
        />
        <StatCard
          label="Application ID"
          value={applicant?.application_id ?? '—'}
          color="bg-slate-50 text-slate-700"
          mono
        />
        <StatCard
          label="Submission Date"
          value={applicant?.submission_date
            ? new Date(applicant.submission_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
            : '—'}
          color="bg-amber-50 text-amber-700"
        />
      </div>

      {/* Client link */}
      {applicant?.client && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Associated Client</p>
          <p className="text-sm font-medium text-indigo-900">{applicant.client.name}</p>
          <p className="text-xs text-indigo-500 font-mono">{applicant.client.case_reference}</p>
        </div>
      )}

      {/* Milestone Timeline */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Case Milestones
        </h4>
        {!milestones?.data.length ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-slate-400 text-sm">No case milestones recorded yet.</p>
            <p className="text-xs text-slate-300 mt-1">Log government submissions or meetings to track progress.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {milestones.data.map((a: Activity) => <MilestoneItem key={a.id} activity={a} />)}
          </div>
        )}
      </div>

    </div>
  );
}

function StatCard({ label, value, color, mono }: { label: string; value: string; color: string; mono?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${color}`}>
      <p className={`text-sm font-semibold truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
      <p className="text-xs font-medium mt-0.5 opacity-70">{label}</p>
    </div>
  );
}
