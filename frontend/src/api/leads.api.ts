import apiClient, { ApiResponse, PaginatedResponse } from './client';
import { Lead, LeadFilters, CreateLeadPayload, UpdateLeadPayload, ConvertLeadPayload } from '../types/lead.types';

export const leadsApi = {
  list: (filters: LeadFilters & { page?: number; per_page?: number }) =>
    apiClient.get<PaginatedResponse<Lead>>('/leads', { params: filters }),

  get: (id: number) =>
    apiClient.get<ApiResponse<Lead>>(`/leads/${id}`),

  create: (payload: CreateLeadPayload) =>
    apiClient.post<ApiResponse<Lead>>('/leads', payload),

  update: (id: number, payload: UpdateLeadPayload) =>
    apiClient.put<ApiResponse<Lead>>(`/leads/${id}`, payload),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/leads/${id}`),

  convert: (id: number, payload: ConvertLeadPayload) =>
    apiClient.post<ApiResponse<{ client: unknown; applicant: unknown; opportunity: unknown }>>(`/leads/${id}/convert`, payload),

  assign: (id: number, ownerId: number) =>
    apiClient.patch<ApiResponse<Lead>>(`/leads/${id}/assign`, { owner_id: ownerId }),
};
