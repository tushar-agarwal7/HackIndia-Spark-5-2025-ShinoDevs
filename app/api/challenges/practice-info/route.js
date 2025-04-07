// app/api/challenges/practice-info/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';

const prisma = new PrismaClient();

export async function GET(request) {
  const auth = await verifyAuth();
  
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get userChallengeId from query params
    const { searchParams } = new URL(request.url);
    const userChallengeId = searchParams.get('userChallengeId');
    
    if (!userChallengeId) {
      return NextResponse.json({ error: 'User challenge ID is required' }, { status: 400 });
    }
    
    // Verify the user challenge belongs to the authenticated user
    const userChallenge = await prisma.userChallenge.findFirst({
      where: {
        id: userChallengeId,
        userId: auth.userId,
        status: 'ACTIVE'
      },
      include: {
        challenge: true
      }
    });
    
    if (!userChallenge) {
      return NextResponse.json({ error: 'Challenge not found or not active' }, { status: 404 });
    }
    
    // Get today's date (reset to midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find today's progress if it exists
    const todayProgress = await prisma.dailyProgress.findUnique({
      where: {
        userChallengeId_date: {
          userChallengeId,
          date: today
        }
      }
    });
    
    // Return practice info
    return NextResponse.json({
      dailyRequirement: userChallenge.challenge.dailyRequirement,
      todayProgress: todayProgress?.minutesPracticed || 0,
      todayCompleted: todayProgress?.completed || false,
      currentStreak: userChallenge.currentStreak,
      longestStreak: userChallenge.longestStreak,
      progressPercentage: userChallenge.progressPercentage,
      language: {
        code: userChallenge.challenge.languageCode,
        level: userChallenge.challenge.proficiencyLevel
      }
    });
  } catch (error) {
    console.error('Error getting practice info:', error);
    return NextResponse.json({ error: 'Failed to get practice info' }, { status: 500 });
  }
}