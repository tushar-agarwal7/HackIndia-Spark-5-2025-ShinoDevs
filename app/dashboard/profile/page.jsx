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
<div>
    hello
</div>
  )
}