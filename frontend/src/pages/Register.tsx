import { Link, useNavigate } from 'react-router-dom';
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
  fullName: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Add an uppercase letter')
    .regex(/[a-z]/, 'Add a lowercase letter')
    .regex(/[0-9]/, 'Add a number'),
});
type FormValues = z.infer<typeof schema>;

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await registerUser(values);
      toast.success('Account created! Let’s build your style profile.');
      navigate('/app/profile', { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not create account'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Create your style profile" subtitle="Join StyleSense and get explained recommendations.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Field label="Full name" error={errors.fullName?.message}>
          <Input placeholder="Maya Sharma" autoComplete="name" {...register('fullName')} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Phone" hint="Optional" error={errors.phone?.message}>
          <Input placeholder="+977 98XXXXXXXX" autoComplete="tel" {...register('phone')} />
        </Field>
        <Field label="Password" error={errors.password?.message} hint="8+ chars, mixed case & number">
          <Input type="password" placeholder="••••••••" autoComplete="new-password" {...register('password')} />
        </Field>
        <Button type="submit" variant="gold" className="w-full" disabled={submitting}>
          {submitting ? <Spinner className="h-4 w-4" /> : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
