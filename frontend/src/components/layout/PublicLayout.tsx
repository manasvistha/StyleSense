import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Brand } from './Brand';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/explore', label: 'Explore' },
  { to: '/measurement-guide', label: 'Measurement Guide' },
  { to: '/#how-it-works', label: 'How It Works' },
];

export function PublicLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Brand />
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                    isActive && 'text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            {user ? (
              <Button onClick={() => navigate(user.role === 'ADMIN' ? '/admin' : '/app')}>
                Go to {user.role === 'ADMIN' ? 'Admin' : 'Studio'}
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button variant="gold" asChild>
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
          <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="border-t border-border bg-background px-6 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="py-2 text-sm font-medium">
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex gap-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button variant="gold" asChild className="flex-1">
                  <Link to="/register">Get started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Brand />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            An intelligent, explainable dress recommendation platform for women aged 18–35 — personalised by
            age, body shape, measurements, occasion and budget.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Platform</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/explore" className="hover:text-foreground">Explore dresses</Link></li>
            <li><Link to="/measurement-guide" className="hover:text-foreground">Measurement guide</Link></li>
            <li><Link to="/register" className="hover:text-foreground">Create account</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">About</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Final-year thesis project</li>
            <li>Rule-based, explainable AI</li>
            <li>Three-tier architecture</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} StyleSense. Built for academic demonstration.
      </div>
    </footer>
  );
}
