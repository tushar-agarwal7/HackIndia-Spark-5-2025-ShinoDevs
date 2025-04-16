// app/dashboard/profile/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import TransactionStatus from '@/components/ui/TransactionStatus';
import { useContract } from '@/lib/web3/hooks/useContract';

export default function ProfilePage() {
  const router = useRouter();
  const { isConnected, connectWallet } = useContract();
  
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nativeLanguage: '',
    learningLanguages: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [challenges, setChallenges] = useState([]);
  
  // Define language options
  const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ru', name: 'Russian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' }
  ];
  
  // Define proficiency levels
  const PROFICIENCY_LEVELS = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'ELEMENTARY', label: 'Elementary' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
    { value: 'FLUENT', label: 'Fluent' }
  ];
  
  useEffect(() => {
    async function fetchProfileData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch user profile
        const profileRes = await fetch('/api/users/profile');
        
        if (!profileRes.ok) {
          if (profileRes.status === 401) {
            router.push('/auth/signin');
            return;
          }
          throw new Error('Failed to fetch user profile');
        }
        
        const profileData = await profileRes.json();
        setProfile(profileData);
        
        // Initialize form data with current profile values
        setFormData({
          username: profileData.username || '',
          email: profileData.email || '',
          nativeLanguage: profileData.nativeLanguage || '',
          learningLanguages: profileData.learningLanguages?.length > 0 
            ? [...profileData.learningLanguages] 
            : [{
                languageCode: '',
                proficiencyLevel: 'BEGINNER'
              }]
        });
        
        // Fetch active challenges
        const challengesRes = await fetch('/api/challenges/user?status=ACTIVE');
        if (challengesRes.ok) {
          const challengesData = await challengesRes.json();
          setChallenges(challengesData);
        }
        
        // Fetch achievements (TODO: implement API endpoint)
        // For now, using placeholder data
        setAchievements([
          {
            id: '1',
            name: '5-Day Streak',
            description: 'Practiced language for 5 consecutive days',
            earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            badgeUrl: '/badges/streak.svg',
            achievementType: 'STREAK_DAYS'
          },
          {
            id: '2',
            name: '100 Words Mastered',
            description: 'Learned and mastered 100 vocabulary words',
            earnedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            badgeUrl: '/badges/vocabulary.svg',
            achievementType: 'VOCABULARY_SIZE'
          }
        ]);
        
        // Fetch transactions (TODO: implement API endpoint)
        // For now, using placeholder data
        setTransactions([
          {
            id: '1',
            transactionType: 'STAKE',
            amount: 100,
            currency: 'USDC',
            txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            status: 'COMPLETED',
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            transactionType: 'REWARD',
            amount: 105,
            currency: 'USDC',
            txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            status: 'COMPLETED',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]);
        
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError(error.message || 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProfileData();
  }, [router]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle learning language changes
  const handleLearningLanguageChange = (index, field, value) => {
    setFormData(prev => {
      const newLearningLanguages = [...prev.learningLanguages];
      newLearningLanguages[index] = {
        ...newLearningLanguages[index],
        [field]: value
      };
      return { ...prev, learningLanguages: newLearningLanguages };
    });
  };
  
  // Add a new learning language
  const addLearningLanguage = () => {
    setFormData(prev => ({
      ...prev,
      learningLanguages: [
        ...prev.learningLanguages,
        { languageCode: '', proficiencyLevel: 'BEGINNER' }
      ]
    }));
  };
  
  // Remove a learning language
  const removeLearningLanguage = (index) => {
    setFormData(prev => {
      const newLearningLanguages = [...prev.learningLanguages];
      newLearningLanguages.splice(index, 1);
      return { ...prev, learningLanguages: newLearningLanguages };
    });
  };
  
  // Start editing profile
  const handleEditProfile = () => {
    setIsEditing(true);
    setSubmitSuccess(false);
    setSubmitError(null);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    // Reset form to current profile data
    setFormData({
      username: profile.username || '',
      email: profile.email || '',
      nativeLanguage: profile.nativeLanguage || '',
      learningLanguages: profile.learningLanguages?.length > 0 
        ? [...profile.learningLanguages] 
        : [{
            languageCode: '',
            proficiencyLevel: 'BEGINNER'
          }]
    });
    setIsEditing(false);
    setSubmitError(null);
  };
  
  // Submit profile updates
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.username.trim()) {
      setSubmitError('Username is required');
      return;
    }
    
    if (!formData.email.trim()) {
      setSubmitError('Email is required');
      return;
    }
    
    if (!formData.nativeLanguage) {
      setSubmitError('Native language is required');
      return;
    }
    
    // Validate learning languages
    if (formData.learningLanguages.some(lang => !lang.languageCode)) {
      setSubmitError('Please select all learning languages or remove empty ones');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      const updatedProfile = await response.json();
      
      // Update local state with the response
      setProfile(updatedProfile);
      setIsEditing(false);
      setSubmitSuccess(true);
      
      // Show success message briefly
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setSubmitError(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle exiting a challenge
  const handleExitChallenge = async (challengeId) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/exit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to exit challenge');
      }
      
      // Refresh challenges
      const challengesRes = await fetch('/api/challenges/user?status=ACTIVE');
      if (challengesRes.ok) {
        const challengesData = await challengesRes.json();
        setChallenges(challengesData);
      }
      
    } catch (error) {
      console.error('Error exiting challenge:', error);
      alert(error.message || 'Failed to exit challenge');
    }
  };
  
  // Get language name from code
  const getLanguageName = (code) => {
    const language = LANGUAGES.find(lang => lang.code === code);
    return language ? language.name : code;
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  // Format transaction type
  const formatTransactionType = (type) => {
    const types = {
      'STAKE': 'Stake',
      'UNSTAKE': 'Unstake',
      'REWARD': 'Reward',
      'YIELD': 'Yield'
    };
    
    return types[type] || type;
  };
  
  // Format currency amount
  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'USDC' ? 'USD' : currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Get language flag emoji
  const getLanguageFlag = (code) => {
    const flags = {
      ja: "🇯🇵",
      ko: "🇰🇷",
      zh: "🇨🇳",
      en: "🇬🇧",
      es: "🇪🇸",
      fr: "🇫🇷",
      de: "🇩🇪",
      it: "🇮🇹",
      ru: "🇷🇺",
      pt: "🇵🇹",
      ar: "🇸🇦",
      hi: "🇮🇳",
    };
    return flags[code] || "🌐";
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <LoadingSpinner size="large" />
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8 px-4">
          <ErrorMessage
            title="Failed to load profile"
            message={error}
            retry={() => window.location.reload()}
          />
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="mb-8 border-b border-gray-200">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
              <li className="mr-2">
                <button
                  className={`inline-block p-4 rounded-t-lg ${
                    activeTab === 'profile'
                      ? 'border-b-2 border-cyan-500 text-cyan-600'
                      : 'hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('profile')}
                >
                  Profile
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`inline-block p-4 rounded-t-lg ${
                    activeTab === 'challenges'
                      ? 'border-b-2 border-cyan-500 text-cyan-600'
                      : 'hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('challenges')}
                >
                  My Challenges
                </button>
              </li>
              
              <li>
                <button
                  className={`inline-block p-4 rounded-t-lg ${
                    activeTab === 'transactions'
                      ? 'border-b-2 border-cyan-500 text-cyan-600'
                      : 'hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('transactions')}
                >
                  Transactions
                </button>
              </li>
            </ul>
          </div>
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              {/* Profile Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center text-cyan-600 font-bold text-2xl mr-4">
                      {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="text-white">
                      <h1 className="text-2xl font-bold">{profile?.username || 'User'}</h1>
                      <p className="text-cyan-100">
                        {profile?.walletAddress ? 
                          `${profile.walletAddress.slice(0, 6)}...${profile.walletAddress.slice(-4)}` : 
                          'No wallet connected'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {submitSuccess && (
                    <div className="mb-6 bg-green-50 text-green-700 border border-green-200 rounded-md p-4">
                      <p className="font-medium">Profile updated successfully!</p>
                    </div>
                  )}
                  
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {submitError && (
                        <div className="bg-red-50 text-red-700 border border-red-200 rounded-md p-4">
                          <p className="font-medium">Error</p>
                          <p className="text-sm">{submitError}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Username */}
                        <div>
                          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                            Username<span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                            required
                          />
                        </div>
                        
                        {/* Email */}
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email<span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                            required
                          />
                        </div>
                      </div>
                      
                      {/* Native Language */}
                      <div>
                        <label htmlFor="nativeLanguage" className="block text-sm font-medium text-gray-700 mb-1">
                          Native Language<span className="text-red-500">*</span>
                        </label>
                        <select
                          id="nativeLanguage"
                          name="nativeLanguage"
                          value={formData.nativeLanguage}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                          required
                        >
                          <option value="">Select your native language</option>
                          {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>
                              {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Learning Languages */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Learning Languages<span className="text-red-500">*</span>
                        </label>
                        
                        {formData.learningLanguages.map((lang, index) => (
                          <div key={index} className="flex items-center space-x-4 mb-4">
                            <div className="flex-1">
                              <select
                                value={lang.languageCode}
                                onChange={(e) => handleLearningLanguageChange(index, 'languageCode', e.target.value)}
                                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                                required
                              >
                                <option value="">Select language</option>
                                {LANGUAGES.map(option => (
                                  <option key={option.code} value={option.code}>
                                    {option.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="flex-1">
                              <select
                                value={lang.proficiencyLevel}
                                onChange={(e) => handleLearningLanguageChange(index, 'proficiencyLevel', e.target.value)}
                                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                                required
                              >
                                {PROFICIENCY_LEVELS.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            {formData.learningLanguages.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeLearningLanguage(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={addLearningLanguage}
                          className="mt-2 flex items-center text-cyan-600 hover:text-cyan-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Add Language
                        </button>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-md hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50"
                        >
                          {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Username</h3>
                          <p className="font-medium text-gray-900">{profile?.username || 'Not set'}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                          <p className="font-medium text-gray-900">{profile?.email || 'Not set'}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Native Language</h3>
                          <p className="font-medium text-gray-900">
                            {profile?.nativeLanguage ? getLanguageName(profile.nativeLanguage) : 'Not set'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Learning Languages</h3>
                        
                        {profile?.learningLanguages?.length > 0 ? (
                          <div className="space-y-3">
                            {profile.learningLanguages.map((lang, index) => (
                              <div key={index} className="flex items-center bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <span className="text-2xl mr-3">
                                  {getLanguageFlag(lang.languageCode)}
                                </span>
                                <div>
                                  <p className="font-medium text-gray-900">{getLanguageName(lang.languageCode)}</p>
                                  <p className="text-sm text-gray-500">
                                    {PROFICIENCY_LEVELS.find(level => level.value === lang.proficiencyLevel)?.label || lang.proficiencyLevel}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No learning languages set</p>
                        )}
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          onClick={handleEditProfile}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-md hover:from-cyan-600 hover:to-teal-600"
                        >
                          Edit Profile
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Challenges Tab */}
          {activeTab === 'challenges' && (
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-xl font-bold text-gray-800">My Active Challenges</h2>
                </div>
                
                <div className="p-6">
                  {challenges.length > 0 ? (
                    <div className="space-y-6">
                      {challenges.map(challenge => (
                        <div key={challenge.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex justify-between">
                            <div className="flex items-start">
                              <span className="text-2xl mr-3">
                                {getLanguageFlag(challenge.challenge.languageCode)}
                              </span>
                              <div>
                                <h3 className="font-medium text-gray-900">{challenge.challenge.title}</h3>
                                <div className="flex mt-1 space-x-2">
                                  <span className="text-xs px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-full">
                                    {calculateDaysRemaining(challenge.endDate)} days left
                                  </span>
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full">
                                    {challenge.challenge.dailyRequirement} min/day
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-medium px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                                {formatCurrency(challenge.stakedAmount, 'USDC')}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Progress</span>
                              <span className="font-medium text-gray-900">
                                {challenge.progressPercentage}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-cyan-400 to-teal-500 h-2 rounded-full"
                                style={{ width: `${challenge.progressPercentage}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="flex flex-wrap mt-4 gap-2">
                            <button
                              onClick={() => router.push(`/dashboard/challenges/${challenge.challengeId}`)}
                              className="px-3 py-1.5 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 text-sm"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => router.push(`/dashboard/learn?challengeId=${challenge.challengeId}`)}
                              className="px-3 py-1.5 bg-teal-500 text-white rounded-md hover:bg-teal-600 text-sm"
                            >
                              Practice Now
                            </button>
                            <button
                              onClick={() => handleExitChallenge(challenge.challengeId)}
                              className="px-3 py-1.5 border border-red-300 text-red-600 rounded-md hover:bg-red-50 text-sm"
                            >
                              Exit Challenge
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No active challenges</h3>
                      <p className="mt-1 text-gray-500">You haven't joined any challenges yet.</p>
                      <button
                        onClick={() => router.push('/dashboard/challenges')}
                        className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-md hover:from-cyan-600 hover:to-teal-600"
                      >
                        Browse Challenges
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
        
          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-xl font-bold text-gray-800">Transaction History</h2>
                </div>
                
                <div className="p-6">
                  {transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                           
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {transactions.map(transaction => (
                            <tr key={transaction.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  transaction.transactionType === 'STAKE' 
                                    ? 'bg-blue-100 text-blue-800'
                                    : transaction.transactionType === 'REWARD' 
                                      ? 'bg-green-100 text-green-800'
                                      : transaction.transactionType === 'UNSTAKE'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {formatTransactionType(transaction.transactionType)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatCurrency(transaction.amount, transaction.currency)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {formatDate(transaction.createdAt)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  transaction.status === 'COMPLETED' 
                                    ? 'bg-green-100 text-green-800'
                                    : transaction.status === 'PENDING' 
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                }`}>
                                  {transaction.status}
                                </span>
                              </td>
                            
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No transactions yet</h3>
                      <p className="mt-1 text-gray-500">Your transaction history will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
  
  // Helper function to calculate days remaining
  function calculateDaysRemaining(endDate) {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }
}