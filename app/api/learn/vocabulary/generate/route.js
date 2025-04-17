// app/api/learn/vocabulary/generate/route.js
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';

// Function to generate vocabulary questions using DeepSeek via OpenRouter
async function generateVocabularyQuestions(languageCode, proficiencyLevel, count = 10) {
  try {
    // Set up the prompt based on language and proficiency level
    const prompt = createPromptForLanguage(languageCode, proficiencyLevel, count);
    
    // OpenRouter API key from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    // Make API request to DeepSeek via OpenRouter
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
          {
            role: "system",
            content: "You are a language learning assistant that creates vocabulary exercises. Your responses should be in valid JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2048
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('DeepSeek API error:', errorData);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }
    
    // Extract and parse the generated content
    const responseData = await response.json();
    const jsonContent = responseData.choices[0].message.content;
    
    // Parse the generated content to extract the questions
    const questions = parseGeneratedResponse(jsonContent, languageCode);
    
    return questions.slice(0, count).map((q, index) => ({
      id: index + 1,
      ...q
    }));
  } catch (error) {
    console.error("Error generating vocabulary questions:", error);
    
    // If API fails, fall back to predefined questions for this language/level
    return getFallbackQuestions(languageCode, proficiencyLevel);
  }
}

// Parse the generated content to extract questions
function parseGeneratedResponse(content, languageCode) {
  try {
    // Try to parse the content directly as JSON
    let parsedData;
    
    try {
      // First, try to remove any markdown code fence if present
      let cleanContent = content;
      if (content.includes('```json')) {
        cleanContent = content.replace(/```json\n|\n```/g, '');
      } else if (content.includes('```')) {
        cleanContent = content.replace(/```\n|\n```/g, '');
      }
      
      parsedData = JSON.parse(cleanContent);
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from the text
      console.error("Error directly parsing JSON:", parseError);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract JSON from response");
      }
    }
    
    // Check if the parsed data has a questions property that is an array
    if (parsedData.questions && Array.isArray(parsedData.questions)) {
      return parsedData.questions.filter(q => 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length === 4 &&
        typeof q.correctAnswerIndex === 'number' &&
        q.correctAnswerIndex >= 0 &&
        q.correctAnswerIndex <= 3 &&
        q.explanation
      );
    }
    
    // If not a "questions" array, check if the response itself is an array
    if (Array.isArray(parsedData)) {
      return parsedData.filter(q => 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length === 4 &&
        typeof q.correctAnswerIndex === 'number' &&
        q.correctAnswerIndex >= 0 &&
        q.correctAnswerIndex <= 3 &&
        q.explanation
      );
    }
    
    throw new Error("Response did not contain valid questions format");
  } catch (error) {
    console.error("Error parsing generated questions:", error);
    return getFallbackQuestions(languageCode, 'BEGINNER');
  }
}

// Create the prompt for the given language and proficiency level
function createPromptForLanguage(languageCode, proficiencyLevel, count) {
  const languageName = getLanguageName(languageCode);
  const level = proficiencyLevel.toLowerCase();
  
  return `Generate ${count} multiple-choice vocabulary questions for ${level} level ${languageName} language learners. 
  
For each question:
1. Create a question about a vocabulary word appropriate for ${level} level
2. Provide exactly 4 answer options labeled A, B, C, and D
3. Indicate which option is correct (include the correct answer index as: correctAnswerIndex: 0 for A, 1 for B, 2 for C, or 3 for D)
4. Include a brief explanation of why the answer is correct
5. For non-English languages, include both the target language word and its translation

Return the data in this JSON format:
{
  "questions": [
    {
      "question": "What does [word] mean?",
      "options": ["option A", "option B", "option C", "option D"],
      "correctAnswerIndex": 0,
      "explanation": "Explanation of why option A is correct"
    },
    ... more questions
  ]
}

For the questions, use vocabulary appropriate for ${level} level ${languageName} learners.`;
}

