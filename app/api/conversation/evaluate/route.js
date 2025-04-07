// app/api/conversation/evaluate/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  const auth = await verifyAuth();
  
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { conversationId } = body;
    
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }
    
    // Get conversation and messages
    const conversation = await prisma.aIConversation.findUnique({
      where: { 
        id: conversationId,
        userId: auth.userId
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    // Prepare conversation transcript
    const transcript = conversation.messages.map(msg => 
      `${msg.sender === 'USER' ? 'User' : 'AI'}: ${msg.content}`
    ).join('\n\n');
    
    // Check if there are enough user messages for evaluation
    const userMessages = conversation.messages.filter(msg => msg.sender === 'USER');
    if (userMessages.length < 5) {
      return NextResponse.json({ error: 'Not enough conversation data for evaluation' }, { status: 400 });
    }
    
    // Get language proficiency level
    const userLanguage = await prisma.userLanguage.findUnique({
      where: {
        userId_languageCode: {
          userId: auth.userId,
          languageCode: conversation.languageCode,
        },
      },
    });
    
    const proficiencyLevel = userLanguage?.proficiencyLevel || 'BEGINNER';
    
    // Create evaluation prompt
    const evaluationPrompt = `You are a language learning evaluation expert for ${getLanguageName(conversation.languageCode)}.
    Please evaluate the user's language skills based on the following conversation.
    The user's current proficiency level is ${proficiencyLevel}.
    
    Provide scores for the following aspects on a scale of 0-100:
    1. Grammar accuracy
    2. Vocabulary usage
    3. Fluency and natural expression
    4. Pronunciation (based on written indicators)
    
    Also provide:
    - Specific strengths demonstrated
    - Areas for improvement
    - Overall evaluation
    - Estimated vocabulary size based on words used
    - Recommended next learning focus
    
    Format your response as JSON with the following structure:
    {
      "grammarScore": number,
      "vocabularyScore": number,
      "fluencyScore": number,
      "pronunciationScore": number,
      "overallScore": number,
      "strengths": "text",
      "improvements": "text",
      "evaluation": "text",
      "estimatedVocabularySize": number,
      "recommendedFocus": "text"
    }
    
    Conversation transcript:
    ${transcript}`;
    
    // Generate evaluation using OpenAI
    const evaluationResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: evaluationPrompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });
    
    // Parse evaluation
    const evaluationContent = evaluationResponse.choices[0].message.content;
    const evaluation = JSON.parse(evaluationContent);
    
    // Store evaluation in database
    const conversationEvaluation = await prisma.conversationEvaluation.create({
      data: {
        conversationId: conversation.id,
        grammarScore: evaluation.grammarScore,
        vocabularyScore: evaluation.vocabularyScore,
        pronunciationScore: evaluation.pronunciationScore,
        fluencyScore: evaluation.fluencyScore,
        overallScore: evaluation.overallScore,
        feedback: JSON.stringify({
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
          evaluation: evaluation.evaluation,
          estimatedVocabularySize: evaluation.estimatedVocabularySize,
          recommendedFocus: evaluation.recommendedFocus
        })
      }
    });
    
    // Update user progress record
    await prisma.progressRecord.create({
      data: {
        userId: auth.userId,
        languageCode: conversation.languageCode,
        recordDate: new Date(),
        vocabularySize: evaluation.estimatedVocabularySize,
        grammarAccuracy: evaluation.grammarScore,
        speakingFluency: evaluation.fluencyScore,
        listeningComprehension: evaluation.pronunciationScore * 0.8, // Estimate based on pronunciation
        overallLevel: updateProficiencyLevel(proficiencyLevel, evaluation.overallScore)
      }
    });
    
    // Check if user should level up
    if (shouldLevelUp(proficiencyLevel, evaluation.overallScore)) {
      await prisma.userLanguage.update({
        where: {
          userId_languageCode: {
            userId: auth.userId,
            languageCode: conversation.languageCode,
          },
        },
        data: {
          proficiencyLevel: getNextLevel(proficiencyLevel)
        }
      });
      
      // Create notification for level up
      await prisma.notification.create({
        data: {
          userId: auth.userId,
          type: 'ACHIEVEMENT_EARNED',
          title: 'Level Up!',
          message: `Congratulations! You've leveled up to ${getNextLevelName(proficiencyLevel)} in ${getLanguageName(conversation.languageCode)}.`,
          read: false
        }
      });
    }
    
    return NextResponse.json({
      evaluation: {
        ...evaluation,
        id: conversationEvaluation.id
      }
    });
  } catch (error) {
    console.error('Error evaluating conversation:', error);
    return NextResponse.json({ error: 'Failed to evaluate conversation' }, { status: 500 });
  }
}

// Helper function to get language name
function getLanguageName(code) {
  const languages = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ru': 'Russian',
    'pt': 'Portuguese',
    'ar': 'Arabic',
    'hi': 'Hindi'
  };
  
  return languages[code] || code;
}

// Helper function to check if user should level up
function shouldLevelUp(currentLevel, overallScore) {
  const thresholds = {
    'BEGINNER': 75,
    'ELEMENTARY': 80,
    'INTERMEDIATE': 85,
    'ADVANCED': 90
  };
  
  return thresholds[currentLevel] && overallScore >= thresholds[currentLevel];
}

// Helper function to get next proficiency level
function getNextLevel(currentLevel) {
  const levels = {
    'BEGINNER': 'ELEMENTARY',
    'ELEMENTARY': 'INTERMEDIATE',
    'INTERMEDIATE': 'ADVANCED',
    'ADVANCED': 'FLUENT'
  };
  
  return levels[currentLevel] || currentLevel;
}

// Helper function to get next level name
function getNextLevelName(currentLevel) {
  const levels = {
    'BEGINNER': 'Elementary',
    'ELEMENTARY': 'Intermediate',
    'INTERMEDIATE': 'Advanced',
    'ADVANCED': 'Fluent'
  };
  
  return levels[currentLevel] || 'Next Level';
}

// Helper function to update proficiency level based on score
function updateProficiencyLevel(currentLevel, score) {
  // Don't decrease level based on one evaluation
  // Only return next level if score exceeds threshold
  if (shouldLevelUp(currentLevel, score)) {
    return getNextLevel(currentLevel);
  }
  
  return currentLevel;
}