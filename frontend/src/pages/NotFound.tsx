import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-serif text-7xl font-semibold text-primary">404</p>
      <h1 className="text-2xl font-semibold">This page slipped off the rack</h1>
      <p className="max-w-sm text-muted-foreground">The page you’re looking for doesn’t exist or has moved.</p>
      <Button asChild className="mt-2">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  );
}
