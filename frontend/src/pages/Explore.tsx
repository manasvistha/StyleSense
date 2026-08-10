import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DressCard } from '@/components/DressCard';
import { useCatalog } from '@/hooks/useCatalog';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { DressListItem, PageMeta } from '@/types';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Popular' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

export default function Explore() {
  const { data: catalog } = useCatalog();
  const [filters, setFilters] = useState<Record<string, string>>({ sort: 'newest' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const setFilter = (key: string, value: string) => {
    setPage(1);
    setFilters((f) => {
      const next = { ...f };
      if (!value || next[key] === value) delete next[key];
      else next[key] = value;
      return next;
    });
  };

  const query = useQuery({
    queryKey: ['explore', filters, search, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params = new URLSearchParams({ ...filters, page: String(page), limit: '12' });
      if (search) params.set('search', search);
      const res = await api.get(`/dresses?${params.toString()}`);
      return { dresses: res.data.data.dresses as DressListItem[], meta: res.data.meta as PageMeta };
    },
  });

  const facets = [
    { key: 'categoryId', label: 'Category', options: catalog?.categories ?? [] },
    { key: 'occasionId', label: 'Occasion', options: catalog?.occasions ?? [] },
    { key: 'styleId', label: 'Style', options: catalog?.styles ?? [] },
    { key: 'brandId', label: 'Brand', options: catalog?.brands ?? [] },
    { key: 'bodyShapeId', label: 'Body shape', options: catalog?.bodyShapes ?? [] },
    { key: 'seasonId', label: 'Season', options: catalog?.seasons ?? [] },
  ];

  const activeCount = Object.keys(filters).filter((k) => k !== 'sort').length;

  return (
    <div className="min-h-screen bg-[#FFECF0] dark:bg-background">
    <div className="container py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Explore the collection</h1>
          <p className="text-muted-foreground">{query.data?.meta.total ?? '—'} dresses, filterable every way you shop.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="w-56 pl-9" placeholder="Search dresses…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
            value={filters.sort}
            onChange={(e) => setFilter('sort', e.target.value)}
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <Button variant="outline" className="lg:hidden" onClick={() => setShowFilters((s) => !s)}>
            <SlidersHorizontal className="h-4 w-4" /> {activeCount > 0 && <Badge variant="default">{activeCount}</Badge>}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px,1fr]">
        {/* Filter sidebar */}
        <aside className={cn('space-y-6 lg:block', showFilters ? 'block' : 'hidden')}>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setFilters({ sort: filters.sort ?? 'newest' })}>
              <X className="h-4 w-4" /> Clear filters
            </Button>
          )}
          {facets.map((facet) => (
            <div key={facet.key}>
              <p className="mb-2 text-sm font-semibold">{facet.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {facet.options.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setFilter(facet.key, o.id)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs transition-colors',
                      filters[facet.key] === o.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-secondary',
                    )}
                  >
                    {o.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Grid */}
        <div>
          {query.isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
            </div>
          ) : query.data && query.data.dresses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-20 text-center text-muted-foreground">
              No dresses match these filters. Try clearing a few.
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {query.data?.dresses.map((d) => <DressCard key={d.id} dress={d} />)}
              </div>
              {query.data && query.data.meta.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <span className="px-2 text-sm text-muted-foreground">Page {query.data.meta.page} of {query.data.meta.totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= query.data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
