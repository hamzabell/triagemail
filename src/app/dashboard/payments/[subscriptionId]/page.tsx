'use client';

import { PaymentsContent } from '@/components/dashboard/payments/payments-content';
import { LoadingScreen } from '@/components/dashboard/layout/loading-screen';
import { Suspense } from 'react';
import { useParams } from 'next/navigation';

export default function SubscriptionsPaymentPage() {
  const { subscriptionId } = useParams<{ subscriptionId: string }>();

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-[#1D3557]">Payment Details</h1>
        <p className="text-[#1D3557]/70">View and manage payment details for subscription</p>
      </div>
      <Suspense fallback={<LoadingScreen />}>
        <PaymentsContent subscriptionId={subscriptionId} />
      </Suspense>
    </div>
  );
}
