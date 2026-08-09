import { motion } from 'framer-motion';
import { Sparkles, Shapes, Ruler, CalendarHeart, Target, Info } from 'lucide-react';
import { ConfidenceRing } from './ConfidenceRing';
import type { Recommendation, Profile, Lookup, ProfileCompleteness } from '@/types';
import { estimateSize } from '@/lib/utils';

interface Props {
  recommendations: Recommendation[];
  profile?: Profile | null;
  occasions?: Lookup[];
  completeness?: ProfileCompleteness;
}

/**
 * The hero summary card on the results page — distils the whole run into five
 * glanceable facts: detected body shape, confidence, recommended size, top
 * occasion and the overall confidence ring.
 */
export function RecommendationSummary({ recommendations, profile, occasions = [], completeness }: Props) {
  const top = recommendations[0];
  const confidence = top?.confidence ?? 0;
  const m = profile?.measurements;
  const shape = m?.bodyShape?.name ?? 'Not detected';
  const size = estimateSize(m?.bustCm, m?.waistCm);
  const topOccasion = occasions[0]?.name ?? top?.dress.occasions?.[0]?.name ?? 'Versatile';

  const facts = [
    { icon: Shapes, label: 'Detected body shape', value: shape },
    { icon: Ruler, label: 'Recommended size', value: size, hint: 'estimated' },
    { icon: CalendarHeart, label: 'Top occasion', value: topOccasion },
    { icon: Target, label: 'Matches found', value: String(recommendations.length) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="surface relative overflow-hidden p-6 sm:p-8"
    >
      {/* decorative wash */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center">
        <div className="flex items-center gap-5">
          <div className="text-primary">
            <ConfidenceRing value={confidence} size={104} />
          </div>
          <div>
            <p className="eyebrow"><Sparkles className="h-3.5 w-3.5" /> Your style analysis</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold sm:text-3xl">Curated for you</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {confidence >= 70
                ? 'We found strong matches based on your measurements, shape and preferences.'
                : 'Here are your closest matches — refine your preferences for tighter results.'}
            </p>
            {/* Confidence is shrunk toward neutral when the profile is thin, so
                say why rather than presenting an unearned percentage. */}
            {completeness?.isLowConfidence && (
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Scored on {Math.round(completeness.coverage * 100)}% of our matching signals — confidence is held
                back until we know more.
              </p>
            )}
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="bg-card p-4">
              <f.icon className="h-4 w-4 text-primary" />
              <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{f.label}</p>
              <p className="mt-0.5 truncate text-lg font-semibold" title={f.value}>
                {f.value}
                {f.hint && <span className="ml-1 align-middle text-[10px] font-normal text-muted-foreground">({f.hint})</span>}
              </p>
            </div>
          ))}
        </div>
      </div>

      {completeness && completeness.missing.length > 0 && (
        <div className="relative mt-6 rounded-2xl border border-dashed border-border bg-muted/30 p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Info className="h-3.5 w-3.5" /> Improve these results
          </p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {completeness.missing.map((m) => (
              <li key={m.factor} className="text-sm text-muted-foreground">
                • {m.action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
