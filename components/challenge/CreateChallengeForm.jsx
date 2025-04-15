// components/challenge/CreateChallengeForm.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useContract } from '@/lib/web3/hooks/useContract';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import TransactionStatus from '@/components/ui/TransactionStatus';
import { ethers } from 'ethers';
import { nanoid } from 'nanoid';

// List of available languages
const LANGUAGES = [
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ru', name: 'Russian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' }
];

// Proficiency level options
const PROFICIENCY_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'ELEMENTARY', label: 'Elementary' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'FLUENT', label: 'Fluent' }
];

export default function CreateChallengeForm() {
  const router = useRouter();
  const { 
    isConnected, 
    stakingContract, 
    usdcContract, 
    connectWallet, 
    isLoading: isContractLoading, 
    checkNetwork,
    switchToLocalNetwork,
    networkName,
    chainId,
    signer
  } = useContract();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    languageCode: '',
    proficiencyLevel: 'BEGINNER',
    durationDays: 1,
    dailyRequirement: 20,
    stakeAmount: 100,
    yieldPercentage: 5,
    isHardcore: false,
    maxParticipants: 10,
    inviteCode: '',
    autoJoin: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [transaction, setTransaction] = useState(null);
  const [step, setStep] = useState('form'); // form, submitting, success
  const [submissionProgress, setSubmissionProgress] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  
  // Check if on correct network
  useEffect(() => {
    const verifyNetwork = async () => {
      if (isConnected) {
        const onCorrectNetwork = await checkNetwork();
        setIsCorrectNetwork(onCorrectNetwork);
      }
    };
    
    verifyNetwork();
  }, [isConnected, checkNetwork, chainId]);
  
  // Validate form is completely filled
  const isFormValid = () => {
    const requiredFields = [
      'title',
      'languageCode',
      'proficiencyLevel',
      'durationDays',
      'dailyRequirement',
      'stakeAmount'
    ];
    
    const isValid = requiredFields.every(field => {
      const value = formData[field];
      return value !== undefined && value !== null && value !== '';
    });
    
    const hasValidNumbers = 
      parseInt(formData.durationDays) >= 1 &&
      parseInt(formData.dailyRequirement) >= 5 &&
      parseFloat(formData.stakeAmount) >= 10;
    
    return isValid && hasValidNumbers;
  };
  
  // Estimate daily commitment
  const getDailyCommitmentLevel = () => {
    const mins = parseInt(formData.dailyRequirement);
    if (mins <= 10) return { level: 'Easy', color: 'text-green-500' };
    if (mins <= 20) return { level: 'Moderate', color: 'text-amber-500' };
    if (mins <= 40) return { level: 'Challenging', color: 'text-orange-500' };
    return { level: 'Intense', color: 'text-red-500' };
  };
  
  // Calculate potential reward
  const calculatePotentialReward = () => {
    const stake = parseFloat(formData.stakeAmount);
    const yield_pct = parseFloat(formData.yieldPercentage);
    
    if (isNaN(stake) || isNaN(yield_pct)) return 0;
    
    return stake * (1 + (yield_pct / 100));
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Function to approve USDC spending
  const approveUSDC = async (amount) => {
    try {
      setSubmissionProgress({
        step: 'approving',
        message: 'Approving USDC spending...'
      });
      
      // Check if already approved
      const userAddress = await signer.getAddress();
      const allowance = await usdcContract.allowance(userAddress, stakingContract.target);
      const amountInWei = ethers.parseUnits(amount.toString(), 6); // USDC has 6 decimals
      
      if (allowance >= amountInWei) {
        console.log("USDC already approved");
        return true;
      }
      
      // Approve USDC spending
      const approveTx = await usdcContract.approve(
        stakingContract.target, 
        amountInWei
      );
      
      setSubmissionProgress({
        step: 'approvingConfirmation',
        message: 'Waiting for approval confirmation...',
        txHash: approveTx.hash
      });
      
      // Wait for confirmation
      const approveReceipt = await approveTx.wait();
      
      if (!approveReceipt.status) {
        throw new Error("USDC approval transaction failed");
      }
      
      return true;
    } catch (error) {
      console.error("Error approving USDC:", error);
      throw new Error(`Failed to approve USDC: ${error.message}`);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!isFormValid()) {
      setError('Please fill out all required fields');
      return;
    }
    
    if (!isConnected) {
      try {
        await connectWallet();
      } catch (connError) {
        setError('Please connect your wallet to create a challenge');
        return;
      }
    }
    
    if (!isCorrectNetwork) {
      try {
        const switched = await switchToLocalNetwork();
        if (!switched) {
          setError('Please switch to Localhost network to create a challenge');
          return;
        }
      } catch (networkError) {
        setError('Failed to switch to Localhost network. Please switch manually in your wallet.');
        return;
      }
    }
    
    setError(null);
    setIsSubmitting(true);
    setStep('submitting');
    
    try {
      let transactionHash = null;
      let contractAddress = null;
      
      // Register on blockchain if connected
      if (isConnected && stakingContract) {
        try {
          // Show detailed progress to user
          setSubmissionProgress({
            step: 'preparing',
            message: 'Preparing contract transaction...'
          });
          
          // Convert values for contract
          const stakeAmount = Math.round(parseFloat(formData.stakeAmount) * 100); // Convert to cents
          const yieldBps = Math.round(parseFloat(formData.yieldPercentage) * 100); // Convert to basis points
          
          // Create a unique challenge ID - use timestamp + random string
          const challengeId = `${Date.now()}-${nanoid(8)}`;
          
          // First approve USDC if necessary
          await approveUSDC(formData.stakeAmount);
          
          setSubmissionProgress({
            step: 'confirming',
            message: 'Please confirm the transaction in your wallet...'
          });
          
          // Call the contract function
          const tx = await stakingContract.registerChallenge(
            challengeId,
            ethers.parseUnits(formData.stakeAmount.toString(), 6), // Convert to USDC units (6 decimals)
            yieldBps,
            formData.isHardcore,
            parseInt(formData.durationDays),
            { gasLimit: 500000 }
          );
          
          setSubmissionProgress({
            step: 'mining',
            message: 'Transaction submitted! Waiting for confirmation...',
            txHash: tx.hash
          });
          
          // Wait for transaction confirmation
          const receipt = await tx.wait();
          
          if (receipt.status) {
            transactionHash = receipt.hash;
            contractAddress = stakingContract.target;
            
            setSubmissionProgress({
              step: 'confirmed',
              message: 'Transaction confirmed! Creating challenge...',
              txHash: receipt.hash
            });
          } else {
            throw new Error('Transaction failed');
          }
        } catch (contractError) {
          console.error('Error registering challenge on blockchain:', contractError);
          
          // Provide more specific error message
          if (contractError.code === 4001) {
            throw new Error('Transaction rejected. Please approve the transaction in your wallet.');
          } else if (contractError.message.includes('gas')) {
            throw new Error('Transaction failed: Gas estimation error. Please try again with different parameters.');
          } else {
            throw new Error(`Blockchain error: ${contractError.message}`);
          }
        }
      } else {
        // Development mode: create without blockchain
        console.warn("Creating challenge without blockchain integration - development mode");
        transactionHash = "0x" + Array(64).fill('0').join('');
        contractAddress = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
      }
      
      // Create challenge in database
      const challengeData = {
        ...formData,
        transactionHash,
        contractAddress,
        contractChain: 'localhost' // Changed from 'polygon' to 'localhost'
      };
      
      const response = await fetch('/api/challenges/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(challengeData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create challenge');
      }
      
      const data = await response.json();
      
      // Store transaction information
      if (transactionHash) {
        setTransaction({
          hash: transactionHash,
          status: 'success'
        });
      }
      
      setSuccess(true);
      setStep('success');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/dashboard/challenges/${data.id}`);
      }, 3000);
    } catch (error) {
      console.error('Error creating challenge:', error);
      setError(error.message || 'Failed to create challenge');
      setStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render network warning if needed
  const renderNetworkWarning = () => {
    if (isConnected && !isCorrectNetwork) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Wrong Network Detected</h3>
              <p className="text-sm mt-1">
                You are currently on {networkName || 'an unsupported network'}. Please switch to Localhost network to create challenges.
              </p>
              <button
                onClick={switchToLocalNetwork}
                className="mt-2 px-3 py-1 text-sm bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200"
              >
                Switch to Localhost
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Render the form step
  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <ErrorMessage 
          message={error} 
          dismiss={() => setError(null)} 
        />
      )}
      
      {renderNetworkWarning()}
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Challenge Details</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Challenge Title*
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500"
              placeholder="e.g., '30-Day Japanese Speaking Challenge'"
              required
            />
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500"
              placeholder="Describe your challenge and what participants will achieve..."
            />
          </div>
          
          {/* Language and Proficiency */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="languageCode" className="block text-sm font-medium text-gray-700">
                Language*
              </label>
              <select
                id="languageCode"
                name="languageCode"
                value={formData.languageCode}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500"
                required
              >
                <option value="">Select a language</option>
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="proficiencyLevel" className="block text-sm font-medium text-gray-700">
                Proficiency Level*
              </label>
              <select
                id="proficiencyLevel"
                name="proficiencyLevel"
                value={formData.proficiencyLevel}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500"
                required
              >
                {PROFICIENCY_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Challenge Parameters */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Challenge Parameters</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Duration and Daily Requirement */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="durationDays" className="block text-sm font-medium text-gray-700">
                Duration (days)*
              </label>
              <input
                type="number"
                id="durationDays"
                name="durationDays"
                min="0"
                max="365"
                value={formData.durationDays}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                We recommend 30-90 days for optimal results
              </p>
            </div>
            
            <div>
              <label htmlFor="dailyRequirement" className="block text-sm font-medium text-gray-700">
                Daily Practice (minutes)*
              </label>
              <input
                type="number"
                id="dailyRequirement"
                name="dailyRequirement"
                min="5"
                max="120"
                value={formData.dailyRequirement}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Commitment level: <span className={getDailyCommitmentLevel().color}>{getDailyCommitmentLevel().level}</span>
              </p>
            </div>
          </div>
          
          {/* Stake Amount and Yield */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="stakeAmount" className="block text-sm font-medium text-gray-700">
                Stake Amount (USDC)*
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="stakeAmount"
                  name="stakeAmount"
                  min="10"
                  max="1000"
                  value={formData.stakeAmount}
                  onChange={handleChange}
                  className="block w-full pl-7 pr-12 py-2 rounded-md border border-gray-300 focus:border-cyan-500 focus:outline-none focus:ring-cyan-500"
                  placeholder="0.00"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">USDC</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Minimum stake: $10 USDC
              </p>
            </div>
            
            <div>
              <label htmlFor="yieldPercentage" className="block text-sm font-medium text-gray-700">
                Yield Percentage
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  id="yieldPercentage"
                  name="yieldPercentage"
                  min="0"
                  max="20"
                  step="0.5"
                  value={formData.yieldPercentage}
                  onChange={handleChange}
                  className="block w-full pr-12 py-2 rounded-md border border-gray-300 focus:border-cyan-500 focus:outline-none focus:ring-cyan-500"
                  placeholder="5"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Potential reward: ${calculatePotentialReward().toFixed(2)} USDC
              </p>
            </div>
          </div>
          
          {/* Challenge Type and Max Participants */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="isHardcore"
                  name="isHardcore"
                  type="checkbox"
                  checked={formData.isHardcore}
                  onChange={handleChange}
                  className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="isHardcore" className="font-medium text-gray-700">
                  Hardcore Challenge
                </label>
                <p className="text-gray-500">
                  Stake is forfeited if daily requirements are not met
                </p>
              </div>
            </div>
            
            <div>
              <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">
                Max Participants (optional)
              </label>
              <input
                type="number"
                id="maxParticipants"
                name="maxParticipants"
                min="0"
                max="1000"
                value={formData.maxParticipants}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Leave empty for unlimited participants
              </p>
            </div>
          </div>
          
          {/* Invite Code */}
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700">
              Private Invite Code (optional)
            </label>
            <input
              type="text"
              id="inviteCode"
              name="inviteCode"
              value={formData.inviteCode}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500"
              placeholder="Leave empty for public challenge"
            />
            <p className="mt-1 text-sm text-gray-500">
              Create a private challenge only accessible via invite code
            </p>
          </div>
          
          {/* Auto-join option */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="autoJoin"
                name="autoJoin"
                type="checkbox"
                checked={formData.autoJoin}
                onChange={handleChange}
                className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="autoJoin" className="font-medium text-gray-700">
                Join my own challenge
              </label>
              <p className="text-gray-500">
                Automatically join this challenge after creation
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Wallet Connection Notice */}
      {!isConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Wallet not connected</h3>
              <p className="text-sm mt-1">
                Connect your wallet to enable blockchain integration for staking and rewards.
              </p>
              <button
                type="button"
                onClick={connectWallet}
                className="mt-2 px-3 py-1 text-sm bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 mr-3"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isFormValid() || isSubmitting}
          className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50"
        >
          Create Challenge
        </button>
      </div>
    </form>
  );
  
  // Render the submitting step with detailed progress
  const renderSubmitting = () => (
    <div className="text-center py-12">
      <LoadingSpinner size="large" />
      <h2 className="mt-4 text-lg font-medium text-gray-900">Creating Your Challenge</h2>
      
      {submissionProgress && (
        <div className="mt-6 max-w-md mx-auto">
          <div className="space-y-4">
            <div className="flex items-center">
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                submissionProgress.step === 'preparing' ? 'bg-blue-500 text-white' : 
                submissionProgress.step === 'approving' || submissionProgress.step === 'approvingConfirmation' ? 'bg-yellow-500 text-white' : 
                submissionProgress.step === 'confirming' ? 'bg-yellow-500 text-white' : 
                submissionProgress.step === 'mining' ? 'bg-yellow-500 text-white' : 
                submissionProgress.step === 'confirmed' ? 'bg-green-500 text-white' : 
                'bg-gray-200'
              }`}>
                {submissionProgress.step === 'confirmed' ? (
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  '1'
                )}
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium">{
                  submissionProgress.step === 'preparing' ? 'Preparing Transaction' : 
                  submissionProgress.step === 'approving' ? 'Approving USDC Spending' : 
                  submissionProgress.step === 'approvingConfirmation' ? 'Confirming USDC Approval' : 
                  submissionProgress.step === 'confirming' ? 'Waiting for Confirmation' : 
                  submissionProgress.step === 'mining' ? 'Processing Transaction' : 
                  submissionProgress.step === 'confirmed' ? 'Transaction Confirmed' : 
                  'Processing'
                }</h3>
                <p className="text-sm text-gray-500">{submissionProgress.message}</p>
                
                {submissionProgress.txHash && (
                  <a 
                    href={`https://mumbai.polygonscan.com/tx/${submissionProgress.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-600 hover:text-cyan-800 mt-1 inline-block"
                  >
                    View transaction on explorer
                  </a>
                )}
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                submissionProgress.step === 'confirmed' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium">Creating Challenge Record</h3>
                <p className="text-sm text-gray-500">
                  {submissionProgress.step === 'confirmed' 
                    ? 'Saving challenge details to our database...' 
                    : 'Waiting for blockchain confirmation...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <p className="mt-4 text-sm text-gray-500">
        This process may take a minute or two to complete. Please don't close this window.
      </p>
    </div>
  );
  
  // Render the success step
  const renderSuccess = () => (
    <div className="text-center py-12">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
        <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="mt-4 text-lg font-medium text-gray-900">Challenge Created Successfully!</h2>
      <p className="mt-2 text-sm text-gray-500">
        Your challenge is now ready. Redirecting to challenge details...
      </p>
      
      {transaction && (
        <div className="mt-6 max-w-md mx-auto">
          <TransactionStatus 
            txHash={transaction.hash}
            status={transaction.status}
            message="Blockchain transaction completed"
            network="mumbai"
          />
        </div>
      )}
    </div>
  );
  
  // Render the appropriate step
  return (
    <DashboardLayout>
      <div className="py-8">
        <div className="max-w-3xl mx-auto">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Create New Challenge
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Set up a new language learning challenge and invite others to join you.
              </p>
            </div>
          </div>
          
          {step === 'form' && renderForm()}
          {step === 'submitting' && renderSubmitting()}
          {step === 'success' && renderSuccess()}
        </div>
      </div>
    </DashboardLayout>
  );
}