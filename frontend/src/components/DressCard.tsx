import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SmartImage } from '@/components/ui/image';
import { cn, discountedPrice, formatCurrency } from '@/lib/utils';
import type { DressListItem } from '@/types';

interface Props {
  dress: DressListItem;
  confidence?: number;
  className?: string;
  footer?: React.ReactNode;
}

export function DressCard({ dress, confidence, className, footer }: Props) {
  const image = dress.images?.[0]?.url;
  const hasDiscount = dress.discountPct > 0;
  const price = discountedPrice(dress.basePrice, dress.discountPct);

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-md',
        className,
      )}
    >
      <Link to={`/dresses/${dress.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <SmartImage
            src={image}
            alt={dress.name}
            fallbackLabel={dress.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {confidence !== undefined && (
            <div className="absolute left-3 top-3">
              <Badge variant="gold" className="bg-black/70 text-gold backdrop-blur">
                {confidence}% match
              </Badge>
            </div>
          )}
          {hasDiscount && (
            <div className="absolute right-3 top-3">
              <Badge variant="destructive">-{dress.discountPct}%</Badge>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{dress.brand?.name}</p>
            <Link to={`/dresses/${dress.slug}`}>
              <h3 className="truncate font-medium leading-tight hover:text-primary">{dress.name}</h3>
            </Link>
          </div>
          {dress.ratingCount > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              {dress.ratingAvg.toFixed(1)}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-semibold">{formatCurrency(price)}</span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">{formatCurrency(dress.basePrice)}</span>
          )}
        </div>
        {footer}
      </div>
    </div>
  );
}
