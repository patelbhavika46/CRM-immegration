import { useState } from 'react';
import { useActivities, useCompleteActivity, useDeleteActivity } from '../../hooks/useActivities';
import { ActivityFilters, ActivityType, ActivityStatus, ACTIVITY_TYPE_LABELS, STATUS_COLORS } from '../../types/activity.types';
import { useAuthStore } from '../../store/authStore';

const TYPE_OPTIONS: { value: ActivityType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  ...Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => ({ value: value as ActivityType, label })),
];

const STATUS_OPTIONS: { value: ActivityStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'pending',     label: 'Pending' },
  { value: 'scheduled',   label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
];

export default function ActivitiesPage() {
  const { can } = useAuthStore();
  const [filters, setFilters] = useState<ActivityFilters & { page: number; per_page: number }>({
    page: 1, per_page: 20,
  });

  const { data, isLoading } = useActivities(filters);
  const complete = useCompleteActivity();
  const remove   = useDeleteActivity();

  const handleComplete = async (id: number) => {
    await complete.mutateAsync({ id });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this activity?')) return;
    await remove.mutateAsync(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Activities</h1>
        {can('activities.create') && (
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors">
            + New Activity
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="search"
          placeholder="Search activities…"
          value={filters.search ?? ''}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
        />
        <select
          value={filters.type ?? ''}
          onChange={e => setFilters(f => ({ ...f, type: e.target.value as ActivityType || undefined, page: 1 }))}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={filters.status ?? ''}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value as ActivityStatus || undefined, page: 1 }))}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={!!filters.overdue}
            onChange={e => setFilters(f => ({ ...f, overdue: e.target.checked || undefined, page: 1 }))}
            className="accent-indigo-600"
          />
          Overdue only
        </label>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Related To</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Due Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Assigned To</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.data.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">No activities found.</td></tr>
              )}
              {data?.data.map(act => (
                <tr key={act.id} className={`hover:bg-slate-50 ${act.is_overdue ? 'bg-red-50/40' : ''}`}>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {act.subject}
                    {act.is_overdue && <span className="ml-2 text-xs text-red-600 font-normal">Overdue</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{ACTIVITY_TYPE_LABELS[act.type]}</td>
                  <td className="px-4 py-3 text-slate-600">{act.relatable?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {act.due_date
                      ? `${act.due_date}${act.due_time ? ` ${act.due_time.slice(0, 5)}` : ''}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[act.status]}`}>
                      {act.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{act.assigned_to?.full_name ?? '—'}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2 justify-end">
                      {act.status !== 'completed' && act.status !== 'cancelled' && (
                        <button
                          onClick={() => handleComplete(act.id)}
                          className="text-xs px-2 py-1 bg-green-50 border border-green-200 text-green-700 rounded hover:bg-green-100"
                        >
                          Complete
                        </button>
                      )}
                      {can('activities.delete') && (
                        <button
                          onClick={() => handleDelete(act.id)}
                          className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
          <span>
            {((filters.page - 1) * filters.per_page) + 1}–
            {Math.min(filters.page * filters.per_page, data.meta.total)} of {data.meta.total}
          </span>
          <div className="flex gap-1">
            <button disabled={filters.page === 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
              className="px-3 py-1 border border-slate-300 rounded disabled:opacity-40 hover:bg-slate-50">Previous</button>
            <button disabled={filters.page >= data.meta.last_page} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
              className="px-3 py-1 border border-slate-300 rounded disabled:opacity-40 hover:bg-slate-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
