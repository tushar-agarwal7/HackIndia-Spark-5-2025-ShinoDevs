import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * API route to initiate a speaking practice call with Ultravox
 */
export async function POST(request) {
  try {
    console.log('Starting speaking call...');
    
    // Verify authentication
    const auth = await verifyAuth();
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' }, 
        { status: 401 }
      );
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
    
    console.log('Request body:', {
      languageCode,
      proficiencyLevel,
      voice,
      topic,
      userChallengeId,
      // Don't log the full system prompt to keep logs cleaner
      systemPromptLength: systemPrompt?.length || 0,
    });

    // Validate required fields
    if (!languageCode || !systemPrompt) {
      return NextResponse.json(
        {
          success: false,
          error: 'Language code and system prompt are required'
        }, 
        { status: 400 }
      );
    }

    // Configure Ultravox call
    const ultravoxConfig = {
      systemPrompt: systemPrompt,
      model: "fixie-ai/ultravox", // Using the main model
      voice: voice || "Jessica", // Use the voice parameter passed from frontend
      temperature: 0.7,
      firstSpeaker: "FIRST_SPEAKER_AGENT", // Agent speaks first in language learning context
      experimentalSettings: {
        metadata: {
          userId: auth.userId,
          languageCode,
          proficiencyLevel,
          topic,
          userChallengeId,
          sessionType: "language_practice"
        }
      },
      medium: {
        webRtc: {}
      }
    };
    
    console.log('Ultravox API config:', {
      // Log only essential config info
      model: ultravoxConfig.model,
      voice: ultravoxConfig.voice,
      temperature: ultravoxConfig.temperature,
      firstSpeaker: ultravoxConfig.firstSpeaker,
      metadata: ultravoxConfig.experimentalSettings.metadata
    });

    // Make request to Ultravox API to create the call
    const response = await fetch('https://api.ultravox.ai/api/calls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ULTRAVOX_API_KEY
      },
      body: JSON.stringify(ultravoxConfig)
    });
    
    console.log('Ultravox API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Ultravox API error:', errorData);
      throw new Error(`Ultravox API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Ultravox API response data:', {
      callId: data.callId,
      hasJoinUrl: !!data.joinUrl,
    });

    // Check for errors
    if (!data.joinUrl) {
      throw new Error(data.detail || 'Failed to create call');
    }

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