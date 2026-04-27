import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useApplicantActivities, useLogApplicantActivity } from '../../../hooks/useApplicants';
import { Activity, STATUS_COLORS } from '../../../types/activity.types';
import { useAuthStore } from '../../../store/authStore';
import apiClient from '../../../api/client';
import { useQueryClient } from '@tanstack/react-query';

interface TaskFormValues { subject: string; notes: string; due_date: string; due_time: string; }

function NewTaskModal({ applicantId, onClose }: { applicantId: number; onClose: () => void }) {
  const log = useLogApplicantActivity(applicantId);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TaskFormValues>({
    defaultValues: { subject: '', notes: '', due_date: '', due_time: '' },
  });

  const onSubmit: SubmitHandler<TaskFormValues> = async (values) => {
    await log.mutateAsync({
      type: 'internal_task', subject: values.subject,
      notes: values.notes || undefined, due_date: values.due_date || undefined, due_time: values.due_time || undefined,
    });
    onClose();
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">New Task</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Task <span className="text-red-500">*</span></label>
            <input {...register('subject', { required: 'Required' })} className={inputCls}
              placeholder="e.g. Collect passport copies" />
            {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea {...register('notes')} rows={2} className={inputCls} placeholder="Optional details…" />
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
              {isSubmitting ? 'Saving…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskRow({ task, applicantId }: { task: Activity; applicantId: number }) {
  const qc = useQueryClient();
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await apiClient.patch(`/activities/${task.id}/complete`);
      qc.invalidateQueries({ queryKey: ['applicants', applicantId, 'activities'] });
    } finally {
      setCompleting(false);
    }
  };

  const isCompleted = task.status === 'completed';

  return (
    <div className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
      isCompleted ? 'border-slate-100 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
    }`}>
      <button onClick={isCompleted ? undefined : handleComplete} disabled={isCompleted || completing}
        className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
          isCompleted ? 'bg-green-500 border-green-500 cursor-default' : 'border-slate-300 hover:border-indigo-500'
        }`}>
        {isCompleted && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
          {task.subject}
        </p>
        {task.notes && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.notes}</p>}
        <div className="flex items-center gap-3 mt-1">
          {task.due_date && (
            <span className={`text-xs ${task.is_overdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
              Due {new Date(task.due_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
              {task.is_overdue && ' · Overdue'}
            </span>
          )}
          {task.assigned_to && <span className="text-xs text-slate-400">{task.assigned_to.full_name}</span>}
        </div>
      </div>
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[task.status]}`}>
        {task.status.replace('_', ' ')}
      </span>
    </div>
  );
}

interface Props { applicantId: number }

const TASK_TYPES = 'internal_task,document_request';

export default function TasksTab({ applicantId }: Props) {
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [page, setPage] = useState(1);
  const { can } = useAuthStore();

  const { data, isLoading } = useApplicantActivities(applicantId, { page, per_page: 20, type: TASK_TYPES });
  const pending   = data?.data.filter((t: Activity) => t.status !== 'completed' && t.status !== 'cancelled') ?? [];
  const completed = data?.data.filter((t: Activity) => t.status === 'completed' || t.status === 'cancelled') ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">
          {data ? `${pending.length} open · ${completed.length} completed` : '…'}
        </p>
        {can('applicants.edit') && (
          <button onClick={() => setNewTaskOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Task
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.data.length ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">No tasks yet.</p>
          {can('applicants.edit') && (
            <button onClick={() => setNewTaskOpen(true)} className="mt-2 text-sm text-indigo-600 hover:underline">
              Create the first task →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Open</h4>
              <div className="space-y-2">
                {pending.map((t: Activity) => <TaskRow key={t.id} task={t} applicantId={applicantId} />)}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Completed</h4>
              <div className="space-y-2">
                {completed.map((t: Activity) => <TaskRow key={t.id} task={t} applicantId={applicantId} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {newTaskOpen && <NewTaskModal applicantId={applicantId} onClose={() => setNewTaskOpen(false)} />}
    </div>
  );
}
