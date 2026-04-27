import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useApplicantActivities, useLogApplicantActivity } from '../../../hooks/useApplicants';
import { Activity, ActivityType, ACTIVITY_TYPE_LABELS, STATUS_COLORS } from '../../../types/activity.types';
import { useAuthStore } from '../../../store/authStore';

// ── Type icons / colors ───────────────────────────────────────────────────────

const TYPE_META: Record<ActivityType, { icon: string; bg: string; text: string }> = {
  client_call:      { icon: '📞', bg: 'bg-blue-100',   text: 'text-blue-700'   },
  email:            { icon: '✉️', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  meeting:          { icon: '📅', bg: 'bg-purple-100', text: 'text-purple-700' },
  gov_submission:   { icon: '🏛️', bg: 'bg-teal-100',   text: 'text-teal-700'   },
  internal_task:    { icon: '✅', bg: 'bg-green-100',  text: 'text-green-700'  },
  document_request: { icon: '📄', bg: 'bg-amber-100',  text: 'text-amber-700'  },
  sms:              { icon: '💬', bg: 'bg-pink-100',   text: 'text-pink-700'   },
  note:             { icon: '📝', bg: 'bg-slate-100',  text: 'text-slate-600'  },
};

// ── Log Activity Modal ────────────────────────────────────────────────────────

interface LogFormValues {
  type: ActivityType; subject: string; notes: string; due_date: string; due_time: string;
}

function LogActivityModal({
  applicantId,
  defaultType = 'note',
  onClose,
}: {
  applicantId: number;
  defaultType?: ActivityType;
  onClose: () => void;
}) {
  const log = useLogApplicantActivity(applicantId);
  const {
    register, handleSubmit, watch,
    formState: { errors, isSubmitting },
  } = useForm<LogFormValues>({
    defaultValues: { type: defaultType, subject: '', notes: '', due_date: '', due_time: '' },
  });

  const selectedType = watch('type');
  const meta = TYPE_META[selectedType] ?? TYPE_META.note;

  const onSubmit: SubmitHandler<LogFormValues> = async (values) => {
    await log.mutateAsync({
      type:     values.type,
      subject:  values.subject,
      notes:    values.notes    || undefined,
      due_date: values.due_date || undefined,
      due_time: values.due_time || undefined,
    });
    onClose();
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 ${meta.bg}`}>
          <div className="flex items-center gap-2.5">
            <span className="text-lg">{meta.icon}</span>
            <h3 className={`font-semibold text-sm ${meta.text}`}>
              {ACTIVITY_TYPE_LABELS[selectedType]}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Activity Type
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.entries(ACTIVITY_TYPE_LABELS) as [ActivityType, string][]).map(([v, l]) => {
                const m = TYPE_META[v];
                return (
                  <label key={v}
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border-2 cursor-pointer transition-all text-center ${
                      selectedType === v
                        ? `border-indigo-500 ${m.bg}`
                        : 'border-transparent bg-slate-50 hover:bg-slate-100'
                    }`}>
                    <input type="radio" {...register('type')} value={v} className="sr-only" />
                    <span className="text-base leading-none">{m.icon}</span>
                    <span className="text-[10px] font-medium text-slate-600 leading-tight">{l}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Subject <span className="text-red-500">*</span>
            </label>
            <input {...register('subject', { required: 'Subject is required' })} className={inputCls}
              placeholder="e.g. Follow-up call re: documents" />
            {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea {...register('notes')} rows={3} className={inputCls}
              placeholder="Add details, outcome, or next steps…" />
          </div>

          {/* Due date / time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Due Date</label>
              <input type="date" {...register('due_date')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Due Time</label>
              <input type="time" {...register('due_time')} className={inputCls} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {isSubmitting ? 'Saving…' : 'Save Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Timeline Item ─────────────────────────────────────────────────────────────

function TimelineItem({ activity }: { activity: Activity }) {
  const meta = TYPE_META[activity.type] ?? TYPE_META.note;

  const dateLabel = (() => {
    const d = activity.completed_at
      ? new Date(activity.completed_at)
      : activity.due_date
      ? new Date(activity.due_date)
      : new Date(activity.created_at);
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
  })();

  return (
    <div className="flex gap-3 group">
      {/* Dot */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 z-10 border-2 border-white ring-1 ring-slate-200 ${meta.bg}`}>
          {meta.icon}
        </div>
        <div className="w-px flex-1 bg-slate-100 mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-5 min-w-0">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 leading-snug">{activity.subject}</p>
              {activity.notes && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{activity.notes}</p>
              )}
              {activity.assigned_to && (
                <p className="text-xs text-slate-400 mt-1.5">
                  Assigned to <span className="font-medium text-slate-600">{activity.assigned_to.full_name}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[activity.status]}`}>
                {activity.status.replace('_', ' ')}
              </span>
              {activity.is_overdue && (
                <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-600">
                  Overdue
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-slate-100">
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${meta.bg} ${meta.text}`}>
              {ACTIVITY_TYPE_LABELS[activity.type]}
            </span>
            <span className="text-[11px] text-slate-400">{dateLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab ───────────────────────────────────────────────────────────────────────

interface Props { applicantId: number }

export default function CommunicationsTab({ applicantId }: Props) {
  const [page, setPage]       = useState(1);
  const [modal, setModal]     = useState<{ open: boolean; type: ActivityType }>({ open: false, type: 'note' });
  const { can }               = useAuthStore();
  const { data, isLoading }   = useApplicantActivities(applicantId, { page, per_page: 15 });

  const openModal = (type: ActivityType) => setModal({ open: true, type });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <p className="text-sm text-slate-500">
          {data ? `${data.meta.total} activit${data.meta.total === 1 ? 'y' : 'ies'}` : '—'}
        </p>

        {can('applicants.edit') && (
          <div className="flex items-center gap-2">
            {/* Log Call */}
            <button onClick={() => openModal('client_call')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-blue-200 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
              <span className="text-base leading-none">📞</span>
              Log Call
            </button>

            {/* Send Email */}
            <button onClick={() => openModal('email')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-indigo-200 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <span className="text-base leading-none">✉️</span>
              Send Email
            </button>

            {/* Log Activity (generic) */}
            <button onClick={() => openModal('note')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Log Activity
            </button>
          </div>
        )}
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.data.length ? (
        <div className="text-center py-14 border-2 border-dashed border-slate-200 rounded-xl">
          <span className="text-4xl">💬</span>
          <p className="text-slate-500 text-sm font-medium mt-3">No activities yet</p>
          <p className="text-slate-400 text-xs mt-1">Log a call, email, or note to start the timeline.</p>
          {can('applicants.edit') && (
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => openModal('client_call')}
                className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100">
                📞 Log Call
              </button>
              <button onClick={() => openModal('email')}
                className="px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100">
                ✉️ Send Email
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          {data.data.map((a: Activity) => <TimelineItem key={a.id} activity={a} />)}
        </div>
      )}

      {/* Pagination */}
      {data && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-2 text-sm text-slate-600">
          <span className="text-xs text-slate-400">
            {((page - 1) * 15) + 1}–{Math.min(page * 15, data.meta.total)} of {data.meta.total}
          </span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 text-xs border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50">
              ← Prev
            </button>
            <button disabled={page >= data.meta.last_page} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-xs border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50">
              Next →
            </button>
          </div>
        </div>
      )}

      {modal.open && (
        <LogActivityModal
          applicantId={applicantId}
          defaultType={modal.type}
          onClose={() => setModal({ open: false, type: 'note' })}
        />
      )}
    </div>
  );
}
