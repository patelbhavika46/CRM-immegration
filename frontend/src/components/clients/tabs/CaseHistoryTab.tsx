import { useClient } from '../../../hooks/useClients';
import { useNavigate } from 'react-router-dom';

const STAGES = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won'] as const;
type Stage = typeof STAGES[number];

const STAGE_LABELS: Record<Stage, string> = {
  prospecting:   'Prospecting',
  qualification: 'Qualification',
  proposal:      'Proposal',
  negotiation:   'Negotiation',
  closed_won:    'Closed Won',
};

const STAGE_COLORS: Record<Stage, string> = {
  prospecting:   'bg-slate-400',
  qualification: 'bg-blue-500',
  proposal:      'bg-indigo-500',
  negotiation:   'bg-purple-500',
  closed_won:    'bg-green-500',
};

function StageBar({ current }: { current: string }) {
  const idx = STAGES.indexOf(current as Stage);
  return (
    <div className="flex items-center gap-0.5 mt-2">
      {STAGES.map((s, i) => (
        <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= idx ? STAGE_COLORS[s] : 'bg-slate-200'}`} />
      ))}
    </div>
  );
}

interface Opportunity {
  id: number; name: string; stage: string; amount: number | null; currency: string;
  probability: number; close_date: string | null; owner?: { id: number; full_name: string } | null;
  created_at: string; updated_at: string;
}

function OpportunityCard({ opp }: { opp: Opportunity }) {
  const navigate   = useNavigate();
  const stageBadge = STAGE_COLORS[opp.stage as Stage] ?? 'bg-slate-400';

  return (
    <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer"
      onClick={() => navigate('/opportunities')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{opp.name}</p>
          {opp.owner && <p className="text-xs text-slate-400 mt-0.5">{opp.owner.full_name}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white ${stageBadge}`}>
            {STAGE_LABELS[opp.stage as Stage] ?? opp.stage}
          </span>
        </div>
      </div>
      <StageBar current={opp.stage} />
      <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
        <span>{opp.amount ? `${opp.currency} ${opp.amount.toLocaleString()}` : 'No value set'}</span>
        <span>{opp.probability}% probability</span>
        {opp.close_date && (
          <span>Close: {new Date(opp.close_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
    </div>
  );
}

interface Props { clientId: number }

export default function CaseHistoryTab({ clientId }: Props) {
  const { data: client, isLoading } = useClient(clientId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const opportunities = (client as any)?.opportunities ?? [];
  const active     = opportunities.filter((o: Opportunity) => o.stage !== 'closed_won' && o.stage !== 'closed_lost');
  const closedWon  = opportunities.filter((o: Opportunity) => o.stage === 'closed_won');
  const totalRevenue = closedWon.reduce((sum: number, o: Opportunity) => sum + (o.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Applications" value={opportunities.length} color="bg-slate-50 text-slate-700" />
        <StatCard label="Active"             value={active.length}        color="bg-blue-50 text-blue-700" />
        <StatCard label="Won / Closed"       value={closedWon.length}     color="bg-green-50 text-green-700" />
        <div className="rounded-xl p-4 bg-indigo-50 text-indigo-700">
          <p className="text-xl font-bold">{totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : '—'}</p>
          <p className="text-xs font-medium mt-0.5 opacity-80">Total Revenue</p>
        </div>
      </div>

      {(client?.date_opened || client?.date_closed) && (
        <div className="grid grid-cols-2 gap-3">
          {client.date_opened && (
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Date Opened</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {new Date(client.date_opened).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
          {client.date_closed && (
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Date Closed</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {new Date(client.date_closed).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Opportunities / Pipeline</h4>
        </div>
        {!opportunities.length ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-slate-400 text-sm">No opportunities linked to this client yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {opportunities.map((opp: Opportunity) => <OpportunityCard key={opp.id} opp={opp} />)}
          </div>
        )}
      </div>

      {client?.lead_id && (
        <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Converted from Lead</p>
          <p className="text-sm text-indigo-700">
            This client was created via lead conversion (Lead #{client.lead_id}).
          </p>
        </div>
      )}
    </div>
  );
}
