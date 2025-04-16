// lib/web3/hooks/useStaking.js
'use client'
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useContract } from './useContract';

export function useStaking() {
  const { stakingContract, usdcContract, isConnected, signer } = useContract();
  const [isStaking, setIsStaking] = useState(false);
  const [stakingError, setStakingError] = useState(null);
  const [stakingSuccess, setStakingSuccess] = useState(false);
  const [transaction, setTransaction] = useState(null);

  // Function to approve USDC for spending by the staking contract
  const approveUSDC = useCallback(async (amount) => {
    if (!usdcContract || !isConnected) {
      throw new Error('Wallet not connected or contract not initialized');
    }

    try {
      setStakingError(null);
      // Convert amount to USDC units (6 decimals)
      const usdcAmount = ethers.parseUnits(amount.toString(), 6);
      
      // Approve staking contract to spend USDC
      const tx = await usdcContract.approve(stakingContract.target, usdcAmount);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error approving USDC:', error);
      throw error;
    }
  }, [usdcContract, stakingContract, isConnected]);

  const stakeForChallenge = useCallback(async (challengeId, amount, isHardcore) => {
    if (!stakingContract || !isConnected) {
      setStakingError('Wallet not connected or contract not initialized');
      return null;
    }
  
    try {
      setIsStaking(true);
      setStakingError(null);
      setStakingSuccess(false);
      
      // Convert to USDC units (6 decimals)
      const usdcAmount = ethers.parseUnits(amount.toString(), 6);
      
      // Use a SHORT challenge ID (first 10 chars only)
      const shortId = challengeId.slice(0, 10);
      
      console.log("Staking for challenge:", {
        shortId,
        amount: amount.toString(),
        usdcAmount: usdcAmount.toString(),
        isHardcore: Boolean(isHardcore)
      });
      
      // Approve USDC if needed
      const userAddress = await signer.getAddress();
      const allowance = await usdcContract.allowance(userAddress, stakingContract.target);
      
      console.log("Current allowance:", allowance.toString());
      
      if (allowance < usdcAmount) {
        console.log("Approving USDC...");
        
        // Calculate double the amount for approval
        const doubleAmount = ethers.parseUnits((parseFloat(amount) * 2).toString(), 6);
        
        const approveTx = await usdcContract.approve(
          stakingContract.target,
          doubleAmount,
          { gasLimit: 150000 }
        );
        
        await approveTx.wait();
        console.log("USDC approved");
      }
      
      // Execute staking transaction
      console.log("Executing stakeForChallenge...");
      const tx = await stakingContract.stakeForChallenge(
        shortId,
        usdcAmount,
        Boolean(isHardcore),
        { gasLimit: 500000 }
      );
      
      console.log("Staking transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Staking transaction confirmed:", receipt);
      
      setTransaction({
        hash: receipt.hash,
        status: 'success',
        amount,
        challengeId
      });
      
      setStakingSuccess(true);
      return receipt.hash;
    } catch (error) {
      console.error("Staking error details:", error);
      setStakingError(error.message || 'Failed to stake for challenge');
      return null;
    } finally {
      setIsStaking(false);
    }
  }, [stakingContract, usdcContract, signer, isConnected]);

  // Function to withdraw from a non-hardcore challenge
  const withdrawFromChallenge = useCallback(async (challengeId) => {
    if (!stakingContract || !isConnected) {
      setStakingError('Wallet not connected or contract not initialized');
      return null;
    }

    try {
      setIsStaking(true);
      setStakingError(null);
      setStakingSuccess(false);
      
      const tx = await stakingContract.withdrawFromChallenge(
        challengeId,
        { gasLimit: 300000 }
      );
      
      const receipt = await tx.wait();
      
      setTransaction({
        hash: receipt.hash,
        status: receipt.status ? 'success' : 'failed',
        challengeId
      });
      
      if (receipt.status) {
        setStakingSuccess(true);
        return receipt.hash;
      } else {
        setStakingError('Transaction failed');
        return null;
      }
    } catch (error) {
      console.error('Error withdrawing from challenge:', error);
      setStakingError(error.message || 'Failed to withdraw from challenge');
      return null;
    } finally {
      setIsStaking(false);
    }
  }, [stakingContract, isConnected]);

  // Get user's active challenges
  const getUserActiveChallenges = useCallback(async (userAddress) => {
    if (!stakingContract) return [];
    
    try {
      const challenges = await stakingContract.getUserActiveChallenges(userAddress);
      return challenges;
    } catch (error) {
      console.error('Error getting active challenges:', error);
      return [];
    }
  }, [stakingContract]);

  // Get stake details for a challenge
  const getStakeDetails = useCallback(async (userAddress, challengeId) => {
    if (!stakingContract) return null;
    
    try {
      const [amount, timestamp, isHardcore, isCompleted, isFailed] = 
        await stakingContract.getStake(userAddress, challengeId);
      
      return {
        amount: ethers.formatUnits(amount, 6), // Convert from USDC units
        timestamp: new Date(Number(timestamp) * 1000),
        isHardcore,
        isCompleted,
        isFailed
      };
    } catch (error) {
      console.error('Error getting stake details:', error);
      return null;
    }
  }, [stakingContract]);

  return {
    stakeForChallenge,
    withdrawFromChallenge,
    getUserActiveChallenges,
    getStakeDetails,
    isStaking,
    stakingError,
    stakingSuccess,
    transaction,
    approveUSDC
  };
}