// app/dashboard/learn/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ConversationInterface from '@/components/learn/ConversationInterface';

export default function LearnPage() {
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
  
  const handleStartConversation = () => {
    setShowConversation(true);
  };
  
  if (showConversation) {
    return (
      <ConversationInterface 
        languageCode={languageCode} 
        userChallengeId={userChallenge?.id}
      />
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-slate-100">
              <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                <span className="text-3xl mr-3">
                  {languageCode === 'ja' ? '🇯🇵' : 
                   languageCode === 'ko' ? '🇰🇷' : 
                   languageCode === 'zh' ? '🇨🇳' : 
                   languageCode === 'en' ? '🇬🇧' : 
                   languageCode === 'es' ? '🇪🇸' : 
                   languageCode === 'fr' ? '🇫🇷' : '🌐'}
                </span>
                {languageCode === 'ja' ? 'Japanese' : 
                 languageCode === 'ko' ? 'Korean' : 
                 languageCode === 'zh' ? 'Chinese' : 
                 languageCode === 'en' ? 'English' : 
                 languageCode === 'es' ? 'Spanish' : 
                 languageCode === 'fr' ? 'French' : 'Language'} Practice
              </h1>
            </div>
            
            <div className="p-6">
              {userChallenge ? (
                <div className="mb-6">
                  <h2 className="font-medium text-slate-800 mb-2">Challenge Progress</h2>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-600">Daily Goal:</span>
                      <span className="font-medium text-slate-800">
                        0/{userChallenge.challenge?.dailyRequirement} minutes
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                      <div className="bg-gradient-to-r from-cyan-500 to-teal-500 h-2 rounded-full w-0"></div>
                    </div>
                    <div className="text-sm text-slate-500">
                      Complete {userChallenge.challenge?.dailyRequirement} minutes of practice today to maintain your streak.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <h2 className="font-medium text-amber-800 mb-2">Free Practice Session</h2>
                    <p className="text-slate-600">
                      You're in free practice mode. Consider joining a challenge to track your progress 
                      and earn rewards for consistent practice.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <h2 className="font-medium text-slate-800 mb-2">Practice Options</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:border-cyan-300 cursor-pointer" onClick={handleStartConversation}>
                    <h3 className="font-medium text-slate-700 flex items-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      Free Conversation
                    </h3>
                    <p className="text-sm text-slate-600">
                      Practice natural conversation on any topic with our AI language tutor.
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:border-cyan-300 cursor-pointer">
                    <h3 className="font-medium text-slate-700 flex items-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                      Vocabulary Practice
                    </h3>
                    <p className="text-sm text-slate-600">
                      Focus on expanding your vocabulary with targeted exercises.
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:border-cyan-300 cursor-pointer">
                    <h3 className="font-medium text-slate-700 flex items-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      Grammar Exercises
                    </h3>
                    <p className="text-sm text-slate-600">
                      Practice specific grammar points with structured exercises.
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:border-cyan-300 cursor-pointer">
                    <h3 className="font-medium text-slate-700 flex items-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Listening Comprehension
                    </h3>
                    <p className="text-sm text-slate-600">
                      Improve your listening skills with audio exercises and questions.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                <h2 className="font-medium text-teal-800 mb-2">AI Tutor Tips</h2>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-teal-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Try to speak in complete sentences to get better feedback.
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-teal-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    The AI will provide corrections in [brackets] when you make mistakes.
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-teal-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Don't hesitate to ask the AI to explain grammar or vocabulary.
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-teal-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Practice for at least 15-20 minutes for the best learning experience.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}