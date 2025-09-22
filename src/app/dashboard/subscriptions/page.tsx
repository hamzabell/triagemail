import { LoadingScreen } from '@/components/dashboard/layout/loading-screen';
import { Suspense } from 'react';
import { Subscriptions } from '@/components/dashboard/subscriptions/subscriptions';

export default async function SubscriptionsListPage() {
  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-[#1D3557]">Subscriptions</h1>
        <p className="text-[#1D3557]/70">Manage your subscription plans and billing cycles</p>
      </div>
      <Suspense fallback={<LoadingScreen />}>
        <Subscriptions />
      </Suspense>
    </div>
  );
}
