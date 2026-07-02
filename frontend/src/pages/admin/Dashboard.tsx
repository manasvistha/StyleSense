import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Shirt, Sparkles, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Dashboard {
  cards: {
    totalUsers: number;
    totalDresses: number;
    recommendationsGenerated: number;
    averageUserAge: number;
    mostCommonBodyShape: string | null;
    mostActiveAgeGroup: string | null;
    mostPopularDress: { name: string; selections: number } | null;
  };
  bodyShapeDistribution: { shape: string; count: number }[];
  ageDistribution: { band: string; count: number }[];
  mostRecommended: { name: string; count: number }[];
  recentActivity: { id: string; type: string; user: string; createdAt: string }[];
}

const SHAPE_COLORS = ['#6d1a36', '#c8a45c', '#2e8b57', '#1f2a44', '#b497bd'];

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get('/analytics/dashboard')).data.data as Dashboard,
  });
  const { data: trend } = useQuery({
    queryKey: ['admin-trend'],
    queryFn: async () => (await api.get('/analytics/trend?days=30')).data.data.trend as { date: string; recommendations: number; avgConfidence: number }[],
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  const c = data.cards;
  const stats = [
    { label: 'Total users', value: c.totalUsers, icon: Users },
    { label: 'Active dresses', value: c.totalDresses, icon: Shirt },
    { label: 'Recommendations', value: c.recommendationsGenerated, icon: Sparkles },
    { label: 'Avg. user age', value: c.averageUserAge || '—', icon: Activity },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Platform analytics and recommendation trends.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <s.icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-2xl font-semibold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Highlight chips */}
      <div className="flex flex-wrap gap-3">
        {c.mostCommonBodyShape && <Badge variant="gold" className="px-3 py-1.5">Most common shape: {c.mostCommonBodyShape}</Badge>}
        {c.mostActiveAgeGroup && <Badge variant="gold" className="px-3 py-1.5">Most active age group: {c.mostActiveAgeGroup}</Badge>}
        {c.mostPopularDress && <Badge variant="gold" className="px-3 py-1.5">Most chosen: {c.mostPopularDress.name}</Badge>}
      </div>

      {/* Trend chart */}
      <Card>
        <CardHeader><CardTitle>Recommendation trend (30 days)</CardTitle></CardHeader>
        <CardContent>
          {trend && trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                <Line type="monotone" dataKey="recommendations" stroke="#6d1a36" strokeWidth={2.5} dot={false} name="Runs" />
                <Line type="monotone" dataKey="avgConfidence" stroke="#c8a45c" strokeWidth={2} dot={false} name="Avg confidence %" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No recommendation runs yet. Generate some as a user to populate this chart.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Body shape distribution */}
        <Card>
          <CardHeader><CardTitle>Body-shape distribution</CardTitle></CardHeader>
          <CardContent>
            {data.bodyShapeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.bodyShapeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="shape" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {data.bodyShapeDistribution.map((_, i) => <Cell key={i} fill={SHAPE_COLORS[i % SHAPE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>

        {/* Age distribution */}
        <Card>
          <CardHeader><CardTitle>Age-group distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.ageDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="band" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                <Bar dataKey="count" fill="#c8a45c" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Most recommended */}
        <Card>
          <CardHeader><CardTitle>Most recommended dresses</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.mostRecommended.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
            {data.mostRecommended.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="text-muted-foreground">{i + 1}.</span> {d.name}</span>
                <Badge variant="muted">{d.count}×</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.recentActivity.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
            {data.recentActivity.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <span><span className="font-medium">{a.user}</span> · {a.type.replace(/_/g, ' ').toLowerCase()}</span>
                <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyChart() {
  return <p className="py-10 text-center text-sm text-muted-foreground">No data yet — seed users with measurements.</p>;
}
