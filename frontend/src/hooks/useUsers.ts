import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/users.api';

const KEY = 'users';

export function useUsers(options: { enabled?: boolean; per_page?: number } = {}) {
  const { enabled = true, per_page = 100 } = options;
  return useQuery({
    queryKey: [KEY, { per_page }],
    queryFn: () => usersApi.list({ per_page, is_active: true }).then((r) => r.data),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
