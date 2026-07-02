import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FactorScore } from '@/types';

/**
 * The "Why this recommendation?" panel — renders the full per-factor breakdown
 * so the score is transparent and defensible, not a black box.
 */
export function WhyPanel({ factors }: { factors: FactorScore[] }) {
  const sorted = [...factors].sort((a, b) => b.contribution - a.contribution);

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Why this recommendation?
      </p>
      <div className="space-y-2.5">
        {sorted.map((f) => (
          <div key={f.key}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full',
                    f.matched ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {f.matched ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                </span>
                <span className={cn(f.matched ? 'text-foreground' : 'text-muted-foreground')}>{f.label}</span>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {Math.round(f.subScore * 100)}% × {Math.round(f.weight * 100)}%
              </span>
            </div>
            {/* Contribution bar */}
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full', f.matched ? 'bg-success' : 'bg-primary/40')}
                style={{ width: `${Math.min(100, (f.contribution / Math.max(0.0001, f.weight)) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="pt-1 text-xs text-muted-foreground">
        Each factor contributes <em>sub-score × weight</em> to the overall confidence.
      </p>
    </div>
  );
}
