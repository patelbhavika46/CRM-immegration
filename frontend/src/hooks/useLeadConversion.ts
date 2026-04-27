import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { leadConversionApi } from '../api/leadConversion.api';
import { ConvertLeadPayload, ConversionResult } from '../types/leadConversion.types';
import { ApiError } from '../api/client';

export function useLeadConversion(leadId: number) {
  const qc = useQueryClient();

  return useMutation<ConversionResult, AxiosError<ApiError>, ConvertLeadPayload>({
    mutationFn: async (payload) => {
      const { data } = await leadConversionApi.convert(leadId, payload);
      return data.data;
    },
    onSuccess: () => {
      // Invalidate all affected query caches
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['leads', leadId] });
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['applicants'] });
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
