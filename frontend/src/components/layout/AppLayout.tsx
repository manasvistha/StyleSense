import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Heart, History, LogOut, Sparkles, UserRound } from 'lucide-react';
import { Brand } from './Brand';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/misc';
import { useAuth } from '@/context/AuthContext';
import { cn, initials } from '@/lib/utils';

const links = [
  { to: '/app', label: 'Recommend', icon: Sparkles, end: true },
  { to: '/app/history', label: 'History', icon: History, end: false },
  { to: '/app/wishlist', label: 'Wishlist', icon: Heart, end: false },
  { to: '/app/profile', label: 'Profile', icon: UserRound, end: false },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-[#FFECF0] dark:bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Brand to="/app" />
          <nav className="hidden items-center gap-1 md:flex">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                    isActive && 'bg-secondary text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Avatar className="h-9 w-9 border border-border">
              {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
              <AvatarFallback>{user ? initials(user.fullName) : '?'}</AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Log out"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {/* Mobile bottom nav */}
        <nav className="flex items-center justify-around border-t border-border py-2 md:hidden">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn('flex flex-col items-center gap-0.5 px-3 text-xs', isActive ? 'text-primary' : 'text-muted-foreground')
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="container flex-1 py-8">
        <Outlet />
      </main>
    </div>
  );
}
