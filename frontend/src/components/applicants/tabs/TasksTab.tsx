import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useApplicantActivities, useLogApplicantActivity } from '../../../hooks/useApplicants';
import { Activity, STATUS_COLORS } from '../../../types/activity.types';
import { useAuthStore } from '../../../store/authStore';
import apiClient from '../../../api/client';
import { useQueryClient } from '@tanstack/react-query';

// ── New Task Modal ────────────────────────────────────────────────────────────

interface TaskFormValues { subject: string; notes: string; due_date: string; due_time: string; }

function NewTaskModal({ applicantId, onClose }: { applicantId: number; onClose: () => void }) {
  const log = useLogApplicantActivity(applicantId);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TaskFormValues>({
    defaultValues: { subject: '', notes: '', due_date: '', due_time: '' },
  });

  const onSubmit: SubmitHandler<TaskFormValues> = async (values) => {
    await log.mutateAsync({
      type:     'internal_task',
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
        <div className="flex items-center justify-between px-5 py-4 bg-green-50 border-b border-green-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <h3 className="font-semibold text-sm text-green-700">New Task</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input {...register('subject', { required: 'Title is required' })} className={inputCls}
              placeholder="e.g. Collect passport copies from client" />
            {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Description
            </label>
            <textarea {...register('notes')} rows={2} className={inputCls}
              placeholder="Optional details or instructions…" />
          </div>
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
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {isSubmitting ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Task Row ──────────────────────────────────────────────────────────────────

function TaskRow({ task, applicantId }: { task: Activity; applicantId: number }) {
  const qc          = useQueryClient();
  const [completing, setCompleting] = useState(false);
  const isCompleted = task.status === 'completed';
  const isOverdue   = task.is_overdue && !isCompleted;

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await apiClient.patch(`/activities/${task.id}/complete`);
      qc.invalidateQueries({ queryKey: ['applicants', applicantId, 'activities'] });
    } finally {
      setCompleting(false);
    }
  };

  const dueLabel = task.due_date
    ? new Date(task.due_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className={`flex items-start gap-3 px-4 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors group ${
      isCompleted ? 'opacity-60' : ''
    }`}>
      {/* Checkbox */}
      <button
        onClick={isCompleted ? undefined : handleComplete}
        disabled={isCompleted || completing}
        title={isCompleted ? 'Completed' : 'Mark complete'}
        className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${
          isCompleted
            ? 'bg-green-500 border-green-500 cursor-default'
            : 'border-slate-300 hover:border-indigo-500 group-hover:border-indigo-400'
        }`}
      >
        {(isCompleted || completing) && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Title + notes */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${
          isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
        }`}>
          {task.subject}
        </p>
        {task.notes && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{task.notes}</p>
        )}
      </div>

      {/* Due Date */}
      <div className="flex-shrink-0 text-center min-w-[90px]">
        {dueLabel ? (
          <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
            {isOverdue && '⚠ '}{dueLabel}
          </span>
        ) : (
          <span className="text-xs text-slate-300">No due date</span>
        )}
      </div>

      {/* Assigned user */}
      <div className="flex-shrink-0 min-w-[110px] text-right">
        {task.assigned_to ? (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
              {task.assigned_to.full_name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
            </span>
            <span className="truncate max-w-[80px]">{task.assigned_to.full_name}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-300">Unassigned</span>
        )}
      </div>

      {/* Status badge */}
      <div className="flex-shrink-0">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[task.status]}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}

// ── Tab ───────────────────────────────────────────────────────────────────────

interface Props { applicantId: number }

const TASK_TYPES = 'internal_task,document_request';

export default function TasksTab({ applicantId }: Props) {
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [page,        setPage]        = useState(1);
  const { can }                       = useAuthStore();

  const { data, isLoading } = useApplicantActivities(applicantId, { page, per_page: 25, type: TASK_TYPES });
  const pending   = (data?.data ?? []).filter((t: Activity) => t.status !== 'completed' && t.status !== 'cancelled');
  const completed = (data?.data ?? []).filter((t: Activity) => t.status === 'completed' || t.status === 'cancelled');

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">
          {data ? `${pending.length} open · ${completed.length} done` : '—'}
        </p>
        {can('applicants.edit') && (
          <button onClick={() => setNewTaskOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Task
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.data.length ? (
        <div className="text-center py-14 border-2 border-dashed border-slate-200 rounded-xl">
          <span className="text-4xl">✅</span>
          <p className="text-slate-500 text-sm font-medium mt-3">No tasks yet</p>
          <p className="text-slate-400 text-xs mt-1">Create a task to track what needs to be done.</p>
          {can('applicants.edit') && (
            <button onClick={() => setNewTaskOpen(true)}
              className="mt-4 px-4 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50">
              Create first task
            </button>
          )}
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          {/* Column header */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            <div className="w-5 flex-shrink-0" />
            <div className="flex-1">Title</div>
            <div className="flex-shrink-0 min-w-[90px] text-center">Due Date</div>
            <div className="flex-shrink-0 min-w-[110px] text-right">Assigned To</div>
            <div className="flex-shrink-0 w-20 text-right">Status</div>
          </div>

          {/* Open tasks */}
          {pending.length > 0 && (
            <div>
              <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Open ({pending.length})
                </span>
              </div>
              {pending.map((t: Activity) => <TaskRow key={t.id} task={t} applicantId={applicantId} />)}
            </div>
          )}

          {/* Completed tasks */}
          {completed.length > 0 && (
            <div>
              <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-100 border-t">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Completed ({completed.length})
                </span>
              </div>
              {completed.map((t: Activity) => <TaskRow key={t.id} task={t} applicantId={applicantId} />)}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {data && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
          <span>{((page - 1) * 25) + 1}–{Math.min(page * 25, data.meta.total)} of {data.meta.total}</span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50">← Prev</button>
            <button disabled={page >= data.meta.last_page} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next →</button>
          </div>
        </div>
      )}

      {newTaskOpen && <NewTaskModal applicantId={applicantId} onClose={() => setNewTaskOpen(false)} />}
    </div>
  );
}
