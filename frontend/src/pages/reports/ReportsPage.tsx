import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import apiClient from '../../api/client';

const COLORS = ['#4f46e5','#6366f1','#818cf8','#a5b4fc','#c7d2fe'];

type ReportType = 'pipeline' | 'lead_sources' | 'sales_performance' | 'case_statuses';

const TABS: { key: ReportType; label: string }[] = [
  { key: 'pipeline',          label: 'Pipeline' },
  { key: 'lead_sources',      label: 'Lead Sources' },
  { key: 'sales_performance', label: 'Sales Performance' },
  { key: 'case_statuses',     label: 'Case Statuses' },
];

const useReport = (type: ReportType) =>
  useQuery({
    queryKey: ['reports', type],
    queryFn: () => apiClient.get(`/reports/${type.replace('_', '-')}`).then(r => r.data.data),
  });

export default function ReportsPage() {
  const [active, setActive] = useState<ReportType>('pipeline');
  const { data, isLoading } = useReport(active);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Reports & Analytics</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {(active === 'pipeline' || active === 'case_statuses') && (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={data} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey={active === 'pipeline' ? 'stage' : 'case_status'} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey={active === 'pipeline' ? 'total_amount' : 'count'} radius={[4, 4, 0, 0]}>
                    {(data ?? []).map((_: unknown, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {active === 'lead_sources' && (
              <div className="flex items-center gap-8 justify-center">
                <ResponsiveContainer width="40%" height={280}>
                  <PieChart>
                    <Pie data={data} dataKey="count" nameKey="source" innerRadius={70} outerRadius={110}>
                      {(data ?? []).map((_: unknown, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <table className="text-sm">
                  <thead><tr className="text-left text-slate-500 text-xs uppercase">
                    <th className="pr-8 py-1">Source</th><th>Count</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data ?? []).map((r: { source: string; count: number }, i: number) => (
                      <tr key={r.source}>
                        <td className="pr-8 py-2 capitalize flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          {r.source.replace('_', ' ')}
                        </td>
                        <td className="font-semibold">{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {active === 'sales_performance' && (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={data} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Closed Won']} />
                  <Bar dataKey="total_amount" radius={[4, 4, 0, 0]} fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        )}
      </div>
    </div>
  );
}
