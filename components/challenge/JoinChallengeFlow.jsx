'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStaking } from '@/lib/web3/hooks/useStaking';
import { useContract } from '@/lib/web3/hooks/useContract';
import { useYield } from '@/lib/web3/hooks/useYield';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import TransactionStatus from '@/components/ui/TransactionStatus';

export default function JoinChallengeFlow({ challenge, onSuccess, onCancel }) {
  const router = useRouter();
  const { isConnected, signer } = useContract();
  const { stakeForChallenge, isStaking, stakingError, transaction, stakingSuccess } = useStaking();
  const { projectedReward, apy } = useYield(challenge.stakeAmount, challenge.yieldPercentage, challenge.durationDays);
  
  const [step, setStep] = useState('confirmation'); // confirmation, staking, result
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState(null);
  
  // Get connected wallet address
  useEffect(() => {
    const getAddress = async () => {
      if (signer) {
        try {
          const address = await signer.getAddress();
          setWalletAddress(address);
        } catch (err) {
          console.error('Error getting wallet address:', err);
        }
      }
    };
    
    getAddress();
  }, [signer]);
  
  // Handle transaction status changes
  useEffect(() => {
    if (stakingSuccess) {
      setStep('result');
    }
  }, [stakingSuccess]);
  
  // Handle staking errors
  useEffect(() => {
    if (stakingError) {
      setError(stakingError);
    }
  }, [stakingError]);
  
// Enhanced staking function in JoinChallengeFlow.jsx
const handleJoinChallenge = async () => {
  setError(null);
  
  if (!isConnected) {
    setError('Please connect your wallet first');
    return;
  }
  
  try {
    setStep('staking');
    setStakingStage('approving'); // Track substages: 'approving', 'staking', 'confirming'
    
    // 1. First approve USDC spending
    try {
      const approvalTx = await approveUSDC(challenge.stakeAmount);
      setStakingStage('staking');
      console.log('USDC approval confirmed:', approvalTx);
    } catch (approvalError) {
      if (approvalError.code === 4001) {
        throw new Error('You rejected the approval transaction. Please approve USDC spending to continue.');
      }
      throw new Error(`Failed to approve USDC: ${approvalError.message}`);
    }
    
    // 2. Stake for the challenge
    try {
      const stakingTxHash = await stakeForChallenge(
        challenge.id,
        challenge.stakeAmount,
        challenge.isHardcore
      );
      
      if (!stakingTxHash) {
        throw new Error('Failed to stake. Please try again.');
      }
      
      setStakingStage('confirming');
      
      // 3. Register participation on backend
      const joinResponse = await fetch('/api/challenges/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId: challenge.id,
          transactionHash: stakingTxHash
        }),
      });
      
      if (!joinResponse.ok) {
        const errorData = await joinResponse.json();
        throw new Error(errorData.error || 'Failed to join challenge');
      }
      
      const joinData = await joinResponse.json();
      
      // 4. Success - call onSuccess callback with complete data
      if (onSuccess) {
        onSuccess(stakingTxHash, joinData);
      }
    } catch (stakingError) {
      if (stakingError.code === 4001) {
        throw new Error('You rejected the staking transaction. Please approve the transaction to join the challenge.');
      }
      throw stakingError;
    }
  } catch (error) {
    console.error('Error joining challenge:', error);
    setError(error.message || 'Failed to join challenge');
    setStep('confirmation'); // Go back to confirmation step on error
  }
};

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Confirmation Step
  const renderConfirmation = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Confirm Challenge Participation</h2>
      
      {error && (
        <ErrorMessage 
          message={error} 
          dismiss={() => setError(null)} 
        />
      )}
      
      <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
        <h3 className="font-medium">{challenge.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{challenge.description}</p>
        
        <div className="mt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Duration:</span>
            <span className="text-sm font-medium">{challenge.durationDays} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Daily requirement:</span>
            <span className="text-sm font-medium">{challenge.dailyRequirement} minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Stake amount:</span>
            <span className="text-sm font-medium">{formatCurrency(challenge.stakeAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Potential reward:</span>
            <span className="text-sm font-medium text-green-600">{formatCurrency(projectedReward)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Effective APY:</span>
            <span className="text-sm font-medium text-green-600">{apy.toFixed(2)}%</span>
          </div>
        </div>
      </div>
      
      {challenge.isHardcore && (
        <div className="bg-red-50 p-4 rounded-md text-red-700 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Hardcore Challenge</h3>
              <div className="mt-1 text-sm">
                <p>
                  This is a hardcore challenge. If you fail to meet the daily requirements, your stake will be forfeited.
                  Make sure you're committed before joining.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleJoinChallenge}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-md hover:from-cyan-600 hover:to-teal-600"
          disabled={!isConnected}
        >
          {isConnected ? 'Join Challenge' : 'Connect Wallet to Join'}
        </button>
      </div>
    </div>
  );
  
  // Staking Step (loading)
  const renderStaking = () => (
    <div className="space-y-6 text-center py-8">
      <LoadingSpinner size="large" />
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Staking in Progress</h2>
        <p className="text-gray-500">
          Please confirm the transaction in your wallet.<br />
          Do not close this window until the transaction is complete.
        </p>
      </div>
    </div>
  );
  
  // Result Step
  const renderResult = () => (
    <div className="space-y-6">
      <TransactionStatus 
        txHash={transaction?.hash}
        status={transaction?.status || 'success'}
        message={
          transaction?.status === 'success' 
            ? `You've successfully joined the ${challenge.title} challenge!` 
            : 'There was an issue with your transaction.'
        }
      />
      
      <div className="text-center mt-6">
        <p className="mb-4">
          {transaction?.status === 'success' 
            ? "You're all set! Start practicing today to make progress on your challenge." 
            : "Please try again or contact support if the issue persists."}
        </p>
        
        <div className="flex justify-center space-x-4 mt-4">
          {transaction?.status === 'success' ? (
            <>
              <button
                onClick={() => router.push('/dashboard/learn')}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-md hover:from-cyan-600 hover:to-teal-600"
              >
                Start Learning
              </button>
              <button
                onClick={() => router.push('/dashboard/challenges')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                View My Challenges
              </button>
            </>
          ) : (
            <button
              onClick={() => setStep('confirmation')}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-md hover:from-cyan-600 hover:to-teal-600"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-lg mx-auto">
      {step === 'confirmation' && renderConfirmation()}
      {step === 'staking' && renderStaking()}
      {step === 'result' && renderResult()}
    </div>
  );
}