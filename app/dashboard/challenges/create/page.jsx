'use client';

// app/dashboard/challenges/create/page.jsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Dynamically import the challenge creation form to avoid hydration issues with wallet connection
const CreateChallengeForm = dynamic(
  () => import('@/components/challenge/CreateChallengeForm'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }
);

export default function Page() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="py-8">
          <div className="max-w-3xl mx-auto text-center">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-500">Loading challenge creation form...</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <CreateChallengeForm />
    </Suspense>
  );
}