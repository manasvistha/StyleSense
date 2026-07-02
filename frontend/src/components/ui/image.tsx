import { useState } from 'react';
import { Shirt } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Optional label shown on the fallback placeholder (e.g. the dress name). */
  fallbackLabel?: string;
}

/**
 * Image that degrades gracefully: if the source fails to load (e.g. a dead
 * Unsplash photo) it shows an elegant rose-gold placeholder instead of a
 * broken-image icon — so the catalogue always looks intentional.
 */
export function SmartImage({ src, alt, className, fallbackLabel, ...props }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-secondary to-muted text-muted-foreground',
          className,
        )}
      >
        <Shirt className="h-8 w-8 text-primary/40" />
        {fallbackLabel && (
          <span className="max-w-[80%] truncate px-2 text-center text-xs font-medium">{fallbackLabel}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={className}
      {...props}
    />
  );
}
