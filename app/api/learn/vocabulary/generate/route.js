// app/api/learn/vocabulary/generate/route.js
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';

// Function to generate vocabulary questions using Hugging Face BLOOMZ model
async function generateVocabularyQuestions(languageCode, proficiencyLevel, count = 10) {
  try {
    // Hugging Face API URL
    const API_URL = "https://api-inference.huggingface.co/models/bigscience/bloomz";
    
    // Set up the prompt based on language and proficiency level
    const prompt = createPromptForLanguage(languageCode, proficiencyLevel, count);
    
    // Make API request to Hugging Face
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 2048,
          temperature: 0.7,
          top_p: 0.95,
          do_sample: true
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Hugging Face API error:", error);
      throw new Error("Failed to generate vocabulary questions");
    }

    const data = await response.json();
    
    // Parse the generated content to extract the questions
    const questions = parseGeneratedQuestions(data.generated_text, languageCode);
    
    return questions;
  } catch (error) {
    console.error("Error generating vocabulary questions:", error);
    
    // If API fails, fall back to predefined questions for this language/level
    return getFallbackQuestions(languageCode, proficiencyLevel);
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
5. Format each question as a JSON object

Here's the format to follow:
[
  {
    "question": "What does [word] mean?",
    "options": ["option A", "option B", "option C", "option D"],
    "correctAnswerIndex": 0,
    "explanation": "Explanation of why option A is correct"
  },
  ...more questions
]

The output should be a valid JSON array of question objects.`;
}

// Parse the generated content to extract questions
function parseGeneratedQuestions(generatedText, languageCode) {
  try {
    // Find the JSON array in the generated text
    const jsonMatch = generatedText.match(/\[\s*\{.*\}\s*\]/s);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[0];
      const questions = JSON.parse(jsonStr);
      
      // Validate the questions format
      return questions.filter(q => 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length === 4 &&
        typeof q.correctAnswerIndex === 'number' &&
        q.correctAnswerIndex >= 0 &&
        q.correctAnswerIndex <= 3 &&
        q.explanation
      );
    }
    
    throw new Error("Could not parse generated questions");
  } catch (error) {
    console.error("Error parsing generated questions:", error);
    return getFallbackQuestions(languageCode, 'BEGINNER');
  }
}

// Fallback questions in case API fails
function getFallbackQuestions(languageCode, proficiencyLevel) {
  // Sample questions for Japanese
  if (languageCode === 'ja') {
    return [
      {
        question: 'What does "おはよう" mean?',
        options: ['Good morning', 'Good afternoon', 'Good evening', 'Goodbye'],
        correctAnswerIndex: 0,
        explanation: '"おはよう" (Ohayou) means "Good morning" in Japanese.'
      },
      {
        question: 'Which word means "thank you" in Japanese?',
        options: ['さようなら', 'ありがとう', 'すみません', 'はい'],
        correctAnswerIndex: 1,
        explanation: '"ありがとう" (Arigatou) means "thank you" in Japanese.'
      },
      {
        question: 'What does "水" mean?',
        options: ['Fire', 'Earth', 'Water', 'Wind'],
        correctAnswerIndex: 2,
        explanation: '"水" (Mizu) means "water" in Japanese.'
      },
      {
        question: 'Which word means "food" in Japanese?',
        options: ['たべもの', 'のみもの', 'くるま', 'いえ'],
        correctAnswerIndex: 0,
        explanation: '"たべもの" (Tabemono) means "food" in Japanese.'
      },
      {
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
        question: 'What does "hola" mean?',
        options: ['Goodbye', 'Hello', 'Thank you', 'Please'],
        correctAnswerIndex: 1,
        explanation: '"Hola" means "hello" in Spanish.'
      },
      {
        question: 'Which word means "water" in Spanish?',
        options: ['Pan', 'Leche', 'Agua', 'Vino'],
        correctAnswerIndex: 2,
        explanation: '"Agua" means "water" in Spanish.'
      },
      {
        question: 'What does "gato" mean?',
        options: ['Dog', 'Cat', 'Bird', 'Mouse'],
        correctAnswerIndex: 1,
        explanation: '"Gato" means "cat" in Spanish.'
      },
      {
        question: 'Which word means "house" in Spanish?',
        options: ['Casa', 'Carro', 'Libro', 'Mesa'],
        correctAnswerIndex: 0,
        explanation: '"Casa" means "house" in Spanish.'
      },
      {
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
      question: 'What does "hello" mean?',
      options: ['Goodbye', 'A greeting when meeting someone', 'Thank you', 'I don\'t know'],
      correctAnswerIndex: 1,
      explanation: '"Hello" is a greeting used when meeting someone.'
    },
    {
      question: 'Which word means "a place where people live"?',
      options: ['Car', 'House', 'Tree', 'Phone'],
      correctAnswerIndex: 1,
      explanation: 'A "house" is a place where people live.'
    },
    {
      question: 'What is the opposite of "hot"?',
      options: ['Warm', 'Cold', 'Wet', 'Dry'],
      correctAnswerIndex: 1,
      explanation: 'The opposite of "hot" is "cold".'
    },
    {
      question: 'Which word describes water falling from the sky?',
      options: ['Wind', 'Snow', 'Rain', 'Cloud'],
      correctAnswerIndex: 2,
      explanation: '"Rain" describes water falling from the sky.'
    },
    {
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