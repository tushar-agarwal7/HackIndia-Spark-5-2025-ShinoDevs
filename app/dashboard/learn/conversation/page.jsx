
'use client';
import ConversationInterface from '@/components/learn/ConversationInterface'
import React from 'react'
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

const CoversationPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userChallenge, setUserChallenge] = useState(null);
  const [challengeId, setChallengeId] = useState(null);
  const [languageCode, setLanguageCode] = useState('en');
  const [isLoading, setIsLoading] = useState(true);
  const [showConversation, setShowConversation] = useState(false);
  
    
  useEffect(() => {
    async function fetchUserChallengeData() {
      try {
        setIsLoading(true);
        const id = searchParams.get('challengeId');
        
        if (id) {
          setChallengeId(id);
          
          // Fetch challenge participation details
          const res = await fetch(`/api/challenges/user?challengeId=${id}`);
          
          if (res.ok) {
            const data = await res.json();
            if (data.length > 0) {
              setUserChallenge(data[0]);
              
              // Fetch language code from challenge
              const challengeRes = await fetch(`/api/challenges/${id}`);
              if (challengeRes.ok) {
                const challengeData = await challengeRes.json();
                setLanguageCode(challengeData.languageCode);
              }
            }
          }
        } else {
          // No challenge ID provided, use user's preferred language
          const userRes = await fetch('/api/users/profile');
          if (userRes.ok) {
            const userData = await userRes.json();
            if (userData.learningLanguages && userData.learningLanguages.length > 0) {
              setLanguageCode(userData.learningLanguages[0].languageCode);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching challenge data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserChallengeData();
  }, [searchParams]);
  
  return (
    <div>
        <ConversationInterface  languageCode={languageCode} 
        userChallengeId={userChallenge?.id}  />
    </div>
  )
}

export default CoversationPage