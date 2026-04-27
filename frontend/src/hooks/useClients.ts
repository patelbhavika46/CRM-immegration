import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../api/clients.api';
import { ClientFilters, CreateClientPayload, UpdateClientPayload } from '../types/client.types';
import { CreateActivityPayload } from '../types/activity.types';

const KEY = 'clients';

export function useClients(filters: ClientFilters & { page?: number; per_page?: number } = {}) {
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: () => clientsApi.list(filters).then(r => r.data),
    placeholderData: prev => prev,
  });
}

export function useClient(id: number, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => clientsApi.get(id).then(r => r.data.data),
    enabled: options.enabled ?? true,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClientPayload) => clientsApi.create(payload).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateClient(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateClientPayload) => clientsApi.update(id, payload).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: [KEY, id] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => clientsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

// ── Sub-resource hooks ────────────────────────────────────────────────────────

export function useClientApplicants(clientId: number) {
  return useQuery({
    queryKey: [KEY, clientId, 'applicants'],
    queryFn: () => clientsApi.getApplicants(clientId).then(r => r.data.data),
  });
}

export function useAddApplicant(clientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      clientsApi.addApplicant(clientId, payload).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, clientId, 'applicants'] });
      qc.invalidateQueries({ queryKey: [KEY, clientId] });
    },
  });
}

export function useLinkApplicant(clientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (applicantId: number) =>
      clientsApi.linkApplicant(clientId, applicantId).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, clientId, 'applicants'] });
      qc.invalidateQueries({ queryKey: [KEY, clientId] });
    },
  });
}

export function useUnlinkApplicant(clientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (applicantId: number) => clientsApi.unlinkApplicant(clientId, applicantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, clientId, 'applicants'] });
      qc.invalidateQueries({ queryKey: [KEY, clientId] });
    },
  });
}

export function useClientActivities(
  clientId: number,
  params: { page?: number; per_page?: number; type?: string } = {}
) {
  return useQuery({
    queryKey: [KEY, clientId, 'activities', params],
    queryFn: () => clientsApi.getActivities(clientId, params).then(r => r.data),
    placeholderData: prev => prev,
  });
}

export function useLogActivity(clientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<CreateActivityPayload, 'relatable_type' | 'relatable_id'>) =>
      clientsApi.logActivity(clientId, payload).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, clientId, 'activities'] });
      qc.invalidateQueries({ queryKey: [KEY, clientId] });
    },
  });
}

export function useClientDocuments(clientId: number) {
  return useQuery({
    queryKey: [KEY, clientId, 'documents'],
    queryFn: () => clientsApi.getDocuments(clientId).then(r => r.data.data),
  });
}

export function useUploadDocument(clientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      clientsApi.uploadDocument(clientId, formData).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, clientId, 'documents'] });
      qc.invalidateQueries({ queryKey: [KEY, clientId] });
    },
  });
}

export function useDeleteDocument(clientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: number) => clientsApi.deleteDocument(documentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, clientId, 'documents'] });
    },
  });
}
