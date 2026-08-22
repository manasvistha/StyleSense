import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles, ArrowRight, ArrowLeft, User, Ruler, Palette, Wallet,
  ClipboardCheck, RotateCcw, SlidersHorizontal, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChipSelect } from '@/components/ChipSelect';
import { WizardStepper } from '@/components/recommend/WizardStepper';
import { RecommendationSummary } from '@/components/recommend/RecommendationSummary';
import { RecommendationCard } from '@/components/recommend/RecommendationCard';
import { useCatalog } from '@/hooks/useCatalog';
import { api, apiErrorMessage } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { Profile, Lookup, RecommendationResponse } from '@/types';

const STEPS = [
  { title: 'Basics', icon: User },
  { title: 'Measurements', icon: Ruler },
  { title: 'Preferences', icon: Palette },
  { title: 'Budget & Occasion', icon: Wallet },
  { title: 'Review', icon: ClipboardCheck },
];

const SKIN_TONES = ['FAIR', 'LIGHT', 'MEDIUM', 'TAN', 'DEEP'] as const;

/** Server-side accepted ranges — mirrored client-side for instant feedback. */
const RANGES = {
  age: [18, 35], heightCm: [120, 220], weightKg: [30, 200],
  bustCm: [50, 180], waistCm: [40, 170], hipCm: [50, 190], shoulderCm: [25, 70],
} as const;

/** Returns an inline error message for a value against its range, or ''. */
function rangeError(raw: string, key: keyof typeof RANGES, required = true): string {
  if (!raw) return required ? 'Required' : '';
  const n = Number(raw);
  const [min, max] = RANGES[key];
  if (Number.isNaN(n)) return 'Enter a number';
  if (n < min || n > max) return `Must be between ${min} and ${max}`;
  return '';
}

interface FormState {
  fullName: string;
  phone: string;
  age: string;
  skinTone: string;
  heightCm: string;
  weightKg: string;
  bustCm: string;
  waistCm: string;
  hipCm: string;
  shoulderCm: string;
  preferredColorIds: Set<string>;
  preferredStyleIds: Set<string>;
  favoriteBrandIds: Set<string>;
  budgetMin: number;
  budgetMax: number;
  favoriteOccasionIds: Set<string>;
  categoryId: string;
}

const emptyForm: FormState = {
  fullName: '', phone: '', age: '', skinTone: '',
  heightCm: '', weightKg: '', bustCm: '', waistCm: '', hipCm: '', shoulderCm: '',
  preferredColorIds: new Set(), preferredStyleIds: new Set(), favoriteBrandIds: new Set(),
  budgetMin: 0, budgetMax: 50000, favoriteOccasionIds: new Set(), categoryId: '',
};

