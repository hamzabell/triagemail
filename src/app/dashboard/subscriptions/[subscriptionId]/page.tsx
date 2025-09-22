'use client';

import { LoadingScreen } from '@/components/dashboard/layout/loading-screen';
import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { SubscriptionDetail } from '@/components/dashboard/subscriptions/components/subscription-detail';

export default function SubscriptionPage() {
  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-[#1D3557]">Subscription Details</h1>
        <p className="text-[#1D3557]/70">View and manage your subscription details</p>
      </div>
      <Suspense fallback={<LoadingScreen />}>
        <SubscriptionDetail subscriptionId={subscriptionId} />
      </Suspense>
    </div>
  );
}
