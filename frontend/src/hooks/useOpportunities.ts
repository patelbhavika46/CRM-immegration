import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunitiesApi } from '../api/opportunities.api';
import {
  OpportunityFilters,
  CreateOpportunityPayload,
  KanbanColumn,
  Opportunity,
  OpportunityStage,
} from '../types/opportunity.types';

const KEY = 'opportunities';

export const useKanban = (filters = {}) =>
  useQuery({
    queryKey: [KEY, 'kanban', filters],
    queryFn: () => opportunitiesApi.kanban(filters).then(r => r.data.data),
  });

export const useOpportunities = (filters: OpportunityFilters & { page?: number; per_page?: number } = {}) =>
  useQuery({
    queryKey: [KEY, filters],
    queryFn: () => opportunitiesApi.list(filters).then(r => r.data),
    placeholderData: prev => prev,
  });

export const useOpportunity = (id: number) =>
  useQuery({
    queryKey: [KEY, id],
    queryFn: () => opportunitiesApi.get(id).then(r => r.data.data),
    enabled: id > 0,
  });

export const useCreateOpportunity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: CreateOpportunityPayload) => opportunitiesApi.create(p).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
};

export const useUpdateStage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage, note }: { id: number; stage: string; note?: string }) =>
      opportunitiesApi.updateStage(id, stage, note).then(r => r.data.data),

    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: [KEY, 'kanban'] });

      // Snapshot every matching kanban query (filters vary per component mount)
      const snapshot = qc.getQueriesData<KanbanColumn[]>({ queryKey: [KEY, 'kanban'] });

      qc.setQueriesData<KanbanColumn[]>({ queryKey: [KEY, 'kanban'] }, (old) => {
        if (!old) return old;
        let moved: Opportunity | undefined;

        const stripped = old.map(col => ({
          ...col,
          items: col.items.filter(o => (o.id === id ? ((moved = o), false) : true)),
          total_value: col.items.some(o => o.id === id)
            ? col.total_value - (col.items.find(o => o.id === id)?.amount ?? 0)
            : col.total_value,
        }));

        if (!moved) return old;

        const updated: Opportunity = { ...moved, stage: stage as OpportunityStage };

        return stripped.map(col =>
          col.stage === stage
            ? { ...col, items: [...col.items, updated], total_value: col.total_value + (moved!.amount ?? 0) }
            : col,
        );
      });

      return { snapshot };
    },

    onError: (_err, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },

    onSettled: () => qc.invalidateQueries({ queryKey: [KEY, 'kanban'] }),
  });
};

export const useUpdateOpportunity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & Partial<CreateOpportunityPayload>) =>
      opportunitiesApi.update(id, payload).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
};

export const useDeleteOpportunity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => opportunitiesApi.delete(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: [KEY, 'kanban'] });

      const snapshot = qc.getQueriesData<KanbanColumn[]>({ queryKey: [KEY, 'kanban'] });

      qc.setQueriesData<KanbanColumn[]>({ queryKey: [KEY, 'kanban'] }, (old) => {
        if (!old) return old;
        return old.map(col => ({
          ...col,
          items: col.items.filter(o => o.id !== id),
          total_value: col.items.some(o => o.id === id)
            ? col.total_value - (col.items.find(o => o.id === id)?.amount ?? 0)
            : col.total_value,
        }));
      });

      return { snapshot };
    },

    onError: (_err, _id, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },

    onSettled: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
};
