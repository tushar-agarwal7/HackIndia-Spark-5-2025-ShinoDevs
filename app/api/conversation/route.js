// app/api/conversation/route.js
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
    const { message, conversationId, languageCode, userChallengeId } = body;
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Get or create conversation
    let conversation;
    let messages = [];
    
    if (conversationId) {
      conversation = await prisma.aIConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' },
          },
        },
      });
      
      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      
      messages = conversation.messages;
    } else {
      // Create new conversation
      conversation = await prisma.aIConversation.create({
        data: {
          userId: auth.userId,
          languageCode: languageCode || 'en',
          avatarType: 'default',
          userChallengeId: userChallengeId
        }
      });
    }
    
    // Save user message
    const userMessage = await prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        sender: 'USER',
        content: message,
      },
    });
    
    // Format previous messages for OpenAI
    const previousMessages = messages.map(msg => ({
      role: msg.sender === 'USER' ? 'user' : 'assistant',
      content: msg.content,
    }));
    
    // Get user language proficiency
    const userLanguage = await prisma.userLanguage.findUnique({
      where: {
        userId_languageCode: {
          userId: auth.userId,
          languageCode: conversation.languageCode,
        },
      },
    });
    
    const proficiencyLevel = userLanguage?.proficiencyLevel || 'BEGINNER';
    
    // Create system prompt based on language and proficiency
    const systemPrompt = `You are a helpful language tutor for ${getLanguageName(conversation.languageCode)} at ${proficiencyLevel.toLowerCase()} level.
    - Respond primarily in ${getLanguageName(conversation.languageCode)} with English translations when appropriate.
    - Adjust your language complexity to match ${proficiencyLevel.toLowerCase()} level.
    - Provide gentle corrections for grammar or vocabulary mistakes.
    - Be encouraging and supportive.
    - For beginner levels, use simple sentences and basic vocabulary.
    - For intermediate levels, introduce more complex grammar and vocabulary.
    - For advanced levels, use natural, native-like language.
    - When the user makes a mistake, provide the correction in [brackets].
    - Each response should end with a question to keep the conversation going.`;
    
    // Generate AI response
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        ...previousMessages,
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });
    
    const aiContent = aiResponse.choices[0].message.content;
    
    // Save AI response
    const aiMessageRecord = await prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        sender: 'AI',
        content: aiContent,
      },
    });
    
    // Update practice minutes for challenge if applicable
    if (userChallengeId) {
      await updateChallengeProgress(userChallengeId, 1); // Add 1 minute of practice
    }
    
    return NextResponse.json({
      id: aiMessageRecord.id,
      content: aiContent,
      conversationId: conversation.id
    });
  } catch (error) {
    console.error('Error in conversation:', error);
    return NextResponse.json({ error: 'Failed to process conversation' }, { status: 500 });
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

// Helper function to update challenge progress
async function updateChallengeProgress(userChallengeId, minutes) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  try {
    // Check if there's already a daily progress record for today
    const existingProgress = await prisma.dailyProgress.findUnique({
      where: {
        userChallengeId_date: {
          userChallengeId: userChallengeId,
          date: today
        }
      }
    });
    
    if (existingProgress) {
      // Update existing record
      await prisma.dailyProgress.update({
        where: {
          id: existingProgress.id
        },
        data: {
          minutesPracticed: existingProgress.minutesPracticed + minutes,
          completed: (existingProgress.minutesPracticed + minutes) >= 
            (await getUserChallengeRequirement(userChallengeId))
        }
      });
    } else {
      // Create new record
      const dailyRequirement = await getUserChallengeRequirement(userChallengeId);
      
      await prisma.dailyProgress.create({
        data: {
          userChallengeId: userChallengeId,
          date: today,
          minutesPracticed: minutes,
          completed: minutes >= dailyRequirement
        }
      });
      
      // Update streak
      await updateUserStreak(userChallengeId);
    }
    
    // Update overall progress percentage
    await updateOverallProgress(userChallengeId);
    
  } catch (error) {
    console.error('Error updating challenge progress:', error);
  }
}

