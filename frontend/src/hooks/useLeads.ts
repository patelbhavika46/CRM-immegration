import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '../api/leads.api';
import { LeadFilters, CreateLeadPayload, UpdateLeadPayload, ConvertLeadPayload } from '../types/lead.types';
import { AxiosError } from 'axios';
import { ApiError } from '../api/client';

const LEADS_KEY = 'leads';

export function useLeads(filters: LeadFilters & { page?: number; per_page?: number } = {}) {
  return useQuery({
    queryKey: [LEADS_KEY, filters],
    queryFn: () => leadsApi.list(filters).then((r) => r.data),
    placeholderData: (prev) => prev,
  });
}

export function useLead(id: number) {
  return useQuery({
    queryKey: [LEADS_KEY, id],
    queryFn: () => leadsApi.get(id).then((r) => r.data.data),
    enabled: id > 0,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => leadsApi.create(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LEADS_KEY] }),
  });
}

export function useUpdateLead(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateLeadPayload) => leadsApi.update(id, payload).then((r) => r.data.data),
    onSuccess: (updated) => {
      qc.setQueryData([LEADS_KEY, id], updated);
      qc.invalidateQueries({ queryKey: [LEADS_KEY] });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => leadsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LEADS_KEY] }),
  });
}

export function useConvertLead(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConvertLeadPayload) => leadsApi.convert(id, payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LEADS_KEY] });
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['applicants'] });
    },
  });
}
