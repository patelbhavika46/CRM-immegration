import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useClientActivities, useLogActivity } from '../../../hooks/useClients';
import { Activity, ActivityType, ACTIVITY_TYPE_LABELS, STATUS_COLORS } from '../../../types/activity.types';
import { useAuthStore } from '../../../store/authStore';

const TYPE_ICONS: Record<ActivityType, string> = {
  client_call:      '📞',
  email:            '✉️',
  meeting:          '📅',
  gov_submission:   '🏛️',
  internal_task:    '✅',
  document_request: '📄',
  sms:              '💬',
  note:             '📝',
};

interface LogFormValues {
  type: ActivityType; subject: string; notes: string; due_date: string; due_time: string;
}

function LogActivityModal({ clientId, onClose }: { clientId: number; onClose: () => void }) {
  const log = useLogActivity(clientId);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LogFormValues>({
    defaultValues: { type: 'note', subject: '', notes: '', due_date: '', due_time: '' },
  });

  const onSubmit: SubmitHandler<LogFormValues> = async (values) => {
    await log.mutateAsync({
      type: values.type, subject: values.subject,
      notes: values.notes || undefined, due_date: values.due_date || undefined, due_time: values.due_time || undefined,
    });
    onClose();
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Log Activity</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Activity Type</label>
            <select {...register('type')} className={inputCls}>
              {(Object.entries(ACTIVITY_TYPE_LABELS) as [ActivityType, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Subject <span className="text-red-500">*</span></label>
            <input {...register('subject', { required: 'Required' })} className={inputCls}
              placeholder="e.g. Follow-up call re: documents" />
            {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea {...register('notes')} rows={3} className={inputCls} placeholder="Details…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Due Date</label>
              <input type="date" {...register('due_date')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Due Time</label>
              <input type="time" {...register('due_time')} className={inputCls} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {isSubmitting ? 'Saving…' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TimelineItem({ activity }: { activity: Activity }) {
  const date = activity.completed_at
    ? new Date(activity.completed_at)
    : activity.due_date
    ? new Date(activity.due_date)
    : new Date(activity.created_at);

  return (
    <div className="flex gap-3 relative">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm flex-shrink-0 z-10 border border-white">
        {TYPE_ICONS[activity.type] ?? '•'}
      </div>
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{activity.subject}</p>
            {activity.notes && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{activity.notes}</p>}
            {activity.assigned_to && <p className="text-xs text-slate-400 mt-0.5">Assigned to {activity.assigned_to.full_name}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[activity.status]}`}>
              {activity.status.replace('_', ' ')}
            </span>
            {activity.is_overdue && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">Overdue</span>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {ACTIVITY_TYPE_LABELS[activity.type]} · {date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}

interface Props { clientId: number }

export default function CommunicationsTab({ clientId }: Props) {
  const [page, setPage]           = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const { can } = useAuthStore();
  const { data, isLoading } = useClientActivities(clientId, { page, per_page: 15 });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">{data ? `${data.meta.total} activities` : '…'}</p>
        {can('clients.edit') && (
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Log Activity
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.data.length ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">No activities yet.</p>
          <button onClick={() => setModalOpen(true)} className="mt-2 text-sm text-indigo-600 hover:underline">
            Log the first one →
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-4 bottom-0 w-px bg-slate-100" />
          <div className="space-y-0">
            {data.data.map(a => <TimelineItem key={a.id} activity={a} />)}
          </div>
        </div>
      )}

      {data && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
          <span>{((page - 1) * 15) + 1}–{Math.min(page * 15, data.meta.total)} of {data.meta.total}</span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border border-slate-300 rounded disabled:opacity-40 hover:bg-slate-50">Prev</button>
            <button disabled={page >= data.meta.last_page} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border border-slate-300 rounded disabled:opacity-40 hover:bg-slate-50">Next</button>
          </div>
        </div>
      )}

      {modalOpen && <LogActivityModal clientId={clientId} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
