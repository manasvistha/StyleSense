import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/skeleton';
import { api, apiErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { PageMeta } from '@/types';

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  measurements: { age: number; bodyShape: { name: string } | null } | null;
  _count: { recommendationRuns: number; reviews: number };
}

export default function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      const res = await api.get(`/admin/users?${params}`);
      return { users: res.data.data.users as AdminUser[], meta: res.data.meta as PageMeta };
    },
  });

  const mutate = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<Pick<AdminUser, 'role' | 'isActive'>> }) =>
      api.patch(`/admin/users/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated');
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Users</h1>
          <p className="text-muted-foreground">{data?.meta.total ?? '—'} registered users.</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="w-64 pl-9" placeholder="Search name or email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-muted-foreground">
                  <tr>
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Shape / Age</th>
                    <th className="p-4 font-medium">Activity</th>
                    <th className="p-4 font-medium">Joined</th>
                    <th className="p-4 font-medium">Admin</th>
                    <th className="p-4 font-medium">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.users.map((u) => (
                    <tr key={u.id} className="border-b border-border/60 last:border-0">
                      <td className="p-4">
                        <p className="font-medium">{u.fullName}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="p-4">
                        {u.measurements ? (
                          <span className="flex flex-wrap gap-1">
                            {u.measurements.bodyShape && <Badge variant="muted">{u.measurements.bodyShape.name}</Badge>}
                            <Badge variant="muted">{u.measurements.age}y</Badge>
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-4 text-muted-foreground">{u._count.recommendationRuns} runs · {u._count.reviews} reviews</td>
                      <td className="p-4 text-muted-foreground">{formatDate(u.createdAt)}</td>
                      <td className="p-4">
                        <Switch checked={u.role === 'ADMIN'} onCheckedChange={(v) => mutate.mutate({ id: u.id, body: { role: v ? 'ADMIN' : 'USER' } })} />
                      </td>
                      <td className="p-4">
                        <Switch checked={u.isActive} onCheckedChange={(v) => mutate.mutate({ id: u.id, body: { isActive: v } })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {data.meta.page} of {data.meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
