import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Ruler,
  Sparkles,
  ShieldCheck,
  Wand2,
  HeartHandshake,
  ChevronDown,
  Quote,
  Scale,
  Palette,
  CalendarHeart,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DressCard } from '@/components/DressCard';
import { SmartImage } from '@/components/ui/image';
import type { DressListItem } from '@/types';

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }),
};

export default function Landing() {
  return (
    <div className="overflow-hidden bg-[#FFECF0]">
      <Hero />
      <TrustBar />
      <HowItWorks />
      <Personalization />
      <Featured />
      <Categories />
      <Benefits />
      <Testimonials />
      <Faq />
      <CtaBand />
    </div>
  );
}

/* ───────────────────────── Hero ───────────────────────── */
function Hero() {
  return (
    <section className="relative">
      {/* decorative backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(closest-side,white,transparent)]" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-gradient-radial from-primary/10 to-transparent blur-2xl" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-gradient-radial from-gold/15 to-transparent blur-2xl" />
      </div>

      <div className="container grid min-h-[88vh] items-center gap-12 py-16 lg:grid-cols-[1.05fr,1fr] lg:py-20">
        {/* Left — message */}
        <motion.div initial="hidden" animate="show" variants={fade}>
          <Badge variant="gold" className="mb-5 py-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Explainable styling intelligence · women 18–35
          </Badge>
          <h1 className="font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]">
            Find the perfect dress for your <span className="text-primary">body, age and style</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-balance">
            Personalised fashion recommendations powered by your real measurements and an intelligent
            decision engine — every match comes with a confidence score and a clear reason. No guesswork, no black box.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button variant="gold" size="lg" asChild>
              <Link to="/register">Start your style analysis <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/explore">Explore dresses</Link>
            </Button>
          </div>
          <div className="mt-10 flex items-center gap-7 text-sm text-muted-foreground">
            <div><span className="block font-serif text-2xl font-semibold text-foreground">94%</span>avg. match score</div>
            <div className="h-10 w-px bg-border" />
            <div><span className="block font-serif text-2xl font-semibold text-foreground">9</span>scoring factors</div>
            <div className="h-10 w-px bg-border" />
            <div><span className="block font-serif text-2xl font-semibold text-foreground">5</span>body shapes</div>
          </div>
        </motion.div>

        {/* Right — floating composition (no single static image) */}
        <HeroComposition />
      </div>
    </section>
  );
}

