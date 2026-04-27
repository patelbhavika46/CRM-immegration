import KanbanBoard from '../../components/opportunities/KanbanBoard';

export default function OpportunitiesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Opportunities</h1>
      </div>

      <KanbanBoard />
    </div>
  );
}
