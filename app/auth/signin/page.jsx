// app/auth/signin/page.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import WalletConnectButton from '@/components/auth/WalletConnectButton';
import UserProfileForm from '@/components/auth/UserProfileForm';

export default function SignIn() {
  const router = useRouter();
  const [step, setStep] = useState('connect'); // 'connect' or 'profile'
  const [walletData, setWalletData] = useState(null);
  const [error, setError] = useState(null);
  
  const handleWalletSuccess = (data) => {
    setWalletData(data);
    
    // If user is already registered and profile is complete, redirect to dashboard
    if (!data.isNewUser) {
      router.push('/dashboard');
      return;
    }
    
    // Otherwise, proceed to profile setup
    setStep('profile');
  };
  
  const handleWalletError = (errorMessage) => {
    setError(errorMessage);
  };
  
  const handleProfileSuccess = () => {
    router.push('/dashboard');
  };
  
  const handleProfileError = (errorMessage) => {
    setError(errorMessage);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white py-4 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <Image src="/logo.svg" alt="ShinobiSpeak Logo" width={40} height={40} />
              <span className="text-xl font-bold">ShinobiSpeak</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
              <button 
                className="float-right font-bold"
                onClick={() => setError(null)}
              >
                ×
              </button>
            </div>
          )}
          
          {step === 'connect' ? (
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-6">Welcome to ShinobiSpeak</h1>
              <p className="mb-8 text-gray-600">
                Connect your wallet to sign in or create an account
              </p>
              
              <div className="mb-6">
                <WalletConnectButton
                  onSuccess={handleWalletSuccess}
                  onError={handleWalletError}
                />
              </div>
              
              <p className="text-sm text-gray-500">
                By connecting your wallet, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold mb-6">Complete Your Profile</h1>
              <p className="mb-8 text-gray-600">
                Tell us more about yourself to get personalized language learning
              </p>
              
              <UserProfileForm
                walletAddress={walletData.walletAddress}
                onSuccess={handleProfileSuccess}
                onError={handleProfileError}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

