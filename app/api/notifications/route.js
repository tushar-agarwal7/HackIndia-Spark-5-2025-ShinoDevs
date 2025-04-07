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
    // Get user challenges
    const userChallenges = await prisma.userChallenge.findMany({
      where: {
        userId: auth.userId
      },
      include: {
        challenge: true
      }
    });
    
    // Format challenges for response    
    const formattedChallenges = userChallenges.map(challenge => {
      // Check if the challenge has reached max participants
      const isAtCapacity = 
        challenge.maxParticipants &&         
        challenge._count.participants >= challenge.maxParticipants;
      
      return {
        ...challenge,
        participantCount: challenge._count.participants,
        isAtCapacity,
        creatorName: challenge.creator.username,
        
        // Add additional computed properties
        formattedStartDate: challenge.createdAt.toLocaleDateString(),
        formattedEndDate: new Date( // End date is the same as start date for now
          new Date(challenge.createdAt).setDate(
            new Date(challenge.createdAt).getDate() + challenge.durationDays
          )
        ).toLocaleDateString(),
        
        // Calculate potential reward
        potentialReward: challenge.stakeAmount * (1 + (challenge.yieldPercentage / 100)),
        
        // Remove sensitive or unnecessary data
        _count: undefined
      };
    });
    
    return NextResponse.json(formattedChallenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}