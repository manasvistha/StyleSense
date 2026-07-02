import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Plus, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch, Spinner } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/skeleton';
import { ChipSelect } from '@/components/ChipSelect';
import { useCatalog } from '@/hooks/useCatalog';
import { api, apiErrorMessage } from '@/lib/api';
import { discountedPrice, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { DressListItem, PageMeta } from '@/types';

interface AdminDress extends DressListItem {
  isActive?: boolean;
  _count?: { reviews: number; inventory: number };
}

export default function AdminDresses() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dresses', page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await api.get(`/admin/dresses?page=${page}&limit=12`);
      return { dresses: res.data.data.dresses as AdminDress[], meta: res.data.meta as PageMeta };
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, boolean> }) => api.put(`/admin/dresses/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-dresses'] }),
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/dresses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-dresses'] });
      toast.success('Dress deleted');
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Dresses</h1>
          <p className="text-muted-foreground">{data?.meta.total ?? '—'} dresses in the catalogue.</p>
        </div>
        <Button onClick={() => setCreating((c) => !c)}>
          {creating ? <><X className="h-4 w-4" /> Close</> : <><Plus className="h-4 w-4" /> New dress</>}
        </Button>
      </div>

      {creating && <CreateDressForm onDone={() => { setCreating(false); qc.invalidateQueries({ queryKey: ['admin-dresses'] }); }} />}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-muted-foreground">
                  <tr>
                    <th className="p-4 font-medium">Dress</th>
                    <th className="p-4 font-medium">Price</th>
                    <th className="p-4 font-medium">Featured</th>
                    <th className="p-4 font-medium">Active</th>
                    <th className="p-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {data?.dresses.map((d) => (
                    <tr key={d.id} className="border-b border-border/60 last:border-0">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-10 overflow-hidden rounded-md bg-muted">
                            {d.images?.[0]?.url && <img src={d.images[0].url} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <div>
                            <p className="font-medium">{d.name}</p>
                            <p className="text-xs text-muted-foreground">{d.brand?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{formatCurrency(discountedPrice(d.basePrice, d.discountPct))}</td>
                      <td className="p-4"><Switch checked={d.isFeatured} onCheckedChange={(v) => toggle.mutate({ id: d.id, body: { isFeatured: v } })} /></td>
                      <td className="p-4"><Switch checked={d.isActive ?? true} onCheckedChange={(v) => toggle.mutate({ id: d.id, body: { isActive: v } })} /></td>
                      <td className="p-4">
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove.mutate(d.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {data.meta.page} of {data.meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

/* ───────────────── Create form ───────────────── */
function CreateDressForm({ onDone }: { onDone: () => void }) {
  const { data: catalog } = useCatalog();
  const [f, setF] = useState({
    name: '', description: '', brandId: '', categoryId: '', styleId: '', seasonId: '', fabricId: '', ageGroupId: '',
    sleeveType: 'SHORT', length: 'KNEE', neckStyle: 'Round', pattern: 'Solid', material: 'Cotton',
    basePrice: '3000', discountPct: '0', isFeatured: false,
  });
  const [colors, setColors] = useState<Set<string>>(new Set());
  const [occasions, setOccasions] = useState<Set<string>>(new Set());
  const [shapes, setShapes] = useState<Set<string>>(new Set());
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState<Record<string, string>>({});

  const set = (k: keyof typeof f, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));
  const toggle = (setter: typeof setColors) => (id: string) =>
    setter((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const create = useMutation({
    mutationFn: async () => {
      const inventory = Object.entries(stock)
        .filter(([, v]) => Number(v) > 0)
        .map(([sizeId, v]) => ({ sizeId, stock: Number(v) }));
      return api.post('/admin/dresses', {
        ...f,
        basePrice: Number(f.basePrice),
        discountPct: Number(f.discountPct),
        colorIds: [...colors],
        occasionIds: [...occasions],
        bodyShapeIds: [...shapes],
        images: imageUrl ? [{ url: imageUrl, isPrimary: true }] : [],
        inventory,
      });
    },
    onSuccess: () => { toast.success('Dress created'); onDone(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const selects: { key: keyof typeof f; label: string; options?: { id: string; name?: string; label?: string }[] }[] = [
    { key: 'brandId', label: 'Brand', options: catalog?.brands },
    { key: 'categoryId', label: 'Category', options: catalog?.categories },
    { key: 'styleId', label: 'Style', options: catalog?.styles },
    { key: 'seasonId', label: 'Season', options: catalog?.seasons },
    { key: 'fabricId', label: 'Fabric', options: catalog?.fabrics },
    { key: 'ageGroupId', label: 'Age group', options: catalog?.ageGroups },
  ];

  return (
    <Card className="border-primary/30">
      <CardHeader><CardTitle>New dress</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><Input value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Material"><Input value={f.material} onChange={(e) => set('material', e.target.value)} /></Field>
        </div>
        <Field label="Description"><Textarea value={f.description} onChange={(e) => set('description', e.target.value)} /></Field>

        <div className="grid gap-4 sm:grid-cols-3">
          {selects.map((s) => (
            <Field key={s.key} label={s.label}>
              <select className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" value={f[s.key] as string} onChange={(e) => set(s.key, e.target.value)}>
                <option value="">Select…</option>
                {s.options?.map((o) => <option key={o.id} value={o.id}>{o.name ?? o.label}</option>)}
              </select>
            </Field>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Sleeve">
            <select className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" value={f.sleeveType} onChange={(e) => set('sleeveType', e.target.value)}>
              {['SLEEVELESS', 'CAP', 'SHORT', 'THREE_QUARTER', 'LONG'].map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Length">
            <select className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" value={f.length} onChange={(e) => set('length', e.target.value)}>
              {['MINI', 'KNEE', 'MIDI', 'MAXI', 'FLOOR'].map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Neckline"><Input value={f.neckStyle} onChange={(e) => set('neckStyle', e.target.value)} /></Field>
          <Field label="Pattern"><Input value={f.pattern} onChange={(e) => set('pattern', e.target.value)} /></Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Base price"><Input type="number" value={f.basePrice} onChange={(e) => set('basePrice', e.target.value)} /></Field>
          <Field label="Discount %"><Input type="number" value={f.discountPct} onChange={(e) => set('discountPct', e.target.value)} /></Field>
          <Field label="Primary image URL"><Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" /></Field>
        </div>

        <Field label="Colours"><ChipSelect options={catalog?.colors ?? []} selected={colors} onToggle={toggle(setColors)} /></Field>
        <Field label="Occasions"><ChipSelect options={catalog?.occasions ?? []} selected={occasions} onToggle={toggle(setOccasions)} /></Field>
        <Field label="Suitable body shapes"><ChipSelect options={catalog?.bodyShapes ?? []} selected={shapes} onToggle={toggle(setShapes)} /></Field>

        <Field label="Inventory (stock per size)">
          <div className="flex flex-wrap gap-3">
            {catalog?.sizes.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <Badge variant="muted">{s.label}</Badge>
                <Input type="number" className="w-20" value={stock[s.id] ?? ''} placeholder="0" onChange={(e) => setStock((p) => ({ ...p, [s.id]: e.target.value }))} />
              </div>
            ))}
          </div>
        </Field>

        <div className="flex items-center gap-3">
          <Switch checked={f.isFeatured} onCheckedChange={(v) => set('isFeatured', v)} />
          <span className="text-sm">Feature on homepage</span>
        </div>

        <Button onClick={() => create.mutate()} disabled={create.isPending || !f.name || !f.brandId || !f.categoryId}>
          {create.isPending ? <Spinner className="h-4 w-4" /> : 'Create dress'}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
