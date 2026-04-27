import { useDashboard } from '../../hooks/useDashboard';
import { useAuthStore } from '../../store/authStore';
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';

const KpiCard = ({ label, value, sub, accent = false }: { label: string; value: string | number; sub?: string; accent?: boolean }) => (
  <div className={`rounded-xl border p-5 ${accent ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
    <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${accent ? 'text-indigo-200' : 'text-slate-500'}`}>{label}</p>
    <p className={`text-3xl font-bold ${accent ? 'text-white' : 'text-slate-900'}`}>{value}</p>
    {sub && <p className={`text-xs mt-1 ${accent ? 'text-indigo-200' : 'text-slate-400'}`}>{sub}</p>}
  </div>
);

const STAGE_COLORS: Record<string, string> = {
  prospecting:   '#a5b4fc',
  qualification: '#818cf8',
  proposal:      '#6366f1',
  negotiation:   '#4f46e5',
};

const SOURCE_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

const STATUS_BADGE: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-700',
  scheduled:   'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-slate-100 text-slate-500',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { kpis, pipeline_summary, recent_activities, lead_sources } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Welcome back, {user?.first_name}.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard label="Total Leads"       value={kpis.total_leads}       sub={`+${kpis.new_leads_this_month} this month`} />
        <KpiCard label="Active Clients"    value={kpis.active_clients}    sub={`${kpis.total_clients} total`} />
        <KpiCard label="Open Opps"         value={kpis.open_opportunities}/>
        <KpiCard label="Pipeline Value"    value={`$${(kpis.pipeline_value / 1000).toFixed(1)}k`} accent />
        <KpiCard label="Overdue Tasks"     value={kpis.overdue_activities} sub={`${kpis.pending_activities} pending`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline bar chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Pipeline by Stage</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pipeline_summary} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Total']} />
              <Bar dataKey="total_amount" radius={[4, 4, 0, 0]}>
                {pipeline_summary.map((entry) => (
                  <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] ?? '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lead source pie */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Lead Sources</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={lead_sources} dataKey="count" nameKey="source" innerRadius={50} outerRadius={80}>
                  {lead_sources.map((_, i) => (
                    <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <ul className="space-y-1.5 text-sm flex-1">
              {lead_sources.map((s, i) => (
                <li key={s.source} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                  <span className="capitalize text-slate-600">{s.source.replace('_', ' ')}</span>
                  <span className="ml-auto font-semibold text-slate-800">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Recent Activities</h2>
        {recent_activities.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No recent activities.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recent_activities.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{a.subject}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {a.type.replace('_', ' ')}
                    {a.related_name ? ` · ${a.related_name}` : ''}
                    {a.assigned_to ? ` · ${a.assigned_to}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  {a.due_date && <span className="text-xs text-slate-400">{a.due_date}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[a.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
