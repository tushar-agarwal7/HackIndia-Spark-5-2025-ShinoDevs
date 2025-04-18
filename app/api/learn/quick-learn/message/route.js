// app/api/learn/quick-learn/message/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';
import { createQuickLearnPrompt } from '@/lib/learn/promt-helper';

const prisma = new PrismaClient();

export async function POST(request) {
  // Verify authentication
  const auth = await verifyAuth();
  
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { message, conversationId, isFirstMessage, languageCode } = body;
    

    console.log('Request body:', body);
    if ( !conversationId) {
      return NextResponse.json({ error: 'conversation ID are required' }, { status: 400 });
    }
    
    // Verify session exists and belongs to this user
    const session = await prisma.quickLearnSession.findFirst({
      where: {
        userId: auth.userId,
        status: 'IN_PROGRESS'
      }
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found or not active' }, { status: 404 });
    }
    
    // If this is not the first message, verify and save user message
    if (!isFirstMessage && (!message || message.trim().length === 0)) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Check conversation exists
    const conversation = await prisma.aIConversation.findUnique({
      where: {
        id: conversationId
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    // Save user message if this is not the first message
    if (!isFirstMessage) {
      await prisma.conversationMessage.create({
        data: {
          conversationId: conversationId,
          sender: 'USER',
          content: message
        }
      });
    }
    
    // Create system prompt for quick language learning
    const systemPrompt = createQuickLearnPrompt(
      languageCode || session.languageCode,
      conversation.messages.length,
      isFirstMessage
    );
    
    // Format previous messages for the AI
    const previousMessages = conversation.messages.map(msg => ({
      role: msg.sender === 'USER' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // Add user's current message if this is not first interaction
    const messagesForAI = [
      { role: "system", content: systemPrompt },
      ...previousMessages
    ];
    
    if (!isFirstMessage) {
      messagesForAI.push({ role: "user", content: message });
    }
    
    // OpenRouter API key from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    // Generate AI response 
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: messagesForAI,
        temperature: 0.7,
        max_tokens: 500
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('AI API error:', errorData);
      throw new Error(`AI API error: ${response.status}`);
    }
    
    const aiResponseData = await response.json();
    const aiContent = aiResponseData.choices[0].message.content;
    
    // Save AI response
    await prisma.conversationMessage.create({
      data: {
        conversationId: conversationId,
        sender: 'AI',
        content: aiContent
      }
    });
    
    // Check if this is near the end of the 10 minutes and signal completion accordingly
    const sessionStartTime = new Date(session.startedAt);
    const currentTime = new Date();
    const sessionDurationMinutes = (currentTime - sessionStartTime) / (1000 * 60);
    
    // If session is over 9 minutes, signal that we're near completion
    const isNearingCompletion = sessionDurationMinutes > 9;
    
    // Check for completion signal in AI response
    const hasCompletionMarker = aiContent.toLowerCase().includes("[session complete]") || 
                                aiContent.toLowerCase().includes("we've completed") ||
                                aiContent.toLowerCase().includes("you've learned");
    
    // Determine if session should be marked complete
    const shouldCompleteSession = isNearingCompletion || hasCompletionMarker;
    
    // If completing, update session status
    if (shouldCompleteSession) {
      await prisma.quickLearnSession.update({
        where: { id: session.id },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: aiContent,
      isCompleted: shouldCompleteSession
    });
  } catch (error) {
    console.error('Error in quick learn conversation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process message' },
      { status: 500 }
    );
  }
}