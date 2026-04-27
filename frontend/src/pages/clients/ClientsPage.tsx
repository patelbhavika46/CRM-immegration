import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients, useDeleteClient } from '../../hooks/useClients';
import { useUsers } from '../../hooks/useUsers';
import {
  Client,
  ClientFilters,
  ClientType,
  CaseStatus,
  CLIENT_TYPE_LABELS,
  CLIENT_TYPE_COLORS,
  CASE_STATUS_LABELS,
  CASE_STATUS_COLORS,
  SERVICE_TYPE_LABELS,
  ServiceType,
} from '../../types/client.types';
import { useAuthStore } from '../../store/authStore';
import ClientForm from '../../components/clients/ClientForm';

// ── Sort state ────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'type' | 'case_status' | 'applicants_count' | 'created_at';
interface Sort { key: SortKey; dir: 'asc' | 'desc' }

// ── Filter bar ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: ClientType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'individual', label: 'Individual' },
  { value: 'family',     label: 'Family' },
  { value: 'corporate',  label: 'Corporate' },
];

const STATUS_OPTIONS: { value: CaseStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  ...Object.entries(CASE_STATUS_LABELS).map(([v, l]) => ({ value: v as CaseStatus, label: l })),
];

// ── Column header with sort ───────────────────────────────────────────────────

