import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'NPR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function discountedPrice(base: number, discountPct: number): number {
  return Math.round(base * (1 - discountPct / 100));
}

export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** Maps a confidence score to a tailwind colour token + label. */
export function confidenceTier(confidence: number): { label: string; color: string } {
  if (confidence >= 85) return { label: 'Excellent match', color: 'text-success' };
  if (confidence >= 70) return { label: 'Strong match', color: 'text-primary' };
  if (confidence >= 55) return { label: 'Good match', color: 'text-gold-deep dark:text-gold-soft' };
  return { label: 'Fair match', color: 'text-muted-foreground' };
}

/**
 * Estimates a standard dress size from bust + waist measurements (cm).
 * A transparent heuristic — surfaced as an *estimate* in the UI, never as truth.
 */
export function estimateSize(bustCm?: number | null, waistCm?: number | null): string {
  if (!bustCm) return '—';
  const bands: [number, string][] = [
    [80, 'XS'],
    [88, 'S'],
    [96, 'M'],
    [104, 'L'],
    [114, 'XL'],
  ];
  let size = 'XXL';
  for (const [max, label] of bands) {
    if (bustCm <= max) { size = label; break; }
  }
  return size;
}

/** Body Mass Index from height (cm) + weight (kg). */
export function bmi(heightCm?: number | null, weightKg?: number | null): number | null {
  if (!heightCm || !weightKg) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function bmiLabel(value: number | null): string {
  if (value == null) return '—';
  if (value < 18.5) return 'Underweight';
  if (value < 25) return 'Healthy';
  if (value < 30) return 'Overweight';
  return 'Higher';
}