export default function Recommend() {
  const qc = useQueryClient();
  const { data: catalog } = useCatalog();
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await api.get('/profile')).data.data.profile as Profile,
  });

  const [view, setView] = useState<'wizard' | 'results'>('wizard');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [selectedDress, setSelectedDress] = useState<string | null>(null);

  // Prefill from the saved profile once it loads.
  useEffect(() => {
    if (!profile) return;
    const m = profile.measurements;
    const p = profile.preferences;
    setForm((f) => ({
      ...f,
      fullName: profile.fullName ?? '',
      phone: profile.phone ?? '',
      age: m?.age ? String(m.age) : '',
      skinTone: m?.skinTone ?? '',
      heightCm: m?.heightCm ? String(m.heightCm) : '',
      weightKg: m?.weightKg ? String(m.weightKg) : '',
      bustCm: m?.bustCm ? String(m.bustCm) : '',
      waistCm: m?.waistCm ? String(m.waistCm) : '',
      hipCm: m?.hipCm ? String(m.hipCm) : '',
      shoulderCm: m?.shoulderCm ? String(m.shoulderCm) : '',
      preferredColorIds: new Set(p?.preferredColors.map((c) => c.id) ?? []),
      preferredStyleIds: new Set(p?.preferredStyles.map((s) => s.id) ?? []),
      favoriteBrandIds: new Set(p?.favoriteBrands.map((b) => b.id) ?? []),
      budgetMin: p?.budgetMin ?? 0,
      budgetMax: p?.budgetMax ?? 50000,
      favoriteOccasionIds: new Set(p?.favoriteOccasions.map((o) => o.id) ?? []),
    }));
  }, [profile]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleSet = (key: 'preferredColorIds' | 'preferredStyleIds' | 'favoriteBrandIds' | 'favoriteOccasionIds') =>
    (id: string) =>
      setForm((f) => {
        const next = new Set(f[key]);
        if (next.has(id)) next.delete(id); else next.add(id);
        return { ...f, [key]: next };
      });

  const stepValid = useMemo(() => {
    switch (step) {
      case 0:
        return form.fullName.trim().length >= 2 && !rangeError(form.age, 'age');
      case 1:
        return (
          !rangeError(form.heightCm, 'heightCm') &&
          !rangeError(form.weightKg, 'weightKg') &&
          !rangeError(form.bustCm, 'bustCm') &&
          !rangeError(form.waistCm, 'waistCm') &&
          !rangeError(form.hipCm, 'hipCm') &&
          !rangeError(form.shoulderCm, 'shoulderCm', false)
        );
      case 3:
        return form.budgetMax >= form.budgetMin;
      default:
        return true;
    }
  }, [step, form]);

  const generate = useMutation({
    mutationFn: async () => {
      // 1. Persist the profile the wizard collected
      await api.patch('/profile', { fullName: form.fullName, phone: form.phone || '' });
      await api.put('/profile/measurements', {
        age: +form.age, heightCm: +form.heightCm, weightKg: +form.weightKg,
        bustCm: +form.bustCm, waistCm: +form.waistCm, hipCm: +form.hipCm,
        ...(form.shoulderCm ? { shoulderCm: +form.shoulderCm } : {}),
        ...(form.skinTone ? { skinTone: form.skinTone } : {}),
      });
      await api.put('/profile/preferences', {
        budgetMin: form.budgetMin, budgetMax: form.budgetMax,
        preferredColorIds: [...form.preferredColorIds],
        preferredStyleIds: [...form.preferredStyleIds],
        favoriteBrandIds: [...form.favoriteBrandIds],
        favoriteOccasionIds: [...form.favoriteOccasionIds],
      });
      // 2. Generate against the freshly-saved profile
      const body = {
        occasionIds: [...form.favoriteOccasionIds],
        ...(form.categoryId ? { categoryId: form.categoryId } : {}),
        limit: 12,
      };
      return (await api.post('/recommendations/generate', body)).data.data as RecommendationResponse;
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ['profile'] });
      setResult(data);
      setSelectedDress(null);
      setView('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (data.recommendations.length === 0) toast.info('No matches found — try widening your filters.');
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const select = useMutation({
    mutationFn: async (dressId: string) => {
      if (!result?.historyId) return;
      await api.post(`/recommendations/history/${result.historyId}/select`, { dressId });
    },
    onSuccess: (_d, dressId) => {
      setSelectedDress(dressId);
      toast.success('Saved your choice — it helps improve future matches.');
    },
  });

  const addWishlist = async (dressId: string) => {
    try {
      await api.post(`/wishlist/${dressId}`);
      toast.success('Added to wishlist');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const next = () => (step < STEPS.length - 1 ? setStep((s) => s + 1) : generate.mutate());
  const back = () => setStep((s) => Math.max(0, s - 1));

  const selectedOccasions = (catalog?.occasions ?? []).filter((o) => form.favoriteOccasionIds.has(o.id));

  // ── Results view ────────────────────────────────────────
  if (view === 'results' && result) {
    return (
      <div className="mx-auto max-w-6xl space-y-8">
        <RecommendationSummary
          recommendations={result.recommendations}
          profile={profile}
          occasions={selectedOccasions}
          completeness={result.completeness}
        />

        {/* Say plainly what was ruled out, rather than silently shrinking the list. */}
        {result.excludedCount > 0 && (
          <div className="surface flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {result.excludedCount} {result.excludedCount === 1 ? 'dress' : 'dresses'} ruled out:
            </span>
            {result.excludedReasons.map((r) => (
              <span key={r.reason}>
                {r.reason.toLowerCase()} ({r.count})
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-semibold">
              {result.recommendations.length} dresses, ranked by fit
            </h2>
            <p className="text-sm text-muted-foreground">Every match is scored and fully explained below.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setView('wizard'); setStep(2); }}>
              <SlidersHorizontal className="h-4 w-4" /> Refine
            </Button>
            <Button variant="ghost" onClick={() => { setView('wizard'); setStep(0); }}>
              <RotateCcw className="h-4 w-4" /> Start over
            </Button>
          </div>
        </div>

        {result.recommendations.length === 0 ? (
          <div className="surface p-12 text-center text-muted-foreground">
            No dresses matched this run. Try removing a filter or widening your budget.
          </div>
        ) : (
          <div className="grid gap-5">
            {result.recommendations.map((rec, i) => (
              <motion.div
                key={rec.dress.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.4) }}
              >
                <RecommendationCard
                  rec={rec}
                  selected={selectedDress === rec.dress.id}
                  onSelect={() => select.mutate(rec.dress.id)}
                  onWishlist={() => addWishlist(rec.dress.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Wizard view ─────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <p className="eyebrow justify-center"><Sparkles className="h-3.5 w-3.5" /> Style analysis</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">Let's find your perfect dress</h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Five quick steps. We use your measurements and taste to score every dress and explain why.
        </p>
      </div>

      <div className="mb-8 px-1">
        <WizardStepper steps={STEPS} current={step} onJump={(i) => i < step && setStep(i)} />
      </div>

      <div className="surface p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 && <StepBasics form={form} set={set} />}
            {step === 1 && <StepMeasurements form={form} set={set} />}
            {step === 2 && (
              <StepPreferences
                form={form} catalog={catalog}
                toggleColor={toggleSet('preferredColorIds')}
                toggleStyle={toggleSet('preferredStyleIds')}
                toggleBrand={toggleSet('favoriteBrandIds')}
              />
            )}
            {step === 3 && (
              <StepBudget form={form} set={set} catalog={catalog} toggleOccasion={toggleSet('favoriteOccasionIds')} />
            )}
            {step === 4 && <StepReview form={form} catalog={catalog} />}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <Button variant="ghost" onClick={back} disabled={step === 0} className={cn(step === 0 && 'invisible')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <span className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
          <Button variant="gold" onClick={next} disabled={!stepValid || generate.isPending}>
            {step === STEPS.length - 1 ? (
              generate.isPending ? <>Scoring dresses…</> : <><Sparkles className="h-4 w-4" /> Generate</>
            ) : (
              <>Continue <ArrowRight className="h-4 w-4" /></>
            )}
          </Button>
        </div>
      </div>

      {generate.isPending && (
        <p className="mt-4 text-center text-sm text-muted-foreground">Saving your profile and scoring the catalog…</p>
      )}
    </div>
  );
}

// ── Step components ───────────────────────────────────────
type SetFn = <K extends keyof FormState>(key: K, value: FormState[K]) => void;

function StepHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-serif text-2xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

function NumberField({
  label, value, onChange, unit, placeholder, error, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  unit?: string; placeholder?: string; error?: string; hint?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <div className="relative">
        <Input
          type="number" inputMode="decimal" value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(unit && 'pr-14', error && 'border-destructive focus-visible:ring-destructive/40')}
        />
        {unit && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{unit}</span>}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function StepBasics({ form, set }: { form: FormState; set: SetFn }) {
  return (
    <div>
      <StepHeader title="Tell us about you" hint="The essentials we use to tailor age-appropriate picks." />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label className="mb-1.5 block">Full name</Label>
          <Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Your name" />
        </div>
        <NumberField label="Age" value={form.age} onChange={(v) => set('age', v)} unit="yrs" placeholder="18–35"
          error={rangeError(form.age, 'age')} />
        <div>
          <Label className="mb-1.5 block">Phone <span className="text-muted-foreground">(optional)</span></Label>
          <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+977…" />
        </div>
        <div className="sm:col-span-2">
          <Label className="mb-2 block">Skin tone <span className="text-muted-foreground">(optional — helps colour matching)</span></Label>
          <div className="flex flex-wrap gap-2">
            {SKIN_TONES.map((t) => (
              <button
                key={t} type="button" onClick={() => set('skinTone', form.skinTone === t ? '' : t)}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm capitalize transition-colors',
                  form.skinTone === t ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-secondary',
                )}
              >
                {t.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepMeasurements({ form, set }: { form: FormState; set: SetFn }) {
  return (
    <div>
      <StepHeader title="Your measurements" hint="Used to detect your body shape and recommend a size. All in centimetres." />
      <div className="grid gap-5 sm:grid-cols-2">
        <NumberField label="Height" value={form.heightCm} onChange={(v) => set('heightCm', v)} unit="cm"
          placeholder="120–220" error={rangeError(form.heightCm, 'heightCm')} />
        <NumberField label="Weight" value={form.weightKg} onChange={(v) => set('weightKg', v)} unit="kg"
          placeholder="30–200" error={rangeError(form.weightKg, 'weightKg')} />
        <NumberField label="Bust" value={form.bustCm} onChange={(v) => set('bustCm', v)} unit="cm"
          placeholder="50–180" error={rangeError(form.bustCm, 'bustCm')} />
        <NumberField label="Waist" value={form.waistCm} onChange={(v) => set('waistCm', v)} unit="cm"
          placeholder="40–170" error={rangeError(form.waistCm, 'waistCm')} />
        <NumberField label="Hip" value={form.hipCm} onChange={(v) => set('hipCm', v)} unit="cm"
          placeholder="50–190" error={rangeError(form.hipCm, 'hipCm')} />
        <NumberField label="Shoulder (optional)" value={form.shoulderCm} onChange={(v) => set('shoulderCm', v)} unit="cm"
          placeholder="25–70" error={rangeError(form.shoulderCm, 'shoulderCm', false)} />
      </div>
      <Link to="/measurement-guide" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
        Not sure how to measure? Read the guide →
      </Link>
    </div>
  );
}

function StepPreferences({
  form, catalog, toggleColor, toggleStyle, toggleBrand,
}: {
  form: FormState; catalog: ReturnType<typeof useCatalog>['data'];
  toggleColor: (id: string) => void; toggleStyle: (id: string) => void; toggleBrand: (id: string) => void;
}) {
  return (
    <div>
      <StepHeader title="Your taste" hint="Pick what you love — leave blank to keep things open." />
      <div className="space-y-6">
        <div>
          <Label className="mb-2 block">Preferred colours</Label>
          <ChipSelect options={catalog?.colors ?? []} selected={form.preferredColorIds} onToggle={toggleColor} />
        </div>
        <div>
          <Label className="mb-2 block">Styles</Label>
          <ChipSelect options={catalog?.styles ?? []} selected={form.preferredStyleIds} onToggle={toggleStyle} />
        </div>
        <div>
          <Label className="mb-2 block">Favourite brands</Label>
          <ChipSelect options={catalog?.brands ?? []} selected={form.favoriteBrandIds} onToggle={toggleBrand} />
        </div>
      </div>
    </div>
  );
}

function StepBudget({
  form, set, catalog, toggleOccasion,
}: {
  form: FormState; set: SetFn; catalog: ReturnType<typeof useCatalog>['data']; toggleOccasion: (id: string) => void;
}) {
  return (
    <div>
      <StepHeader title="Budget & occasion" hint="Where you'll wear it, and what you'd like to spend." />
      <div className="space-y-6">
        <div>
          <Label className="mb-2 block">Occasions</Label>
          <ChipSelect options={catalog?.occasions ?? []} selected={form.favoriteOccasionIds} onToggle={toggleOccasion} />
        </div>
        <div>
          <Label className="mb-2 block">Category <span className="text-muted-foreground">(optional)</span></Label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button" onClick={() => set('categoryId', '')}
              className={cn('rounded-full border px-4 py-1.5 text-sm transition-colors',
                form.categoryId === '' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-secondary')}
            >Any</button>
            {catalog?.categories.map((c) => (
              <button
                key={c.id} type="button" onClick={() => set('categoryId', c.id)}
                className={cn('rounded-full border px-4 py-1.5 text-sm transition-colors',
                  form.categoryId === c.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-secondary')}
              >{c.name}</button>
            ))}
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField label="Min budget" value={String(form.budgetMin)} onChange={(v) => set('budgetMin', +v || 0)} unit="NPR" />
          <NumberField label="Max budget" value={String(form.budgetMax)} onChange={(v) => set('budgetMax', +v || 0)} unit="NPR" />
        </div>
        <p className="text-sm text-muted-foreground">
          Range: <span className="font-medium text-foreground">{formatCurrency(form.budgetMin)}</span> – <span className="font-medium text-foreground">{formatCurrency(form.budgetMax)}</span>
        </p>
      </div>
    </div>
  );
}

function StepReview({ form, catalog }: { form: FormState; catalog: ReturnType<typeof useCatalog>['data'] }) {
  const names = (ids: Set<string>, pool: Lookup[] = []) =>
    pool.filter((x) => ids.has(x.id)).map((x) => x.name).join(', ') || '—';

  const rows: { label: string; value: string }[] = [
    { label: 'Name', value: form.fullName || '—' },
    { label: 'Age', value: form.age ? `${form.age} yrs` : '—' },
    { label: 'Measurements', value: `${form.bustCm || '—'} · ${form.waistCm || '—'} · ${form.hipCm || '—'} cm (B·W·H)` },
    { label: 'Colours', value: names(form.preferredColorIds, catalog?.colors) },
    { label: 'Styles', value: names(form.preferredStyleIds, catalog?.styles) },
    { label: 'Brands', value: names(form.favoriteBrandIds, catalog?.brands) },
    { label: 'Occasions', value: names(form.favoriteOccasionIds, catalog?.occasions) },
    { label: 'Budget', value: `${formatCurrency(form.budgetMin)} – ${formatCurrency(form.budgetMax)}` },
  ];

  return (
    <div>
      <StepHeader title="Review & generate" hint="Confirm your details — we'll save them and score the catalogue." />
      <div className="divide-y divide-border rounded-xl border border-border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 px-4 py-3">
            <span className="text-sm text-muted-foreground">{r.label}</span>
            <span className="max-w-[60%] text-right text-sm font-medium">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/5 p-4 text-sm text-muted-foreground">
        <Check className="h-4 w-4 shrink-0 text-primary" />
        Your profile is saved so future runs are one click away.
      </div>
      {!form.skinTone && <Badge variant="muted" className="mt-3">Tip: add skin tone for sharper colour matches</Badge>}
    </div>
  );
}
