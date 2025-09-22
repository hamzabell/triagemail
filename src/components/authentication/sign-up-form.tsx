'use client';

import { useState } from 'react';
import { AuthenticationForm } from '@/components/authentication/authentication-form';
import { signup } from '@/app/signup/actions';
import { useToast } from '@/components/ui/use-toast';

export function SignupForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignup(e?: React.FormEvent) {
    if (e) e.preventDefault();

    setIsLoading(true);
    try {
      const result = await signup({ email, password });

      if (result?.error) {
        toast({
          title: 'Sign Up Failed',
          description: result.error || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      } else if (result?.success) {
        toast({
          title: 'Account Created!',
          description: result.message || 'Welcome to TriageMail! Please check your email to verify your account.',
        });

        // Redirect to verification page if email confirmation is required
        if (result.requiresEmailConfirmation) {
          window.location.href = '/verify-email';
        } else if (result.redirect) {
          window.location.href = result.redirect;
        }
      } else {
        toast({
          title: 'Account Created!',
          description: 'Welcome to TriageMail! Please check your email to verify your account.',
        });
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
        onClick={handleSignup}
        disabled={isLoading}
        className="w-full bg-[#FF3366] text-white py-3 rounded-full font-semibold text-base hover:bg-[#E63946] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {isLoading ? 'Creating Account...' : 'Sign Up'}
      </button>
    </div>
  );
}
