'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ReactNode } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

interface Props {
  children: ReactNode;
}

export function DashboardLayout({ children }: Props) {
  const supabase = createClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#F1FAEE] font-sans text-[#1D3557]">
      {/* Dashboard Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <div className="font-heading text-xl md:text-2xl font-extrabold text-[#FF3366] tracking-tight">
            TRIAGEMAIL
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link
              href="/dashboard"
              className="text-[#1D3557] font-medium hover:text-[#FF3366] transition-colors text-sm lg:text-base"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/subscriptions"
              className="text-[#1D3557] font-medium hover:text-[#FF3366] transition-colors text-sm lg:text-base"
            >
              Subscriptions
            </Link>
            <Link
              href="/dashboard/payments"
              className="text-[#1D3557] font-medium hover:text-[#FF3366] transition-colors text-sm lg:text-base"
            >
              Payments
            </Link>
            <Link
              href="/"
              className="text-[#1D3557] font-medium hover:text-[#FF3366] transition-colors text-sm lg:text-base"
            >
              Home
            </Link>
            <Button
              onClick={handleLogout}
              className="bg-[#FF3366] text-white px-4 lg:px-5 py-2 lg:py-2.5 rounded-full font-semibold text-sm lg:text-base hover:bg-[#E63946] transition-all hover:-translate-y-0.5"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-[#1D3557] hover:text-[#FF3366]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation Overlay */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-sm border-t border-gray-100 absolute left-0 right-0 top-16 z-50">
            <nav className="flex flex-col space-y-2 p-4">
              <Link
                href="/dashboard"
                className="text-[#1D3557] font-medium hover:text-[#FF3366] transition-colors py-2 px-3 rounded-lg hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/subscriptions"
                className="text-[#1D3557] font-medium hover:text-[#FF3366] transition-colors py-2 px-3 rounded-lg hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Subscriptions
              </Link>
              <Link
                href="/dashboard/payments"
                className="text-[#1D3557] font-medium hover:text-[#FF3366] transition-colors py-2 px-3 rounded-lg hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Payments
              </Link>
              <Link
                href="/"
                className="text-[#1D3557] font-medium hover:text-[#FF3366] transition-colors py-2 px-3 rounded-lg hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Button
                onClick={handleLogout}
                className="bg-[#FF3366] text-white px-4 py-2.5 rounded-full font-semibold text-sm hover:bg-[#E63946] transition-all hover:-translate-y-0.5 w-full mt-2"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 md:py-8 px-4">{children}</main>
    </div>
  );
}
