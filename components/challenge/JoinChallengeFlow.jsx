// Updated JoinChallengeFlow.jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStaking } from '@/lib/web3/hooks/useStaking';
import { useContract } from '@/lib/web3/hooks/useContract';
import { useYield } from '@/lib/web3/hooks/useYield';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import TransactionStatus from '@/components/ui/TransactionStatus';
import { ethers } from 'ethers';

export default function JoinChallengeFlow({ challenge, onSuccess, onCancel }) {
  const router = useRouter();
  const { isConnected, signer, usdcContract, stakingContract } = useContract();
  const { stakeForChallenge, isStaking, stakingError, transaction, stakingSuccess } = useStaking();
  const { projectedReward, apy } = useYield(challenge.stakeAmount, challenge.yieldPercentage, challenge.durationDays);
  
  const [step, setStep] = useState('confirmation'); // confirmation, staking, result
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState(null);
  const [stakingStage, setStakingStage] = useState(null); // 'approving', 'staking', 'confirming'
  
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
  
// Replace the approveUSDC function with this improved version:
const approveUSDC = async (amount) => {
  if (!usdcContract || !stakingContract || !isConnected) {
    throw new Error('Wallet not connected or contracts not initialized');
  }
  
  try {
    setError(null);
    console.log("Approving USDC amount:", amount);
    
    // Convert amount to USDC units (6 decimals)
    const usdcAmount = ethers.parseUnits(amount.toString(), 6);
    console.log("USDC amount in wei:", usdcAmount.toString());
    
    // Get contract target address
    const stakingAddress = stakingContract.target;
    console.log("Staking contract address:", stakingAddress);
    
    // Check if already approved
    const userAddress = await signer.getAddress();
    const allowance = await usdcContract.allowance(userAddress, stakingAddress);
    console.log("Current allowance:", allowance.toString());
    
    if (allowance >= usdcAmount) {
      console.log("USDC already approved");
      return { success: true };
    }
    
    // Approve staking contract to spend USDC with explicit gas settings
    console.log("Sending approval transaction...");
    const tx = await usdcContract.approve(stakingAddress, usdcAmount, {
      gasLimit: 100000 // Add explicit gas limit
    });
    console.log('Approval transaction submitted:', tx.hash);
    
    // Wait for confirmation
    console.log("Waiting for approval confirmation...");
    const receipt = await tx.wait();
    console.log('Approval transaction confirmed:', receipt);
    
    return { success: true, hash: receipt.hash };
  } catch (error) {
    console.error('Error approving USDC:', error);
    throw error;
  }
};

const handleJoinChallenge = async () => {
  console.log('Joining challenge...');
  setError(null);
  
  if (!isConnected) {
    setError('Please connect your wallet first');
    return;
  }
  
  try {
    setStep('staking');
    setStakingStage('approving');
    
    console.log("Challenge details:", {
      id: challenge.id,
      stakeAmount: challenge.stakeAmount,
      isHardcore: Boolean(challenge.isHardcore)
    });
    
    // With the updated contract, we can directly call stakeForChallenge
    const stakingTxHash = await stakeForChallenge(
      challenge.id,
      challenge.stakeAmount,
      Boolean(challenge.isHardcore)
    );
    
    if (!stakingTxHash) {
      throw new Error('Failed to stake. Please check console for details.');
    }
    
    console.log("Staking transaction successful:", stakingTxHash);
    setStakingStage('confirming');
    
    // Register participation on backend
    console.log("Registering challenge participation...");
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
    console.log("Join challenge API response:", joinData);
    
    if (onSuccess) {
      onSuccess(stakingTxHash);
    }
  } catch (error) {
    console.error('Error joining challenge:', error);
    setError(error.message || 'Failed to join challenge');
    setStep('confirmation'); // Go back to confirmation step on error
  }
};


const debugContractState = async () => {
  try {
    if (!stakingContract) {
      return "Staking contract not initialized";
    }
    
    const totalStaked = await stakingContract.totalStaked();
    const totalChallenges = await stakingContract.totalChallenges();
    const usdcBalance = await usdcContract.balanceOf(walletAddress);
    
    return {
      totalStaked: ethers.formatUnits(totalStaked, 6),
      totalChallenges: totalChallenges.toString(),
      usdcBalance: ethers.formatUnits(usdcBalance, 6)
    };
  } catch (error) {
    return `Error debugging contract: ${error.message}`;
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
  onClick={async () => {
    try {
      const info = {
        walletAddress: await signer.getAddress(),
        usdcBalance: ethers.formatUnits(await usdcContract.balanceOf(await signer.getAddress()), 6),
        totalStaked: ethers.formatUnits(await stakingContract.totalStaked(), 6),
        totalChallenges: (await stakingContract.totalChallenges()).toString(),
        contractAddresses: {
          usdc: usdcContract.target,
          staking: stakingContract.target
        }
      };
      alert(JSON.stringify(info, null, 2));
    } catch (e) {
      alert("Error: " + e.message);
    }
  }}
  className="px-4 py-2 bg-blue-200 text-blue-700 rounded-md mr-2"
>
  Debug Contract
</button>
        <button
          onClick={handleJoinChallenge}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-md hover:from-cyan-600 hover:to-teal-600 cursor-pointer"
          disabled={!isConnected}
        >
          {isConnected ? 'Join Challenge' : 'Connect Wallet to Join'}
        </button>
      </div>
    </div>
  );
  
  // Staking Step (loading) with detailed substages
  const renderStaking = () => (
    <div className="space-y-6 text-center py-8">
      <LoadingSpinner size="large" />
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Joining Challenge</h2>
        <p className="text-gray-600">
          {stakingStage === 'approving' ? 'Approving USDC spending...' : 
           stakingStage === 'staking' ? 'Staking tokens for challenge...' :
           stakingStage === 'confirming' ? 'Finalizing participation...' :
           'Processing transaction...'}
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Please confirm the transaction in your wallet.<br />
          Do not close this window until the process is complete.
        </p>
      </div>
      
      {/* Progress indicator */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-between">
            <div>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${
                stakingStage === 'approving' ? 'bg-cyan-600 text-white' : 
                stakingStage === 'staking' || stakingStage === 'confirming' ? 'bg-green-600 text-white' : 
                'bg-gray-300 text-gray-700'
              }`}>
                1
              </span>
              <span className="mt-2 block text-xs font-medium text-gray-700">Approve</span>
            </div>
            <div>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${
                stakingStage === 'staking' ? 'bg-cyan-600 text-white' : 
                stakingStage === 'confirming' ? 'bg-green-600 text-white' : 
                'bg-gray-300 text-gray-700'
              }`}>
                2
              </span>
              <span className="mt-2 block text-xs font-medium text-gray-700">Stake</span>
            </div>
            <div>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${
                stakingStage === 'confirming' ? 'bg-cyan-600 text-white' : 
                'bg-gray-300 text-gray-700'
              }`}>
                3
              </span>
              <span className="mt-2 block text-xs font-medium text-gray-700">Confirm</span>
            </div>
          </div>
        </div>
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