// Fallback questions in case API fails
function getFallbackQuestions(languageCode, proficiencyLevel) {
  // Sample questions for Japanese
  if (languageCode === 'ja') {
    return [
      {
        id: 1,
        question: 'What does "おはよう" mean?',
        options: ['Good morning', 'Good afternoon', 'Good evening', 'Goodbye'],
        correctAnswerIndex: 0,
        explanation: '"おはよう" (Ohayou) means "Good morning" in Japanese.'
      },
      {
        id: 2,
        question: 'Which word means "thank you" in Japanese?',
        options: ['さようなら', 'ありがとう', 'すみません', 'はい'],
        correctAnswerIndex: 1,
        explanation: '"ありがとう" (Arigatou) means "thank you" in Japanese.'
      },
      {
        id: 3,
        question: 'What does "水" mean?',
        options: ['Fire', 'Earth', 'Water', 'Wind'],
        correctAnswerIndex: 2,
        explanation: '"水" (Mizu) means "water" in Japanese.'
      },
      {
        id: 4,
        question: 'Which word means "food" in Japanese?',
        options: ['たべもの', 'のみもの', 'くるま', 'いえ'],
        correctAnswerIndex: 0,
        explanation: '"たべもの" (Tabemono) means "food" in Japanese.'
      },
      {
        id: 5,
        question: 'What does "ねこ" mean?',
        options: ['Dog', 'Cat', 'Bird', 'Fish'],
        correctAnswerIndex: 1,
        explanation: '"ねこ" (Neko) means "cat" in Japanese.'
      }
    ];
  }
  
  // Sample questions for Spanish
  if (languageCode === 'es') {
    return [
      {
        id: 1,
        question: 'What does "hola" mean?',
        options: ['Goodbye', 'Hello', 'Thank you', 'Please'],
        correctAnswerIndex: 1,
        explanation: '"Hola" means "hello" in Spanish.'
      },
      {
        id: 2,
        question: 'Which word means "water" in Spanish?',
        options: ['Pan', 'Leche', 'Agua', 'Vino'],
        correctAnswerIndex: 2,
        explanation: '"Agua" means "water" in Spanish.'
      },
      {
        id: 3,
        question: 'What does "gato" mean?',
        options: ['Dog', 'Cat', 'Bird', 'Mouse'],
        correctAnswerIndex: 1,
        explanation: '"Gato" means "cat" in Spanish.'
      },
      {
        id: 4,
        question: 'Which word means "house" in Spanish?',
        options: ['Casa', 'Carro', 'Libro', 'Mesa'],
        correctAnswerIndex: 0,
        explanation: '"Casa" means "house" in Spanish.'
      },
      {
        id: 5,
        question: 'What does "gracias" mean?',
        options: ['Please', 'Sorry', 'Thank you', 'You\'re welcome'],
        correctAnswerIndex: 2,
        explanation: '"Gracias" means "thank you" in Spanish.'
      }
    ];
  }
  
  // Default questions for English
  return [
    {
      id: 1,
      question: 'What does "hello" mean?',
      options: ['Goodbye', 'A greeting when meeting someone', 'Thank you', 'I don\'t know'],
      correctAnswerIndex: 1,
      explanation: '"Hello" is a greeting used when meeting someone.'
    },
    {
      id: 2,
      question: 'Which word means "a place where people live"?',
      options: ['Car', 'House', 'Tree', 'Phone'],
      correctAnswerIndex: 1,
      explanation: 'A "house" is a place where people live.'
    },
    {
      id: 3,
      question: 'What is the opposite of "hot"?',
      options: ['Warm', 'Cold', 'Wet', 'Dry'],
      correctAnswerIndex: 1,
      explanation: 'The opposite of "hot" is "cold".'
    },
    {
      id: 4,
      question: 'Which word describes water falling from the sky?',
      options: ['Wind', 'Snow', 'Rain', 'Cloud'],
      correctAnswerIndex: 2,
      explanation: '"Rain" describes water falling from the sky.'
    },
    {
      id: 5,
      question: 'What animal says "meow"?',
      options: ['Dog', 'Cat', 'Bird', 'Fish'],
      correctAnswerIndex: 1,
      explanation: 'A cat says "meow".'
    }
  ];
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
  
  return languages[code] || code;
}

// API Route Handler
export async function POST(request) {
  // Verify authentication
  const auth = await verifyAuth();
  
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { languageCode, proficiencyLevel, count } = body;
    
    // Validate request parameters
    if (!languageCode) {
      return NextResponse.json({ error: 'Language code is required' }, { status: 400 });
    }
    
    // Default to BEGINNER if proficiency level is not provided
    const level = proficiencyLevel || 'BEGINNER';
    
    // Generate questions
    const questions = await generateVocabularyQuestions(languageCode, level, count || 10);
    
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error in vocabulary generation API:', error);
    return NextResponse.json(
      { error: 'Failed to generate vocabulary questions' },
      { status: 500 }
    );
  }
}