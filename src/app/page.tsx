'use client';

import { useState } from 'react';
import { CheckCircle, Bell, Layers, Zap } from 'lucide-react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1FAEE] font-sans text-[#1D3557] overflow-x-hidden">
      {/* Font imports */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&family=Syne:wght@700;800&display=swap');

        .font-['Space_Grotesk'] {
          font-family: 'Space Grotesk', sans-serif;
        }

        .font-heading {
          font-family: 'Syne', sans-serif;
        }
      `}</style>

      {/* Minimalist Header */}
      <header className="fixed top-0 w-full px-6 py-5 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="font-heading text-2xl font-extrabold text-[#FF3366] tracking-tight">TRIAGEMAIL</div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2" aria-label="Toggle menu">
            <div className="w-6 h-0.5 bg-foreground mb-1.5 transition-all"></div>
            <div className="w-6 h-0.5 bg-foreground mb-1.5 transition-all"></div>
            <div className="w-6 h-0.5 bg-foreground transition-all"></div>
          </button>

          <nav
            className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex absolute md:static top-16 left-0 w-full md:w-auto bg-white md:bg-transparent flex-col md:flex-row items-center gap-8 p-6 md:p-0 shadow-lg md:shadow-none`}
          >
            <button
              onClick={() => scrollToSection('features')}
              className="text-[#1D3557] font-medium text-base hover:text-[#FF3366] transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-[#1D3557] font-medium text-base hover:text-[#FF3366] transition-colors"
            >
              Pricing
            </button>
            <a
              href="/login"
              className="bg-transparent text-[#FF3366] border-2 border-[#FF3366] px-5 py-2.5 rounded-full font-semibold text-base hover:bg-[#FF3366]/10 transition-all hover:-translate-y-0.5"
            >
              Log In
            </a>
            <a
              href="/signup"
              className="bg-[#FF3366] text-white px-5 py-2.5 rounded-full font-semibold text-base hover:bg-[#FF3366]/90 transition-all hover:-translate-y-0.5"
            >
              Sign Up
            </a>
          </nav>
        </div>
      </header>

      {/* Centered Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-24 px-10 pb-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block bg-[#FF3366] text-white px-4 py-1.5 rounded text-sm font-semibold mb-6 -rotate-2">
            WORKS INSIDE GMAIL • AI-POWERED • FREE FOREVER
          </div>

          <h1 className="font-heading text-5xl md:text-7xl font-black leading-tight mb-6">
            AI Email Triage{' '}
            <span className="text-[#FF3366] relative inline-block">
              Inside Gmail
              <span className="absolute bottom-1 left-0 w-full h-3 bg-[#FFD166] -rotate-2"></span>
            </span>
          </h1>

          <p className="text-xl md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed text-[#1D3557]">
            The only AI email assistant that categorizes, prioritizes, and analyzes relationships—right inside your
            Gmail. Save 10+ hours weekly with intelligent automation that learns your workflow and predicts client
            needs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="bg-[#FF3366] text-white px-7 py-4 rounded-full font-semibold text-base hover:bg-[#FF3366]/90 transition-all hover:-translate-y-0.5 text-center"
            >
              Get Started Free
            </a>
            <button
              onClick={() => scrollToSection('features')}
              className="bg-transparent text-[#FF3366] border-2 border-[#FF3366] px-7 py-3.5 rounded-full font-semibold text-base hover:bg-[#FF3366]/10 transition-colors text-center"
            >
              See How
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-10 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-4xl md:text-5xl font-black mb-16 text-center text-[#1D3557]">
            The Future of Email Relationship Management
          </h2>

          <div className="space-y-8">
            <div className="flex items-start gap-5 p-6 rounded-lg hover:bg-[#F1FAEE] transition-colors">
              <div className="w-12 h-12 bg-[#FF3366] rounded-full flex items-center justify-center text-white flex-shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold mb-2 text-[#1D3557]">5-Category AI Intelligence</h3>
                <p className="text-[#1D3557] leading-relaxed">
                  Automatically classifies emails as Urgent, Request, Question, Update, or Spam with confidence scoring
                  and priority ranking.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5 p-6 rounded-lg hover:bg-[#F1FAEE] transition-colors">
              <div className="w-12 h-12 bg-[#457B9D] rounded-full flex items-center justify-center text-white flex-shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold mb-2 text-[#1D3557]">Client Health Intelligence</h3>
                <p className="text-[#1D3557] leading-relaxed">
                  AI-powered relationship scoring (0-100) that tracks response patterns, sentiment analysis, and
                  identifies at-risk relationships before they become problems.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5 p-6 rounded-lg hover:bg-[#F1FAEE] transition-colors">
              <div className="w-12 h-12 bg-[#1D3557] rounded-full flex items-center justify-center text-white flex-shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold mb-2 text-[#1D3557]">Predictive Email Intelligence</h3>
                <p className="text-[#1D3557] leading-relaxed">
                  Advanced algorithms that predict response times, identify communication patterns, and provide
                  actionable insights to improve your email effectiveness and relationship management.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5 p-6 rounded-lg hover:bg-[#F1FAEE] transition-colors">
              <div className="w-12 h-12 bg-[#FF3366] rounded-full flex items-center justify-center text-white flex-shrink-0">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold mb-2 text-[#1D3557]">AI-Generated Responses</h3>
                <p className="text-[#1D3557] leading-relaxed">
                  One-click professional responses in Professional, Casual, or Formal tones. Slash response time by 80%
                  with smart drafting powered by sentiment analysis.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5 p-6 rounded-lg hover:bg-[#F1FAEE] transition-colors">
              <div className="w-12 h-12 bg-[#457B9D] rounded-full flex items-center justify-center text-white flex-shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold mb-2 text-[#1D3557]">Relationship Analytics Dashboard</h3>
                <p className="text-[#1D3557] leading-relaxed">
                  Comprehensive analytics showing response trends, relationship health scores, and predictive insights
                  to help you nurture professional relationships effectively.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simplified Pricing Section */}
      <section id="pricing" className="py-24 px-10 bg-[#F1FAEE]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-4xl md:text-5xl font-black mb-6 text-center text-[#1D3557]">
            Start Free, Upgrade When You Need More
          </h2>
          <p className="text-lg text-center text-[#1D3557] mb-16 max-w-2xl mx-auto">
            Powerful AI email management that grows with your business. No credit card required to start.
          </p>

          <div className="flex flex-col md:flex-row justify-center items-center gap-10">
            <div className="bg-white rounded-xl p-10 w-full max-w-xs text-center border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                MOST POPULAR
              </div>
              <h3 className="font-heading text-2xl font-bold mb-4 text-[#1D3557]">Starter</h3>
              <div className="font-heading text-5xl font-black mb-6 text-[#FF3366] leading-none">
                $0<span className="text-lg font-normal text-[#1D3557]">/mo</span>
              </div>
              <ul className="text-left text-base text-[#1D3557] mb-8 space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#FF3366] mr-3 mt-0.5 flex-shrink-0" />
                  100 emails/month
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#FF3366] mr-3 mt-0.5 flex-shrink-0" />
                  5-Category AI classification
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#FF3366] mr-3 mt-0.5 flex-shrink-0" />
                  Priority scoring & confidence levels
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#FF3366] mr-3 mt-0.5 flex-shrink-0" />
                  Basic response suggestions
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#FF3366] mr-3 mt-0.5 flex-shrink-0" />
                  Native Gmail integration
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#FF3366] mr-3 mt-0.5 flex-shrink-0" />
                  Basic relationship analytics
                </li>
              </ul>
              <a
                href="/signup"
                className="bg-[#FF3366] text-white px-6 py-3 rounded-full font-semibold text-base hover:bg-[#FF3366]/90 transition-colors block"
              >
                Start Free - No Credit Card
              </a>
            </div>

            <div className="bg-white rounded-xl p-10 w-full max-w-xs text-center border-2 border-[#FF3366] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 scale-105">
              <div className="inline-block bg-[#FF3366] text-white px-3 py-1 rounded-full text-sm font-semibold mb-4">
                FOR POWER USERS
              </div>
              <h3 className="font-heading text-2xl font-bold mb-4 text-[#1D3557]">Professional</h3>
              <div className="font-heading text-5xl font-black mb-6 text-[#FF3366] leading-none">
                $5<span className="text-lg font-normal text-[#1D3557]">/mo</span>
              </div>
              <ul className="text-left text-base text-[#1D3557] mb-8 space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#FF3366] mr-3 mt-0.5 flex-shrink-0" />
                  <strong>Unlimited emails</strong>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#FF3366] mr-3 mt-0.5 flex-shrink-0" />
                  Advanced AI with higher accuracy
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#FF3366] mr-3 mt-0.5 flex-shrink-0" />
                  3-tone response generation (Pro/Casual/Formal)
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#FF3366] mr-3 mt-0.5 flex-shrink-0" />
                  <strong>Client Health Scoring & Intelligence</strong>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#FF3366] mr-3 mt-0.5 flex-shrink-0" />
                  <strong>Predictive Email Analytics</strong>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#FF3366] mr-3 mt-0.5 flex-shrink-0" />
                  Advanced relationship dashboard
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#FF3366] mr-3 mt-0.5 flex-shrink-0" />
                  Sentiment analysis & emotion tracking
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#FF3366] mr-3 mt-0.5 flex-shrink-0" />
                  Priority customer support
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#FF3366] mr-3 mt-0.5 flex-shrink-0" />
                  Advanced deadline detection
                </li>
              </ul>
              <a
                href="/signup"
                className="bg-[#FF3366] text-white px-6 py-3 rounded-full font-semibold text-base hover:bg-[#FF3366]/90 transition-colors block"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-10 bg-gradient-to-br from-[#FF3366] to-[#FF6B6B] text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-4xl md:text-5xl font-black mb-4">Build Stronger Client Relationships</h2>
          <p className="text-xl mb-8 opacity-90">
            Join professionals who&apos;ve transformed their email productivity with AI-powered relationship
            intelligence that works inside Gmail and predicts client needs.
          </p>
          <a
            href="/signup"
            className="bg-white text-[#FF3366] px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all hover:-translate-y-0.5 inline-block"
          >
            Get Started Now
          </a>
        </div>
      </section>

      {/* Simplified Footer */}
      <footer className="py-16 px-10 bg-[#1D3557] text-white text-center">
        <div className="max-w-4xl mx-auto">
          <div className="font-heading text-3xl font-black mb-8 text-[#FF3366]">Take back control of your inbox</div>

          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <button
              onClick={() => scrollToSection('features')}
              className="text-white/80 hover:text-[#FF3366] transition-colors font-medium"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-white/80 hover:text-[#FF3366] transition-colors font-medium"
            >
              Pricing
            </button>
            <a href="#" className="text-white/80 hover:text-[#FF3366] transition-colors font-medium">
              Privacy
            </a>
            <a href="#" className="text-white/80 hover:text-[#FF3366] transition-colors font-medium">
              Terms
            </a>
            <a href="#" className="text-white/80 hover:text-[#FF3366] transition-colors font-medium">
              Contact
            </a>
          </div>

          <div className="pt-8 border-t border-white/20 text-white/70 text-sm">
            <p>&copy; 2023 TriageMail. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
