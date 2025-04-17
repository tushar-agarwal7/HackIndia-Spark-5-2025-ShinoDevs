// app/api/assistant-chat/route.js
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';

export async function POST(request) {
  // Verify authentication
  const auth = await verifyAuth();
  
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { message, languageCode = 'en', previousMessages = [] } = body;
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Create system prompt based on language
    const systemPrompt = createSystemPrompt(languageCode);
    
    // OpenRouter API key from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    // Format messages for API
    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...previousMessages,
      { role: "user", content: message }
    ];
    
    // Generate AI response using DeepSeek via OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000" // Required by OpenRouter
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('DeepSeek API error:', errorData);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }
    
    const aiResponseData = await response.json();
    const aiContent = aiResponseData.choices[0].message.content;
    
    // Add to chat log in database if needed
    // This could be implemented to track user questions and improve the assistant
    // await logChatInteraction(auth.userId, message, aiContent, languageCode);
    
    return NextResponse.json({
      content: aiContent
    });
    
  } catch (error) {
    console.error('Error in assistant chat:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      content: "I'm sorry, I'm having trouble right now. Please try again in a moment."
    }, { status: 500 });
  }
}

// Helper function to create system prompt based on language
function createSystemPrompt(languageCode) {
  const languageName = getLanguageName(languageCode);
  
  return `You are Shinobi, a friendly and knowledgeable AI assistant specialized in language learning, especially ${languageName}.

Your personality traits:
- Helpful, encouraging, and supportive of the user's language learning journey
- Knowledgeable about language learning techniques and ${languageName} specifically
- Can provide examples and explanations in both ${languageName} and English
- Always provides translations when using ${languageName} words or phrases
- Keeps responses concise (maximum 3-4 paragraphs) but informative

When responding to language questions:
1. If the user asks about vocabulary or phrases in ${languageName}, provide the answer in both languages
2. For grammar questions, explain concepts clearly with examples
3. For pronunciation questions, describe how to position mouth and tongue, and provide phonetic spellings
4. For cultural questions, give brief, accurate information about cultural context

The user is currently learning ${languageName}. Try to incorporate simple ${languageName} phrases in your responses when appropriate, but always provide English translations.

Remember to be encouraging and motivational, as language learning requires persistence. Suggest specific practice techniques when relevant.`;
}

// Helper function to get language name from code
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
  
  return languages[code] || 'English';
}