function ColHeader({
  label, sortKey, current, onSort,
}: {
  label: string;
  sortKey?: SortKey;
  current: Sort;
  onSort: (k: SortKey) => void;
}) {
  const active = current.key === sortKey;
  return (
    <th
      className={`text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${sortKey ? 'cursor-pointer select-none hover:text-slate-700' : ''}`}
      onClick={() => sortKey && onSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey && (
          <span className={`transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
            {active && current.dir === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </span>
    </th>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirmModal({
  client,
  onConfirm,
  onCancel,
}: {
  client: Client;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-2">Delete Client?</h3>
        <p className="text-sm text-slate-500 mb-5">
          <strong>{client.name}</strong> will be soft-deleted. Associated applicants and documents are retained.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Client table row ──────────────────────────────────────────────────────────

function ClientRow({
  client,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  client: Client;
  onEdit: (c: Client) => void;
  onDelete: (c: Client) => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const navigate = useNavigate();

  return (
    <tr
      className="hover:bg-slate-50 cursor-pointer transition-colors"
      onClick={() => navigate(`/clients/${client.id}`)}
    >
      {/* Client name */}
      <td className="px-4 py-3">
        <p className="font-semibold text-indigo-600 hover:underline truncate max-w-[200px]">
          {client.name}
        </p>
        <p className="text-xs text-slate-400 font-mono mt-0.5">{client.case_reference}</p>
      </td>

      {/* Type */}
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CLIENT_TYPE_COLORS[client.type]}`}>
          {CLIENT_TYPE_LABELS[client.type]}
        </span>
      </td>

      {/* Primary contact */}
      <td className="px-4 py-3">
        <p className="text-sm text-slate-700">{client.primary_applicant ?? '—'}</p>
      </td>

      {/* Email */}
      <td className="px-4 py-3 text-sm text-slate-500">
        {client.primary_contact_email ?? '—'}
      </td>

      {/* Phone */}
      <td className="px-4 py-3 text-sm text-slate-500">
        {client.primary_contact_phone ?? '—'}
      </td>

      {/* Applicant count */}
      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
          {client.applicants_count ?? 0}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CASE_STATUS_COLORS[client.case_status]}`}>
          {CASE_STATUS_LABELS[client.case_status]}
        </span>
      </td>

      {/* Owner / Consultant */}
      <td className="px-4 py-3 text-sm text-slate-600">
        {client.consultant?.full_name ?? <span className="text-slate-300">—</span>}
      </td>

      {/* Actions */}
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          {canEdit && (
            <button
              onClick={() => onEdit(client)}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
              title="Edit"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(client)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { can } = useAuthStore();
  const { data: usersData } = useUsers({ per_page: 100 });

  const [filters, setFilters] = useState<ClientFilters & { page: number; per_page: number }>({
    page: 1, per_page: 20,
  });
  const [sort, setSort] = useState<Sort>({ key: 'created_at', dir: 'desc' });

  const [formOpen, setFormOpen]     = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const { data, isLoading, isFetching } = useClients(filters);
  const deleteMutation = useDeleteClient();

  const handleSort = (key: SortKey) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  const sorted = useMemo(() => {
    if (!data?.data) return [];
    return [...data.data].sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      const va = (a as any)[sort.key] ?? '';
      const vb = (b as any)[sort.key] ?? '';
      if (typeof va === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [data, sort]);

  const openEdit = (c: Client) => { setEditClient(c); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditClient(null); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          {data && (
            <p className="text-sm text-slate-400 mt-0.5">{data.meta.total} total</p>
          )}
        </div>
        {can('clients.create') && (
          <button
            onClick={() => { setEditClient(null); setFormOpen(true); }}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Client
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 p-4 bg-white rounded-xl border border-slate-200">
        <input
          type="search"
          placeholder="Search name, reference…"
          value={filters.search ?? ''}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value || undefined, page: 1 }))}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
        />
        <select
          value={filters.type ?? ''}
          onChange={e => setFilters(f => ({ ...f, type: (e.target.value as ClientType) || undefined, page: 1 }))}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={filters.case_status ?? ''}
          onChange={e => setFilters(f => ({
            ...f,
            case_status: (e.target.value as CaseStatus) || undefined,
            page: 1,
          }))}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={
            filters.is_active === true ? 'true'
            : filters.is_active === false ? 'false'
            : ''
          }
          onChange={e => setFilters(f => ({
            ...f,
            is_active: e.target.value === '' ? undefined : e.target.value === 'true',
            page: 1,
          }))}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Active &amp; Inactive</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
        <select
          value={filters.consultant_id?.toString() ?? ''}
          onChange={e => setFilters(f => ({
            ...f,
            consultant_id: e.target.value ? Number(e.target.value) : undefined,
            page: 1,
          }))}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Consultants</option>
          {usersData?.data.map(u => (
            <option key={u.id} value={u.id}>{u.full_name}</option>
          ))}
        </select>

        {/* Clear filters */}
        {(filters.search || filters.type || filters.case_status || filters.is_active !== undefined || filters.consultant_id) && (
          <button
            onClick={() => setFilters({ page: 1, per_page: 20 })}
            className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden transition-opacity ${isFetching ? 'opacity-75' : ''}`}>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <ColHeader label="Client"           sortKey="name"             current={sort} onSort={handleSort} />
                  <ColHeader label="Type"             sortKey="type"             current={sort} onSort={handleSort} />
                  <ColHeader label="Primary Contact"                             current={sort} onSort={handleSort} />
                  <ColHeader label="Email"                                       current={sort} onSort={handleSort} />
                  <ColHeader label="Phone"                                       current={sort} onSort={handleSort} />
                  <ColHeader label="Applicants"       sortKey="applicants_count" current={sort} onSort={handleSort} />
                  <ColHeader label="Status"           sortKey="case_status"      current={sort} onSort={handleSort} />
                  <ColHeader label="Owner"                                       current={sort} onSort={handleSort} />
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-14 text-slate-400">
                      No clients match your filters.
                    </td>
                  </tr>
                ) : (
                  sorted.map(c => (
                    <ClientRow
                      key={c.id}
                      client={c}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                      canEdit={can('clients.edit')}
                      canDelete={can('clients.delete')}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {data && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            {((filters.page - 1) * filters.per_page) + 1}–
            {Math.min(filters.page * filters.per_page, data.meta.total)} of {data.meta.total}
          </span>
          <div className="flex gap-1">
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            {/* Page number pills */}
            {Array.from({ length: data.meta.last_page }, (_, i) => i + 1)
              .filter(p => Math.abs(p - filters.page) <= 2)
              .map(p => (
                <button
                  key={p}
                  onClick={() => setFilters(f => ({ ...f, page: p }))}
                  className={`px-3 py-1.5 border rounded-lg ${
                    p === filters.page
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            <button
              disabled={filters.page >= data.meta.last_page}
              onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {formOpen && (
        <ClientForm
          client={editClient ?? undefined}
          onClose={closeForm}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          client={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
