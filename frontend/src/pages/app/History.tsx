import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Clock, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfidenceRing } from '@/components/recommend/ConfidenceRing';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { RecommendationRun } from '@/types';

export default function History() {
  const { data, isLoading } = useQuery({
    queryKey: ['rec-history'],
    queryFn: async () => (await api.get('/recommendations/history?limit=20')).data.data.runs as RecommendationRun[],
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Recommendation history</h1>
        <p className="text-muted-foreground">Revisit every run, with the inputs and reasons preserved.</p>
      </div>

      {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}

      {data && data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No recommendation runs yet</p>
            <p className="text-sm text-muted-foreground">Generate your first set of matches to see them here.</p>
            <Button asChild className="mt-2"><Link to="/app">Generate now</Link></Button>
          </CardContent>
        </Card>
      )}

      {data?.map((run) => (
        <Link key={run.id} to={`/app/history/${run.id}`}>
          <Card className="transition-colors hover:border-primary">
            <CardContent className="flex items-center gap-5 py-5">
              <ConfidenceRing value={run.topConfidence} />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" /> {formatDate(run.createdAt)}
                </div>
                <p className="mt-1 font-medium">{run.resultCount} dresses recommended</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {run.bodyShape && <Badge variant="muted">{run.bodyShape.name}</Badge>}
                  {run.selectedDress && <Badge variant="success">Chose: {run.selectedDress.name}</Badge>}
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
