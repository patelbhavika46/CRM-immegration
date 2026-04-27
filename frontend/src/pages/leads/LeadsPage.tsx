import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeads, useDeleteLead } from '../../hooks/useLeads';
import { useUsers } from '../../hooks/useUsers';
import { LeadFilters, LeadStatus, LeadSource } from '../../types/lead.types';
import { useAuthStore } from '../../store/authStore';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<LeadStatus, string> = {
  new:          'bg-blue-100 text-blue-700',
  contacted:    'bg-yellow-100 text-yellow-700',
  qualified:    'bg-green-100 text-green-700',
  disqualified: 'bg-red-100 text-red-700',
  converted:    'bg-purple-100 text-purple-700',
};

const STATUS_OPTIONS: { label: string; value: LeadStatus | '' }[] = [
  { label: 'All Statuses',  value: '' },
  { label: 'New',           value: 'new' },
  { label: 'Contacted',     value: 'contacted' },
  { label: 'Qualified',     value: 'qualified' },
  { label: 'Disqualified',  value: 'disqualified' },
  { label: 'Converted',     value: 'converted' },
];

const SOURCE_OPTIONS: { label: string; value: LeadSource | '' }[] = [
  { label: 'All Sources',   value: '' },
  { label: 'Web',           value: 'web' },
  { label: 'Referral',      value: 'referral' },
  { label: 'Cold Call',     value: 'cold_call' },
  { label: 'Event',         value: 'event' },
  { label: 'Social Media',  value: 'social_media' },
  { label: 'Other',         value: 'other' },
];

type SortField = 'full_name' | 'company' | 'status' | 'source' | 'created_at';
type SortDir   = 'asc' | 'desc';