function HeroComposition() {
  const floaty = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
  });
  const lift = 'transition-transform duration-300 ease-out hover:-translate-y-1.5';
  return (
    // Clean 2×2 layout: Recommendation + Detected shape on top, Dress + Measurement
    // side by side below. Each card floats gently and lifts on hover.
    <div className="relative mx-auto hidden w-full max-w-md grid-cols-2 items-start gap-4 lg:grid">
      {/* Recommendation card */}
      <motion.div {...floaty(0.15)} className="animate-float">
        <div className={`rounded-2xl border border-border/70 bg-card/90 p-4 shadow-soft-lg backdrop-blur-md ${lift}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Recommendation</span>
            <Badge variant="success">94%</Badge>
          </div>
          <ul className="mt-2.5 space-y-1.5 text-xs">
            <li className="flex gap-1.5"><span className="text-success">✔</span> Suits your Hourglass shape</li>
            <li className="flex gap-1.5"><span className="text-success">✔</span> Fits your size (M)</li>
            <li className="flex gap-1.5"><span className="text-success">✔</span> Within budget</li>
          </ul>
        </div>
      </motion.div>

      {/* Detected shape chip */}
      <motion.div {...floaty(0.25)} className="animate-float [animation-delay:-1.2s]">
        <div className={`rounded-2xl border border-border/70 bg-card/90 p-4 shadow-soft-lg backdrop-blur-md ${lift}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Detected shape</p>
          <p className="mt-1 font-serif text-lg font-semibold text-primary">Hourglass</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[88%] rounded-full bg-primary" />
          </div>
        </div>
      </motion.div>

      {/* Mini dress card */}
      <motion.div {...floaty(0.35)} className="animate-float [animation-delay:-2.4s]">
        <div className={`overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft-lg ${lift}`}>
          <div className="aspect-[4/5] overflow-hidden bg-muted">
            <SmartImage
              src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80"
              alt="Recommended dress" fallbackLabel="Emerald Wrap Midi" className="h-full w-full object-cover" loading="lazy"
            />
          </div>
          <div className="p-2.5">
            <p className="truncate text-xs font-medium">Emerald Wrap Midi</p>
            <p className="text-[11px] text-muted-foreground">NPR 6,800</p>
          </div>
        </div>
      </motion.div>

      {/* Body-measurement card (smaller; silhouette shifted left so labels sit clear) */}
      <motion.div {...floaty(0.45)} className="animate-float [animation-delay:-0.6s]">
        <div className={`relative ${lift}`}>
          <div className="relative h-[20rem] w-full overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-secondary to-card shadow-soft-lg">
            <div className="absolute inset-0 bg-grid opacity-60" />
            {/* simple body silhouette */}
            <svg viewBox="0 0 100 200" className="absolute left-[34%] top-1/2 h-[70%] -translate-x-1/2 -translate-y-1/2 text-primary/25" fill="currentColor">
              <circle cx="50" cy="22" r="13" />
              <path d="M50 36 C34 36 30 50 30 64 L26 110 L38 112 L42 80 L42 150 L48 150 L50 96 L52 150 L58 150 L58 80 L62 112 L74 110 L70 64 C70 50 66 36 50 36 Z" />
            </svg>
          </div>
          {/* measurement indicators — outside the clipped panel so the pills are never cut off */}
          {[
            { top: '26%', label: 'Bust', value: '92' },
            { top: '48%', label: 'Waist', value: '70' },
            { top: '66%', label: 'Hip', value: '98' },
          ].map((m) => (
            <div key={m.label} className="absolute right-2 flex -translate-y-1/2 items-center gap-1.5" style={{ top: m.top }}>
              <span className="h-px w-5 bg-primary/40" />
              <span className="whitespace-nowrap rounded-full border border-border/70 bg-card px-2.5 py-1 text-[10px] font-medium shadow-soft">
                {m.label} <span className="text-primary">{m.value}cm</span>
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function TrustBar() {
  const items = ['Body-shape aware', 'Size-accurate', 'Budget-friendly', 'Occasion-ready', 'Explainable'];
  return (
    <div className="border-y border-border bg-secondary/40">
      <div className="container flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-5 text-sm font-medium text-muted-foreground">
        {items.map((i) => (
          <span key={i} className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> {i}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────── How it works ─────────────────────── */
function HowItWorks() {
  const steps = [
    { icon: Ruler, title: 'Share your measurements', desc: 'Enter your bust, waist and hip with our illustrated guide. We range-check every value for accuracy.' },
    { icon: Wand2, title: 'We detect your body shape', desc: 'Our analyzer classifies your silhouette from your ratios — and explains exactly why.' },
    { icon: Sparkles, title: 'Get explained matches', desc: 'Every dress is scored across 9 factors with a confidence % and a clear list of reasons.' },
  ];
  return (
    <section id="how-it-works" className="container py-20 lg:py-28">
      <SectionHeading
        eyebrow="How it works"
        title="Personalised in three simple steps"
        subtitle="From measurements to meaningful matches — transparent at every stage."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div key={s.title} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <Card className="h-full">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="mb-1 text-xs font-semibold text-muted-foreground">STEP {i + 1}</div>
                <h3 className="font-serif text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────── Personalization explanation ───────────── */
function Personalization() {
  const factors = [
    { icon: Wand2, label: 'Body Shape', weight: '30%' },
    { icon: Scale, label: 'Measurements / Size', weight: '25%' },
    { icon: CalendarHeart, label: 'Occasion', weight: '10%' },
    { icon: Sparkles, label: 'Age Group', weight: '10%' },
    { icon: HeartHandshake, label: 'Budget', weight: '10%' },
    { icon: Palette, label: 'Colour, Style & Brand', weight: '13%' },
  ];
  return (
    <section className="border-y border-border bg-secondary/30 py-20 lg:py-28">
      <div className="container grid items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow="The recommendation engine"
            title="Not a black box — a weighted, explainable score"
            subtitle="We combine nine personalised signals into a single confidence score. Administrators can even tune the weights — and the engine re-balances automatically."
          />
          <Button variant="outline" className="mt-8" asChild>
            <Link to="/measurement-guide">
              See the measurement guide <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {factors.map((f, i) => (
            <motion.div key={f.label} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
              <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-foreground">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium">{f.label}</span>
                </div>
                <span className="font-serif text-lg font-semibold text-primary">{f.weight}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── Featured dresses ────────────────── */
function Featured() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['featured'],
    queryFn: async () => (await api.get('/dresses/featured?limit=4')).data.data.dresses as DressListItem[],
  });

  return (
    <section className="container py-20 lg:py-28">
      <SectionHeading eyebrow="Featured" title="Pieces our community loves" subtitle="A glimpse of the curated collection waiting inside." />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
        {isError && (
          <p className="col-span-full text-center text-sm text-muted-foreground">
            Start the API and seed the database to see live featured dresses.
          </p>
        )}
        {data?.map((d) => <DressCard key={d.id} dress={d} />)}
      </div>
      <div className="mt-10 text-center">
        <Button asChild>
          <Link to="/explore">Explore all dresses <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    </section>
  );
}

/* ───────────────────────── Categories ──────────────────── */
function Categories() {
  const cats = [
    { name: 'Wedding Guest', img: '1606760227091-3dd870d97f1d' },
    { name: 'Office', img: '1490481651871-ab68de25d43d' },
    { name: 'Party', img: '1539008835657-9e8e9680c956' },
    { name: 'Summer', img: '1515372039744-b8f02a3ae446' },
  ];
  return (
    <section className="border-t border-border bg-secondary/30 py-20 lg:py-28">
      <div className="container">
        <SectionHeading eyebrow="Fashion categories" title="Dressed for every moment" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cats.map((c, i) => (
            <motion.div key={c.name} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
              <Link
                to={`/explore?occasion=${encodeURIComponent(c.name)}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl"
              >
                <img
                  src={`https://images.unsplash.com/photo-${c.img}?auto=format&fit=crop&w=600&q=80`}
                  alt={c.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 font-serif text-xl font-semibold text-white">{c.name}</div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Benefits ────────────────────── */
function Benefits() {
  const benefits = [
    { icon: Ruler, title: 'Accuracy you can trust', desc: 'Range-validated measurements and an illustrated guide minimise sizing mistakes.' },
    { icon: ShieldCheck, title: 'Honest recommendations', desc: 'We surface caveats too — like “slightly above budget” — never just flattery.' },
    { icon: Wand2, title: 'Knows your silhouette', desc: 'Five body shapes detected automatically from your measurement ratios.' },
    { icon: HeartHandshake, title: 'Respects your budget', desc: 'Set a range and watch the engine prioritise pieces you can actually buy.' },
  ];
  return (
    <section className="container py-20 lg:py-28">
      <SectionHeading eyebrow="Why StyleSense" title="Styling that actually understands you" />
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {benefits.map((b, i) => (
          <motion.div key={b.title} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <div className="rounded-2xl border border-border bg-card p-6">
              <b.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────── Testimonials ─────────────────── */
function Testimonials() {
  const items = [
    { name: 'Maya S.', role: 'Age 23 · Hourglass', quote: 'It finally explained why a dress suits me. The 94% match was spot on for my sister’s wedding.' },
    { name: 'Aria T.', role: 'Age 28 · Pear', quote: 'I always struggled with fit. StyleSense pointed me to A-line styles and they were perfect.' },
    { name: 'Noor A.', role: 'Age 32 · Rectangle', quote: 'The reasons next to every dress make shopping feel effortless and trustworthy.' },
  ];
  return (
    <section className="border-y border-border bg-primary/5 py-20 lg:py-28">
      <div className="container">
        <SectionHeading eyebrow="Loved by our testers" title="What women are saying" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <motion.div key={t.name} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <Quote className="h-7 w-7 text-accent" />
                  <p className="mt-3 text-sm leading-relaxed">{t.quote}</p>
                  <div className="mt-5">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── FAQ ──────────────────────── */
function Faq() {
  const faqs = [
    { q: 'How does StyleSense decide what to recommend?', a: 'It scores every dress across nine weighted factors — body shape, measurements, age, occasion, budget, colour, style, brand and popularity — then shows a confidence percentage and the exact reasons.' },
    { q: 'Do I have to know my body shape?', a: 'No. We detect it automatically from your bust, waist and hip measurements and explain the classification in plain language.' },
    { q: 'What if my measurements are slightly off?', a: 'Our illustrated measurement guide and server-side range checks reduce errors, and the size scorer tolerates small differences gracefully.' },
    { q: 'Is my data private?', a: 'Your measurements are used only to personalise recommendations. Passwords are hashed and sessions are protected with JWTs.' },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="container py-20 lg:py-28">
      <SectionHeading eyebrow="FAQ" title="Questions, answered" />
      <div className="mx-auto mt-10 max-w-3xl divide-y divide-border rounded-2xl border border-border bg-card">
        {faqs.map((f, i) => (
          <div key={f.q}>
            <button
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="font-medium">{f.q}</span>
              <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <p className="px-6 pb-5 text-sm text-muted-foreground">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="container pb-24">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-[#3a0d1d] px-8 py-16 text-center text-primary-foreground">
        <div className="pointer-events-none absolute -right-10 -top-10 h-60 w-60 rounded-full bg-gold/20 blur-3xl" />
        <h2 className="font-serif text-3xl font-semibold sm:text-4xl">Your perfect dress is one profile away.</h2>
        <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
          Create your style profile and get explained, confidence-scored recommendations in minutes.
        </p>
        <Button variant="gold" size="lg" className="mt-8" asChild>
          <Link to="/register">Create my style profile <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    </section>
  );
}

/* ───────────────────── Shared heading ──────────────────── */
function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'}>
      <p className="text-sm font-semibold uppercase tracking-widest text-accent-foreground/80">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground text-balance">{subtitle}</p>}
    </div>
  );
}
