// app/dashboard/learn/vocabulary/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function VocabularyPracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [languageCode, setLanguageCode] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState('');
  const [userChallengeId, setUserChallengeId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  
  useEffect(() => {
    // Load language and challenge data from URL parameters
    const challengeId = searchParams.get('challengeId');
    const language = searchParams.get('language');
    
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
            throw new Error('Failed to fetch challenge details');
          }
          
          const challengeData = await challengeRes.json();
          setLanguageCode(challengeData.languageCode);
          setProficiencyLevel(challengeData.proficiencyLevel);
          
          // Get user challenge data to track progress
          const userChallengeRes = await fetch(`/api/challenges/user?challengeId=${challengeId}`);
          if (userChallengeRes.ok) {
            const userChallengeData = await userChallengeRes.json();
            if (userChallengeData.length > 0) {
              setUserChallengeId(userChallengeData[0].id);
            }
          }
        } else if (language) {
          // If no challenge but language is specified, get user's proficiency level
          const profileRes = await fetch('/api/users/profile');
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            const learningLanguage = profileData.learningLanguages?.find(
              lang => lang.languageCode === language
            );
            if (learningLanguage) {
              setProficiencyLevel(learningLanguage.proficiencyLevel);
            } else {
              setProficiencyLevel('BEGINNER');
            }
          } else {
            setProficiencyLevel('BEGINNER'); // Default if profile fetch fails
          }
        } else {
          // If no parameters, redirect to learn page
          router.push('/dashboard/learn');
          return;
        }
      } catch (error) {
        console.error('Error loading vocabulary practice data:', error);
        setError('Failed to load practice data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadInitialData();
  }, [searchParams, router]);
  
  // Generate questions when language and proficiency level are set
  useEffect(() => {
    if (languageCode && proficiencyLevel && !isGeneratingQuestions && questions.length === 0) {
      generateVocabularyQuestions();
    }
  }, [languageCode, proficiencyLevel]);
  
  // Function to generate vocabulary questions using AI
  const generateVocabularyQuestions = async () => {
    if (!languageCode || !proficiencyLevel || isGeneratingQuestions) return;
    
    try {
      setIsGeneratingQuestions(true);
      setError(null);
      
      // Call the API to generate vocabulary questions
      const response = await fetch('/api/learn/vocabulary/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          languageCode,
          proficiencyLevel,
          count: 10 // Request 10 questions
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate vocabulary questions');
      }
      
      const data = await response.json();
      setQuestions(data.questions);
      
    } catch (error) {
      console.error('Error generating vocabulary questions:', error);
      setError('Failed to generate vocabulary questions. Please try again.');
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
      setScore(prevScore => prevScore + 1);
    }
    
    setIsAnswerChecked(true);
  };
  
  // Function to move to the next question
  const handleNextQuestion = async () => {
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      // End of questions, update progress
      setIsSessionComplete(true);
      
      if (userChallengeId) {
        // Update challenge progress
        try {
          await fetch('/api/challenges/update-progress', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userChallengeId,
              minutes: 10, // Assume 10 minutes of practice for vocabulary
              isSessionEnd: true,
              activityType: 'VOCABULARY'
            }),
          });
        } catch (error) {
          console.error('Error updating challenge progress:', error);
        }
      }
      
      // Save vocabulary practice results
      try {
        await fetch('/api/learn/vocabulary/save-result', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            languageCode,
            proficiencyLevel,
            score,
            totalQuestions: questions.length,
            userChallengeId: userChallengeId || null
          }),
        });
      } catch (error) {
        console.error('Error saving vocabulary practice results:', error);
      }
    }
  };
  
  // Function to restart the practice or go back to dashboard
  const handleFinish = () => {
    if (userChallengeId) {
      router.push(`/dashboard/challenges/${searchParams.get('challengeId')}`);
    } else {
      router.push('/dashboard/learn');
    }
  };
  
  // Render functions for different states
  const renderQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gray-900">Vocabulary Practice</h1>
          <p className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-teal-500 h-2 rounded-full" 
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{currentQuestion.question}</h2>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  selectedAnswer === index
                    ? isAnswerChecked
                      ? index === currentQuestion.correctAnswerIndex
                        ? 'bg-green-50 border-green-500'
                        : 'bg-red-50 border-red-500'
                      : 'bg-cyan-50 border-cyan-500'
                    : 'border-gray-200 hover:border-gray-300'
                } cursor-pointer transition-colors`}
                onClick={() => handleAnswerSelect(index)}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                    selectedAnswer === index
                      ? isAnswerChecked
                        ? index === currentQuestion.correctAnswerIndex
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                        : 'bg-cyan-500 text-white'
                      : 'bg-gray-100'
                  }`}>
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
                <span className="font-medium">Explanation:</span> {currentQuestion.explanation}
              </p>
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            {!isAnswerChecked ? (
              <button
                onClick={checkAnswer}
                disabled={selectedAnswer === null}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg disabled:opacity-50"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Practice'}
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
          <h1 className="text-2xl font-bold text-gray-900">Practice Complete!</h1>
          <p className="text-gray-600 mt-2">You've completed today's vocabulary practice.</p>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-8 border border-gray-200 max-w-md mx-auto">
          <div className="mb-6">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 rounded-full bg-cyan-100 flex items-center justify-center">
                <span className="text-3xl font-bold text-cyan-600">{percentage}%</span>
              </div>
              <svg className="w-32 h-32" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="#e2e8f0" 
                  strokeWidth="8"
                />
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="#0ea5e9" 
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
              <p>Excellent work! Keep it up!</p>
            ) : percentage >= 60 ? (
              <p>Good job! Practice makes perfect.</p>
            ) : (
              <p>Keep practicing to improve your vocabulary skills.</p>
            )}
          </div>
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => {
                setCurrentQuestionIndex(0);
                setSelectedAnswer(null);
                setIsAnswerChecked(false);
                setScore(0);
                setIsSessionComplete(false);
                generateVocabularyQuestions();
              }}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg"
            >
              Practice Again
            </button>
            
            <button
              onClick={handleFinish}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render loading state
  if (isLoading || isGeneratingQuestions) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex flex-col justify-center items-center min-h-[400px]">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-500">
              {isGeneratingQuestions ? 'Generating vocabulary questions...' : 'Loading practice...'}
            </p>
          </div>
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
            title="Failed to load vocabulary practice"
            message={error}
            retry={() => {
              if (questions.length === 0) {
                generateVocabularyQuestions();
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">No Vocabulary Questions Available</h2>
            <p className="text-gray-600 mb-6">
              We couldn't generate vocabulary questions at this time. This might be due to a temporary issue.
            </p>
            <button
              onClick={generateVocabularyQuestions}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg"
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