import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplicants, useDeleteApplicant } from '../../hooks/useApplicants';
import { useAuthStore } from '../../store/authStore';
import {
  Applicant,
  ApplicantFilters,
  VisaType,
  ImmigrationStatus,
  ApplicantRelationship,
  VISA_TYPE_LABELS,
  IMMIGRATION_STATUS_LABELS,
  IMMIGRATION_STATUS_COLORS,
  RELATIONSHIP_LABELS,
  RELATIONSHIP_COLORS,
} from '../../types/applicant.types';
import ApplicantForm from '../../components/applicants/ApplicantForm';

// ── Sort ──────────────────────────────────────────────────────────────────────

type SortKey = 'full_name' | 'visa_type' | 'immigration_status' | 'relationship' | 'created_at';
interface Sort { key: SortKey; dir: 'asc' | 'desc' }

// ── ColHeader ─────────────────────────────────────────────────────────────────

function ColHeader({ label, sortKey, current, onSort }: {
  label: string; sortKey?: SortKey; current: Sort; onSort: (k: SortKey) => void;
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

// ── Delete modal ──────────────────────────────────────────────────────────────

function DeleteModal({ applicant, onConfirm, onCancel }: {
  applicant: Applicant; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-2">Delete Applicant?</h3>
        <p className="text-sm text-slate-500 mb-5">
          <strong>{applicant.full_name}</strong> will be soft-deleted. Associated documents and
          activities are retained.
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

// ── Table row ─────────────────────────────────────────────────────────────────

function ApplicantRow({ applicant, onEdit, onDelete, canEdit, canDelete }: {
  applicant: Applicant;
  onEdit: (a: Applicant) => void;
  onDelete: (a: Applicant) => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const navigate     = useNavigate();
  const statusColor  = applicant.immigration_status
    ? IMMIGRATION_STATUS_COLORS[applicant.immigration_status as ImmigrationStatus]
    : 'bg-slate-100 text-slate-500';
  const relColor     = RELATIONSHIP_COLORS[applicant.relationship as ApplicantRelationship] ?? 'bg-slate-100 text-slate-600';

  return (
    <tr
      className="hover:bg-slate-50 cursor-pointer transition-colors"
      onClick={() => navigate(`/applicants/${applicant.id}`)}
    >
      <td className="px-4 py-3">
        <p className="font-semibold text-indigo-600 truncate max-w-[180px]">{applicant.full_name}</p>
        {applicant.email && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{applicant.email}</p>}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {applicant.client ? (
          <div>
            <p className="font-medium">{applicant.client.name}</p>
            <p className="text-xs text-slate-400 font-mono">{applicant.client.case_reference}</p>
          </div>
        ) : '—'}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {applicant.visa_type ? VISA_TYPE_LABELS[applicant.visa_type as VisaType] : '—'}
      </td>
      <td className="px-4 py-3 text-xs font-mono text-slate-500">
        {applicant.application_id ?? '—'}
      </td>
      <td className="px-4 py-3">
        {applicant.immigration_status ? (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
            {IMMIGRATION_STATUS_LABELS[applicant.immigration_status as ImmigrationStatus]}
          </span>
        ) : '—'}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${relColor}`}>
          {RELATIONSHIP_LABELS[applicant.relationship as ApplicantRelationship]}
        </span>
      </td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          {canEdit && (
            <button onClick={() => onEdit(applicant)}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors" title="Edit">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(applicant)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Delete">
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

export default function ApplicantsPage() {
  const { can }  = useAuthStore();

  const [filters, setFilters] = useState<ApplicantFilters & { page: number; per_page: number }>({
    page: 1, per_page: 20,
  });
  const [sort, setSort] = useState<Sort>({ key: 'created_at', dir: 'desc' });

  const [formOpen,      setFormOpen]      = useState(false);
  const [editApplicant, setEditApplicant] = useState<Applicant | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<Applicant | null>(null);

  const { data, isLoading, isFetching } = useApplicants(filters);
  const deleteMutation = useDeleteApplicant();

  const handleSort = (key: SortKey) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  const sorted = useMemo(() => {
    if (!data?.data) return [];
    return [...data.data].sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      const va = (a as any)[sort.key] ?? '';
      const vb = (b as any)[sort.key] ?? '';
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [data, sort]);

  const openEdit   = (a: Applicant) => { setEditApplicant(a); setFormOpen(true); };
  const closeForm  = () => { setFormOpen(false); setEditApplicant(null); };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applicants</h1>
          {data && <p className="text-sm text-slate-400 mt-0.5">{data.meta.total} total</p>}
        </div>
        {can('applicants.create') && (
          <button
            onClick={() => { setEditApplicant(null); setFormOpen(true); }}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Applicant
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 p-4 bg-white rounded-xl border border-slate-200">
        <input
          type="search"
          placeholder="Search name, email, app ID, passport…"
          value={filters.search ?? ''}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value || undefined, page: 1 }))}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
        />
        <select
          value={filters.visa_type ?? ''}
          onChange={e => setFilters(f => ({ ...f, visa_type: (e.target.value as VisaType) || undefined, page: 1 }))}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Visa Types</option>
          {(Object.entries(VISA_TYPE_LABELS) as [VisaType, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={filters.immigration_status ?? ''}
          onChange={e => setFilters(f => ({ ...f, immigration_status: (e.target.value as ImmigrationStatus) || undefined, page: 1 }))}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          {(Object.entries(IMMIGRATION_STATUS_LABELS) as [ImmigrationStatus, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={filters.relationship ?? ''}
          onChange={e => setFilters(f => ({ ...f, relationship: (e.target.value as ApplicantRelationship) || undefined, page: 1 }))}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Roles</option>
          {(Object.entries(RELATIONSHIP_LABELS) as [ApplicantRelationship, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        {(filters.search || filters.visa_type || filters.immigration_status || filters.relationship) && (
          <button
            onClick={() => setFilters({ page: 1, per_page: 20 })}
            className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
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
                  <ColHeader label="Applicant"    sortKey="full_name"          current={sort} onSort={handleSort} />
                  <ColHeader label="Client"                                    current={sort} onSort={handleSort} />
                  <ColHeader label="Visa Type"    sortKey="visa_type"          current={sort} onSort={handleSort} />
                  <ColHeader label="App. ID"                                   current={sort} onSort={handleSort} />
                  <ColHeader label="Status"       sortKey="immigration_status" current={sort} onSort={handleSort} />
                  <ColHeader label="Role"         sortKey="relationship"       current={sort} onSort={handleSort} />
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-14 text-slate-400">
                      No applicants match your filters.
                    </td>
                  </tr>
                ) : (
                  sorted.map(a => (
                    <ApplicantRow
                      key={a.id}
                      applicant={a}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                      canEdit={can('applicants.edit')}
                      canDelete={can('applicants.delete')}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
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
            {Array.from({ length: data.meta.last_page }, (_, i) => i + 1)
              .filter(p => Math.abs(p - filters.page) <= 2)
              .map(p => (
                <button key={p}
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

      {/* Modals */}
      {formOpen && (
        <ApplicantForm
          applicant={editApplicant ?? undefined}
          onClose={closeForm}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          applicant={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
