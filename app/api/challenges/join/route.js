// app/api/challenges/join/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';
import { processStaking } from '@/lib/web3/staking';

const prisma = new PrismaClient();

export async function POST(request) {
  const auth = await verifyAuth();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { challengeId, transactionHash } = body;
    
    if (!challengeId || !transactionHash) {
      return NextResponse.json({ error: 'Challenge ID and transaction hash are required' }, { status: 400 });
    }

    // Verify the challenge exists and is active
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId, isActive: true }
    });
    
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found or inactive' }, { status: 404 });
    }

    // Check if user is already participating in this specific challenge
    const existingParticipation = await prisma.userChallenge.findUnique({
      where: {
        userId_challengeId: {
          userId: auth.userId,
          challengeId: challengeId
        }
      }
    });
    
    if (existingParticipation) {
      return NextResponse.json({ error: 'You are already participating in this challenge' }, { status: 400 });
    }

    // Verify transaction on the blockchain
    const stakingVerified = await processStaking(transactionHash, challenge.stakeAmount, auth.walletAddress);
    if (!stakingVerified.success) {
      return NextResponse.json({ error: stakingVerified.error }, { status: 400 });
    }

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + challenge.durationDays);

    // Create user challenge participation
    const userChallenge = await prisma.userChallenge.create({
      data: {
        userId: auth.userId,
        challengeId: challengeId,
        startDate: startDate,
        endDate: endDate,
        stakedAmount: challenge.stakeAmount,
        stakeTxHash: transactionHash,
        currentStreak: 0,
        longestStreak: 0,
        progressPercentage: 0,
        status: 'ACTIVE'
      }
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: auth.userId,
        type: 'CHALLENGE_CREATED',
        title: 'New Challenge Started',
        message: `You've joined the "${challenge.title}" challenge. Start practicing daily to maintain your streak!`,
        read: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully joined challenge',
      userChallenge: userChallenge
    });
    
  } catch (error) {
    console.error('Error joining challenge:', error);
    return NextResponse.json({ error: 'Failed to join challenge' }, { status: 500 });
  }
}