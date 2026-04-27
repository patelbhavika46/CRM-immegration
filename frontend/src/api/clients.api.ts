import apiClient, { ApiResponse, PaginatedResponse } from './client';
import {
  Client,
  ClientFilters,
  CreateClientPayload,
  UpdateClientPayload,
  ClientApplicant,
  ClientDocument,
} from '../types/client.types';
import { Activity, CreateActivityPayload } from '../types/activity.types';

export const clientsApi = {
  list: (filters: ClientFilters & { page?: number; per_page?: number }) =>
    apiClient.get<PaginatedResponse<Client>>('/clients', { params: filters }),

  get: (id: number) =>
    apiClient.get<ApiResponse<Client>>(`/clients/${id}`),

  create: (payload: CreateClientPayload) =>
    apiClient.post<ApiResponse<Client>>('/clients', payload),

  update: (id: number, payload: UpdateClientPayload) =>
    apiClient.put<ApiResponse<Client>>(`/clients/${id}`, payload),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/clients/${id}`),

  // ── Applicants ────────────────────────────────────────────────────────────

  getApplicants: (clientId: number) =>
    apiClient.get<ApiResponse<ClientApplicant[]>>(`/clients/${clientId}/applicants`),

  addApplicant: (clientId: number, payload: Partial<ClientApplicant>) =>
    apiClient.post<ApiResponse<ClientApplicant>>(`/clients/${clientId}/applicants`, payload),

  linkApplicant: (clientId: number, applicantId: number) =>
    apiClient.patch<ApiResponse<ClientApplicant>>(
      `/clients/${clientId}/applicants/${applicantId}/link`,
      {}
    ),

  unlinkApplicant: (clientId: number, applicantId: number) =>
    apiClient.delete<ApiResponse<null>>(
      `/clients/${clientId}/applicants/${applicantId}/unlink`
    ),

  // ── Activities / Communications ───────────────────────────────────────────

  getActivities: (clientId: number, params: { page?: number; per_page?: number; type?: string } = {}) =>
    apiClient.get<PaginatedResponse<Activity>>(`/clients/${clientId}/activities`, { params }),

  logActivity: (clientId: number, payload: Omit<CreateActivityPayload, 'relatable_type' | 'relatable_id'>) =>
    apiClient.post<ApiResponse<Activity>>(`/clients/${clientId}/activities`, payload),

  // ── Documents ─────────────────────────────────────────────────────────────

  getDocuments: (clientId: number) =>
    apiClient.get<ApiResponse<ClientDocument[]>>(`/clients/${clientId}/documents`),

  uploadDocument: (clientId: number, formData: FormData) =>
    apiClient.post<ApiResponse<ClientDocument>>('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteDocument: (documentId: number) =>
    apiClient.delete<ApiResponse<null>>(`/documents/${documentId}`),

  downloadDocument: (documentId: number) =>
    apiClient.get(`/documents/${documentId}/download`, { responseType: 'blob' }),

  // ── Notes ─────────────────────────────────────────────────────────────────

  addNote: (clientId: number, content: string) =>
    apiClient.post<ApiResponse<null>>(`/clients/${clientId}/notes`, { content }),
};
