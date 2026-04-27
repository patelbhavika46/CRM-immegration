import apiClient, { PaginatedResponse } from './client';
import { User } from '../types/auth.types';

export const usersApi = {
  list: (params: { per_page?: number; role_id?: number; search?: string; is_active?: boolean } = {}) =>
    apiClient.get<PaginatedResponse<User>>('/users', { params }),

  get: (id: number) =>
    apiClient.get<{ success: boolean; data: User }>(`/users/${id}`),
};
