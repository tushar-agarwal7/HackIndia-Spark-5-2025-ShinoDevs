// app/api/learn/speaking/start-call/route.js
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    console.log('Starting speaking call...');
    // Verify authentication
    const auth = await verifyAuth();
    
    if (!auth.success) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    const { 
      languageCode, 
      proficiencyLevel, 
      systemPrompt, 
      voice,
      topic,
      userChallengeId 
    } = body;
    
    // Validate required fields
    if (!languageCode || !systemPrompt) {
      return NextResponse.json({ 
        success: false, 
        error: 'Language code and system prompt are required' 
      }, { status: 400 });
    }

    // Configure Ultravox API request
    const ultravoxConfig = {
      systemPrompt,
      model: "fixie-ai/ultravox",
      voice:   "Jessica",
      temperature: 0.7,
      firstSpeaker: "FIRST_SPEAKER_AGENT",
      experimentalSettings: {
        metadata: {
          userId: auth.userId,
          languageCode,
          proficiencyLevel,
          topic,
          userChallengeId
        }
      },
      medium: {
        webRtc: {}
      }
    };
    console.log('Ultravox API config:', ultravoxConfig);

    // Make request to Ultravox API
    const response = await fetch('https://api.ultravox.ai/api/calls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ULTRAVOX_API_KEY
      },
      body: JSON.stringify(ultravoxConfig)
    });
    console.log('Ultravox API response:', response);

    const data = await response.json();
    console.log('Ultravox API response:', data);
    
    // Check for errors
    if (!data.joinUrl) {
      throw new Error(data.detail || 'Failed to create call');
    }
    
    // Store call data in database
  // Store call data in database
  await prisma.speakingSession.create({
    data: {
      userId: auth.userId,
      languageCode,
      proficiencyLevel: proficiencyLevel || 'BEGINNER',
      ultravoxCallId: data.callId,
      topic: topic || '',
      userChallengeId: userChallengeId || null,
      startedAt: new Date(),
      status: 'ACTIVE'
    }
  });

  // Return success with call data
  return NextResponse.json({ 
    success: true, 
    data: {
      callId: data.callId,
      joinUrl: data.joinUrl
    } 
  });
} catch (error) {
  console.error('Error creating speaking session call:', error);
  return NextResponse.json(
    { success: false, error: error.message || 'Failed to create speaking session' },
    { status: 500 }
  );
}
}