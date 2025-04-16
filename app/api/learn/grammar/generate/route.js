// app/api/learn/grammar/generate/route.js
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';

// Function to generate grammar questions using DeepSeek via OpenRouter
async function generateGrammarQuestions(languageCode, proficiencyLevel, count = 10) {
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
            content: "You are a language learning assistant that creates grammar exercises. Your responses should be in valid JSON format."
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
    
    let questionsData;
    try {
      questionsData = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Error parsing JSON from DeepSeek:', parseError);
      // Attempt to extract JSON if the model wrapped it with additional text
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questionsData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse response as JSON');
      }
    }
    
    // Validate and format the questions
    if (questionsData.questions && Array.isArray(questionsData.questions)) {
      return questionsData.questions.slice(0, count).map((q, index) => ({
        id: index + 1,
        ...q
      }));
    }
    
    throw new Error("Invalid question format from AI");
  } catch (error) {
    console.error("Error generating grammar questions:", error);
    
    // If API fails, fall back to predefined questions for this language/level
    return getFallbackQuestions(languageCode, proficiencyLevel);
  }
}

// Create the prompt for the given language and proficiency level
function createPromptForLanguage(languageCode, proficiencyLevel, count) {
  const languageName = getLanguageName(languageCode);
  const level = proficiencyLevel.toLowerCase();
  
  return `Generate ${count} multiple-choice grammar questions for ${level} level ${languageName} language learners. 

The questions should test appropriate grammar concepts for ${level} level, such as:
- Beginner: basic verb forms, simple present/past tense, articles, pronouns
- Elementary: comparative forms, prepositions, simple future tense
- Intermediate: conditional forms, passive voice, relative clauses
- Advanced: complex tenses, subjunctive mood, idiomatic expressions
- Fluent: nuanced grammatical distinctions, rare grammatical forms

For each question:
1. Create a question about a grammar concept appropriate for ${level} level
2. Provide exactly 4 answer options labeled A, B, C, and D
3. Indicate which option is correct (include the correct answer index as 0 for A, 1 for B, 2 for C, or 3 for D)
4. Include a brief explanation of why the answer is correct and why others are wrong
5. Specify the grammar concept being tested (e.g., "past tense", "conditional", etc.)

Return the data in this JSON format:
{
  "questions": [
    {
      "question": "Complete the sentence: She ____ to school every day.",
      "options": ["go", "goes", "going", "went"],
      "correctAnswerIndex": 1,
      "explanation": "The correct answer is 'goes'. With third-person singular subjects (he, she, it) in simple present tense, we add -s to the verb.",
      "grammarConcept": "simple present tense - third person singular"
    },
    ... more questions
  ]
}

Ensure the questions are appropriate for ${level} level ${languageName} learners and cover different grammar concepts.`;
}

// Fallback questions in case API fails
function getFallbackQuestions(languageCode, proficiencyLevel) {
  // Sample questions for Japanese - BEGINNER
  if (languageCode === 'ja' && proficiencyLevel === 'BEGINNER') {
    return [
      {
        id: 1,
        question: "Which particle is used to mark the direct object of a verb?",
        options: ["は (wa)", "を (o)", "に (ni)", "が (ga)"],
        correctAnswerIndex: 1,
        explanation: "The particle を (o) is used to mark the direct object of a verb. For example: りんごを食べます (I eat an apple).",
        grammarConcept: "particles - direct object marker"
      },
      {
        id: 2,
        question: "Which sentence uses the correct word order?",
        options: ["私は学校に行きます", "私は行きます学校に", "学校に私は行きます", "行きます私は学校に"],
        correctAnswerIndex: 0,
        explanation: "The correct word order in Japanese is typically Subject-Object-Verb. So '私は学校に行きます' (I go to school) follows the proper structure.",
        grammarConcept: "sentence structure - word order"
      },
      {
        id: 3,
        question: "Which form is used to make a request?",
        options: ["食べる", "食べます", "食べて", "食べない"],
        correctAnswerIndex: 2,
        explanation: "The te-form (食べて) is used to make requests, among other functions. For example: 'それを食べてください' (Please eat that).",
        grammarConcept: "te-form - requests"
      }
    ];
  }
  
  // Sample questions for Spanish - BEGINNER
  if (languageCode === 'es' && proficiencyLevel === 'BEGINNER') {
    return [
      {
        id: 1,
        question: "Which is the correct form of the verb 'hablar' (to speak) in the present tense for 'yo' (I)?",
        options: ["hablo", "hablas", "habla", "hablan"],
        correctAnswerIndex: 0,
        explanation: "The correct conjugation for 'yo' (I) in the present tense of 'hablar' is 'hablo'.",
        grammarConcept: "present tense conjugation - first person singular"
      },
      {
        id: 2,
        question: "Which is the correct article to use with 'libro' (book)?",
        options: ["la", "el", "los", "las"],
        correctAnswerIndex: 1,
        explanation: "'Libro' (book) is a masculine noun, so it uses the masculine singular article 'el'.",
        grammarConcept: "articles - gender agreement"
      },
      {
        id: 3,
        question: "Complete the sentence: '_____ estudiantes están en la clase.' (The students are in class.)",
        options: ["El", "La", "Los", "Las"],
        correctAnswerIndex: 2,
        explanation: "'Estudiantes' is plural and can be either masculine or mixed gender, so the correct article is 'Los'.",
        grammarConcept: "articles - plural forms"
      }
    ];
  }
  
  // Default questions for English
  return [
    {
      id: 1,
      question: "Which sentence is grammatically correct?",
      options: ["She don't like pizza.", "She doesn't likes pizza.", "She doesn't like pizza.", "She not like pizza."],
      correctAnswerIndex: 2,
      explanation: "The correct negative form of third-person singular in simple present is 'doesn't' + base form of the verb. So 'She doesn't like pizza' is correct.",
      grammarConcept: "simple present negative - third person singular"
    },
    {
      id: 2,
      question: "Complete the sentence: 'They _____ to the store yesterday.'",
      options: ["go", "goes", "went", "gone"],
      correctAnswerIndex: 2,
      explanation: "The sentence refers to a completed action in the past, so the simple past tense 'went' is correct.",
      grammarConcept: "simple past tense"
    },
    {
      id: 3,
      question: "Choose the correct sentence:",
      options: ["I am student.", "I am a student.", "I am the student.", "I am an student."],
      correctAnswerIndex: 1,
      explanation: "The indefinite article 'a' is used before singular countable nouns that begin with a consonant sound, like 'student'.",
      grammarConcept: "articles - indefinite article usage"
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
    const questions = await generateGrammarQuestions(languageCode, level, count || 10);
    
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error in grammar generation API:', error);
    return NextResponse.json(
      { error: 'Failed to generate grammar questions' },
      { status: 500 }
    );
  }
}