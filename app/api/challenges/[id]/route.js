// app/api/challenges/[id]/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }
    
    // Verify authentication (optional - can show challenge details to non-authenticated users)
    const auth = await verifyAuth();
    const isAuthenticated = auth.success;
    
    // Fetch challenge details
    const challenge = await prisma.challenge.findUnique({
      where: { id },
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
      }
    });
    
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }
    
    // If authenticated, check if user is already participating
    let userParticipation = null;
    
    if (isAuthenticated) {
      userParticipation = await prisma.userChallenge.findUnique({
        where: {
          userId_challengeId: {
            userId: auth.userId,
            challengeId: id
          }
        }
      });
    }
    
    // Check if the challenge has reached max participants
    const isAtCapacity = 
      challenge.maxParticipants && 
      challenge._count.participants >= challenge.maxParticipants;
    
    // Format response
    const response = {
      ...challenge,
      participantCount: challenge._count.participants,
      isAtCapacity,
      isParticipating: Boolean(userParticipation),
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
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching challenge details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge details', details: error.message },
      { status: 500 }
    );
  }
}