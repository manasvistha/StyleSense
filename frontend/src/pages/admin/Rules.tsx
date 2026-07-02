import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Save, Settings2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider, Switch, Spinner } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/skeleton';
import { api, apiErrorMessage } from '@/lib/api';
import { toast } from 'sonner';

interface Rule {
  id: string;
  factorKey: string;
  label: string;
  description: string | null;
  weight: number;
  isActive: boolean;
}
interface Normalized {
  factorKey: string;
  effectivePercent: number;
}

export default function AdminRules() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-rules'],
    queryFn: async () => {
      const res = await api.get('/admin/rules');
      return { rules: res.data.data.rules as Rule[], normalized: res.data.data.normalized as Normalized[] };
    },
  });

  const [draft, setDraft] = useState<Record<string, { weight: number; isActive: boolean }>>({});
  useEffect(() => {
    if (data) {
      const next: Record<string, { weight: number; isActive: boolean }> = {};
      for (const r of data.rules) next[r.factorKey] = { weight: r.weight, isActive: r.isActive };
      setDraft(next);
    }
  }, [data]);

  // Live preview of normalized percentages based on the working draft.
  const activeSum = Object.values(draft).filter((d) => d.isActive).reduce((s, d) => s + d.weight, 0) || 1;

  const update = useMutation({
    mutationFn: async (rule: Rule) =>
      api.patch(`/admin/rules/${rule.factorKey}`, {
        weight: draft[rule.factorKey]?.weight,
        isActive: draft[rule.factorKey]?.isActive,
      }),
    onSuccess: () => toast.success('Rule updated'),
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const saveAll = useMutation({
    mutationFn: async () => {
      if (!data) return;
      await Promise.all(
        data.rules.map((r) =>
          api.patch(`/admin/rules/${r.factorKey}`, {
            weight: draft[r.factorKey]?.weight,
            isActive: draft[r.factorKey]?.isActive,
          }),
        ),
      );
    },
    onSuccess: () => {
      toast.success('All weights saved — the engine will use them on the next run.');
      qc.invalidateQueries({ queryKey: ['admin-rules'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const reset = useMutation({
    mutationFn: async () => api.post('/admin/rules/reset'),
    onSuccess: () => {
      toast.success('Reset to default weights');
      qc.invalidateQueries({ queryKey: ['admin-rules'] });
    },
  });

  if (isLoading || !data) {
    return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-3xl font-semibold">
            <Settings2 className="h-7 w-7 text-primary" /> Recommendation rules
          </h1>
          <p className="text-muted-foreground">Tune how much each factor influences the match score.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => reset.mutate()} disabled={reset.isPending}>
            <RotateCcw className="h-4 w-4" /> Reset defaults
          </Button>
          <Button onClick={() => saveAll.mutate()} disabled={saveAll.isPending}>
            {saveAll.isPending ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />} Save all
          </Button>
        </div>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex gap-3 pt-6 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Weights don’t need to sum to 100%. The engine <strong>re-normalizes active weights automatically</strong>,
            so the percentages on the right always reflect the true influence on every recommendation.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {data.rules.map((rule) => {
          const d = draft[rule.factorKey] ?? { weight: rule.weight, isActive: rule.isActive };
          const effective = d.isActive ? Math.round((d.weight / activeSum) * 100) : 0;
          return (
            <Card key={rule.id} className={d.isActive ? '' : 'opacity-60'}>
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{rule.label}</CardTitle>
                <div className="flex items-center gap-3">
                  <Badge variant={d.isActive ? 'default' : 'muted'}>{effective}% effective</Badge>
                  <Switch
                    checked={d.isActive}
                    onCheckedChange={(v) =>
                      setDraft((s) => ({ ...s, [rule.factorKey]: { ...d, isActive: v } }))
                    }
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{rule.description}</p>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[d.weight]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={([v]) => setDraft((s) => ({ ...s, [rule.factorKey]: { ...d, weight: v } }))}
                    className="flex-1"
                  />
                  <span className="w-12 text-right text-sm font-medium tabular-nums">{d.weight.toFixed(2)}</span>
                  <Button size="sm" variant="ghost" onClick={() => update.mutate(rule)}>Save</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
