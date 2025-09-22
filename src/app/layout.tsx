import { Space_Grotesk, Syne } from 'next/font/google';
import '../styles/globals.css';
import '../styles/layout.css';
import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://triagemail.com'),
  title: 'TriageMail',
  description:
    'AI-powered email triage that works everywhere Gmail does. Save 5+ hours weekly with smart categorization and one-click AI responses.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={'min-h-full dark'}>
      <body className={`${spaceGrotesk.variable} ${syne.variable} font-sans`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
