import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#F1FAEE] font-sans text-[#1D3557]">
      {/* Header with logo and navigation */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="font-heading text-2xl font-extrabold text-[#FF3366] tracking-tight">TRIAGEMAIL</div>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-[#1D3557] font-medium hover:text-[#FF3366] transition-colors">
              Home
            </Link>
            <Link
              href="/login"
              className="bg-[#FF3366] text-white px-5 py-2.5 rounded-full font-semibold text-base hover:bg-[#E63946] transition-all hover:-translate-y-0.5"
            >
              Log In
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="min-h-screen flex items-center justify-center pt-20 pb-12 px-4">
        <div className="w-full max-w-md">
          <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-[#1D3557]">Check Your Email</CardTitle>
              <CardDescription className="text-[#1D3557]/70">
                We&apos;ve sent you a verification email. Please check your inbox and click the verification link to
                activate your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-[#1D3557]/60">
                <p>• Check your spam folder if you don&apos;t see the email</p>
                <p>• The verification link will expire in 24 hours</p>
                <p>• Make sure to verify before trying to log in</p>
              </div>

              <div className="flex flex-col gap-3">
                <Button asChild className="w-full bg-[#FF3366] hover:bg-[#E63946]">
                  <Link href="/login">Go to Login</Link>
                </Button>

                <Button variant="outline" className="w-full" asChild>
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
