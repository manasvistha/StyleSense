import { AlertTriangle, Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FactorScore } from '@/types';

interface Props {
  factors: FactorScore[];
  /** Negative signals worth stating plainly rather than hiding. */
  caveats?: string[];
}

/**
 * The "Why this recommendation?" panel — renders the full per-factor breakdown
 * so the score is transparent and defensible, not a black box.
 *
 * Factors the profile holds no data for are listed separately as prompts rather
 * than shown as scored results, so an empty preference never looks like a
 * half-marked match.
 */
export function WhyPanel({ factors, caveats = [] }: Props) {
  const scored = factors.filter((f) => f.applicable).sort((a, b) => b.contribution - a.contribution);
  const dormant = factors.filter((f) => !f.applicable);

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Why this recommendation?
      </p>
      <div className="space-y-2.5">
        {scored.map((f) => (
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

      {caveats.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-warning">
            <AlertTriangle className="h-3.5 w-3.5" /> Worth knowing
          </p>
          <ul className="mt-1.5 space-y-1">
            {caveats.map((c) => (
              <li key={c} className="text-xs text-muted-foreground">
                {c.replace(/^!\s*/, '')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {dormant.length > 0 && (
        <div className="rounded-lg border border-dashed border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">Not scored — we need more from you</p>
          <ul className="mt-1.5 space-y-1">
            {dormant.map((f) => (
              <li key={f.key} className="text-xs text-muted-foreground">
                {f.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="pt-1 text-xs text-muted-foreground">
        Each scored factor contributes <em>sub-score × weight</em> to the overall confidence. Weights are
        redistributed across the factors we can actually judge.
      </p>
    </div>
  );
}
