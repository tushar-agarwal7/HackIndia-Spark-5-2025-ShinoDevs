// app/dashboard/challenges/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ChallengeCard from "@/components/dashboard/ChallengeCard";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";

export default function ChallengesPage() {
  const router = useRouter();
  const [challenges, setChallenges] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchChallenges() {
      try {
        setIsLoading(true);

        // Fetch active challenges for this user
        const activeRes = await fetch("/api/challenges/user?status=ACTIVE");

        if (!activeRes.ok) {
          throw new Error("Failed to fetch active challenges");
        }

        const activeData = await activeRes.json();
        setActiveChallenges(activeData);

        // Fetch available challenges
        const availableRes = await fetch("/api/challenges");

        if (!availableRes.ok) {
          throw new Error("Failed to fetch available challenges");
        }

        const availableData = await availableRes.json();
        setChallenges(availableData);
      } catch (error) {
        console.error("Error fetching challenges:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchChallenges();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8 px-4">
          <LoadingState message="Loading challenges..." height="64" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Language Challenges
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                Level up your skills through focused challenges and community
                learning
              </p>
            </div>
            <Link
              href="/dashboard/challenges/create"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Create New Challenge
            </Link>
          </div>

          {error && (
            <div className="mb-8 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="font-bold">Error loading challenges</h3>
              </div>
              <p className="ml-7 mt-1 text-sm">{error}</p>
            </div>
          )}

          {/* Active Challenges Section */}
          <section className="mb-16">
            <div className="flex items-center mb-8">
              <div className="w-3 h-8 bg-gradient-to-b from-cyan-500 to-teal-500 rounded-full mr-3"></div>
              <h2 className="text-2xl font-bold text-gray-900">
                Your Active Challenges
              </h2>
              <span className="ml-auto bg-cyan-100 text-cyan-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {activeChallenges.length} ongoing
              </span>
            </div>

            {activeChallenges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge.challenge}
                    userChallenge={challenge}
                    isActive={true}
                    onClick={() =>
                      router.push(
                        `/dashboard/challenges/${challenge.challengeId}`
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="mx-auto w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  No Active Challenges
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Join an existing challenge or create your own to track your
                  progress and compete with others!
                </p>
                <button
                  onClick={() => router.push("/dashboard/challenges/create")}
                  className="cursor-pointer inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-medium rounded-lg shadow-md transition-all"
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
            )}
          </section>

          {/* Available Challenges Section */}
          <section className="mb-8">
            <div className="flex items-center mb-8">
              <div className="w-3 h-8 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-full mr-3"></div>
              <h2 className="text-2xl font-bold text-gray-900">
                Available Challenges
              </h2>
              <span className="ml-auto bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {challenges.length} total
              </span>
            </div>

            {challenges.filter(
              (c) => !activeChallenges.some((ac) => ac.challengeId === c.id)
            ).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {challenges
                  .filter(
                    (c) =>
                      !activeChallenges.some((ac) => ac.challengeId === c.id)
                  )
                  .map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      isActive={false}
                      onClick={() =>
                        router.push(`/dashboard/challenges/${challenge.id}`)
                      }
                    />
                  ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="mx-auto w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  No Available Challenges
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Be the pioneer! Create the first challenge and inspire others
                  to join your language learning journey.
                </p>
                <button
                  onClick={() => router.push("/dashboard/challenges/create")}
                  className="cursor-pointer inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-medium rounded-lg shadow-md transition-all"
                >
                  Start a New Challenge
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
            )}
          </section>

          {/* Community CTA */}
          <div className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl p-8 md:p-10 text-white shadow-xl mt-12 mb-10">
            <div className="flex flex-col md:flex-row items-center">
              <div className="flex-1 mb-6 md:mb-0">
                <h3 className="text-2xl font-bold mb-2">
                  Create Your Own Challenge
                </h3>
                <p className="opacity-90 max-w-lg">
                  Design a custom challenge with your goals and invite friends
                  to join. Set the rules, duration, and rewards!
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard/challenges/create")}
                className="cursor-pointer flex-shrink-0 bg-white text-cyan-600 hover:bg-gray-100 font-bold px-8 py-3 rounded-lg shadow-md transition-colors flex items-center gap-2"
              >
                Get Started
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
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
        </div>
      </div>
    </DashboardLayout>
  );
}
