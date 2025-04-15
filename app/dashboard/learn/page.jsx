'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function LearnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userChallengeId, setUserChallengeId] = useState(null);
  const [challengeId, setChallengeId] = useState(null);
  const [languageCode, setLanguageCode] = useState('en');
  const [proficiencyLevel, setProficiencyLevel] = useState('BEGINNER');
  const [isLoading, setIsLoading] = useState(true);
  const [practiceInfo, setPracticeInfo] = useState(null);
  
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
              setUserChallengeId(data[0].id);
              
              // Fetch language code from challenge
              const challengeRes = await fetch(`/api/challenges/${id}`);
              if (challengeRes.ok) {
                const challengeData = await challengeRes.json();
                setLanguageCode(challengeData.languageCode);
                setProficiencyLevel(challengeData.proficiencyLevel);
                
                // Fetch practice info
                if (data[0].id) {
                  const practiceInfoRes = await fetch(`/api/challenges/practice-info?userChallengeId=${data[0].id}`);
                  if (practiceInfoRes.ok) {
                    const practiceData = await practiceInfoRes.json();
                    setPracticeInfo(practiceData);
                  }
                }
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
              setProficiencyLevel(userData.learningLanguages[0].proficiencyLevel);
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
  
  // Format language name
  const getLanguageName = (code) => {
    const languages = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ru': 'Russian',
      'pt': 'Portuguese',
      'ar': 'Arabic',
      'hi': 'Hindi'
    };
    
    return languages[code] || code;
  };
  
  // Format language flag emoji
  const getLanguageFlag = (code) => {
    const flags = {
      'ja': '🇯🇵',
      'ko': '🇰🇷',
      'zh': '🇨🇳',
      'en': '🇬🇧',
      'es': '🇪🇸',
      'fr': '🇫🇷',
      'de': '🇩🇪',
      'it': '🇮🇹',
      'ru': '🇷🇺',
      'pt': '🇵🇹',
      'ar': '🇸🇦', 
      'hi': '🇮🇳'
    };
    
    return flags[code] || '🌐';
  };
  
  // Generate URL with parameters
  const getLearningModuleUrl = (path) => {
    const params = new URLSearchParams();
    if (challengeId) {
      params.append('challengeId', challengeId);
    } else {
      params.append('language', languageCode);
    }
    
    return `${path}?${params.toString()}`;
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="large" />
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">{getLanguageFlag(languageCode)}</span>
              <h1 className="text-2xl font-bold text-slate-800">{getLanguageName(languageCode)} Learning</h1>
            </div>
            
            {practiceInfo && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-700">Daily Goal</span>
                  <span className="font-medium">
                    {practiceInfo.todayProgress}/{practiceInfo.dailyRequirement} minutes
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full ${practiceInfo.todayCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-cyan-400 to-teal-500'}`}
                    style={{ width: `${Math.min(100, (practiceInfo.todayProgress / practiceInfo.dailyRequirement) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Current streak: {practiceInfo.currentStreak} days</span>
                  <span className="text-slate-500">Proficiency: {proficiencyLevel.charAt(0) + proficiencyLevel.slice(1).toLowerCase()}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Learning Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Conversation Practice */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Conversation Practice</h2>
                </div>
                
                <p className="text-slate-600 mb-6">
                  Practice natural conversation with our AI tutor. Receive instant feedback and corrections to improve your speaking skills.
                </p>
                
                <Link 
                  href={getLearningModuleUrl("/dashboard/learn/conversation")}
                  className="block w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-colors"
                >
                  Start Conversation
                </Link>
              </div>
            </div>
            
            {/* Vocabulary Practice */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Vocabulary Practice</h2>
                </div>
                
                <p className="text-slate-600 mb-6">
                  Expand your vocabulary with interactive exercises. Learn new words and test your knowledge with quizzes.
                </p>
                
                <Link 
                  href={getLearningModuleUrl("/dashboard/learn/vocabulary")}
                  className="block w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-center rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-colors"
                >
                  Practice Vocabulary
                </Link>
              </div>
            </div>
            
            {/* Grammar Exercises */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Grammar Exercises</h2>
                </div>
                
                <p className="text-slate-600 mb-6">
                  Master grammar rules through interactive exercises. Practice sentence structure, verb conjugation, and more.
                </p>
                
                <Link 
                  href={getLearningModuleUrl("/dashboard/learn/grammar")}
                  className="block w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-center rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-colors"
                >
                  Practice Grammar
                </Link>
              </div>
            </div>
            
            {/* Speaking Practice */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Speaking Practice</h2>
                </div>
                
                <p className="text-slate-600 mb-6">
                  Improve your pronunciation with our speech recognition technology. Get feedback on your accent and speaking clarity.
                </p>
                
                <Link 
                  href={getLearningModuleUrl("/dashboard/learn/speaking")}
                  className="block w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-center rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-colors"
                >
                  Practice Speaking
                </Link>
              </div>
            </div>
           
           
          </div>
          
          {/* Learning Tips */}
          <div className="mt-10 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Tips to Maximize Your Learning</h2>
            </div>
            <div className="p-6">
              <ul className="space-y-4">
                <li className="flex">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <p className="text-slate-700">
                    <span className="font-medium">Practice daily:</span> Consistent practice is more effective than occasional long sessions.
                  </p>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <p className="text-slate-700">
                    <span className="font-medium">Mix learning methods:</span> Combine vocabulary, grammar, speaking, and listening for balanced progress.
                  </p>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <p className="text-slate-700">
                    <span className="font-medium">Learn through conversation:</span> Real dialogue practice helps internalize grammar and vocabulary.
                  </p>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <p className="text-slate-700">
                    <span className="font-medium">Set specific goals:</span> Having clear objectives helps you stay motivated and measure progress.
                  </p>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <p className="text-slate-700">
                    <span className="font-medium">Track your progress:</span> Regularly review your statistics to see improvement and identify areas to focus on.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}