import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Info, Ruler, Sparkles, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/misc';
import { ChipSelect } from '@/components/ChipSelect';
import { useCatalog } from '@/hooks/useCatalog';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { BodyShapeResult, Profile as ProfileType } from '@/types';

export default function Profile() {
  const { refreshUser } = useAuth();
  const qc = useQueryClient();
  const { data: catalog } = useCatalog();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await api.get('/profile')).data.data.profile as ProfileType,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-7 w-7 text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Your style profile</h1>
        <p className="text-muted-foreground">The more accurate this is, the better your recommendations.</p>
      </div>

      <MeasurementsCard
        profile={profile}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ['profile'] });
          void refreshUser();
        }}
      />

      <PreferencesCard profile={profile} catalog={catalog} onSaved={() => qc.invalidateQueries({ queryKey: ['profile'] })} />
    </div>
  );
}

/* ───────────────────── Measurements ────────────────────── */
function MeasurementsCard({ profile, onSaved }: { profile?: ProfileType; onSaved: () => void }) {
  const m = profile?.measurements;
  const [form, setForm] = useState({
    age: '', heightCm: '', weightKg: '', bustCm: '', waistCm: '', hipCm: '', shoulderCm: '',
  });
  const [shape, setShape] = useState<BodyShapeResult | null>(null);

  useEffect(() => {
    if (m) {
      setForm({
        age: String(m.age), heightCm: String(m.heightCm), weightKg: String(m.weightKg),
        bustCm: String(m.bustCm), waistCm: String(m.waistCm), hipCm: String(m.hipCm),
        shoulderCm: m.shoulderCm ? String(m.shoulderCm) : '',
      });
    }
  }, [m]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        age: Number(form.age), heightCm: Number(form.heightCm), weightKg: Number(form.weightKg),
        bustCm: Number(form.bustCm), waistCm: Number(form.waistCm), hipCm: Number(form.hipCm),
        ...(form.shoulderCm ? { shoulderCm: Number(form.shoulderCm) } : {}),
      };
      return (await api.put('/profile/measurements', payload)).data.data as { bodyShape: BodyShapeResult };
    },
    onSuccess: (data) => {
      setShape(data.bodyShape);
      toast.success(`Saved — you’re a ${data.bodyShape.name} shape`);
      onSaved();
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Check your measurement values')),
  });

  const fields: { key: keyof typeof form; label: string; optional?: boolean }[] = [
    { key: 'age', label: 'Age (18–35)' },
    { key: 'heightCm', label: 'Height (cm)' },
    { key: 'weightKg', label: 'Weight (kg)' },
    { key: 'bustCm', label: 'Bust (cm)' },
    { key: 'waistCm', label: 'Waist (cm)' },
    { key: 'hipCm', label: 'Hip (cm)' },
    { key: 'shoulderCm', label: 'Shoulder (cm)', optional: true },
  ];

  const currentShape = shape ?? (m?.bodyShape ? { name: m.bodyShape.name, reason: m.bodyShapeReason ?? m.bodyShape.description, stylingTips: m.bodyShape.stylingTips } : null);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Ruler className="h-5 w-5 text-primary" /> Body measurements</CardTitle>
        <Link to="/measurement-guide" className="text-sm text-primary hover:underline">How to measure</Link>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-sm font-medium">{f.label}</label>
              <Input
                type="number"
                inputMode="decimal"
                value={form[f.key]}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        {currentShape && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Detected body shape:</span>
              <Badge>{currentShape.name}</Badge>
            </div>
            {currentShape.reason && (
              <p className="mt-2 flex gap-2 text-sm text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {currentShape.reason}
              </p>
            )}
          </div>
        )}

        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Spinner className="h-4 w-4" /> : 'Save measurements'}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ───────────────────── Preferences ─────────────────────── */
function PreferencesCard({
  profile,
  catalog,
  onSaved,
}: {
  profile?: ProfileType;
  catalog?: ReturnType<typeof useCatalog>['data'];
  onSaved: () => void;
}) {
  const p = profile?.preferences;
  const [budgetMin, setBudgetMin] = useState('0');
  const [budgetMax, setBudgetMax] = useState('10000');
  const [colors, setColors] = useState<Set<string>>(new Set());
  const [styles, setStyles] = useState<Set<string>>(new Set());
  const [brands, setBrands] = useState<Set<string>>(new Set());
  const [occasions, setOccasions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (p) {
      setBudgetMin(String(p.budgetMin));
      setBudgetMax(String(p.budgetMax));
      setColors(new Set(p.preferredColors.map((c) => c.id)));
      setStyles(new Set(p.preferredStyles.map((s) => s.id)));
      setBrands(new Set(p.favoriteBrands.map((b) => b.id)));
      setOccasions(new Set(p.favoriteOccasions.map((o) => o.id)));
    }
  }, [p]);

  const toggle = (setter: typeof setColors) => (id: string) =>
    setter((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const save = useMutation({
    mutationFn: async () =>
      api.put('/profile/preferences', {
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        preferredColorIds: [...colors],
        preferredStyleIds: [...styles],
        favoriteBrandIds: [...brands],
        favoriteOccasionIds: [...occasions],
      }),
    onSuccess: () => {
      toast.success('Preferences saved');
      onSaved();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const sections = useMemo(
    () => [
      { title: 'Preferred colours', options: catalog?.colors ?? [], selected: colors, toggle: toggle(setColors) },
      { title: 'Preferred styles', options: catalog?.styles ?? [], selected: styles, toggle: toggle(setStyles) },
      { title: 'Favourite brands', options: catalog?.brands ?? [], selected: brands, toggle: toggle(setBrands) },
      { title: 'Favourite occasions', options: catalog?.occasions ?? [], selected: occasions, toggle: toggle(setOccasions) },
    ],
    [catalog, colors, styles, brands, occasions],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /> Preferences & budget</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:max-w-sm">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Budget min</label>
            <Input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Budget max</label>
            <Input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
          </div>
        </div>

        {sections.map((s) => (
          <div key={s.title} className="space-y-2">
            <label className="text-sm font-medium">{s.title}</label>
            <ChipSelect options={s.options} selected={s.selected} onToggle={s.toggle} />
          </div>
        ))}

        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Spinner className="h-4 w-4" /> : 'Save preferences'}
        </Button>
      </CardContent>
    </Card>
  );
}