// ── Sub-components ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[200, 140, 110, 90, 90, 120, 64].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`h-4 bg-slate-100 rounded`} style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) {
    return <span className="ml-1 text-slate-300 text-xs">↕</span>;
  }
  return <span className="ml-1 text-indigo-600 text-xs">{dir === 'asc' ? '↑' : '↓'}</span>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const navigate  = useNavigate();
  const { can }   = useAuthStore();

  // ── Filter / sort / page state ────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<
    LeadFilters & { page: number; per_page: number; sort_by?: SortField; sort_dir?: SortDir }
  >({ page: 1, per_page: 20 });
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir,   setSortDir]   = useState<SortDir>('desc');
  const [deleting,  setDeleting]  = useState<number | null>(null);

  // ── Debounce search input ─────────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput || undefined, page: 1 }));
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const canManageOwner = can('users.view') || can('users.manage');
  const { data: usersData } = useUsers({ enabled: canManageOwner });

  const { data, isLoading } = useLeads({ ...filters, sort_by: sortField, sort_dir: sortDir });
  const deleteLead = useDeleteLead();

  // ── Sorting ───────────────────────────────────────────────────────────────
  const handleSort = useCallback((field: SortField) => {
    setSortDir((prev) => (sortField === field && prev === 'asc' ? 'desc' : 'asc'));
    setSortField(field);
    setFilters((f) => ({ ...f, page: 1 }));
  }, [sortField]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (deleting !== id) {
      setDeleting(id);
      return;
    }
    await deleteLead.mutateAsync(id);
    setDeleting(null);
  };

  const leads = data?.data ?? [];
  const meta  = data?.meta;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          {meta && (
            <p className="text-sm text-slate-500 mt-0.5">{meta.total} lead{meta.total !== 1 ? 's' : ''} total</p>
          )}
        </div>
        {can('leads.create') && (
          <button
            onClick={() => navigate('/leads/new')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center gap-1.5"
          >
            <span className="text-lg leading-none">+</span> New Lead
          </button>
        )}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-2.5 mb-4 items-center">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, company…"
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56 transition-shadow"
          />
        </div>

        {/* Status */}
        <select
          value={filters.status ?? ''}
          onChange={(e) => setFilters((f) => ({
            ...f,
            status: (e.target.value as LeadStatus) || undefined,
            page: 1,
          }))}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Source */}
        <select
          value={filters.source ?? ''}
          onChange={(e) => setFilters((f) => ({
            ...f,
            source: (e.target.value as LeadSource) || undefined,
            page: 1,
          }))}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Owner filter — only if user can see users */}
        {canManageOwner && usersData && (
          <select
            value={filters.owner_id ?? ''}
            onChange={(e) => setFilters((f) => ({
              ...f,
              owner_id: e.target.value ? Number(e.target.value) : undefined,
              page: 1,
            }))}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Owners</option>
            {usersData.data.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>
        )}

        {/* Clear filters */}
        {(filters.status || filters.source || filters.owner_id || searchInput) && (
          <button
            onClick={() => {
              setSearchInput('');
              setFilters({ page: 1, per_page: 20 });
            }}
            className="text-xs text-slate-500 hover:text-red-600 underline underline-offset-2 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {(
                [
                  { label: 'Name',         field: 'full_name'   as SortField },
                  { label: 'Company',      field: 'company'     as SortField },
                  { label: 'Visa Interest',field: null },
                  { label: 'Status',       field: 'status'      as SortField },
                  { label: 'Source',       field: 'source'      as SortField },
                  { label: 'Owner',        field: null },
                  { label: 'Created',      field: 'created_at'  as SortField },
                ] as { label: string; field: SortField | null }[]
              ).map(({ label, field }) => (
                <th
                  key={label}
                  onClick={field ? () => handleSort(field) : undefined}
                  className={`text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide select-none ${
                    field ? 'cursor-pointer hover:text-slate-900 hover:bg-slate-100 transition-colors' : ''
                  }`}
                >
                  {label}
                  {field && <SortIcon field={field} current={sortField} dir={sortDir} />}
                </th>
              ))}
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading
              ? [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
              : leads.length === 0
              ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-slate-500 font-medium">No leads found</p>
                      <p className="text-slate-400 text-xs">
                        {(filters.status || filters.source || filters.owner_id || filters.search)
                          ? 'Try adjusting your filters.'
                          : 'Click "New Lead" to add your first lead.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )
              : leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <td className="px-4 py-3 font-semibold text-indigo-600 group-hover:text-indigo-700">
                    {lead.full_name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{lead.company ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate">{lead.visa_interest ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[lead.status]}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs capitalize">{lead.source.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.owner?.full_name ?? <span className="text-slate-300">Unassigned</span>}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(lead.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      {can('leads.edit') && !lead.is_converted && (
                        <button
                          onClick={() => navigate(`/leads/${lead.id}/edit`)}
                          className="text-xs px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 text-slate-600 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      {can('leads.delete') && !lead.is_converted && (
                        <button
                          onClick={(e) => handleDelete(e, lead.id)}
                          onMouseLeave={() => setDeleting(null)}
                          className={`text-xs px-2 py-1 border rounded transition-colors ${
                            deleting === lead.id
                              ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                              : 'border-red-200 text-red-500 hover:bg-red-50'
                          }`}
                        >
                          {deleting === lead.id ? 'Confirm?' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
          <span className="text-slate-500">
            Showing{' '}
            <span className="font-medium text-slate-700">
              {(filters.page - 1) * filters.per_page + 1}–
              {Math.min(filters.page * filters.per_page, meta.total)}
            </span>{' '}
            of <span className="font-medium text-slate-700">{meta.total}</span>
          </span>
          <div className="flex gap-1">
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="px-3 py-1.5 border border-slate-300 rounded-md disabled:opacity-40 hover:bg-slate-50 text-xs font-medium transition-colors"
            >
              ← Previous
            </button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setFilters((f) => ({ ...f, page }))}
                  className={`px-3 py-1.5 border rounded-md text-xs font-medium transition-colors ${
                    filters.page === page
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              disabled={filters.page >= meta.last_page}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="px-3 py-1.5 border border-slate-300 rounded-md disabled:opacity-40 hover:bg-slate-50 text-xs font-medium transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
