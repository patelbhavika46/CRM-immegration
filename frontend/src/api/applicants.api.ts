import apiClient from './client';
import type {
  ApplicantFilters,
  CreateApplicantPayload,
  UpdateApplicantPayload,
} from '../types/applicant.types';

const BASE = '/applicants';

export const applicantsApi = {
  list: (params?: ApplicantFilters & { page?: number; per_page?: number }) =>
    apiClient.get(BASE, { params }),

  get: (id: number) =>
    apiClient.get(`${BASE}/${id}`),

  create: (payload: CreateApplicantPayload) =>
    apiClient.post(BASE, payload),

  update: (id: number, payload: UpdateApplicantPayload) =>
    apiClient.put(`${BASE}/${id}`, payload),

  delete: (id: number) =>
    apiClient.delete(`${BASE}/${id}`),

  getActivities: (id: number, params?: Record<string, unknown>) =>
    apiClient.get(`${BASE}/${id}/activities`, { params }),

  logActivity: (id: number, payload: Record<string, unknown>) =>
    apiClient.post(`${BASE}/${id}/activities`, payload),

  getDocuments: (id: number) =>
    apiClient.get(`${BASE}/${id}/documents`),

  downloadDocument: (docId: number) =>
    apiClient.get(`/documents/${docId}/download`, { responseType: 'blob' }),
};
