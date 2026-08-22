import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Camera, Info, Ruler, Sparkles, UserRound, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage, Spinner } from '@/components/ui/misc';
import { ChipSelect } from '@/components/ChipSelect';
import { useCatalog } from '@/hooks/useCatalog';
import { api, apiErrorMessage } from '@/lib/api';
import { initials } from '@/lib/utils';
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

      <AccountCard
        profile={profile}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ['profile'] });
          void refreshUser();
        }}
      />

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

/* ───────────────────── Account ─────────────────────────── */
function AccountCard({ profile, onSaved }: { profile?: ProfileType; onSaved: () => void }) {
  const [name, setName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) setName(profile.fullName);
  }, [profile]);

  const saveName = useMutation({
    mutationFn: async () => api.patch('/profile', { fullName: name.trim() }),
    onSuccess: () => {
      toast.success('Name updated');
      onSaved();
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Could not update your name')),
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return (await api.post('/profile/avatar', fd)).data.data as { avatarUrl: string };
    },
    onSuccess: () => {
      toast.success('Profile picture updated');
      onSaved();
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Could not upload the image')),
  });

  const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar.mutate(file);
    e.target.value = ''; // let the same file be picked again if needed
  };

  const nameChanged = profile ? name.trim() !== profile.fullName : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" /> Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile picture */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="h-20 w-20 border border-border">
              {profile?.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />}
              <AvatarFallback className="text-lg">{profile ? initials(profile.fullName) : '?'}</AvatarFallback>
            </Avatar>
            {uploadAvatar.isPending && (
              <div className="absolute inset-0 grid place-items-center rounded-full bg-background/60">
                <Spinner className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploadAvatar.isPending}>
              <Camera className="h-4 w-4" /> Change photo
            </Button>
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP or AVIF — up to a few MB.</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="hidden"
              onChange={onPickFile}
            />
          </div>
        </div>

        {/* Name + email */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input value={profile?.email ?? ''} readOnly disabled />
          </div>
        </div>

        <Button
          onClick={() => saveName.mutate()}
          disabled={saveName.isPending || !nameChanged || name.trim().length < 2}
        >
          {saveName.isPending ? <Spinner className="h-4 w-4" /> : 'Save name'}
        </Button>
      </CardContent>
    </Card>
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
      if (next.has(id)) next.delete(id); else next.add(id);
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
