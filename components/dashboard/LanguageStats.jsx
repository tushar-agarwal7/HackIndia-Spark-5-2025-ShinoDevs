// components/dashboard/LanguageStats.jsx
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LanguageStats({ languageCode, proficiencyLevel }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get language name from language code
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
  
  // Calculate progress percentage based on proficiency level
  const getProgressPercentage = (level) => {
    const levels = {
      'BEGINNER': 20,
      'ELEMENTARY': 40,
      'INTERMEDIATE': 60,
      'ADVANCED': 80,
      'FLUENT': 100
    };
    
    return levels[level] || 0;
  };
  
  useEffect(() => {
    const fetchLanguageStats = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/users/language-stats?languageCode=${languageCode}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch language statistics');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching language stats:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (languageCode) {
      fetchLanguageStats();
    }
  }, [languageCode]);
  
  // Format date as relative time (e.g., "2 days ago")
  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };
  
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-2 bg-gray-200 rounded mb-2.5"></div>
        <div className="h-2 bg-gray-200 rounded mb-2.5"></div>
        <div className="h-2 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="border border-red-200 rounded-lg p-4 bg-red-50 text-red-700">
        <p className="font-medium">Error loading language statistics</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  
  if (!stats) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-500">No statistics available for this language.</p>
      </div>
    );
  }
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold">{getLanguageName(languageCode)}</h3>
        <span className="text-sm text-gray-500">
          {proficiencyLevel.charAt(0) + proficiencyLevel.slice(1).toLowerCase()}
        </span>
      </div>
      
      <div className="p-4">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Progress</span>
            <span>{getProgressPercentage(proficiencyLevel)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ width: `${getProgressPercentage(proficiencyLevel)}%` }}
            ></div>
          </div>
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500">Current streak</div>
            <div className="font-bold text-lg">{stats.currentStreak || 0} days</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Vocabulary size</div>
            <div className="font-bold text-lg">{stats.vocabularySize || 0} words</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Total practice time</div>
            <div className="font-bold text-lg">{stats.totalMinutesPracticed || 0} min</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Last practiced</div>
            <div className="font-bold text-lg">{getRelativeTime(stats.lastPracticed)}</div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2">
          <Link 
            href={`/dashboard/learn?language=${languageCode}`}
            className="flex-1 py-2 text-center bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Practice Now
          </Link>
          <Link 
            href={`/dashboard/challenges?language=${languageCode}`}
            className="flex-1 py-2 text-center border border-primary text-primary rounded-md hover:bg-primary-50 transition-colors"
          >
            Find Challenges
          </Link>
        </div>
      </div>
    </div>
  );
}