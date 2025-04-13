// app/dashboard/statistics/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PracticeChart from '@/components/dashboard/PracticeChart';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export default function StatisticsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [timeRange, setTimeRange] = useState('month');
  
  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true);
        
        // Construct query params
        const params = new URLSearchParams();
        if (selectedLanguage !== 'all') {
          params.append('languageCode', selectedLanguage);
        }
        params.append('period', timeRange);
        
        const response = await fetch(`/api/users/analytics?${params.toString()}`);
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/auth/signin');
            return;
          }
          throw new Error('Failed to fetch analytics');
        }
        
        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAnalytics();
  }, [selectedLanguage, timeRange, router]);
  
  // Function to generate chart data
  const generateChartData = () => {
    if (!analyticsData?.practiceByDay) return [];
    
    // Calculate date range
    const endDate = new Date();
    let startDate;
    
    switch (timeRange) {
      case 'week':
        startDate = subDays(endDate, 7);
        break;
      case 'month':
        startDate = subDays(endDate, 30);
        break;
      case 'year':
        startDate = subDays(endDate, 365);
        break;
      default:
        startDate = subDays(endDate, 30);
    }
    
    // Generate all dates in range
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Format dates and map to practice minutes
    return dateRange.map(date => {
      const dateString = format(date, 'yyyy-MM-dd');
      const dayData = analyticsData.practiceByDay[dateString] || {};
      
      // If specific language selected, return only that language data
      if (selectedLanguage !== 'all') {
        return {
          date: format(date, 'MMM dd'),
          minutes: dayData[selectedLanguage] || 0
        };
      }
      
      // Otherwise, sum all languages
      const totalMinutes = Object.values(dayData).reduce((sum, min) => sum + min, 0);
      
      return {
        date: format(date, 'MMM dd'),
        minutes: totalMinutes
      };
    });
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-40 bg-slate-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  const chartData = generateChartData();
  
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

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Learning Statistics</h1>
            
            <div className="flex space-x-4">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="all">All Languages</option>
                {analyticsData?.streaksByLanguage && Object.keys(analyticsData.streaksByLanguage).map(lang => (
                  <option key={lang} value={lang}>
                    {getLanguageName(lang)}
                  </option>
                ))}
              </select>
              
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="year">Last 365 days</option>
              </select>
            </div>
          </div>
          
          {/* Summary Stats */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard 
              title="Total Practice Time" 
              value={`${analyticsData?.summary?.totalPracticeMinutes || 0} minutes`} 
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>}
              color="cyan"
            />
            
            <StatCard 
              title="Challenges Completed" 
              value={analyticsData?.challengeCompletions?.length || 0} 
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>}
              color="green"
            />
            
            <StatCard 
              title="Total Rewards Earned" 
              value={`$${analyticsData?.summary?.totalEarned?.toFixed(2) || '0.00'}`} 
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>}
              color="amber"
            />
          </div> */}
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-8">
  <div className="px-6 py-4 border-b border-slate-100">
    <h2 className="text-xl font-bold text-slate-800">Practice Minutes</h2>
  </div>
  
  <div className="p-6">
    <div className="h-64">
      <PracticeChart data={chartData} />
    </div>
  </div>
</div>
          {/* Current Streaks */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Current Streaks</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData?.streaksByLanguage && Object.entries(analyticsData.streaksByLanguage).map(([lang, streak]) => (
                  <div key={lang} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">
                        {lang === 'ja' ? '🇯🇵' : 
                         lang === 'ko' ? '🇰🇷' : 
                         lang === 'zh' ? '🇨🇳' : 
                         lang === 'en' ? '🇬🇧' : 
                         lang === 'es' ? '🇪🇸' : 
                         lang === 'fr' ? '🇫🇷' : '🌐'}
                      </span>
                      <h3 className="font-medium text-slate-700">{getLanguageName(lang)}</h3>
                    </div>
                    <div className="flex items-end">
                      <span className="text-3xl font-bold text-cyan-600">{streak}</span>
                      <span className="ml-2 text-slate-500">days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Recent Challenges */}
          {analyticsData?.challengeCompletions?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">Completed Challenges</h2>
              </div>
              
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-2 text-left text-slate-700 border-b border-slate-200">Challenge</th>
                        <th className="px-4 py-2 text-left text-slate-700 border-b border-slate-200">Language</th>
                        <th className="px-4 py-2 text-right text-slate-700 border-b border-slate-200">Stake</th>
                        <th className="px-4 py-2 text-right text-slate-700 border-b border-slate-200">Reward</th>
                        <th className="px-4 py-2 text-right text-slate-700 border-b border-slate-200">Completion Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.challengeCompletions.map((completion) => {
                        const reward = completion.challenge.stakeAmount * (1 + completion.challenge.yieldPercentage / 100);
                        
                        return (
                          <tr key={completion ?.id} className="border-b border-slate-200">
                            <td className="px-4 py-2 text-slate-700">{completion.challenge.title}</td>
                            <td className="px-4 py-2 text-slate-700">{getLanguageName(completion.challenge.languageCode)}</td>
                            <td className="px-4 py-2 text-right text-slate-700">${completion.challenge.stakeAmount.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right text-slate-700">${reward.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right text-slate-700">{completion.completionDate}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>    
        </div>                                                          
      </DashboardLayout>
    );
  };    