async function getUserChallengeRequirement(userChallengeId) {
  const userChallenge = await prisma.userChallenge.findUnique({
    where: { id: userChallengeId },
    include: { challenge: true }
  });
  
  return userChallenge?.challenge?.dailyRequirement || 20; // Default to 20 minutes
}
async function updateUserStreak(userChallengeId) {
    try {
      // Get the user challenge record
      const userChallenge = await prisma.userChallenge.findUnique({
        where: { id: userChallengeId }
      });
      
      if (!userChallenge) {
        console.error('User challenge not found');
        return;
      }
      
      // Get daily progress records ordered by date descending
      const progressRecords = await prisma.dailyProgress.findMany({
        where: { userChallengeId },
        orderBy: { date: 'desc' },
        select: { date: true, completed: true }
      });
      
      // If no records, streak is 0
      if (progressRecords.length === 0) {
        await prisma.userChallenge.update({
          where: { id: userChallengeId },
          data: { currentStreak: 0 }
        });
        return;
      }
      
      // Calculate current streak
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if today's record exists and was completed
      const todayRecord = progressRecords.find(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime() && record.completed;
      });
      
      if (todayRecord) {
        currentStreak = 1;
        
        // Check previous days
        let prevDate = new Date(today);
        prevDate.setDate(prevDate.getDate() - 1);
        
        let consecutiveDays = true;
        while (consecutiveDays) {
          const prevDayRecord = progressRecords.find(record => {
            const recordDate = new Date(record.date);
            recordDate.setHours(0, 0, 0, 0);
            return recordDate.getTime() === prevDate.getTime() && record.completed;
          });
          
          if (prevDayRecord) {
            currentStreak++;
            prevDate.setDate(prevDate.getDate() - 1);
          } else {
            consecutiveDays = false;
          }
        }
      }
      
      // Update current streak
      await prisma.userChallenge.update({
        where: { id: userChallengeId },
        data: { 
          currentStreak,
          // Update longest streak if current > longest
          longestStreak: currentStreak > userChallenge.longestStreak 
            ? currentStreak 
            : userChallenge.longestStreak
        }
      });
    } catch (error) {
      console.error('Error updating user streak:', error);
    }
  }
  
  async function updateOverallProgress(userChallengeId) {
    try {
      // Get the user challenge and related challenge data
      const userChallenge = await prisma.userChallenge.findUnique({
        where: { id: userChallengeId },
        include: { 
          challenge: true,
          dailyProgress: true
        }
      });
      
      if (!userChallenge) {
        console.error('User challenge not found');
        return;
      }
      
      // Calculate overall progress percentage
      // Method: (completed days / total challenge days) * 100
      const totalDays = userChallenge.challenge.durationDays;
      const completedDays = userChallenge.dailyProgress.filter(p => p.completed).length;
      
      // Calculate days elapsed since challenge start
      const startDate = new Date(userChallenge.startDate);
      const today = new Date();
      const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1; // +1 to include start day
      
      // Calculate expected progress at this point (can't exceed 100%)
      const expectedProgress = Math.min(daysDiff / totalDays, 1);
      
      // Calculate actual progress (can't exceed 100%)
      const actualProgress = Math.min(completedDays / totalDays, 1);
      
      // Calculate overall percentage
      const progressPercentage = Math.round(actualProgress * 100);
      
      // Update user challenge progress
      await prisma.userChallenge.update({
        where: { id: userChallengeId },
        data: { progressPercentage }
      });
      
      // If challenge is completed, check if we need to update status
      if (progressPercentage >= 100 && userChallenge.status === 'ACTIVE') {
        // Optional: automatically complete the challenge
        // You might want this to be manual instead
        // await prisma.userChallenge.update({
        //   where: { id: userChallengeId },
        //   data: { status: 'COMPLETED' }
        // });
      }
    } catch (error) {
      console.error('Error updating overall progress:', error);
    }
  }