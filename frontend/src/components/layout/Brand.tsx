import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Brand({ className, to = '/' }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn('group flex items-center gap-2.5', className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-primary text-white shadow-sm transition-transform group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12 3l2.2 3.7H9.8L12 3zm0 3l3.6 6c0 2.2-1.8 4-3.6 4s-3.6-1.8-3.6-4L12 6z" opacity="0.95" />
        </svg>
      </span>
      <span className="font-serif text-xl font-semibold tracking-tight">
        Style<span className="text-primary">Sense</span>
      </span>
    </Link>
  );
}
