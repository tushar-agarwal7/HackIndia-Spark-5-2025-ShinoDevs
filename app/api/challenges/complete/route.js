// app/api/challenges/complete/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';
import { ethers } from 'ethers';
import stakingABI from '@/lib/web3/abis/stakingABI.json';

const prisma = new PrismaClient();

export async function POST(request) {
  const auth = await verifyAuth();
  
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { userChallengeId } = body;
    
    if (!userChallengeId) {
      return NextResponse.json({ error: 'User challenge ID is required' }, { status: 400 });
    }
    
    // Get user challenge with related challenge info
    const userChallenge = await prisma.userChallenge.findUnique({
      where: { 
        id: userChallengeId,
        userId: auth.userId, // Ensure the challenge belongs to the authenticated user
        status: 'ACTIVE'
      },
      include: {
        challenge: true,
        dailyProgress: true,
        user: true
      }
    });

    if (!userChallenge) {
      return NextResponse.json({ error: 'Challenge not found or already completed' }, { status: 404 });
    }

    // Log the challenge completion request for audit purposes
    console.log(`Challenge completion request: ${userChallengeId} by user ${auth.userId}`);

    // Check completion criteria
    const totalDays = userChallenge.challenge.durationDays;
    const completedDays = userChallenge.dailyProgress.filter(p => p.completed).length;

    // For simplicity, we'll say a challenge is complete if the user has completed at least 80% of the days
    const completionThreshold = Math.floor(totalDays * 0.8);

    if (completedDays < completionThreshold) {
      return NextResponse.json({ 
        error: `Challenge not yet complete. You've completed ${completedDays} days out of ${totalDays} required.`,
        completedDays,
        totalDays,
        completionThreshold
      }, { status: 400 });
    }

    // Calculate reward amount
    const rewardAmount = userChallenge.stakedAmount * (1 + userChallenge.challenge.yieldPercentage / 100);

    // Set the transaction status to pending while we process blockchain transaction
    await prisma.userChallenge.update({
      where: { id: userChallengeId },
      data: {
        status: 'PENDING_COMPLETION'
      }
    });

    // Process blockchain transaction
    let transactionHash = null;
    
    try {
      // Initialize ethereum provider
      const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
      
      // Initialize admin wallet
      const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
      
      // Initialize staking contract with admin signer
      const stakingContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS,
        stakingABI,
        adminWallet
      );
      
      // Calculate yield percentage in basis points (1/100 of percent)
      const yieldBps = Math.round(userChallenge.challenge.yieldPercentage * 100);
      
      // Call contract method to complete challenge
      const tx = await stakingContract.completeChallenge(
        userChallenge.user.walletAddress,
        userChallenge.challengeId,
        yieldBps,
        { gasLimit: 500000 }
      );
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (!receipt.status) {
        throw new Error('Challenge completion transaction failed');
      }
      
      transactionHash = receipt.hash;
    } catch (contractError) {
      console.error('Error processing blockchain transaction:', contractError);
      
      // Record the failure but allow retry
      await prisma.transaction.create({
        data: {
          userId: auth.userId,
          transactionType: 'REWARD',
          amount: rewardAmount,
          currency: 'USDC',
          txHash: null,
          status: 'FAILED',
          createdAt: new Date()
        }
      });
      
      return NextResponse.json({ 
        error: contractError.message || 'Transaction failed',
        retryable: true 
      }, { status: 500 });
    }

    // Update user challenge status
    const updatedChallenge = await prisma.userChallenge.update({
      where: { id: userChallengeId },
      data: {
        status: 'COMPLETED',
        completionTxHash: transactionHash,
        progressPercentage: 100
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: auth.userId,
        transactionType: 'REWARD',
        amount: rewardAmount,
        currency: 'USDC',
        txHash: transactionHash,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Create achievement if this is the user's first completed challenge
    const completedChallengesCount = await prisma.userChallenge.count({
      where: {
        userId: auth.userId,
        status: 'COMPLETED'
      }
    });

    if (completedChallengesCount === 1) {
      // Find the "First Challenge Completed" achievement
      const achievement = await prisma.achievement.findFirst({
        where: { achievementType: 'CHALLENGE_COMPLETED', threshold: 1 }
      });
      
      if (achievement) {
        await prisma.userAchievement.create({
          data: {
            userId: auth.userId,
            achievementId: achievement.id
          }
        });
      }
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId: auth.userId,
        type: 'CHALLENGE_COMPLETED',
        title: 'Challenge Completed!',
        message: `Congratulations! You've completed the "${userChallenge.challenge.title}" challenge and earned ${rewardAmount.toFixed(2)} USDC.`,
        read: false
      }
    });

    return NextResponse.json({
      success: true,
      challenge: updatedChallenge,
      reward: rewardAmount,
      transactionHash
    });
  } catch (error) {
    console.error('Error completing challenge:', error);
    return NextResponse.json({ error: 'Failed to complete challenge' }, { status: 500 });
  }
}