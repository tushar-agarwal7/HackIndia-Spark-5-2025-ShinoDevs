// app/api/learn/quick-learn/start/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function POST(request) {
  // Verify authentication
  const auth = await verifyAuth();
  
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { languageCode } = body;
    
    if (!languageCode) {
      return NextResponse.json({ error: 'Language code is required' }, { status: 400 });
    }
    
    // Create a new conversation for the session
    const conversation = await prisma.aIConversation.create({
      data: {
        userId: auth.userId,
        languageCode: languageCode,
        avatarType: 'default',
      }
    });
    
    // Create a session record
    const session = await prisma.quickLearnSession.create({
      data: {
        userId: auth.userId,
        conversationId: conversation.id,
        languageCode: languageCode,
        startedAt: new Date(),
        status: 'IN_PROGRESS'
      }
    });
    
    return NextResponse.json({
      success: true,
      conversationId: conversation.id
    });
  } catch (error) {
    console.error('Error starting quick learn session:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to start session' },
      { status: 500 }
    );
  }
}