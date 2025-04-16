// app/api/challenges/[id]/exit/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';
import { useStaking } from '@/lib/web3/hooks/useStaking';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  const auth = await verifyAuth();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }


  const {id} = await params
  const challengeId = id;
  
  try {
    // Find the user's participation in this challenge
    const userChallenge = await prisma.userChallenge.findUnique({
      where: {
        userId_challengeId: {
          userId: auth.userId,
          challengeId: challengeId
        }
      },
      include: {
        challenge: true
      }
    });

    if (!userChallenge) {
      return NextResponse.json({ error: 'You are not participating in this challenge' }, { status: 404 });
    }

    if (userChallenge.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'This challenge is not active' }, { status: 400 });
    }

    // If it's a hardcore challenge, users can't exit unless it's failed
    if (userChallenge.challenge.isHardcore) {
      return NextResponse.json({ 
        error: 'Cannot exit a hardcore challenge. Hardcore challenges require completion to get your stake back.' 
      }, { status: 400 });
    }

    // Calculate progress percentage
    const totalDays = userChallenge.challenge.durationDays;
    const completedDays = await prisma.dailyProgress.count({
      where: {
        userChallengeId: userChallenge.id,
        completed: true
      }
    });
    
    const progressPercentage = Math.floor((completedDays / totalDays) * 100);

    // Update the user challenge status to WITHDRAWN
    const updatedChallenge = await prisma.userChallenge.update({
      where: { id: userChallenge.id },
      data: {
        status: 'WITHDRAWN',
        progressPercentage: progressPercentage
      }
    });

    // Create a notification for the user
    await prisma.notification.create({
      data: {
        userId: auth.userId,
        type: 'CHALLENGE_WITHDRAWN',
        title: 'Challenge Withdrawn',
        message: `You've withdrawn from the "${userChallenge.challenge.title}" challenge. Your progress was ${progressPercentage}%.`,
        read: false
      }
    });

    // Return the updated challenge data
    return NextResponse.json({
      success: true,
      message: 'Successfully exited the challenge',
      progress: progressPercentage,
      challenge: updatedChallenge
    });
    
  } catch (error) {
    console.error('Error exiting challenge:', error);
    return NextResponse.json({ error: 'Failed to exit challenge' }, { status: 500 });
  }
}