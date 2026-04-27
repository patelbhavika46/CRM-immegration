import apiClient, { ApiResponse, PaginatedResponse } from './client';
import { Activity, ActivityFilters, CreateActivityPayload } from '../types/activity.types';

export const activitiesApi = {
  list: (filters: ActivityFilters & { page?: number; per_page?: number }) =>
    apiClient.get<PaginatedResponse<Activity>>('/activities', { params: filters }),

  get: (id: number) =>
    apiClient.get<ApiResponse<Activity>>(`/activities/${id}`),

  create: (payload: CreateActivityPayload) =>
    apiClient.post<ApiResponse<Activity>>('/activities', payload),

  update: (id: number, payload: Partial<CreateActivityPayload>) =>
    apiClient.put<ApiResponse<Activity>>(`/activities/${id}`, payload),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/activities/${id}`),

  complete: (id: number, outcome?: string) =>
    apiClient.patch<ApiResponse<Activity>>(`/activities/${id}/complete`, { outcome }),
};
