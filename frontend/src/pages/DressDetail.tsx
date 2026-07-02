import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SmartImage } from '@/components/ui/image';
import { api, apiErrorMessage } from '@/lib/api';
import { discountedPrice, formatCurrency, formatDate, initials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/misc';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import type { DressDetail as DressDetailType } from '@/types';

export default function DressDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [activeImg, setActiveImg] = useState(0);

  const { data: dress, isLoading } = useQuery({
    queryKey: ['dress', slug],
    queryFn: async () => (await api.get(`/dresses/${slug}`)).data.data.dress as DressDetailType,
  });

  if (isLoading) {
    return (
      <div className="container grid gap-10 py-12 lg:grid-cols-2">
        <Skeleton className="aspect-[3/4]" />
        <div className="space-y-4"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-24" /></div>
      </div>
    );
  }
  if (!dress) return null;

  const price = discountedPrice(dress.basePrice, dress.discountPct);
  const images = dress.images.length ? dress.images : [{ id: 'x', url: '', alt: '', isPrimary: true }];

  const addWishlist = async () => {
    if (!user) return toast.info('Sign in to save to your wishlist');
    try {
      await api.post(`/wishlist/${dress.id}`);
      toast.success('Added to wishlist');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="container py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-muted shadow-soft">
            <SmartImage src={images[activeImg]?.url} alt={dress.name} fallbackLabel={dress.name} className="h-full w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setActiveImg(i)} className={`h-20 w-16 overflow-hidden rounded-lg border-2 ${i === activeImg ? 'border-primary' : 'border-transparent'}`}>
                  <SmartImage src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{dress.brand.name}</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold">{dress.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xl font-semibold">{formatCurrency(price)}</span>
            {dress.discountPct > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatCurrency(dress.basePrice)}</span>
                <Badge variant="destructive">-{dress.discountPct}%</Badge>
              </>
            )}
          </div>
          {dress.ratingCount > 0 && (
            <div className="mt-2 flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-gold text-gold" /> {dress.ratingAvg.toFixed(1)}
              <span className="text-muted-foreground">({dress.ratingCount} reviews)</span>
            </div>
          )}

          <p className="mt-5 text-muted-foreground">{dress.description}</p>

          {/* Suitable shapes */}
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium">Flatters these body shapes</p>
            <div className="flex flex-wrap gap-2">
              {dress.suitableBodyShapes.map((s) => <Badge key={s.id} variant="default">{s.name}</Badge>)}
            </div>
          </div>

          {/* Sizes */}
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium">Available sizes</p>
            <div className="flex flex-wrap gap-2">
              {dress.inventory.map((inv) => (
                <span key={inv.id} className={`rounded-lg border px-3 py-1.5 text-sm ${inv.stock > 0 ? 'border-border' : 'border-border text-muted-foreground line-through'}`}>
                  {inv.size.label}
                </span>
              ))}
            </div>
          </div>

          {/* Attributes */}
          <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-border bg-secondary/30 p-4 text-sm">
            {[
              ['Style', dress.style.name], ['Fabric', dress.fabric.name], ['Material', dress.material],
              ['Sleeve', dress.sleeveType], ['Length', dress.length], ['Neckline', dress.neckStyle],
              ['Pattern', dress.pattern], ['Season', dress.season.name],
            ].map(([k, v]) => (
              <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
          </dl>

          <div className="mt-6 flex gap-3">
            <Button variant="gold" size="lg" className="flex-1" onClick={addWishlist}>
              <Heart className="h-4 w-4" /> Save to wishlist
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {dress.colors.map((c) => (
              <span key={c.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: c.hex }} /> {c.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      {dress.reviews.length > 0 && (
        <div className="mt-14">
          <h2 className="font-serif text-2xl font-semibold">Reviews</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {dress.reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9"><AvatarFallback>{initials(r.user.fullName)}</AvatarFallback></Avatar>
                  <div>
                    <p className="text-sm font-medium">{r.user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-gold text-gold' : 'text-muted'}`} />
                    ))}
                  </div>
                </div>
                {r.title && <p className="mt-3 font-medium">{r.title}</p>}
                {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
