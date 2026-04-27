import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then(r => r.data.data),
    staleTime: 1000 * 60 * 2, // 2 min — dashboard data is slightly stale-tolerant
  });
