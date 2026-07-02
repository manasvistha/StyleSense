import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';
import { AuthShell, Field } from '@/components/AuthShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/misc';
import { useAuth } from '@/context/AuthContext';
import { apiErrorMessage } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const user = await login(values.email, values.password);
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`);
      const dest = user.role === 'ADMIN' ? '/admin' : (location.state?.from?.pathname ?? '/app');
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not sign in'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to see your personalised recommendations.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
        </Field>
        <Field
          label="Password"
          error={errors.password?.message}
          hint={undefined}
        >
          <Input type="password" placeholder="••••••••" autoComplete="current-password" {...register('password')} />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Spinner className="h-4 w-4" /> : 'Sign in'}
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Demo accounts</p>
        <p>Admin — admin@stylesense.app / Admin@123</p>
        <p>User — maya@example.com / User@123</p>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}
