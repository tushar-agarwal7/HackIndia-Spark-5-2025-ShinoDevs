// app/dashboard/statistics/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PracticeChart from "@/components/dashboard/PracticeChart";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format, subDays, eachDayOfInterval } from "date-fns";

export default function StatisticsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [timeRange, setTimeRange] = useState("month");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true);

        // Construct query params
        const params = new URLSearchParams();
        if (selectedLanguage !== "all") {
          params.append("languageCode", selectedLanguage);
        }
        params.append("period", timeRange);

        const response = await fetch(
          `/api/users/analytics?${params.toString()}`
        );

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/auth/signin");
            return;
          }
          throw new Error("Failed to fetch analytics");
        }

        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [selectedLanguage, timeRange, router]);

  // Function to generate chart data
  const generateChartData = () => {
    if (!analyticsData?.practiceByDay) return [];

    // Calculate date range
    const endDate = new Date();
    let startDate;

    switch (timeRange) {
      case "week":
        startDate = subDays(endDate, 7);
        break;
      case "month":
        startDate = subDays(endDate, 30);
        break;
      case "year":
        startDate = subDays(endDate, 365);
        break;
      default:
        startDate = subDays(endDate, 30);
    }

    // Generate all dates in range
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    // Format dates and map to practice minutes
    return dateRange.map((date) => {
      const dateString = format(date, "yyyy-MM-dd");
      const dayData = analyticsData.practiceByDay[dateString] || {};

      // If specific language selected, return only that language data
      if (selectedLanguage !== "all") {
        return {
          date: format(date, "MMM dd"),
          minutes: dayData[selectedLanguage] || 0,
        };
      }

      // Otherwise, sum all languages
      const totalMinutes = Object.values(dayData).reduce(
        (sum, min) => sum + min,
        0
      );

      return {
        date: format(date, "MMM dd"),
        minutes: totalMinutes,
      };
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-slate-200 rounded-lg w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-2/4"></div>

              <div className="flex flex-wrap gap-4">
                <div className="h-16 bg-slate-200 rounded-xl w-48"></div>
                <div className="h-16 bg-slate-200 rounded-xl w-48"></div>
              </div>

              <div className="h-80 bg-slate-200 rounded-2xl"></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-32 bg-slate-200 rounded-xl"></div>
                <div className="h-32 bg-slate-200 rounded-xl"></div>
                <div className="h-32 bg-slate-200 rounded-xl"></div>
              </div>

              <div className="h-64 bg-slate-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const chartData = generateChartData();

  // Get language name from language code
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

  return (
    <DashboardLayout>
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-10">
            <div className="relative inline-block">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 z-10 relative">
                Your Learning Statistics
              </h1>
              <div className="absolute bottom-0 left-0 w-full h-3 bg-gradient-to-r from-indigo-300 to-cyan-300 opacity-50 rounded-full z-0"></div>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mt-1">
              Track your progress, celebrate milestones, and optimize your
              language learning journey
            </p>
          </div>

          {/* Filters and Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Language Selector */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl bg-white shadow-xs focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 appearance-none text-gray-800"
                >
                  <option value="all">All Languages</option>
                  {analyticsData?.streaksByLanguage &&
                    Object.keys(analyticsData.streaksByLanguage).map((lang) => (
                      <option key={lang} value={lang}>
                        {getLanguageName(lang)}
                      </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Time Range Selector */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl bg-white shadow-xs focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 appearance-none text-gray-800"
                >
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                  <option value="year">Last 365 days</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-cyan-500 to-teal-500 p-5 rounded-2xl shadow-lg text-white">
              <h3 className="text-sm font-medium mb-3 opacity-90">SUMMARY</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-80">Total Practice</p>
                  <p className="text-2xl font-bold">
                    {analyticsData?.summary?.totalPracticeMinutes || 0} min
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Challenges</p>
                  <p className="text-2xl font-bold">
                    {analyticsData?.challengeCompletions?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Practice Chart Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-8">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-indigo-400 to-cyan-400 rounded-full mr-3"></div>
                <h2 className="text-xl font-bold text-gray-800">
                  Practice Activity
                </h2>
              </div>
              <div className="text-sm font-medium text-gray-500">
                {timeRange === "week"
                  ? "Weekly"
                  : timeRange === "month"
                    ? "Monthly"
                    : "Yearly"}{" "}
                View
              </div>
            </div>
            <div className="p-6">
              <div className="h-80">
                <PracticeChart data={chartData} />
              </div>
              {chartData.length > 0 &&
                chartData.every((item) => item.minutes === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No practice data available for this period
                  </div>
                )}
            </div>
          </div>

          {/* Streaks Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Current Streaks */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-indigo-400 rounded-full mr-3"></div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Current Streaks
                  </h2>
                </div>
              </div>
              <div className="p-6">
                {analyticsData?.streaksByLanguage &&
                Object.keys(analyticsData.streaksByLanguage).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(analyticsData.streaksByLanguage).map(
                      ([lang, streak]) => {
                        const streakLevel =
                          streak >= 30
                            ? "expert"
                            : streak >= 14
                              ? "advanced"
                              : streak >= 7
                                ? "intermediate"
                                : "beginner";
                        const colors = {
                          expert:
                            "bg-gradient-to-r from-amber-400 to-yellow-500",
                          advanced:
                            "bg-gradient-to-r from-purple-400 to-indigo-500",
                          intermediate:
                            "bg-gradient-to-r from-cyan-400 to-blue-500",
                          beginner:
                            "bg-gradient-to-r from-teal-400 to-cyan-500",
                        };
                        const emojis = {
                          expert: "🏆",
                          advanced: "⭐",
                          intermediate: "🔥",
                          beginner: "🌱",
                        };

                        return (
                          <div
                            key={lang}
                            className="p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <span className="text-2xl mr-3">
                                  {lang === "ja"
                                    ? "🇯🇵"
                                    : lang === "ko"
                                      ? "🇰🇷"
                                      : lang === "zh"
                                        ? "🇨🇳"
                                        : lang === "en"
                                          ? "🇬🇧"
                                          : lang === "es"
                                            ? "🇪🇸"
                                            : lang === "fr"
                                              ? "🇫🇷"
                                              : "🌐"}
                                </span>
                                <h3 className="font-medium">
                                  {getLanguageName(lang)}
                                </h3>
                              </div>
                              <span className="text-lg">
                                {emojis[streakLevel]}
                              </span>
                            </div>
                            <div className="flex items-baseline">
                              <span className="text-3xl font-bold mr-2">
                                {streak}
                              </span>
                              <span className="text-gray-500">days</span>
                              <div className="ml-auto text-sm font-medium text-gray-500">
                                {streakLevel.charAt(0).toUpperCase() +
                                  streakLevel.slice(1)}
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                              <div
                                className={`h-2 rounded-full ${colors[streakLevel]}`}
                                style={{
                                  width: `${Math.min((streak / 30) * 100, 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-block p-4 bg-purple-50 rounded-full mb-4">
                      <svg
                        className="h-8 w-8 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      No Active Streaks
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Practice daily to start building streaks. Even 5 minutes
                      counts!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Challenges Completed */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-2 h-8 bg-gradient-to-b from-teal-400 to-cyan-400 rounded-full mr-3"></div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Challenges Completed
                  </h2>
                </div>
              </div>
              <div className="p-6">
                {analyticsData?.challengeCompletions?.length > 0 ? (
                  <div className="space-y-4">
                    {analyticsData.challengeCompletions
                      .slice(0, 3)
                      .map((completion) => (
                        <div
                          key={completion.id}
                          className="p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">
                              {completion.challenge.title}
                            </h3>
                            <span className="text-sm text-gray-500">
                              {completion.completionDate}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-xl mr-2">
                                {completion.challenge.languageCode === "ja"
                                  ? "🇯🇵"
                                  : completion.challenge.languageCode === "ko"
                                    ? "🇰🇷"
                                    : completion.challenge.languageCode === "zh"
                                      ? "🇨🇳"
                                      : completion.challenge.languageCode ===
                                          "en"
                                        ? "🇬🇧"
                                        : completion.challenge.languageCode ===
                                            "es"
                                          ? "🇪🇸"
                                          : completion.challenge
                                                .languageCode === "fr"
                                            ? "🇫🇷"
                                            : "🌐"}
                              </span>
                              <span className="text-sm text-gray-600">
                                {getLanguageName(
                                  completion.challenge.languageCode
                                )}
                              </span>
                            </div>
                            <span className="font-bold text-teal-600">
                              +$
                              {(
                                completion.challenge.stakeAmount *
                                (1 + completion.challenge.yieldPercentage / 100)
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    {analyticsData.challengeCompletions.length > 3 && (
                      <button
                        onClick={() => router.push("/dashboard/challenges")}
                        className="cursor-pointer w-full py-2 text-sm font-medium text-teal-600 hover:text-teal-700"
                      >
                        View all {analyticsData.challengeCompletions.length}{" "}
                        challenges →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-block p-4 bg-teal-50 rounded-full mb-4">
                      <svg
                        className="h-8 w-8 text-teal-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      No Challenges Completed
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-4">
                      Join challenges to track progress and earn rewards
                    </p>
                    <button
                      onClick={() => router.push("/dashboard/challenges")}
                      className="cursor-pointer px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium shadow-sm"
                    >
                      Explore Challenges
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personalized Tip */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100 mb-8">
            <div className="flex items-start">
              <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                <svg
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Your Learning Tip
                </h3>
                <p className="text-gray-700">
                  {selectedLanguage !== "all"
                    ? `For ${getLanguageName(selectedLanguage)}, try practicing at the same time each day to build a habit. 
                      Even 10 minutes of focused practice is more effective than longer, irregular sessions.`
                    : "Focus on one language at a time for deeper learning. Master the basics before adding another language to your routine."}
                </p>
              </div>
            </div>
          </div>

          {/* Motivation Section */}
          <div className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl p-8 text-white shadow-xl mb-10">
            <div className="flex flex-col md:flex-row items-center">
              <div className="flex-1 mb-6 md:mb-0">
                <h3 className="text-2xl font-bold mb-2">
                  Keep Up the Great Work!
                </h3>
                <p className="opacity-90 max-w-lg">
                  {analyticsData?.summary?.totalPracticeMinutes > 100
                    ? `You've practiced for ${analyticsData.summary.totalPracticeMinutes} minutes total - that's amazing dedication!`
                    : "Every minute of practice brings you closer to fluency. Stay consistent and you'll see progress!"}
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard/learn")}
                className="cursor-pointer flex-shrink-0 bg-white text-cyan-600 hover:bg-gray-100 font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
              >
                Practice Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
