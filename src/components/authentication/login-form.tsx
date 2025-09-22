'use client';

import { login } from '@/app/login/actions';
import { useState } from 'react';
import { AuthenticationForm } from '@/components/authentication/authentication-form';
import { useToast } from '@/components/ui/use-toast';

export function LoginForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();

    setIsLoading(true);
    try {
      const result = await login({ email, password });

      if (result?.error) {
        toast({
          title: 'Login Failed',
          description: result.error || 'Invalid email or password. Please try again.',
          variant: 'destructive',
        });
      } else if (result?.success && result?.redirect) {
        toast({
          title: 'Welcome Back!',
          description: 'Successfully logged in to your account.',
        });
        // Use window.location for redirect to avoid 303 error
        window.location.href = result.redirect;
      } else if (result?.success) {
        toast({
          title: 'Welcome Back!',
          description: 'Successfully logged in to your account.',
        });
        window.location.href = '/';
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <AuthenticationForm
        email={email}
        onEmailChange={(email) => setEmail(email)}
        password={password}
        onPasswordChange={(password) => setPassword(password)}
      />

      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full bg-[#FF3366] text-white py-3 rounded-full font-semibold text-base hover:bg-[#E63946] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {isLoading ? 'Logging in...' : 'Log In'}
      </button>
    </div>
  );
}
