// app/api/challenges/[id]/daily-exercise/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  const auth = await verifyAuth();
  
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id } =await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }
    
    // Check if challenge exists and user is participating
    const userChallenge = await prisma.userChallenge.findFirst({
      where: {
        challengeId: id,
        userId: auth.userId,
        status: 'ACTIVE'
      },
      include: {
        challenge: true
      }
    });
    
    if (!userChallenge) {
      return NextResponse.json({ error: 'Challenge not found or user not participating' }, { status: 404 });
    }
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if there's already a daily progress record for today
    const todayProgress = await prisma.dailyProgress.findUnique({
      where: {
        userChallengeId_date: {
          userChallengeId: userChallenge.id,
          date: today
        }
      }
    });
    
    // Determine exercise based on progress
    let exercise;
    let description;
    
    if (todayProgress && todayProgress.completed) {
      description = "You've already completed today's goal! Keep practicing for extra progress.";
      exercise = `You've practiced ${todayProgress.minutesPracticed} minutes today. Your goal was ${userChallenge.challenge.dailyRequirement} minutes.`;
    } else if (todayProgress) {
      description = "Continue your daily practice to reach your goal!";
      exercise = `You've practiced ${todayProgress.minutesPracticed} minutes today. You need ${userChallenge.challenge.dailyRequirement - todayProgress.minutesPracticed} more minutes to reach your daily goal.`;
    } else {
      description = "Start your daily practice to maintain your streak!";
      exercise = `Practice ${userChallenge.challenge.dailyRequirement} minutes of ${getLanguageName(userChallenge.challenge.languageCode)} today.`;
    }
    
    return NextResponse.json({
      description,
      exercise,
      challengeId: id,
      userChallengeId: userChallenge.id,
      dailyRequirement: userChallenge.challenge.dailyRequirement,
      currentProgress: todayProgress?.minutesPracticed || 0
    });
  } catch (error) {
    console.error('Error fetching daily exercise:', error);
    return NextResponse.json({ error: 'Failed to fetch daily exercise' }, { status: 500 });
  }
}

// Helper function to get language name
function getLanguageName(code) {
  const languages = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ru': 'Russian',
    'pt': 'Portuguese',
    'ar': 'Arabic',
    'hi': 'Hindi'
  };
  
  return languages[code] || code;
}