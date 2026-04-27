import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesApi } from '../api/activities.api';
import { ActivityFilters, CreateActivityPayload } from '../types/activity.types';

const KEY = 'activities';

export const useActivities = (filters: ActivityFilters & { page?: number; per_page?: number } = {}) =>
  useQuery({
    queryKey: [KEY, filters],
    queryFn: () => activitiesApi.list(filters).then(r => r.data),
    placeholderData: prev => prev,
  });

export const useCreateActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: CreateActivityPayload) => activitiesApi.create(p).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
};

export const useCompleteActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, outcome }: { id: number; outcome?: string }) =>
      activitiesApi.complete(id, outcome).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => activitiesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
};
