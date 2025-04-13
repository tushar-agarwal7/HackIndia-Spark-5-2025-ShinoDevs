// app/api/users/language-stats/route.js
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
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get('languageCode');
    
    if (!languageCode) {
      return NextResponse.json({ error: 'Language code is required' }, { status: 400 });
    }
    
    const userId = auth.userId;
    
    // Get user language data
    const userLanguage = await prisma.userLanguage.findUnique({
      where: {
        userId_languageCode: {
          userId,
          languageCode
        }
      }
    });
    
    if (!userLanguage) {
      return NextResponse.json({ error: 'User is not learning this language' }, { status: 404 });
    }
    
    // Get conversation data
    const conversations = await prisma.aIConversation.findMany({
      where: {
        userId,
        languageCode
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: 100
    });
    
    // Calculate total practice time
    const totalMinutesPracticed = conversations.reduce((total, conv) => {
      return total + (conv.durationMinutes || 0);
    }, 0);
    
    // Get last practiced date
    const lastPracticed = conversations.length > 0 ? conversations[0].startedAt : null;
    
    // Get progress records for vocabulary size
    const latestProgress = await prisma.progressRecord.findFirst({
      where: {
        userId,
        languageCode
      },
      orderBy: {
        recordDate: 'desc'
      }
    });
    
    // Calculate streak
    const streak = await calculateStreak(userId, languageCode);
    
    // Create stats object
    const stats = {
      currentStreak: streak,
      vocabularySize: latestProgress?.vocabularySize || 0,
      totalMinutesPracticed,
      lastPracticed: lastPracticed?.toISOString() || null,
      grammarAccuracy: latestProgress?.grammarAccuracy || 0,
      speakingFluency: latestProgress?.speakingFluency || 0,
      proficiencyLevel: userLanguage.proficiencyLevel
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching language stats:', error);
    return NextResponse.json({ error: 'Failed to fetch language statistics' }, { status: 500 });
  }
}

// Helper function to calculate streak
async function calculateStreak(userId, languageCode) {
  // Get all conversation sessions ordered by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const conversations = await prisma.aIConversation.findMany({
    where: {
      userId,
      languageCode
    },
    select: {
      startedAt: true
    },
    orderBy: {
      startedAt: 'desc'
    }
  });
  
  if (conversations.length === 0) {
    return 0;
  }
  
  // Check if practiced today
  const latestDate = new Date(conversations[0].startedAt);
  latestDate.setHours(0, 0, 0, 0);
  
  if (latestDate.getTime() !== today.getTime()) {
    return 0; // No practice today, streak is 0
  }
  
  // Count consecutive days
  let streak = 1;
  let currentDate = new Date(today);
  
  for (let i = 1; i <= 100; i++) { // Limit to 100 days back
    currentDate.setDate(currentDate.getDate() - 1);
    
    // Check if there's a session for this day
    const hasPractice = conversations.some(conv => {
      const convDate = new Date(conv.startedAt);
      convDate.setHours(0, 0, 0, 0);
      return convDate.getTime() === currentDate.getTime();
    });
    
    if (hasPractice) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}