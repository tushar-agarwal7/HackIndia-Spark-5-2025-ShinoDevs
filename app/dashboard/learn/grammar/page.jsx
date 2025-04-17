"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function GrammarPracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [languageCode, setLanguageCode] = useState("");
  const [proficiencyLevel, setProficiencyLevel] = useState("");
  const [userChallengeId, setUserChallengeId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [grammarConcepts, setGrammarConcepts] = useState([]);

  useEffect(() => {
    // Load language and challenge data from URL parameters
    const challengeId = searchParams.get("challengeId");
    const language = searchParams.get("language");

    if (language) {
      setLanguageCode(language);
    }

    async function loadInitialData() {
      try {
        setIsLoading(true);
        setError(null);

        // If there's a challenge ID, get its details
        if (challengeId) {
          const challengeRes = await fetch(`/api/challenges/${challengeId}`);
          if (!challengeRes.ok) {
            throw new Error("Failed to fetch challenge details");
          }

          const challengeData = await challengeRes.json();
          setLanguageCode(challengeData.languageCode);
          setProficiencyLevel(challengeData.proficiencyLevel);

          // Get user challenge data to track progress
          const userChallengeRes = await fetch(
            `/api/challenges/user?challengeId=${challengeId}`
          );
          if (userChallengeRes.ok) {
            const userChallengeData = await userChallengeRes.json();
            if (userChallengeData.length > 0) {
              setUserChallengeId(userChallengeData[0].id);
            }
          }
        } else if (language) {
          // If no challenge but language is specified, get user's proficiency level
          const profileRes = await fetch("/api/users/profile");
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            const learningLanguage = profileData.learningLanguages?.find(
              (lang) => lang.languageCode === language
            );
            if (learningLanguage) {
              setProficiencyLevel(learningLanguage.proficiencyLevel);
            } else {
              setProficiencyLevel("BEGINNER");
            }
          } else {
            setProficiencyLevel("BEGINNER"); // Default if profile fetch fails
          }
        } else {
          // If no parameters, redirect to learn page
          router.push("/dashboard/learn");
          return;
        }
      } catch (error) {
        console.error("Error loading grammar practice data:", error);
        setError("Failed to load practice data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, [searchParams, router]);

  // Generate questions when language and proficiency level are set
  useEffect(() => {
    if (
      languageCode &&
      proficiencyLevel &&
      !isGeneratingQuestions &&
      questions.length === 0
    ) {
      generateGrammarQuestions();
    }
  }, [languageCode, proficiencyLevel]);

  // Function to generate grammar questions using API
  const generateGrammarQuestions = async () => {
    if (!languageCode || !proficiencyLevel || isGeneratingQuestions) return;

    try {
      setIsGeneratingQuestions(true);
      setError(null);

      // Call the API to generate grammar questions
      const response = await fetch("/api/learn/grammar/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          languageCode,
          proficiencyLevel,
          count: 10, // Request 10 questions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to generate grammar questions"
        );
      }

      const data = await response.json();
      setQuestions(data.questions);

      // Extract grammar concepts for tracking
      const concepts = data.questions
        .map((q) => q.grammarConcept)
        .filter(Boolean);
      setGrammarConcepts(concepts);
    } catch (error) {
      console.error("Error generating grammar questions:", error);
      setError("Failed to generate grammar questions. Please try again.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Function to handle answer selection
  const handleAnswerSelect = (answerIndex) => {
    if (isAnswerChecked) return; // Prevent changing answer after checking
    setSelectedAnswer(answerIndex);
  };

  // Function to check the selected answer
  const checkAnswer = () => {
    if (selectedAnswer === null) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswerIndex;

    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
    }

    setIsAnswerChecked(true);
  };

  // Function to move to the next question
  const handleNextQuestion = async () => {
    setSelectedAnswer(null);
    setIsAnswerChecked(false);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    } else {
      // End of questions, update progress
      setIsSessionComplete(true);

      if (userChallengeId) {
        // Update challenge progress
        try {
          await fetch("/api/challenges/update-progress", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userChallengeId,
              minutes: 10, // Assume 10 minutes of practice for grammar
              isSessionEnd: true,
              activityType: "GRAMMAR",
            }),
          });
        } catch (error) {
          console.error("Error updating challenge progress:", error);
        }
      }

      // Save grammar practice results
      try {
        await fetch("/api/learn/grammar/save-result", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            languageCode,
            proficiencyLevel,
            score,
            totalQuestions: questions.length,
            userChallengeId: userChallengeId || null,
            grammarConcepts,
          }),
        });
      } catch (error) {
        console.error("Error saving grammar practice results:", error);
      }
    }
  };

  // Function to restart the practice or go back to dashboard
  const handleFinish = () => {
    if (userChallengeId) {
      router.push(`/dashboard/challenges/${searchParams.get("challengeId")}`);
    } else {
      router.push("/dashboard/learn");
    }
  };

  // Render functions for different states
  const renderQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gray-900">Grammar Practice</h1>
          <p className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          {currentQuestion.grammarConcept && (
            <div className="mb-4">
              <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                {currentQuestion.grammarConcept}
              </span>
            </div>
          )}

          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  selectedAnswer === index
                    ? isAnswerChecked
                      ? index === currentQuestion.correctAnswerIndex
                        ? "bg-green-50 border-green-500"
                        : "bg-red-50 border-red-500"
                      : "bg-green-50 border-green-500"
                    : "border-gray-200 hover:border-gray-300"
                } cursor-pointer transition-colors`}
                onClick={() => handleAnswerSelect(index)}
              >
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                      selectedAnswer === index
                        ? isAnswerChecked
                          ? index === currentQuestion.correctAnswerIndex
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                          : "bg-green-500 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </div>
              </div>
            ))}
          </div>

          {isAnswerChecked && (
            <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-blue-800">
                <span className="font-medium">Explanation:</span>{" "}
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            {!isAnswerChecked ? (
              <button
                onClick={checkAnswer}
                disabled={selectedAnswer === null}
                className="cursor-pointer px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg disabled:opacity-50"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="cursor-pointer px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg"
              >
                {currentQuestionIndex < questions.length - 1
                  ? "Next Question"
                  : "Finish Practice"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Practice Complete!
          </h1>
          <p className="text-gray-600 mt-2">
            You've completed today's grammar practice.
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-8 border border-gray-200 max-w-md mx-auto">
          <div className="mb-6">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-3xl font-bold text-green-600">
                  {percentage}%
                </span>
              </div>
              <svg className="w-32 h-32" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="8"
                  strokeDasharray={`${percentage * 2.83} 283`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
            </div>
          </div>

          <p className="text-lg font-medium">
            You scored {score} out of {questions.length} questions
          </p>

          <div className="mt-2 mb-6 text-gray-600">
            {percentage >= 80 ? (
              <p>Excellent work! Your grammar is very strong.</p>
            ) : percentage >= 60 ? (
              <p>Good job! Keep practicing to improve your grammar skills.</p>
            ) : (
              <p>
                Keep practicing to improve your understanding of grammar rules.
              </p>
            )}
          </div>

          {grammarConcepts.length > 0 && (
            <div className="mb-6 text-left">
              <p className="font-medium text-gray-700 mb-2">
                Grammar concepts covered:
              </p>
              <div className="flex flex-wrap gap-2">
                {[...new Set(grammarConcepts)].map((concept, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-3">
            <button
              onClick={() => {
                setCurrentQuestionIndex(0);
                setSelectedAnswer(null);
                setIsAnswerChecked(false);
                setScore(0);
                setIsSessionComplete(false);
                generateGrammarQuestions();
              }}
              className="cursor-pointer px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg"
            >
              Practice Again
            </button>

            <button
              onClick={handleFinish}
              className="cursor-pointer px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading || isGeneratingQuestions) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-12 px-4">
          <EnhancedLoadingScreen languageCode={languageCode || "en"} />
        </div>
      </DashboardLayout>
    );
  }
  // Render error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8 px-4">
          <ErrorMessage
            title="Failed to load grammar practice"
            message={error}
            retry={() => {
              if (questions.length === 0) {
                generateGrammarQuestions();
              } else {
                window.location.reload();
              }
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  // Render empty questions state
  if (!isGeneratingQuestions && questions.length === 0) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              No Grammar Questions Available
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't generate grammar questions at this time. This might be
              due to a temporary issue.
            </p>
            <button
              onClick={generateGrammarQuestions}
              className="cursor-pointer px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render main content
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {isSessionComplete ? renderResults() : renderQuestion()}
        </div>
      </div>
    </DashboardLayout>
  );
}



// Enhanced loading component for grammar practice
// To be inserted in app/dashboard/learn/grammar/page.jsx

const EnhancedLoadingScreen = ({ languageCode }) => {
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [currentTip, setCurrentTip] = useState('');
  const [grammarFact, setGrammarFact] = useState({ concept: '', explanation: '' });
  
  // Grammar learning tips
  const learningTips = [
    "Focus on grammar patterns rather than isolated rules to develop intuition",
    "Practice with example sentences rather than memorizing conjugation tables",
    "Listen to native speakers to internalize correct grammar naturally",
    "Make mistakes and learn from them - errors are a natural part of language learning",
    "Look for similarities between your native language and target language",
    "Learn grammar in chunks or phrases to make it more applicable",
    "Create your own example sentences to cement understanding",
    "Speak out loud to practice applying grammar rules in real-time",
    "Read extensively to see grammar in context",
    "Learn one grammar concept thoroughly before moving to the next"
  ];
  
  // Fun grammar facts by language
  const getGrammarFacts = (code) => {
    const facts = {
      ja: [
        { 
          concept: "Particles", 
          explanation: "Japanese particles (は, を, に, etc.) play a role similar to prepositions in English, but appear after the words they modify."
        },
        { 
          concept: "Verb Conjugation", 
          explanation: "Japanese verbs don't conjugate for person or number - the same form is used regardless of who is performing the action."
        },
        { 
          concept: "Sentence Structure", 
          explanation: "Japanese follows Subject-Object-Verb order, unlike English's Subject-Verb-Object structure."
        }
      ],
      es: [
        { 
          concept: "Subjunctive Mood", 
          explanation: "Spanish has an entire mood (subjunctive) dedicated to expressing doubt, desire, and hypothetical situations."
        },
        { 
          concept: "Gender Agreement", 
          explanation: "Spanish nouns have grammatical gender, and adjectives must agree with the gender of the noun they modify."
        },
        { 
          concept: "Two 'To Be' Verbs", 
          explanation: "Spanish has two verbs (ser and estar) that translate to 'to be' in English, used for different types of states."
        }
      ],
      fr: [
        { 
          concept: "Liaison", 
          explanation: "In French, silent consonants at the end of words are often pronounced when the next word begins with a vowel."
        },
        { 
          concept: "Verb Conjugation", 
          explanation: "French verbs have different conjugations for each subject pronoun, with many irregulars."
        },
        { 
          concept: "Negation Structure", 
          explanation: "French negation typically uses two parts (ne...pas) that surround the verb."
        }
      ],
      de: [
        { 
          concept: "Verb Position", 
          explanation: "In German main clauses, the verb must be in the second position, regardless of what comes first."
        },
        { 
          concept: "Grammatical Cases", 
          explanation: "German uses four cases (nominative, accusative, dative, genitive) that change article forms."
        },
        { 
          concept: "Compound Words", 
          explanation: "German can create extremely long compound nouns by joining multiple words together."
        }
      ],
      zh: [
        { 
          concept: "No Conjugation", 
          explanation: "Chinese verbs do not change form based on tense, person, or number - context provides this information."
        },
        { 
          concept: "Measure Words", 
          explanation: "Chinese requires specific classifier words between numbers and nouns, similar to saying 'a piece of paper'."
        },
        { 
          concept: "Tones", 
          explanation: "While not strictly grammar, Chinese uses tones to distinguish between words with the same pronunciation."
        }
      ],
      // Default English
      en: [
        { 
          concept: "Phrasal Verbs", 
          explanation: "English has thousands of phrasal verbs (like 'give up' or 'look after') that change meaning based on the preposition."
        },
        { 
          concept: "Future Tense", 
          explanation: "English doesn't have a true future tense - we use auxiliary verbs like 'will' or present continuous."
        },
        { 
          concept: "Articles", 
          explanation: "The rules for using 'a', 'an', and 'the' are complex and often challenging for language learners."
        }
      ]
    };
    
    return facts[code] || facts.en;
  };
  
  useEffect(() => {
    // Change loading messages at intervals to keep user engaged
    const interval = setInterval(() => {
      setLoadingPhase((prevPhase) => (prevPhase + 1) % 4);
      setCurrentTip(learningTips[Math.floor(Math.random() * learningTips.length)]);
      
      const facts = getGrammarFacts(languageCode);
      setGrammarFact(facts[Math.floor(Math.random() * facts.length)]);
    }, 4000);
    
    // Set initial values
    setCurrentTip(learningTips[Math.floor(Math.random() * learningTips.length)]);
    const facts = getGrammarFacts(languageCode);
    setGrammarFact(facts[Math.floor(Math.random() * facts.length)]);
    
    return () => clearInterval(interval);
  }, [languageCode]);
  
  // Get loading messages based on current phase
  const getLoadingMessage = () => {
    switch (loadingPhase) {
      case 0:
        return "Analyzing grammar patterns for your level...";
      case 1:
        return "Creating targeted grammar exercises...";
      case 2:
        return "Building helpful explanations...";
      case 3:
        return "Almost ready! Finalizing your practice session...";
      default:
        return "Loading...";
    }
  };
  
  // Progress animation that moves based on loading phase
  const getProgressWidth = () => {
    const baseProgress = 15; // Minimum progress shown
    const phaseProgress = loadingPhase * 20; // Each phase adds 20%
    const randomVariation = Math.random() * 5; // Small random variation
    
    return Math.min(95, baseProgress + phaseProgress + randomVariation);
  };
  
  // Get language name from code
  const getLanguageName = (code) => {
    const languages = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      ja: "Japanese",
      ko: "Korean",
      zh: "Chinese",
      ru: "Russian",
      pt: "Portuguese",
      ar: "Arabic",
      hi: "Hindi"
    };
    
    return languages[code] || code;
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-4 text-center">
      {/* Progress bar and indicator */}
      <div className="w-full max-w-md mb-8">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-300 via-green-400 to-green-500 rounded-full transition-all duration-1000 ease-in-out"
            style={{ width: `${getProgressWidth()}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>Preparing exercises</span>
          <span>Ready to start</span>
        </div>
      </div>
      
      {/* Animated icon */}
      <div className="relative w-20 h-20 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-500 absolute top-0 left-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ animationDuration: '2s' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      
      {/* Dynamic loading text */}
      <h2 className="text-2xl font-bold text-green-600 mb-3">
        {getLoadingMessage()}
      </h2>
      
      <p className="text-gray-600 max-w-md mb-8">
        We're creating grammar exercises tailored to your {getLanguageName(languageCode)} proficiency level
      </p>
      
      {/* Grammar fact card */}
      <div className="bg-white w-full max-w-md rounded-xl shadow-md p-6 mb-6 border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-2 flex items-center">
          <span className="text-green-500 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
          </span>
          {getLanguageName(languageCode)} Grammar Fact
        </h3>
        <div className="font-medium text-gray-900 mb-2">{grammarFact.concept}</div>
        <p className="text-gray-600 text-sm">{grammarFact.explanation}</p>
      </div>
      
      {/* Learning tip */}
      <div className="bg-green-50 w-full max-w-md rounded-xl p-5 border border-green-100">
        <h3 className="font-medium text-gray-800 mb-2 flex items-center">
          <span className="text-green-500 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
          </span>
          Grammar Learning Tip
        </h3>
        <p className="text-gray-700 text-sm">{currentTip}</p>
      </div>
      
      <p className="text-sm text-gray-400 mt-8 max-w-md">
        The first time you use a language feature, our system needs to prepare custom questions. 
        This process takes a moment but creates a better learning experience.
      </p>
    </div>
  );
};