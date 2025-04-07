// app/api/challenges/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Optional authentication - can still show challenges to non-authenticated users
    const auth = await verifyAuth();
    const isAuthenticated = auth.success;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get('languageCode');
    const proficiencyLevel = searchParams.get('proficiencyLevel');
    
    // Build query conditions
    let whereConditions = {
      isActive: true,
    };
    
    if (languageCode) {
      whereConditions.languageCode = languageCode;
    }
    
    if (proficiencyLevel) {
      whereConditions.proficiencyLevel = proficiencyLevel;
    }
    
    // Fetch challenges with participant count
    const challenges = await prisma.challenge.findMany({
      where: whereConditions,
      include: {
        creator: {
          select: {
            id: true,
            username: true
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Format challenges for response
    const formattedChallenges = challenges.map(challenge => {
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
        formattedEndDate: new Date(
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