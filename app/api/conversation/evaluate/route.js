// app/api/conversation/evaluate/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';

const prisma = new PrismaClient();

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
    
    // OpenRouter API key from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    // Generate evaluation using DeepSeek via OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000" // Required by OpenRouter
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [
          { role: "system", content: evaluationPrompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('DeepSeek API error:', errorData);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }
    
    // Parse evaluation
    const evaluationResponseData = await response.json();
    const evaluationContent = evaluationResponseData.choices[0].message.content;
    let evaluation;
    
    try {
      evaluation = JSON.parse(evaluationContent);
    } catch (parseError) {
      console.error('Error parsing evaluation JSON:', parseError);
      // Attempt to extract JSON if the model wrapped it with additional text
      const jsonMatch = evaluationContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse evaluation response as JSON');
      }
    }
    
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