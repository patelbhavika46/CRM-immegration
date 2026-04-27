import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { PaginatedResponse } from '../../api/client';

interface UserRow {
  id: number; full_name: string; email: string;
  role: { slug: string; name: string } | null;
  is_active: boolean; last_login_at: string | null;
}

const useUsers = (filters: Record<string, unknown>) =>
  useQuery({
    queryKey: ['users', filters],
    queryFn: () => apiClient.get<PaginatedResponse<UserRow>>('/users', { params: filters }).then(r => r.data),
    placeholderData: prev => prev,
  });

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-700',
  admin:       'bg-orange-100 text-orange-700',
  manager:     'bg-blue-100 text-blue-700',
  consultant:  'bg-indigo-100 text-indigo-700',
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, per_page: 20 });
  const { data, isLoading } = useUsers(filters);

  const toggle = useMutation({
    mutationFn: (id: number) => apiClient.patch(`/users/${id}/toggle-status`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Users</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700">
          + Invite User
        </button>
      </div>

      <input
        type="search"
        placeholder="Search users…"
        onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
        className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56 mb-4"
      />

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Last Login</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.data.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.role && (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role.slug] ?? 'bg-slate-100 text-slate-600'}`}>
                        {u.role.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggle.mutate(u.id)}
                      className={`text-xs px-2 py-1 rounded border ${u.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
