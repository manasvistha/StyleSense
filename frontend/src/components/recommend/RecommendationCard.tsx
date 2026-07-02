import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Heart, Check } from 'lucide-react';
import { ConfidenceRing } from './ConfidenceRing';
import { WhyPanel } from './WhyPanel';
import { SmartImage } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, confidenceTier, discountedPrice, formatCurrency } from '@/lib/utils';
import type { Recommendation } from '@/types';

interface Props {
  rec: Recommendation;
  selected?: boolean;
  onSelect?: () => void;
  onWishlist?: () => void;
}

export function RecommendationCard({ rec, selected, onSelect, onWishlist }: Props) {
  const [open, setOpen] = useState(false);
  const { dress, confidence, reasons, factors } = rec;
  const tier = confidenceTier(confidence);
  const image = dress.images?.[0]?.url;
  const price = discountedPrice(dress.basePrice, dress.discountPct);

  return (
    <div className={cn('overflow-hidden rounded-2xl border bg-card shadow-soft transition-all hover:shadow-soft-md', selected ? 'border-primary ring-2 ring-primary/30' : 'border-border/70')}>
      <div className="grid sm:grid-cols-[200px,1fr]">
        <Link to={`/dresses/${dress.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-muted sm:aspect-auto">
          <SmartImage src={image} alt={dress.name} fallbackLabel={dress.name} className="h-full w-full object-cover" />
        </Link>

        <div className="flex flex-col p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{dress.brand?.name}</p>
              <Link to={`/dresses/${dress.slug}`}>
                <h3 className="font-serif text-xl font-semibold leading-tight hover:text-primary">{dress.name}</h3>
              </Link>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-semibold">{formatCurrency(price)}</span>
                {dress.discountPct > 0 && (
                  <span className="text-sm text-muted-foreground line-through">{formatCurrency(dress.basePrice)}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <ConfidenceRing value={confidence} />
              <span className={cn('mt-1 text-xs font-medium', tier.color)}>{tier.label}</span>
            </div>
          </div>

          {/* Reasons */}
          <ul className="mt-3 space-y-1">
            {reasons.slice(0, 4).map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                <span>{r.replace(/^✔\s*/, '')}</span>
              </li>
            ))}
          </ul>

          {/* Why panel toggle */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="mt-3 flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Why this recommendation?
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
          </button>
          {open && (
            <div className="mt-3 rounded-xl border border-border bg-secondary/30 p-4">
              <WhyPanel factors={factors} />
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 pt-1">
            {onSelect && (
              <Button size="sm" variant={selected ? 'default' : 'outline'} onClick={onSelect}>
                {selected ? (
                  <>
                    <Check className="h-4 w-4" /> Selected
                  </>
                ) : (
                  'I’d wear this'
                )}
              </Button>
            )}
            {onWishlist && (
              <Button size="sm" variant="ghost" onClick={onWishlist}>
                <Heart className="h-4 w-4" /> Save
              </Button>
            )}
            {dress.recommendationTags?.[0] && <Badge variant="muted">{dress.recommendationTags[0]}</Badge>}
          </div>
        </div>
      </div>
    </div>
  );
}
