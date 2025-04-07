// app/dashboard/challenges/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ChallengeCard from '@/components/dashboard/ChallengeCard';
import LoadingState from '@/components/ui/LoadingState';
import EmptyState from '@/components/ui/EmptyState';

export default function ChallengesPage() {
  const router = useRouter();
  const [challenges, setChallenges] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchChallenges() {
      try {
        setIsLoading(true);
        
        // Fetch active challenges for this user
        const activeRes = await fetch('/api/challenges/user?status=ACTIVE');
        
        if (!activeRes.ok) {
          throw new Error('Failed to fetch active challenges');
        }
        
        const activeData = await activeRes.json();
        setActiveChallenges(activeData);
        
        // Fetch available challenges
        const availableRes = await fetch('/api/challenges');
        
        if (!availableRes.ok) {
          throw new Error('Failed to fetch available challenges');
        }
        
        const availableData = await availableRes.json();
        setChallenges(availableData);
      } catch (error) {
        console.error('Error fetching challenges:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchChallenges();
  }, []);
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8 px-4">
          <LoadingState message="Loading challenges..." height="64" />
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Challenges</h1>
            <p className="text-gray-600">Accelerate your language learning with challenges</p>
          </div>
          <Link 
            href="/dashboard/challenges/create"
            className="mt-4 md:mt-0 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all"
          >
            Create New Challenge
          </Link>
        </div>
        
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error loading challenges</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {/* Active Challenges Section */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Active Challenges</h2>
          
          {activeChallenges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeChallenges.map(challenge => (
                <ChallengeCard 
                  key={challenge.id}
                  challenge={challenge.challenge}
                  userChallenge={challenge}
                  isActive={true}
                  onClick={() => router.push(`/dashboard/challenges/${challenge.challengeId}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              title="No active challenges"
              message="Join an existing challenge or create your own to get started!"
              action={{
                text: "Create Challenge",
                onClick: () => router.push('/dashboard/challenges/create')
              }}
            />
          )}
        </div>
        
        {/* Available Challenges Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Available Challenges</h2>
          
          {challenges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges
                .filter(c => !activeChallenges.some(ac => ac.challengeId === c.id))
                .map(challenge => (
                  <ChallengeCard 
                    key={challenge.id}
                    challenge={challenge}
                    isActive={false}
                    onClick={() => router.push(`/dashboard/challenges/${challenge.id}`)}
                  />
              ))}
            </div>
          ) : (
            <EmptyState 
              title="No challenges available"
              message="Be the first to create a challenge for the community!"
              action={{
                text: "Create First Challenge",
                onClick: () => router.push('/dashboard/challenges/create')
              }}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}