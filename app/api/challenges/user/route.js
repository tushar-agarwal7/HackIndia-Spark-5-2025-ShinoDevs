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
    // Get status from query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ACTIVE';
    
    // Fetch user challenges based on status
    const userChallenges = await prisma.userChallenge.findMany({
      where: {
        userId: auth.userId,
        status: status
      },
      include: {
        challenge: true
      },
      orderBy: {
        endDate: 'asc'
      }
    });
    
    return NextResponse.json(userChallenges);
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}