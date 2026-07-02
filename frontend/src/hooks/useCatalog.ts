import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CatalogData } from '@/types';

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    staleTime: 5 * 60_000,
    queryFn: async () => (await api.get('/catalog')).data.data as CatalogData,
  });
}
