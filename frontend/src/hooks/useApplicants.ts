import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicantsApi } from '../api/applicants.api';
import type {
  Applicant,
  ApplicantFilters,
  CreateApplicantPayload,
  UpdateApplicantPayload,
} from '../types/applicant.types';
import type { PaginatedResponse } from '../api/client';

// ── List ─────────────────────────────────────────────────────────────────────

export const useApplicants = (
  filters: ApplicantFilters & { page?: number; per_page?: number }
) =>
  useQuery({
    queryKey: ['applicants', filters],
    queryFn: () =>
      applicantsApi.list(filters).then(r => r.data as PaginatedResponse<Applicant>),
    placeholderData: prev => prev,
  });

// ── Single ────────────────────────────────────────────────────────────────────

export const useApplicant = (id: number) =>
  useQuery({
    queryKey: ['applicants', id],
    queryFn: () =>
      applicantsApi.get(id).then(r => (r.data as { data: Applicant }).data),
    enabled: !!id,
  });

// ── Create ────────────────────────────────────────────────────────────────────

export const useCreateApplicant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateApplicantPayload) =>
      applicantsApi.create(payload).then(r => (r.data as { data: Applicant }).data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applicants'] }),
  });
};

// ── Update ────────────────────────────────────────────────────────────────────

export const useUpdateApplicant = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateApplicantPayload) =>
      applicantsApi.update(id, payload).then(r => (r.data as { data: Applicant }).data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applicants', id] });
      qc.invalidateQueries({ queryKey: ['applicants'] });
    },
  });
};

// ── Delete ────────────────────────────────────────────────────────────────────

export const useDeleteApplicant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => applicantsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applicants'] }),
  });
};

// ── Activities ────────────────────────────────────────────────────────────────

export const useApplicantActivities = (
  id: number,
  params?: Record<string, unknown>
) =>
  useQuery({
    queryKey: ['applicants', id, 'activities', params],
    queryFn: () =>
      applicantsApi.getActivities(id, params).then(r => r.data as any),
    enabled: !!id,
  });

export const useLogApplicantActivity = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      applicantsApi.logActivity(id, payload).then(r => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['applicants', id, 'activities'] }),
  });
};

// ── Documents ─────────────────────────────────────────────────────────────────

export const useApplicantDocuments = (id: number) =>
  useQuery({
    queryKey: ['applicants', id, 'documents'],
    queryFn: () =>
      applicantsApi.getDocuments(id).then(r => (r.data as { data: any[] }).data),
    enabled: !!id,
  });

export const useUploadApplicantDocument = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      import('../api/client').then(({ default: apiClient }) =>
        apiClient.post('/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['applicants', id, 'documents'] }),
  });
};

export const useDeleteApplicantDocument = (applicantId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: number) =>
      import('../api/client').then(({ default: apiClient }) =>
        apiClient.delete(`/documents/${docId}`)
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['applicants', applicantId, 'documents'] }),
  });
};
