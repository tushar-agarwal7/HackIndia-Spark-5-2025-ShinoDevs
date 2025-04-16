// app/api/challenges/user/route.js
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
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const challengeId = searchParams.get('challengeId');
    
    // Build the query based on provided parameters
    const whereClause = {
      userId: auth.userId
    };
    
    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }
    
    // Add challengeId filter if provided
    if (challengeId) {
      whereClause.challengeId = challengeId;
    }
    
    // Fetch user challenges based on the filters
    const userChallenges = await prisma.userChallenge.findMany({
      where: whereClause,
      include: {
        challenge: true
      },
      orderBy: {
        endDate: 'asc'
      }
    });
    
    // Enhance the data with daily progress information
    const enhancedChallenges = await Promise.all(
      userChallenges.map(async (challenge) => {
        if (challenge.status === 'ACTIVE') {
          // Fetch today's progress for active challenges
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const dailyProgress = await prisma.dailyProgress.findFirst({
            where: {
              userChallengeId: challenge.id,
              date: {
                gte: today
              }
            }
          });
          
          return {
            ...challenge,
            todayProgress: dailyProgress || {
              minutesPracticed: 0,
              completed: false
            }
          };
        }
        
        return challenge;
      })
    );
    
    return NextResponse.json(enhancedChallenges);
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}