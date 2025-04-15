// app/dashboard/page.jsx - Improved version with real data fetching
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [todayChallenge, setTodayChallenge] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [error, setError] = useState(null);
  const [learningStats, setLearningStats] = useState({
    totalMinutesPracticed: 0,
    vocabularySize: 0,
    currentStreak: 0,
    longestStreak: 0,
  });

  useEffect(() => {
    // Main data fetching function to load all dashboard data
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all data in parallel for efficiency
        const [profileRes, challengesRes, analyticsRes, activityRes] =
          await Promise.all([
            fetch("/api/users/profile"),
            fetch("/api/challenges/user?status=ACTIVE"),
            fetch("/api/users/analytics"),
            fetch("/api/users/activity"),
          ]);

        // Handle any authentication errors
        if (profileRes.status === 401) {
          router.push("/auth/signin");
          return;
        }

        // Handle other error responses
        if (!profileRes.ok) throw new Error("Failed to fetch user profile");
        if (!challengesRes.ok)
          throw new Error("Failed to fetch active challenges");

        // Parse response data
        const profileData = await profileRes.json();
        const challengesData = await challengesRes.json();

        // Set profile data
        setProfile(profileData);

        // Set active challenges
        setActiveChallenges(challengesData);

        // Process analytics data if available
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setLearningStats({
            totalMinutesPracticed:
              analyticsData.summary?.totalPracticeMinutes || 0,
            vocabularySize:
              analyticsData.progressRecords?.[0]?.vocabularySize || 0,
            currentStreak:
              Object.values(analyticsData.streaksByLanguage || {})[0] || 0,
            longestStreak:
              analyticsData.progressRecords?.[0]?.longestStreak || 0,
          });

          // Process activity data for the chart
          if (analyticsData.practiceByDay) {
            const formattedActivity = formatActivityData(
              analyticsData.practiceByDay
            );
            setActivityData(formattedActivity);
          }
        }

        // Process activity data if available
        if (activityRes.ok) {
          const activityData = await activityRes.json();
          if (!activityData.activities) {
            console.warn(
              "Activity data missing expected structure:",
              activityData
            );
          }
        }

        // Setup today's challenge if there are active challenges
        if (challengesData.length > 0) {
          await setupTodayChallenge(challengesData[0]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(error.message || "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [router]);

  // Helper function to setup today's challenge
  const setupTodayChallenge = async (challenge) => {
    try {
      // Fetch the daily exercise data for this challenge
      const exerciseRes = await fetch(
        `/api/challenges/${challenge.challengeId}/daily-exercise`
      );

      if (exerciseRes.ok) {
        const exerciseData = await exerciseRes.json();

        setTodayChallenge({
          id: challenge.challengeId,
          title: challenge.challenge.title,
          description:
            exerciseData.description ||
            "Continue your daily practice to maintain your streak!",
          exercise:
            exerciseData.exercise ||
            `Practice ${challenge.challenge.dailyRequirement} minutes of ${getLanguageName(challenge.challenge.languageCode)} today.`,
          languageCode: challenge.challenge.languageCode,
          progress: challenge.progressPercentage,
          dailyRequirement: challenge.challenge.dailyRequirement,
          currentProgress: exerciseData.currentProgress || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching daily exercise:", error);
    }
  };

  // Helper function to format activity data for the chart
  const formatActivityData = (practiceByDay) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

    return days.map((day, index) => {
      const isToday = index === dayOfWeek;
      const dateStr = getDateString(
        new Date(
          today.getTime() - ((dayOfWeek - index + 7) % 7) * 24 * 60 * 60 * 1000
        )
      );
      const minutesForDay = practiceByDay[dateStr]
        ? Object.values(practiceByDay[dateStr]).reduce(
            (sum, val) => sum + val,
            0
          )
        : 0;

      return {
        day,
        minutes: minutesForDay,
        isToday,
      };
    });
  };

  // Helper function to get date string in YYYY-MM-DD format
  const getDateString = (date) => {
    return date.toISOString().split("T")[0];
  };

  // Helper function to get language name from code
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

  // Handle starting today's challenge
  const handleStartChallenge = () => {
    if (todayChallenge) {
      router.push(`/dashboard/learn?challengeId=${todayChallenge.id}`);
    }
  };

  // Handle creating a new challenge
  const handleNewChallenge = () => {
    router.push("/dashboard/challenges/create");
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Dashboard
          </h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="cursor-pointer w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white py-3 px-6 rounded-lg font-medium shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Robot mascot floating in corner */}
      <div className="fixed bottom-20 right-6 hidden lg:block z-10 animate-float">
        <RobotAvatar size="large" />
      </div>

      {/* Dashboard Header */}
      <header className="bg-white shadow-sm py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="mr-3">
              <RobotAvatar size="small" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                こんにちは,{" "}
                <span className="text-cyan-600">
                  {profile?.username || "Learner"}
                </span>
                !
              </h1>
              <p className="text-slate-500">
                Your learning adventure continues...
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              className="cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
              onClick={() => router.push("/dashboard")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1 text-slate-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Dashboard</span>
            </button>

            <button
              className="cursor-pointer bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-all transform hover:translate-y-[-2px]"
              onClick={handleNewChallenge}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
              <span>New Challenge</span>
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Main dashboard grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Challenge Card */}
              {todayChallenge ? (
                <TodaysChallenge
                  challenge={todayChallenge}
                  onStart={handleStartChallenge}
                />
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-teal-50 px-6 py-4">
                    <h2 className="text-xl font-bold text-slate-800">
                      No Active Challenges
                    </h2>
                  </div>
                  <div className="p-6">
                    <p className="text-slate-600 mb-6">
                      You don't have any active challenges yet. Start a new
                      challenge to begin your language learning journey!
                    </p>
                    <button
                      onClick={handleNewChallenge}
                      className="cursor-pointer w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white py-3 px-6 rounded-lg font-medium shadow-md transition-all transform hover:translate-y-[-2px] flex items-center justify-center"
                    >
                      Create Your First Challenge
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
                    </button>
                  </div>
                </div>
              )}

              {/* My Learning Stats */}
              <LearningStats stats={learningStats} />

              {/* Progress Charts */}
              <ActivityChart data={activityData} />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* User Profile Card */}
              <UserProfileCard profile={profile} />

              {/* Active Challenges */}
              <ActiveChallenges
                challenges={activeChallenges}
                onViewChallenge={(id) =>
                  router.push(`/dashboard/challenges/${id}`)
                }
                onViewAll={() => router.push("/dashboard/challenges")}
              />
            </div>
          </div>

          {/* Learning Path Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">
                Your Learning Path
              </h2>
              <Link
                href="/dashboard/learn"
                className="text-cyan-600 hover:text-cyan-700 flex items-center"
              >
                View All
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              {profile?.learningLanguages?.length > 0 ? (
                <LearningPath
                  language={profile.learningLanguages[0].languageCode}
                  level={profile.learningLanguages[0].proficiencyLevel}
                  onSelectLesson={(lessonId) =>
                    router.push(`/dashboard/learn/${lessonId}`)
                  }
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500 mb-4">
                    You haven't set up your learning languages yet.
                  </p>
                  <Link
                    href="/dashboard/profile"
                    className="inline-block bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-4 py-2 rounded-lg"
                  >
                    Update Profile
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-6 z-40">
        <div className="max-w-7xl mx-auto">
          <ul className="flex justify-around">
            <li>
              <Link
                href="/dashboard"
                className="flex flex-col items-center text-cyan-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="text-xs mt-1">Home</span>
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/learn"
                className="flex flex-col items-center text-slate-400 hover:text-cyan-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <span className="text-xs mt-1">Learn</span>
              </Link>
            </li>
            <li className="relative">
              <Link
                href="/dashboard/learn"
                className="flex flex-col items-center text-slate-700"
              >
                <div className="absolute -top-10 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full p-3 shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-xs mt-8">Practice</span>
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/challenges"
                className="flex flex-col items-center text-slate-400 hover:text-cyan-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span className="text-xs mt-1">Challenges</span>
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/profile"
                className="flex flex-col items-center text-slate-400 hover:text-cyan-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-xs mt-1">Profile</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
}

// Robot Avatar Component
function RobotAvatar({ size = "medium" }) {
  const sizeClasses = {
    small: "w-10 h-10",
    medium: "w-16 h-16",
    large: "w-24 h-24",
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <div className="relative bg-gradient-to-br from-cyan-400 to-teal-500 rounded-2xl w-full h-full flex items-center justify-center overflow-hidden border-2 border-cyan-300 shadow-md">
        {/* Eyes */}
        <div className="flex space-x-2">
          <div className="bg-yellow-300 rounded-full w-1/4 h-1/4 flex items-center justify-center border border-yellow-400">
            <div className="bg-black rounded-full w-1/2 h-1/2"></div>
          </div>
          <div className="bg-yellow-300 rounded-full w-1/4 h-1/4 flex items-center justify-center border border-yellow-400">
            <div className="bg-black rounded-full w-1/2 h-1/2"></div>
          </div>
        </div>

        {/* Antenna */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <div className="w-1 h-3 bg-slate-600"></div>
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
        </div>

        {/* Mouth */}
        <div className="absolute bottom-2 w-1/2 h-1 bg-slate-700 rounded-full"></div>
      </div>

      {/* Shadow effect */}
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4/5 h-1 bg-black opacity-10 rounded-full blur-sm"></div>
    </div>
  );
}

// Today's Challenge Component
function TodaysChallenge({ challenge, onStart }) {
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
    };
    return flags[code] || "🌐";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-teal-50 px-6 py-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">
            {getLanguageFlag(challenge.languageCode)}
          </span>
          <h2 className="text-xl font-bold text-slate-800">
            {challenge.title}
          </h2>
        </div>
      </div>

      <div className="p-6">
        <p className="text-slate-600 mb-4">{challenge.description}</p>

        {/* Daily progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-slate-500 mb-1">
            <span>Today's Progress</span>
            <span>
              {challenge.currentProgress}/{challenge.dailyRequirement} minutes
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-400 to-teal-500 h-2 rounded-full"
              style={{
                width: `${Math.min(100, (challenge.currentProgress / challenge.dailyRequirement) * 100)}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-100">
          <h3 className="font-medium text-slate-700 mb-2">Today's Exercise:</h3>
          <p className="text-slate-600">{challenge.exercise}</p>
        </div>

        <button
          onClick={onStart}
          className="cursor-pointer w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white py-3 px-6 rounded-lg font-medium shadow-md transition-all transform hover:translate-y-[-2px] flex items-center justify-center"
        >
          Start Today's Challenge
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
        </button>
      </div>
    </div>
  );
}

// Learning Stats Component (continued)
function LearningStats({ stats }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-cyan-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
              clipRule="evenodd"
            />
          </svg>
          My Learning Stats
        </h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Practice"
            value={`${stats.totalMinutesPracticed || 0} min`}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-cyan-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            color="cyan"
          />

          <StatCard
            title="Vocabulary"
            value={`${stats.vocabularySize || 0} words`}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-purple-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
            }
            color="purple"
          />

          <StatCard
            title="Current Streak"
            value={`${stats.currentStreak || 0} days`}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            }
            color="amber"
          />

          <StatCard
            title="Longest Streak"
            value={`${stats.longestStreak || 0} days`}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-teal-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
                />
              </svg>
            }
            color="teal"
          />
        </div>
      </div>
    </div>
  );
}
// Continuing Dashboard components...

// Stat Card Component
function StatCard({ title, value, icon, color }) {
  const bgColors = {
    cyan: "bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200",
    purple: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200",
    amber: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200",
    teal: "bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200",
  };

  const textColors = {
    cyan: "text-cyan-700",
    purple: "text-purple-700",
    amber: "text-amber-700",
    teal: "text-teal-700",
  };

  const iconColors = {
    cyan: "text-cyan-500",
    purple: "text-purple-500",
    amber: "text-amber-500",
    teal: "text-teal-500",
  };

  return (
    <div
      className={`rounded-lg p-5 shadow-md border flex flex-col ${bgColors[color]} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-medium text-slate-700">{title}</h3>
        <div className={`${iconColors[color]}`}>{icon}</div>
      </div>
      <div className={`text-2xl font-bold mt-auto ${textColors[color]}`}>
        {value}
      </div>
    </div>
  );
}

// Activity Chart Component
function ActivityChart({ data }) {
  // Find max value for scaling
  const maxMinutes = Math.max(...data.map((d) => d.minutes), 10); // Min of 10 for scale

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-slate-50 to-white">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-cyan-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          Weekly Activity
        </h2>
      </div>
      <div className="p-6">
        <div className="h-48 flex items-end justify-between">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center group">
              <div
                className={`w-12 rounded-t-md relative transition-all duration-300 ${
                  // Highlight today
                  item.isToday
                    ? "bg-gradient-to-t from-cyan-500 to-teal-400 shadow-md border-2 border-amber-400"
                    : "bg-gradient-to-t from-cyan-400 to-teal-400 opacity-70 group-hover:opacity-100"
                }`}
                style={{ height: `${(item.minutes / maxMinutes) * 100}%` }}
              >
                {/* Minutes indicator */}
                <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs font-medium text-slate-700 bg-white py-1 px-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {item.minutes}min
                </div>
              </div>
              <div
                className={`text-xs mt-3 ${item.isToday ? "font-bold text-slate-800" : "text-slate-500 group-hover:text-slate-700"}`}
              >
                {item.day}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// User Profile Card Component
function UserProfileCard({ profile }) {
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

  const getLevelName = (level) => {
    const levels = {
      BEGINNER: "Beginner",
      ELEMENTARY: "Elementary",
      INTERMEDIATE: "Intermediate",
      ADVANCED: "Advanced",
      FLUENT: "Fluent",
    };

    return levels[level] || level;
  };

  const getLevelColor = (level) => {
    const colors = {
      BEGINNER: "bg-emerald-100 text-emerald-800",
      ELEMENTARY: "bg-sky-100 text-sky-800",
      INTERMEDIATE: "bg-amber-100 text-amber-800",
      ADVANCED: "bg-purple-100 text-purple-800",
      FLUENT: "bg-rose-100 text-rose-800",
    };

    return colors[level] || "bg-slate-100 text-slate-800";
  };

  if (!profile) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden p-6 animate-pulse">
        <div className="h-16 bg-slate-200 rounded mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-3">
          <div className="h-12 bg-slate-200 rounded"></div>
          <div className="h-12 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-400 to-teal-500 px-6 py-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-white rounded-full mr-3 flex items-center justify-center text-xl font-bold text-cyan-600 shadow-md">
            {profile.username?.charAt(0) || "U"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {profile.username || "User"}
            </h2>
            <p className="text-cyan-100 text-sm">
              {profile.walletAddress
                ? `${profile.walletAddress.slice(0, 6)}...${profile.walletAddress.slice(-4)}`
                : "Connect Wallet"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
          Learning Languages
        </h3>
        {profile.learningLanguages && profile.learningLanguages.length > 0 ? (
          <div className="space-y-3 mb-6">
            {profile.learningLanguages.map((lang) => (
              <div
                key={lang.id || lang.languageCode}
                className="flex justify-between items-center bg-slate-50 rounded-lg p-3 border border-slate-100"
              >
                <div className="flex items-center">
                  <span className="mr-2 text-lg">
                    {lang.languageCode === "ja"
                      ? "🇯🇵"
                      : lang.languageCode === "ko"
                        ? "🇰🇷"
                        : lang.languageCode === "zh"
                          ? "🇨🇳"
                          : lang.languageCode === "en"
                            ? "🇬🇧"
                            : lang.languageCode === "es"
                              ? "🇪🇸"
                              : lang.languageCode === "fr"
                                ? "🇫🇷"
                                : lang.languageCode === "de"
                                  ? "🇩🇪"
                                  : lang.languageCode === "it"
                                    ? "🇮🇹"
                                    : lang.languageCode === "ru"
                                      ? "🇷🇺"
                                      : "🌐"}
                  </span>
                  <span className="font-medium text-slate-700">
                    {getLanguageName(lang.languageCode)}
                  </span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getLevelColor(lang.proficiencyLevel)}`}
                >
                  {getLevelName(lang.proficiencyLevel)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-100 text-center">
            <p className="text-slate-500 mb-2">
              No learning languages set up yet.
            </p>
            <Link
              href="/dashboard/profile"
              className="text-cyan-600 hover:text-cyan-700 font-medium"
            >
              Update Profile
            </Link>
          </div>
        )}

        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
          Achievements
        </h3>
        {/* We'll fetch real achievements later, for now showing placeholder badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div
            className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-sm"
            title="5-Day Streak"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" />
            </svg>
          </div>
          <div
            className="w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-500 rounded-full flex items-center justify-center shadow-sm"
            title="100 Words Learned"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </div>
          <div
            className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-sm"
            title="First Challenge Completed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        <Link
          href="/dashboard/profile"
          className="block text-center bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          View Full Profile
        </Link>
      </div>
    </div>
  );
}

// Active Challenges Component
function ActiveChallenges({ challenges, onViewChallenge, onViewAll }) {
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
    };
    return flags[code] || "🌐";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate days left for each challenge
  const processedChallenges = challenges.map((challenge) => {
    const endDate = new Date(challenge.endDate);
    const now = new Date();
    const daysLeft = Math.max(
      0,
      Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
    );

    return {
      ...challenge,
      daysLeft,
      progress: challenge.progressPercentage,
      languageCode: challenge.challenge.languageCode,
    };
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-cyan-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
          Active Challenges
        </h2>
      </div>

      <div className="p-6">
        {processedChallenges.length > 0 ? (
          <div className="space-y-4">
            {processedChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="bg-slate-50 rounded-lg border border-slate-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onViewChallenge(challenge.challengeId)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3 mt-1">
                      {getLanguageFlag(challenge.languageCode)}
                    </span>
                    <div>
                      <h3 className="font-medium text-slate-800">
                        {challenge.challenge.title}
                      </h3>
                      <div className="flex items-center mt-1">
                        <span className="text-xs px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-full">
                          {challenge.daysLeft} days left
                        </span>
                        <span className="mx-2 text-slate-300">•</span>
                        <span className="text-xs text-slate-500">
                          {challenge.challenge.dailyRequirement} min/day
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                      {formatCurrency(challenge.stakedAmount)}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm text-slate-500 mb-1">
                    <span>Progress</span>
                    <span className="font-medium text-slate-700">
                      {challenge.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-teal-500 h-2 rounded-full"
                      style={{ width: `${challenge.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-slate-500 mb-4">
              You don't have any active challenges yet.
            </p>
            <button
              onClick={() => onViewAll()}
              className="cursor-pointer px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
            >
              Browse Challenges
            </button>
          </div>
        )}

        <button
          onClick={onViewAll}
          className="cursor-pointer block w-full text-center bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg mt-4 transition-colors shadow-md"
        >
          View All Challenges
        </button>
      </div>
    </div>
  );
}

// Learning Path Component
function LearningPath({ language, level, onSelectLesson }) {
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch learning path data
    async function fetchLearningPath() {
      try {
        // In a real implementation, this would be fetched from the API
        // For now, we'll use sample data similar to the original
        const sampleLessons = [
          { id: 1, title: "Greetings and Introductions", completed: true },
          { id: 2, title: "Basic Conversation", completed: true },
          { id: 3, title: "Restaurant Phrases", current: true },
          { id: 4, title: "Shopping Vocabulary", locked: false },
          { id: 5, title: "Travel Expressions", locked: true },
          { id: 6, title: "Business Japanese", locked: true },
        ];

        setLessons(sampleLessons);
      } catch (error) {
        console.error("Error fetching learning path:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLearningPath();
  }, [language, level]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-800 flex items-center">
          <span className="mr-2 text-xl">
            {language === "ja"
              ? "🇯🇵"
              : language === "ko"
                ? "🇰🇷"
                : language === "zh"
                  ? "🇨🇳"
                  : "🌐"}
          </span>
          {language === "ja"
            ? "Japanese"
            : language === "ko"
              ? "Korean"
              : language === "zh"
                ? "Chinese"
                : "Language"}{" "}
          Learning Path
        </h3>
        <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
          {level === "BEGINNER"
            ? "Beginner"
            : level === "ELEMENTARY"
              ? "Elementary"
              : level === "INTERMEDIATE"
                ? "Intermediate"
                : level === "ADVANCED"
                  ? "Advanced"
                  : level === "FLUENT"
                    ? "Fluent"
                    : level}
        </span>
      </div>

      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-0 bottom-0 left-5 w-0.5 bg-slate-200"></div>

        {/* Path items */}
        <div className="space-y-6 relative">
          {lessons.map((item) => (
            <div key={item.id} className="flex">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center z-10 mr-4 shadow-sm ${
                  item.completed
                    ? "bg-gradient-to-br from-emerald-400 to-emerald-500"
                    : item.current
                      ? "bg-gradient-to-br from-amber-400 to-amber-500"
                      : item.locked
                        ? "bg-gradient-to-br from-slate-300 to-slate-400"
                        : "bg-gradient-to-br from-cyan-400 to-cyan-500"
                }`}
              >
                {item.completed ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : item.current ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : item.locked ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-white font-medium">{item.id}</span>
                )}
              </div>

              <div
                className={`flex-1 p-4 rounded-lg shadow-sm ${
                  item.current
                    ? "bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300"
                    : item.locked
                      ? "bg-slate-50 border border-slate-200 opacity-60"
                      : "bg-white border border-slate-200"
                }`}
              >
                <div className="flex justify-between items-center">
                  <h4
                    className={`font-medium ${item.locked ? "text-slate-400" : "text-slate-800"}`}
                  >
                    {item.title}
                  </h4>
                  {item.current && (
                    <span className="text-xs bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-medium">
                      Current
                    </span>
                  )}
                </div>

                {!item.locked && (
                  <div className="mt-2">
                    <button
                      onClick={() => onSelectLesson(item.id)}
                      className={`text-sm ${
                        item.current
                          ? "text-amber-600 hover:text-amber-700"
                          : "text-cyan-600 hover:text-cyan-700"
                      } hover:underline flex items-center font-medium`}
                    >
                      {item.completed ? "Review" : "Start"} Lesson
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Loading Screen Component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 animate-bounce">
        <RobotAvatar size="large" />
      </div>

      <h1 className="text-2xl font-bold mb-2 text-slate-800">
        Loading ShinoLearn...
      </h1>
      <p className="text-slate-500 mb-8">
        Preparing your language learning adventure
      </p>

      <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyan-400 to-teal-500 animate-loading-bar"></div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }
        .animate-loading-bar {
          animation: loading 2s infinite;
        }
      `}</style>
    </div>
  );
}
