import type { ReactNode } from 'react';
import { Brand } from '@/components/layout/Brand';

const highlights = [
  'Explainable, confidence-scored matches',
  'Automatic body-shape detection',
  'Size-accurate, budget-aware results',
];

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand / visual side */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary to-[#3a0d1d] p-12 text-primary-foreground lg:flex">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <Brand className="[&_span]:text-white" />
        <div className="relative max-w-md">
          <h2 className="font-serif text-4xl font-semibold leading-tight">
            Styling that understands your shape, size and story.
          </h2>
          <ul className="mt-8 space-y-3">
            {highlights.map((h) => (
              <li key={h} className="flex items-center gap-3 text-primary-foreground/90">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/30 text-gold">✓</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-primary-foreground/70">Final-year thesis · Explainable recommendation system</p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>
          <h1 className="font-serif text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground/90">{label}</label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
