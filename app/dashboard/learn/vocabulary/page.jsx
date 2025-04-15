// app/dashboard/learn/vocabulary/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function VocabularyPracticePage() {
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
        console.error("Error loading vocabulary practice data:", error);
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
      const response = await fetch("/api/learn/vocabulary/generate", {
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
          errorData.error || "Failed to generate vocabulary questions"
        );
      }

      const data = await response.json();
      setQuestions(data.questions);
    } catch (error) {
      console.error("Error generating vocabulary questions:", error);
      setError("Failed to generate vocabulary questions. Please try again.");
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
              minutes: 10, // Assume 10 minutes of practice for vocabulary
              isSessionEnd: true,
              activityType: "VOCABULARY",
            }),
          });
        } catch (error) {
          console.error("Error updating challenge progress:", error);
        }
      }

      // Save vocabulary practice results
      try {
        await fetch("/api/learn/vocabulary/save-result", {
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
          }),
        });
      } catch (error) {
        console.error("Error saving vocabulary practice results:", error);
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

  // Render functions for different states
  const renderQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold  bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
            Vocabulary Practice
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Building your language skills one word at a time
          </p>
          <div className="flex items-center justify-center space-x-3 mt-4">
            <span className="font-medium text-gray-700">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <div className="w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 rounded-full"
                style={{
                  width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                }}
              ></div>
            </div>
            <span className="text-sm font-medium text-cyan-600">
              {Math.round(
                ((currentQuestionIndex + 1) / questions.length) * 100
              )}
              %
            </span>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-b from-cyan-100 to-transparent rounded-bl-full opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-t from-teal-100 to-transparent rounded-tr-full opacity-30"></div>

          <div className="flex items-center mb-6">
            <div className="h-10 w-2 bg-gradient-to-b from-cyan-500 to-teal-500 rounded-full mr-3"></div>
            <h2 className="text-xl font-medium text-gray-800">
              {currentQuestion.question}
            </h2>
          </div>

          <div className="space-y-4 relative z-10">
            {currentQuestion.options.map((option, index) => {
              let bgClass = "bg-white hover:bg-gray-50";
              let borderClass = "border-gray-200";
              let iconColor = "bg-gray-100 text-gray-600";

              if (selectedAnswer === index) {
                if (isAnswerChecked) {
                  if (index === currentQuestion.correctAnswerIndex) {
                    bgClass = "bg-green-50";
                    borderClass = "border-green-400";
                    iconColor = "bg-green-500 text-white";
                  } else {
                    bgClass = "bg-red-50";
                    borderClass = "border-red-400";
                    iconColor = "bg-red-500 text-white";
                  }
                } else {
                  bgClass = "bg-cyan-50";
                  borderClass = "border-cyan-400";
                  iconColor = "bg-cyan-500 text-white";
                }
              }

              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 ${borderClass} ${bgClass} cursor-pointer transition-all transform hover:scale-101 hover:shadow-md`}
                  onClick={() => handleAnswerSelect(index)}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full mr-4 flex items-center justify-center font-medium ${iconColor} shadow transition-colors`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-gray-800 text-lg">{option}</span>

                    {isAnswerChecked &&
                      index === currentQuestion.correctAnswerIndex && (
                        <div className="ml-auto">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-green-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>

          {isAnswerChecked && (
            <div className="mt-6 p-5 rounded-xl bg-blue-50 border border-blue-200 relative overflow-hidden transition-all duration-300 animate-fadeIn">
              <div className="absolute top-0 right-0 opacity-10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-blue-800 mb-2">Explanation</h3>
              <p className="text-blue-800">{currentQuestion.explanation}</p>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            {!isAnswerChecked ? (
              <button
                onClick={checkAnswer}
                disabled={selectedAnswer === null}
                className="cursor-pointer px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl font-medium shadow-lg shadow-cyan-100 transform transition-all hover:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="cursor-pointer px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl font-medium shadow-lg shadow-cyan-100 transform transition-all hover:translate-y-0.5"
              >
                {currentQuestionIndex < questions.length - 1
                  ? "Next Question"
                  : "Finish Practice"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center px-2">
          <div className="text-sm text-gray-500">
            Score: {score}/{currentQuestionIndex + (isAnswerChecked ? 1 : 0)}
          </div>
          <div className="text-sm font-medium text-cyan-600">
            Keep going, you're doing great!
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const percentage = Math.round((score / questions.length) * 100);
    let feedbackMessage, feedbackColor, emoji;

    if (percentage >= 90) {
      feedbackMessage = "Outstanding! You've mastered these words!";
      feedbackColor = "text-purple-600";
      emoji = "🏆";
    } else if (percentage >= 70) {
      feedbackMessage = "Great job! Your vocabulary is growing stronger!";
      feedbackColor = "text-cyan-600";
      emoji = "🌟";
    } else if (percentage >= 50) {
      feedbackMessage = "Good effort! Keep practicing these words.";
      feedbackColor = "text-blue-600";
      emoji = "👍";
    } else {
      feedbackMessage = "Keep going! Practice makes perfect.";
      feedbackColor = "text-teal-600";
      emoji = "💪";
    }

    return (
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
            Practice Complete!
          </h1>
          <p className="text-gray-600 mt-2">
            You've completed today's vocabulary challenge
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-200 max-w-md mx-auto relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-400 via-purple-400 to-teal-400"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-b from-purple-100 to-transparent rounded-bl-full opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-t from-cyan-100 to-transparent rounded-tr-full opacity-30"></div>

          <div className="mb-6 relative">
            <div className="relative w-40 h-40 mx-auto">
              {/* <div className="absolute inset-0 rounded-full flex items-center justify-center text-5xl">
                {emoji}
              </div> */}
              <svg className="w-40 h-40" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="6"
                  strokeDasharray={`${percentage * 2.83} 283`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient
                    id="gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div>
                  <div className="text-4xl font-bold text-gray-800">
                    {percentage}%
                  </div>
                  {/* <div className="text-sm text-gray-500">Score</div> */}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xl font-medium text-gray-800">
            You scored {score} out of {questions.length} {emoji}
          </p>

          <div className={`mt-3 mb-6 ${feedbackColor} font-medium`}>
            {feedbackMessage}
          </div>

          <div className="flex flex-col space-y-3 relative z-10">
            <button
              onClick={() => {
                setCurrentQuestionIndex(0);
                setSelectedAnswer(null);
                setIsAnswerChecked(false);
                setScore(0);
                setIsSessionComplete(false);
                generateVocabularyQuestions();
              }}
              className="cursor-pointer px-5 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-purple-100 transform transition-all hover:translate-y-0.5"
            >
              Practice Again
            </button>

            <button
              onClick={handleFinish}
              className="cursor-pointer px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium transition-colors hover:bg-gray-50"
            >
              Return to Dashboard
            </button>
          </div>
        </div>

        <div className="mt-8 max-w-md mx-auto p-5 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-cyan-100">
          <h3 className="font-medium text-gray-800 mb-2">Learning Tip</h3>
          <p className="text-gray-600 text-sm">
            Consistent practice is key to language mastery. Try using these
            vocabulary words in sentences throughout your day to reinforce your
            learning!
          </p>
        </div>
      </div>
    );
  };

  // Render loading state
  if (isLoading || isGeneratingQuestions) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-12 px-4">
          <div className="flex flex-col justify-center items-center min-h-[400px]">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
              </div>
            </div>
            <p className="mt-6 text-lg font-medium text-gray-700">
              {isGeneratingQuestions
                ? "Crafting your vocabulary challenge..."
                : "Loading practice..."}
            </p>
            <p className="text-sm text-gray-500 mt-2 max-w-xs text-center">
              We're preparing personalized vocabulary content for your learning
              journey
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
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-md mx-auto text-center bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => {
                if (questions.length === 0) {
                  generateVocabularyQuestions();
                } else {
                  window.location.reload();
                }
              }}
              className="cursor-pointer px-5 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl font-medium shadow-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render empty questions state
  if (!isGeneratingQuestions && questions.length === 0) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-md mx-auto text-center bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              No Questions Available
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't generate vocabulary questions at this time. This might
              be due to a temporary issue.
            </p>
            <button
              onClick={generateVocabularyQuestions}
              className="cursor-pointer px-5 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl font-medium shadow-md"
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
      <div className="bg-gradient-to-b from-cyan-50 via-white to-cyan-50 min-h-screen">
        <div className="container mx-auto py-10 px-4">
          <div className="max-w-3xl mx-auto">
            {isSessionComplete ? renderResults() : renderQuestion()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
