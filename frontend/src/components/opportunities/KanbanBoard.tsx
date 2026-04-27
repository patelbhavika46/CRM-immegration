import { useRef, useState, useCallback } from 'react';
import { useKanban, useUpdateStage, useDeleteOpportunity } from '../../hooks/useOpportunities';
import { KanbanColumn, Opportunity, OpportunityStage } from '../../types/opportunity.types';
import OpportunityEditModal from './OpportunityEditModal';

// ── Stage config ──────────────────────────────────────────────────────────────

const STAGE_CONFIG: Record<OpportunityStage, {
  dot: string;
  header: string;
  activeBorder: string;
  activeBg: string;
}> = {
  prospecting:   { dot: 'bg-slate-400',   header: 'bg-slate-100',    activeBorder: 'border-slate-400',   activeBg: 'bg-slate-50/90' },
  qualification: { dot: 'bg-blue-500',    header: 'bg-blue-50',      activeBorder: 'border-blue-400',    activeBg: 'bg-blue-50/80' },
  proposal:      { dot: 'bg-violet-500',  header: 'bg-violet-50',    activeBorder: 'border-violet-400',  activeBg: 'bg-violet-50/80' },
  negotiation:   { dot: 'bg-amber-500',   header: 'bg-amber-50',     activeBorder: 'border-amber-400',   activeBg: 'bg-amber-50/80' },
  closed_won:    { dot: 'bg-emerald-500', header: 'bg-emerald-50',   activeBorder: 'border-emerald-400', activeBg: 'bg-emerald-50/80' },
  closed_lost:   { dot: 'bg-red-400',     header: 'bg-red-50',       activeBorder: 'border-red-400',     activeBg: 'bg-red-50/80' },
};

// ── Value color coding ────────────────────────────────────────────────────────

// Value tiers: <5k = slate · 5k–25k = blue · 25k–100k = amber · 100k+ = emerald
function valueAccentBorder(amount: number | null): string {
  if (!amount || amount <= 0)  return 'border-l-slate-200';
  if (amount >= 100_000)       return 'border-l-emerald-400';
  if (amount >= 25_000)        return 'border-l-amber-400';
  if (amount >= 5_000)         return 'border-l-blue-400';
  return 'border-l-slate-200';
}

