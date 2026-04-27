import apiClient, { ApiResponse } from './client';
import { ConvertLeadPayload, ConversionResult } from '../types/leadConversion.types';

export const leadConversionApi = {
  convert: (leadId: number, payload: ConvertLeadPayload) =>
    apiClient.post<ApiResponse<ConversionResult>>(`/leads/${leadId}/convert`, payload),
};
