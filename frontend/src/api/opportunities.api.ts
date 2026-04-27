import apiClient, { ApiResponse, PaginatedResponse } from './client';
import { Opportunity, OpportunityFilters, KanbanColumn, CreateOpportunityPayload } from '../types/opportunity.types';

export const opportunitiesApi = {
  list: (filters: OpportunityFilters & { page?: number; per_page?: number }) =>
    apiClient.get<PaginatedResponse<Opportunity>>('/opportunities', { params: filters }),

  kanban: (filters: { owner_id?: number; client_id?: number } = {}) =>
    apiClient.get<ApiResponse<KanbanColumn[]>>('/opportunities/kanban', { params: filters }),

  get: (id: number) =>
    apiClient.get<ApiResponse<Opportunity>>(`/opportunities/${id}`),

  create: (payload: CreateOpportunityPayload) =>
    apiClient.post<ApiResponse<Opportunity>>('/opportunities', payload),

  update: (id: number, payload: Partial<CreateOpportunityPayload>) =>
    apiClient.put<ApiResponse<Opportunity>>(`/opportunities/${id}`, payload),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/opportunities/${id}`),

  updateStage: (id: number, stage: string, note?: string) =>
    apiClient.patch<ApiResponse<Opportunity>>(`/opportunities/${id}/stage`, { stage, note }),
};
