"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function LearnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userChallengeId, setUserChallengeId] = useState(null);
  const [challengeId, setChallengeId] = useState(null);
  const [languageCode, setLanguageCode] = useState("en");
  const [proficiencyLevel, setProficiencyLevel] = useState("BEGINNER");
  const [isLoading, setIsLoading] = useState(true);
  const [practiceInfo, setPracticeInfo] = useState(null);

  useEffect(() => {
    async function fetchUserChallengeData() {
      try {
        setIsLoading(true);
        const id = searchParams.get("challengeId");

        if (id) {
          setChallengeId(id);

          // Fetch challenge participation details
          const res = await fetch(`/api/challenges/user?challengeId=${id}`);

          if (res.ok) {
            const data = await res.json();
            if (data.length > 0) {
              setUserChallengeId(data[0].id);

              // Fetch language code from challenge
              const challengeRes = await fetch(`/api/challenges/${id}`);
              if (challengeRes.ok) {
                const challengeData = await challengeRes.json();
                setLanguageCode(challengeData.languageCode);
                setProficiencyLevel(challengeData.proficiencyLevel);

                // Fetch practice info
                if (data[0].id) {
                  const practiceInfoRes = await fetch(
                    `/api/challenges/practice-info?userChallengeId=${data[0].id}`
                  );
                  if (practiceInfoRes.ok) {
                    const practiceData = await practiceInfoRes.json();
                    setPracticeInfo(practiceData);
                  }
                }
              }
            }
          }
        } else {
          // No challenge ID provided, use user's preferred language
          const userRes = await fetch("/api/users/profile");
          if (userRes.ok) {
            const userData = await userRes.json();
            if (
              userData.learningLanguages &&
              userData.learningLanguages.length > 0
            ) {
              setLanguageCode(userData.learningLanguages[0].languageCode);
              setProficiencyLevel(
                userData.learningLanguages[0].proficiencyLevel
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching challenge data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserChallengeData();
  }, [searchParams]);

  // Format language name
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
      hi: "Hindi",
    };

    return languages[code] || code;
  };

  // Format language flag emoji
  const getLanguageFlag = (code) => {
    const flags = {
      ja: "🇯🇵",
      ko: "🇰🇷",
      zh: "🇨🇳",
      en: "🇬🇧",
      es: "🇪🇸",
      fr: "🇫🇷",
      de: "🇩🇪",
      it: "🇮🇹",
      ru: "🇷🇺",
      pt: "🇵🇹",
      ar: "🇸🇦",
      hi: "🇮🇳",
    };

    return flags[code] || "🌐";
  };

  // Generate URL with parameters
  const getLearningModuleUrl = (path) => {
    const params = new URLSearchParams();
    if (challengeId) {
      params.append("challengeId", challengeId);
    } else {
      params.append("language", languageCode);
    }

    return `${path}?${params.toString()}`;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="large" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Language Info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div className="flex items-center mb-4 md:mb-0">
              <span className="text-4xl mr-4">
                {getLanguageFlag(languageCode)}
              </span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {getLanguageName(languageCode)} Learning Center
                </h1>
                <p className="text-lg text-gray-600">
                  {proficiencyLevel.charAt(0) +
                    proficiencyLevel.slice(1).toLowerCase()}{" "}
                  Level
                </p>
              </div>
            </div>

            {practiceInfo && (
              <div className="w-full md:w-auto bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium">
                    Today's Progress
                  </span>
                  <span
                    className={`font-semibold ${practiceInfo.todayCompleted ? "text-green-600" : "text-blue-600"}`}
                  >
                    {practiceInfo.todayProgress}/{practiceInfo.dailyRequirement}{" "}
                    min
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className={`h-2.5 rounded-full ${practiceInfo.todayCompleted ? "bg-green-500" : "bg-gradient-to-r from-blue-400 to-cyan-500"}`}
                    style={{
                      width: `${Math.min(100, (practiceInfo.todayProgress / practiceInfo.dailyRequirement) * 100)}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>🔥 {practiceInfo.currentStreak}-day streak</span>
                  <span>⭐ {practiceInfo.totalMinutes} total minutes</span>
                </div>
              </div>
            )}
          </div>

          {/* Learning Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
            {/* Conversation Practice */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-start mb-5">
                  <div className="p-3 bg-blue-100 rounded-xl mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      Conversation
                    </h2>
                    <p className="text-gray-600">
                      Practice real dialogues with AI feedback
                    </p>
                  </div>
                </div>
                <Link
                  href={getLearningModuleUrl("/dashboard/learn/conversation")}
                  className="inline-flex items-center justify-center w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-300"
                >
                  Start Talking
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Vocabulary Practice */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-start mb-5">
                  <div className="p-3 bg-purple-100 rounded-xl mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      Vocabulary
                    </h2>
                    <p className="text-gray-600">
                      Learn and practice essential words
                    </p>
                  </div>
                </div>
                <Link
                  href={getLearningModuleUrl("/dashboard/learn/vocabulary")}
                  className="inline-flex items-center justify-center w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300"
                >
                  Expand Vocabulary
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Grammar Exercises */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-start mb-5">
                  <div className="p-3 bg-green-100 rounded-xl mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      Grammar
                    </h2>
                    <p className="text-gray-600">
                      Master language rules and structures
                    </p>
                  </div>
                </div>
                <Link
                  href={getLearningModuleUrl("/dashboard/learn/grammar")}
                  className="inline-flex items-center justify-center w-full py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg transition-all duration-300"
                >
                  Learn Grammar
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Speaking Practice */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-start mb-5">
                  <div className="p-3 bg-amber-100 rounded-xl mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-amber-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      Pronunciation
                    </h2>
                    <p className="text-gray-600">
                      Improve your accent and speaking
                    </p>
                  </div>
                </div>
                <Link
                  href={getLearningModuleUrl("/dashboard/learn/speaking")}
                  className="inline-flex items-center justify-center w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium rounded-lg transition-all duration-300"
                >
                  Practice Speaking
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Learning Tips */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-10">
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Learning Strategies
              </h2>
              <p className="text-gray-600 mt-1">
                Proven techniques to accelerate your progress
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-green-100 p-2 rounded-lg mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Daily Consistency
                    </h3>
                    <p className="text-gray-600">
                      Short daily sessions (15-30 min) are more effective than
                      occasional long study marathons.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 p-2 rounded-lg mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Active Recall
                    </h3>
                    <p className="text-gray-600">
                      Test yourself frequently to strengthen memory retention
                      and identify weak areas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-purple-100 p-2 rounded-lg mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Spaced Repetition
                    </h3>
                    <p className="text-gray-600">
                      Review material at increasing intervals to optimize
                      long-term memorization.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-amber-100 p-2 rounded-lg mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-amber-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Immersion
                    </h3>
                    <p className="text-gray-600">
                      Supplement with media (music, shows) in your target
                      language for natural exposure.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-blue-50 rounded-xl p-5 border border-blue-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-blue-600"
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
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-blue-800">
                      Pro Tip
                    </h3>
                    <div className="mt-2 text-blue-700">
                      <p>
                        Combine multiple methods for best results! For example,
                        learn vocabulary in context through conversation
                        practice rather than isolated word lists.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