interface ValueStyle { badge: string; tier: string | null }
function valueStyle(amount: number | null): ValueStyle {
  if (!amount || amount <= 0)  return { badge: 'bg-slate-50 border-slate-200 text-slate-500', tier: null };
  if (amount >= 100_000)       return { badge: 'bg-emerald-50 border-emerald-200 text-emerald-700', tier: 'Premium' };
  if (amount >= 25_000)        return { badge: 'bg-amber-50 border-amber-200 text-amber-700', tier: 'High' };
  if (amount >= 5_000)         return { badge: 'bg-blue-50 border-blue-200 text-blue-700', tier: 'Mid' };
  return { badge: 'bg-slate-50 border-slate-200 text-slate-500', tier: null };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function fmtAmount(amount: number | null, currency: string) {
  if (amount == null) return null;
  return `${currency}\u00a0${amount.toLocaleString()}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

// ── Card ──────────────────────────────────────────────────────────────────────

function KanbanCard({
  opp,
  fading,
  justAdded,
  deletingId,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
}: {
  opp: Opportunity;
  fading: boolean;
  justAdded: boolean;
  deletingId: number | null;
  onDragStart: (e: React.DragEvent, opp: Opportunity) => void;
  onDragEnd: () => void;
  onEdit: (opp: Opportunity) => void;
  onDelete: (id: number) => void;
}) {
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  const amount     = fmtAmount(opp.amount, opp.currency);
  const date       = fmtDate(opp.close_date);
  const accent     = valueAccentBorder(opp.amount);
  const vs         = valueStyle(opp.amount);
  const isDeleting = deletingId === opp.id;

  const barColor = opp.is_won
    ? 'bg-emerald-500'
    : opp.is_lost
    ? 'bg-red-400'
    : 'bg-indigo-500';

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (awaitingConfirm) {
      onDelete(opp.id);
      setAwaitingConfirm(false);
    } else {
      setAwaitingConfirm(true);
    }
  };

  return (
    <div
      draggable={!awaitingConfirm && !isDeleting}
      onDragStart={e => onDragStart(e, opp)}
      onDragEnd={onDragEnd}
      onMouseLeave={() => setAwaitingConfirm(false)}
      className={[
        'group relative bg-white rounded-xl border border-slate-200 border-l-4',
        accent,
        'shadow-sm hover:shadow-lg hover:-translate-y-0.5',
        'cursor-grab active:cursor-grabbing select-none',
        'transition-all duration-200',
        fading     ? 'opacity-40 scale-[0.97]' : 'opacity-100 scale-100',
        justAdded  ? 'animate-card-in' : '',
        isDeleting ? 'opacity-40 pointer-events-none' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* Quick-action buttons — fade in on hover */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
        {/* Edit */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onEdit(opp); }}
          title="Edit opportunity"
          className="p-1 rounded-md bg-white border border-slate-200 text-slate-400
            hover:text-indigo-600 hover:border-indigo-300 shadow-sm transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {/* Delete — two-click confirm */}
        <button
          type="button"
          onClick={handleDeleteClick}
          title={awaitingConfirm ? 'Click again to confirm deletion' : 'Delete opportunity'}
          className={[
            'p-1 rounded-md border shadow-sm transition-all duration-150',
            awaitingConfirm
              ? 'bg-red-500 border-red-500 text-white scale-110'
              : 'bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300',
          ].join(' ')}
        >
          {awaitingConfirm ? (
            /* checkmark = "yes, delete" */
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>

      {/* "Confirm?" tooltip — appears above the button cluster */}
      {awaitingConfirm && (
        <div className="absolute top-1 right-14 flex items-center gap-1 bg-red-600 text-white text-[11px] font-medium px-2 py-0.5 rounded-md shadow-md z-20 pointer-events-none whitespace-nowrap">
          Confirm?
        </div>
      )}

      <div className="p-3.5">
        {/* Title row — leave room for action buttons */}
        <div className="flex items-start gap-2 mb-2.5 pr-16">
          <svg
            className="mt-[3px] flex-shrink-0 text-slate-300 group-hover:text-slate-400 transition-colors"
            width="10" height="16" viewBox="0 0 10 16" fill="currentColor"
          >
            <circle cx="2"  cy="2"  r="1.5" />
            <circle cx="8"  cy="2"  r="1.5" />
            <circle cx="2"  cy="8"  r="1.5" />
            <circle cx="8"  cy="8"  r="1.5" />
            <circle cx="2"  cy="14" r="1.5" />
            <circle cx="8"  cy="14" r="1.5" />
          </svg>
          <p className="text-sm font-semibold text-slate-800 leading-snug flex-1 line-clamp-2">
            {opp.name}
          </p>
        </div>

        {/* Client */}
        {opp.client && (
          <div className="flex items-center gap-1.5 mb-3">
            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-xs text-slate-500 truncate">{opp.client.name}</span>
          </div>
        )}

        {/* Amount + date row */}
        <div className="flex items-center justify-between mb-2.5">
          {date ? (
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
              opp.is_overdue ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
            }`}>
              {opp.is_overdue && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {date}
            </span>
          ) : <span />}

          {/* Value badge — color-coded by tier */}
          {amount && (
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border tabular-nums ${vs.badge}`}>
              {vs.tier && (
                <span className="text-[9px] font-semibold uppercase tracking-wide opacity-60">{vs.tier}</span>
              )}
              {amount}
            </span>
          )}
        </div>

        {/* Probability bar + owner avatar */}
        <div className="space-y-1.5">
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${opp.probability}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 tabular-nums">{opp.probability}%</span>
            {opp.owner && (
              <span
                title={opp.owner.full_name}
                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold ring-1 ring-white"
              >
                {initials(opp.owner.full_name)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────

function KanbanColumnItem({
  col,
  fadingId,
  justAddedId,
  deletingId,
  isTarget,
  isDragging,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
  onDragEnter,
  onEdit,
  onDelete,
}: {
  col: KanbanColumn;
  fadingId: number | null;
  justAddedId: number | null;
  deletingId: number | null;
  isTarget: boolean;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, opp: Opportunity) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, stage: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (stage: string) => void;
  onEdit: (opp: Opportunity) => void;
  onDelete: (id: number) => void;
}) {
  const cfg = STAGE_CONFIG[col.stage as OpportunityStage] ?? STAGE_CONFIG.prospecting;

  return (
    <div
      className={[
        'flex-shrink-0 w-72 flex flex-col rounded-2xl border-2 transition-all duration-200',
        isTarget
          ? `${cfg.activeBorder} ${cfg.activeBg} shadow-xl scale-[1.015] animate-drop-pulse`
          : 'border-slate-200 bg-slate-50/80',
      ].join(' ')}
      onDrop={e => onDrop(e, col.stage)}
      onDragOver={onDragOver}
      onDragEnter={() => onDragEnter(col.stage)}
    >
      {/* Column header */}
      <div className={`px-4 py-3 rounded-t-2xl transition-colors duration-200 ${isTarget ? '' : cfg.header}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
            <h3 className="text-sm font-bold text-slate-700 truncate">{col.label}</h3>
          </div>
          <span className="ml-2 flex-shrink-0 text-xs font-semibold bg-white/80 text-slate-600 rounded-full px-2.5 py-0.5 border border-slate-200/80">
            {col.items.length}
          </span>
        </div>
        {col.total_value > 0 && (
          <p className="text-xs text-slate-500 mt-1 pl-[18px] font-medium tabular-nums">
            ${col.total_value.toLocaleString()}
          </p>
        )}
      </div>

      {/* Card list */}
      <div className="flex-1 p-3 space-y-2.5 overflow-y-auto min-h-[160px] max-h-[calc(100vh-300px)]">
        {col.items.map(opp => (
          <KanbanCard
            key={opp.id}
            opp={opp}
            fading={fadingId === opp.id}
            justAdded={justAddedId === opp.id}
            deletingId={deletingId}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {/* Empty drop zone */}
        {col.items.length === 0 && (
          <div className={[
            'flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed transition-all duration-200',
            isTarget && isDragging
              ? 'border-slate-400 text-slate-500 scale-[1.02]'
              : 'border-slate-200 text-slate-400',
          ].join(' ')}>
            <svg className="w-5 h-5 mb-1 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-xs">{isTarget && isDragging ? 'Release to drop' : 'Drop here'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function KanbanSkeleton() {
  const CARD_COUNTS = [2, 3, 1, 3, 2, 1];
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {CARD_COUNTS.map((count, i) => (
        <div key={i} className="flex-shrink-0 w-72 rounded-2xl border-2 border-slate-200 bg-slate-50/80 animate-pulse">
          <div className="px-4 py-3 bg-slate-100 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <div className="h-4 bg-slate-200 rounded w-28" />
            </div>
          </div>
          <div className="p-3 space-y-2.5">
            {Array.from({ length: count }).map((_, j) => (
              <div key={j} className="bg-white rounded-xl border border-l-4 border-slate-200 p-3.5 space-y-2.5">
                <div className="h-3.5 bg-slate-100 rounded w-4/5" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-1.5 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── KanbanBoard ───────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  filters?: { owner_id?: number; client_id?: number };
}

export default function KanbanBoard({ filters = {} }: KanbanBoardProps) {
  const { data: columns, isLoading, isError } = useKanban(filters);
  const updateStage  = useUpdateStage();
  const deleteOpp    = useDeleteOpportunity();

  const draggingRef               = useRef<Opportunity | null>(null);
  const justAddedTimer            = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fadingId, setFadingId]   = useState<number | null>(null);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [justAddedId, setJustAddedId] = useState<number | null>(null);
  const [moveError, setMoveError]   = useState<string | null>(null);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);

  // ── DnD ────────────────────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, opp: Opportunity) => {
    draggingRef.current = opp;
    setFadingId(opp.id);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    draggingRef.current = null;
    setFadingId(null);
    setDragTarget(null);
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((stage: string) => setDragTarget(stage), []);

  const handleBoardDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setDragTarget(null);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDragTarget(null);
    setIsDragging(false);

    const opp = draggingRef.current;
    draggingRef.current = null;
    setFadingId(null);

    if (!opp || opp.stage === targetStage) return;
    setMoveError(null);

    // Trigger card-in animation on the moved card
    if (justAddedTimer.current) clearTimeout(justAddedTimer.current);
    setJustAddedId(opp.id);
    justAddedTimer.current = setTimeout(() => setJustAddedId(null), 300);

    try {
      await updateStage.mutateAsync({ id: opp.id, stage: targetStage });
    } catch (err: unknown) {
      setJustAddedId(null);
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setMoveError(msg ?? 'Could not move opportunity — this transition may not be allowed.');
    }
  }, [updateStage]);

  // ── Quick actions ───────────────────────────────────────────────────────────

  const handleDelete = useCallback((id: number) => {
    deleteOpp.mutate(id);
  }, [deleteOpp]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) return <KanbanSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-sm font-medium text-slate-500">Failed to load opportunities</p>
        <p className="text-xs mt-1">Check your connection and try again</p>
      </div>
    );
  }

  return (
    <>
      <div>
        {/* Error banner */}
        {moveError && (
          <div className="mb-4 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 animate-card-in">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="flex-1 text-sm font-medium">{moveError}</p>
            <button
              onClick={() => setMoveError(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Board */}
        <div
          className="flex gap-4 overflow-x-auto pb-4"
          onDragLeave={handleBoardDragLeave}
        >
          {(columns ?? []).map(col => (
            <KanbanColumnItem
              key={col.stage}
              col={col}
              fadingId={fadingId}
              justAddedId={justAddedId}
              deletingId={deleteOpp.isPending ? (deleteOpp.variables as number) : null}
              isTarget={dragTarget === col.stage}
              isDragging={isDragging}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onEdit={setEditingOpp}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* "Moving…" toast */}
        {updateStage.isPending && (
          <div className="fixed bottom-6 right-6 flex items-center gap-2.5 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-2xl z-50 pointer-events-none animate-card-in">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Moving opportunity…
          </div>
        )}
      </div>

      {/* Edit modal — rendered outside board so z-index is unaffected */}
      {editingOpp && (
        <OpportunityEditModal
          opportunity={editingOpp}
          onClose={() => setEditingOpp(null)}
        />
      )}
    </>
  );
}
