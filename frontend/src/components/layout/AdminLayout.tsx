import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Settings2, Shirt, Users } from 'lucide-react';
import { Brand } from './Brand';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/rules', label: 'Recommendation Rules', icon: Settings2, end: false },
  { to: '/admin/dresses', label: 'Dresses', icon: Shirt, end: false },
  { to: '/admin/users', label: 'Users', icon: Users, end: false },
];

export function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border bg-background p-5 lg:flex">
        <Brand to="/admin" />
        <Badge variant="gold" className="mt-3 w-fit">Admin Console</Badge>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
                  isActive && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <Button
          variant="ghost"
          className="justify-start"
          onClick={async () => {
            await logout();
            navigate('/');
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <Brand to="/admin" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              View site
            </Button>
          </div>
        </header>
        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-background px-4 py-2 lg:hidden">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium',
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
