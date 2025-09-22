import { SignupForm } from '@/components/authentication/sign-up-form';
import Link from 'next/link';

export default function SignupPage() {
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
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl font-bold text-[#1D3557] mb-2">Create Account</h1>
              <p className="text-[#1D3557]/70">Start saving time with AI-powered email triage</p>
            </div>

            {/* Gmail Account Notice */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-800 mb-1">Important: Gmail Account Required</h3>
                  <p className="text-sm text-blue-700">
                    Please sign up with the Gmail address you plan to use with our Gmail add-on. This email will be
                    automatically registered for add-on authentication.
                  </p>
                </div>
              </div>
            </div>
            <SignupForm />
            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-[#1D3557]/70 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-[#FF3366] font-medium hover:text-[#E63946] transition-colors">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
