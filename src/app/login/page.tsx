import { LoginForm } from '@/components/authentication/login-form';
import Link from 'next/link';

export default function LoginPage() {
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
              href="/signup"
              className="bg-[#FF3366] text-white px-5 py-2.5 rounded-full font-semibold text-base hover:bg-[#E63946] transition-all hover:-translate-y-0.5"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="min-h-screen flex items-center justify-center pt-20 pb-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl font-bold text-[#1D3557] mb-2">Welcome Back</h1>
              <p className="text-[#1D3557]/70">Log in to your TriageMail account</p>
            </div>
            <LoginForm />
            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-[#1D3557]/70 text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-[#FF3366] font-medium hover:text-[#E63946] transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
