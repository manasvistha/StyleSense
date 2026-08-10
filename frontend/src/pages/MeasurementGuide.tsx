import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Ruler, Sparkles, Info } from 'lucide-react';
import { MeasurementFigure } from '@/components/MeasurementFigure';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/misc';
import { api, apiErrorMessage } from '@/lib/api';
import type { BodyShapeResult } from '@/types';
import { toast } from 'sonner';

type Part = 'bust' | 'waist' | 'hip' | 'shoulder';

const steps: { key: Part; title: string; how: string }[] = [
  { key: 'bust', title: 'Bust', how: 'Measure around the fullest part of your chest, keeping the tape parallel to the floor.' },
  { key: 'waist', title: 'Waist', how: 'Measure around the narrowest part of your natural waist, usually just above the belly button.' },
  { key: 'hip', title: 'Hip', how: 'Measure around the fullest part of your hips and seat, feet together.' },
  { key: 'shoulder', title: 'Shoulder', how: 'Measure straight across the back from the edge of one shoulder to the other.' },
];

export default function MeasurementGuide() {
  const [active, setActive] = useState<Part>('bust');
  const [form, setForm] = useState({ bustCm: '', waistCm: '', hipCm: '', shoulderCm: '' });
  const [result, setResult] = useState<BodyShapeResult | null>(null);

  const analyze = useMutation({
    mutationFn: async () => {
      const payload = {
        bustCm: Number(form.bustCm),
        waistCm: Number(form.waistCm),
        hipCm: Number(form.hipCm),
        ...(form.shoulderCm ? { shoulderCm: Number(form.shoulderCm) } : {}),
      };
      return (await api.post('/body-shape/analyze', payload)).data.data.result as BodyShapeResult;
    },
    onSuccess: (data) => setResult(data),
    onError: (e) => toast.error(apiErrorMessage(e, 'Enter valid measurements (cm)')),
  });

  return (
    <div className="min-h-screen bg-[#FFECF0] dark:bg-background">
    <div className="container py-14">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="gold" className="mb-4"><Ruler className="h-3.5 w-3.5" /> Accuracy matters</Badge>
        <h1 className="font-serif text-4xl font-semibold">The measurement guide</h1>
        <p className="mt-3 text-muted-foreground text-balance">
          Accurate measurements are the single biggest factor in great recommendations. Follow the illustrated
          steps below — then preview your body shape instantly.
        </p>
      </div>

      <div className="mt-12 grid items-start gap-10 lg:grid-cols-2">
        {/* Illustration + steps */}
        <Card className="overflow-hidden">
          <CardContent className="grid gap-6 pt-6 sm:grid-cols-[auto,1fr]">
            <div className="flex justify-center rounded-2xl bg-secondary/40 p-4">
              <MeasurementFigure highlight={active} />
            </div>
            <div className="space-y-2">
              {steps.map((s) => (
                <button
                  key={s.key}
                  onMouseEnter={() => setActive(s.key)}
                  onFocus={() => setActive(s.key)}
                  onClick={() => setActive(s.key)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    active === s.key ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary'
                  }`}
                >
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.how}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live analyzer */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Preview your body shape</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">All values in centimetres.</p>

            <div className="mt-5 grid grid-cols-2 gap-4">
              {(['bustCm', 'waistCm', 'hipCm', 'shoulderCm'] as const).map((k) => (
                <div key={k} className="space-y-1.5">
                  <label className="text-sm font-medium capitalize">
                    {k.replace('Cm', '')} {k === 'shoulderCm' && <span className="text-muted-foreground">(optional)</span>}
                  </label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="cm"
                    value={form[k]}
                    onFocus={() => setActive(k.replace('Cm', '') as Part)}
                    onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            <Button
              className="mt-5 w-full"
              onClick={() => analyze.mutate()}
              disabled={analyze.isPending || !form.bustCm || !form.waistCm || !form.hipCm}
            >
              {analyze.isPending ? <Spinner className="h-4 w-4" /> : 'Analyze my shape'}
            </Button>

            {result && (
              <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Your body shape</span>
                  <Badge variant="default" className="text-sm">{result.name}</Badge>
                </div>
                <p className="mt-3 flex gap-2 text-sm">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {result.reason}
                </p>
                {result.stylingTips && (
                  <p className="mt-3 text-sm text-muted-foreground"><strong>Styling tip:</strong> {result.stylingTips}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="muted">Waist/Bust {result.ratios.waistToBust}</Badge>
                  <Badge variant="muted">Bust/Hip {result.ratios.bustToHip}</Badge>
                  <Badge variant="muted">Waist/Hip {result.ratios.waistToHip}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
}
