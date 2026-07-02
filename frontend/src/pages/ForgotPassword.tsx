import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';
import { AuthShell, Field } from '@/components/AuthShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/misc';
import { api, apiErrorMessage } from '@/lib/api';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [submitting, setSubmitting] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password', values);
      toast.success(data.data.message);
      if (data.data.devResetToken) setDevToken(data.data.devResetToken);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="We’ll send you a link to set a new password.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" placeholder="you@example.com" {...register('email')} />
        </Field>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Spinner className="h-4 w-4" /> : 'Send reset link'}
        </Button>
      </form>

      {devToken && (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-secondary/40 p-3 text-xs">
          <p className="font-medium">Demo mode (no mailer configured)</p>
          <p className="mt-1 break-all text-muted-foreground">Reset token: {devToken}</p>
          <Link to={`/reset-password?token=${devToken}`} className="mt-2 inline-block font-medium text-primary hover:underline">
            Continue to reset →
          </Link>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
