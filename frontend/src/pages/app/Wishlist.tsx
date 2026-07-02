import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DressCard } from '@/components/DressCard';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { DressListItem } from '@/types';

interface WishItem {
  id: string;
  dress: DressListItem;
}

export default function Wishlist() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => (await api.get('/wishlist')).data.data.items as WishItem[],
  });

  const remove = useMutation({
    mutationFn: async (dressId: string) => api.delete(`/wishlist/${dressId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Removed from wishlist');
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Your wishlist</h1>
        <p className="text-muted-foreground">Pieces you’ve saved for later.</p>
      </div>

      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
        </div>
      )}

      {data && data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Heart className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Your wishlist is empty</p>
            <Button asChild className="mt-1"><Link to="/explore">Explore dresses</Link></Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((item) => (
          <DressCard
            key={item.id}
            dress={item.dress}
            footer={
              <Button variant="ghost" size="sm" className="mt-3 w-full text-destructive" onClick={() => remove.mutate(item.dress.id)}>
                <Trash2 className="h-4 w-4" /> Remove
              </Button>
            }
          />
        ))}
      </div>
    </div>
  );
}
