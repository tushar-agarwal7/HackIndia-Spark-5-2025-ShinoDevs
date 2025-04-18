// app/api/learn/quick-learn/end/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';

const prisma = new PrismaClient();

export async function POST(request) {
  // Verify authentication
  const auth = await verifyAuth();
  
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { conversationId } = body;
 
    // Verify session exists and belongs to this user
    const session = await prisma.quickLearnSession.findFirst({
      where: {
        userId: auth.userId
      }
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    // Only update if session is still in progress
    if (session.status === 'IN_PROGRESS') {
      // Mark session as completed
      await prisma.quickLearnSession.update({
        where: { id: session.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
    }
    
    // Calculate session stats
    const startTime = new Date(session.startedAt);
    const endTime = session.completedAt || new Date();
    const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
    
    // Count total messages exchanged if conversation ID is provided
    let messageCount = 0;
    if (conversationId) {
      const conversationMessages = await prisma.conversationMessage.count({
        where: { conversationId: conversationId }
      });
      messageCount = conversationMessages;
    }
    
    // Optionally, update user stats or add this session to learning history
    await prisma.userStatistic.upsert({
      where: {
        userId_languageCode: {
          userId: auth.userId,
          languageCode: session.languageCode
        }
      },
      update: {
        quickLearnSessionCount: { increment: 1 },
        totalLearningMinutes: { increment: durationMinutes }
      },
      create: {
        userId: auth.userId,
        languageCode: session.languageCode,
        quickLearnSessionCount: 1,
        totalLearningMinutes: durationMinutes
      }
    });
    
    return NextResponse.json({
      success: true,
      stats: {
        durationMinutes,
        messageCount,
        languageCode: session.languageCode
      }
    });
  } catch (error) {
    console.error('Error ending quick learn session:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to end session' },
      { status: 500 }
    );
  }
}