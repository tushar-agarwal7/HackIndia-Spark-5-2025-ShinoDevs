// components/dashboard/RecentActivity.jsx
import { useState, useEffect } from 'react';

export default function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Fetch real activity data from API
    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/users/activity');
        
        if (!response.ok) {
          throw new Error('Failed to fetch activity data');
        }
        
        const data = await response.json();
        setActivities(data.activities || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActivities();
  }, []);
  
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
  
  // Format date as relative time (e.g., "2 hours ago")
  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} months ago`;
  };
  
  // Get icon for activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'practice':
        return (
          <div className="rounded-full bg-blue-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        );
      case 'challenge':
        return (
          <div className="rounded-full bg-purple-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        );
      case 'achievement':
        return (
          <div className="rounded-full bg-yellow-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="rounded-full bg-gray-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex items-start space-x-3 animate-pulse">
            <div className="rounded-full bg-gray-200 h-8 w-8"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 border border-red-200 rounded-md p-4">
        <p className="font-medium">Error loading activities</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  
  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No recent activity.</p>
        <p className="text-sm text-gray-400 mt-1">Start learning to see your activities here.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3">
          {getActivityIcon(activity.type)}
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="text-sm font-medium">
                {getLanguageName(activity.language)}
              </span>
              <span className="text-xs text-gray-500">
                {getRelativeTime(activity.timestamp)}
              </span>
            </div>
            <p className="text-sm text-gray-600">{activity.details}</p>
          </div>
        </div>
      ))}
    </div>
  );
}