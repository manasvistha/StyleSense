import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfidenceRing } from '@/components/recommend/ConfidenceRing';
import { WhyPanel } from '@/components/recommend/WhyPanel';
import { api } from '@/lib/api';
import { formatDate, discountedPrice, formatCurrency } from '@/lib/utils';
import type { RecommendationRun } from '@/types';

export default function HistoryDetail() {
  const { id } = useParams();
  const { data: run, isLoading } = useQuery({
    queryKey: ['rec-run', id],
    queryFn: async () => (await api.get(`/recommendations/history/${id}`)).data.data.run as RecommendationRun,
  });

  if (isLoading) return <div className="mx-auto max-w-4xl"><Skeleton className="h-64" /></div>;
  if (!run) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/app/history" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to history
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Run from {formatDate(run.createdAt)}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {run.bodyShape && <Badge variant="muted">{run.bodyShape.name} shape</Badge>}
            <Badge variant="muted">{run.resultCount} results</Badge>
            <Badge>Top {run.topConfidence}%</Badge>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {run.items.map((item) => {
          const image = item.dress.images?.[0]?.url;
          const isChosen = run.selectedDress?.id === item.dress.id;
          return (
            <Card key={item.dress.id} className={isChosen ? 'border-primary ring-2 ring-primary/20' : ''}>
              <CardContent className="grid gap-5 py-5 sm:grid-cols-[120px,1fr,1.2fr]">
                <Link to={`/dresses/${item.dress.slug}`} className="block aspect-[3/4] overflow-hidden rounded-xl bg-muted">
                  {image && <img src={image} alt={item.dress.name} className="h-full w-full object-cover" />}
                </Link>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{item.dress.brand?.name}</p>
                  <Link to={`/dresses/${item.dress.slug}`} className="font-medium hover:text-primary">{item.dress.name}</Link>
                  <p className="mt-1 text-sm">{formatCurrency(discountedPrice(item.dress.basePrice, item.dress.discountPct))}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <ConfidenceRing value={item.confidence} size={48} />
                    {isChosen && <Badge variant="success"><Check className="h-3 w-3" /> You chose this</Badge>}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <WhyPanel factors={item.factors} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
