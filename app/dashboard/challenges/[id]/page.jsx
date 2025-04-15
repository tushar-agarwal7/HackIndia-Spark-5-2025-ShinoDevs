"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import YieldInformation from "@/components/challenge/YieldInformation";
import JoinChallengeFlow from "@/components/challenge/JoinChallengeFlow";
import { useStaking } from "@/lib/web3/hooks/useStaking";
import { useContract } from "@/lib/web3/hooks/useContract";
import LoadingState from "@/components/ui/LoadingState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function ChallengePage({ params }) {
  const router = useRouter();
  const id = params.id;
  const [challenge, setChallenge] = useState(null);
  const [userParticipation, setUserParticipation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showJoinFlow, setShowJoinFlow] = useState(false);

  const { isConnected, signer } = useContract();
  const { getStakeDetails } = useStaking();

  useEffect(() => {
    async function fetchChallengeData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch challenge details
        const challengeRes = await fetch(`/api/challenges/${id}`);

        if (!challengeRes.ok) {
          throw new Error("Failed to fetch challenge details");
        }

        const challengeData = await challengeRes.json();
        setChallenge(challengeData);

        // Check if user is already participating
        const participationRes = await fetch(
          `/api/challenges/user?challengeId=${id}`
        );

        if (participationRes.ok) {
          const participationData = await participationRes.json();

          if (participationData.length > 0) {
            const participation = participationData[0];

            // Fetch today's progress if the user is participating
            if (participation.status === "ACTIVE") {
              const todayRes = await fetch(
                `/api/challenges/daily-progress?userChallengeId=${participation.id}`
              );
              if (todayRes.ok) {
                const todayData = await todayRes.json();
                participation.todayProgress = todayData;
              }
            }

            // If user is connected to wallet, get on-chain stake details
            if (isConnected && signer) {
              try {
                const address = await signer.getAddress();
                const stakeDetails = await getStakeDetails(address, id);

                // Merge on-chain data with database data
                if (stakeDetails) {
                  participation.onChain = stakeDetails;
                }
              } catch (walletError) {
                console.error(
                  "Error fetching on-chain stake details:",
                  walletError
                );
                // We can still continue with database info if on-chain lookup fails
              }
            }

            setUserParticipation(participation);
          }
        }
      } catch (error) {
        console.error("Error fetching challenge data:", error);
        setError(error.message || "Failed to load challenge data");
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchChallengeData();
    }
  }, [id, isConnected, signer, getStakeDetails]);

  const renderProgressSection = () => {
    if (!userParticipation) return null;

    const { progressPercentage, currentStreak, longestStreak, status } =
      userParticipation;

    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm mb-6">
        <h3 className="text-lg font-medium text-slate-800 mb-4">
          Your Progress
        </h3>

        <div className="space-y-4">
          {/* Overall progress */}
          <div>
            <div className="flex justify-between text-sm text-slate-600 mb-1">
              <span>Overall Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-cyan-400 to-teal-500 h-2 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Today's progress */}
          {userParticipation.status === "ACTIVE" &&
            userParticipation.todayProgress && (
              <div>
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>Today's Practice</span>
                  <span>
                    {userParticipation.todayProgress.minutesPracticed}/
                    {challenge.dailyRequirement} minutes
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      userParticipation.todayProgress.completed
                        ? "bg-green-500"
                        : "bg-gradient-to-r from-cyan-400 to-teal-500"
                    }`}
                    style={{
                      width: `${Math.min(100, (userParticipation.todayProgress.minutesPracticed / challenge.dailyRequirement) * 100)}%`,
                    }}
                  ></div>
                </div>
                {userParticipation.todayProgress.completed && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ Daily goal completed! Great job!
                  </p>
                )}
              </div>
            )}

          {/* Streak info */}
          <div className="flex space-x-4">
            <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="text-sm text-slate-500">Current Streak</div>
              <div className="font-bold text-lg">{currentStreak} days</div>
            </div>

            <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="text-sm text-slate-500">Longest Streak</div>
              <div className="font-bold text-lg">{longestStreak} days</div>
            </div>
          </div>

          {userParticipation.status === "ACTIVE" &&
            userParticipation.progressPercentage >= 80 && (
              <div>
                {completionError && (
                  <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded-md p-3">
                    <p className="font-medium">Error completing challenge</p>
                    <p className="text-sm">{completionError}</p>
                  </div>
                )}

                <button
                  onClick={handleCompleteChallenge}
                  disabled={isCompletingChallenge}
                  className="cursor-pointer w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {isCompletingChallenge ? (
                    <>
                      <LoadingSpinner
                        size="small"
                        color="white"
                        className="mr-2"
                      />
                      Processing...
                    </>
                  ) : (
                    "Complete Challenge & Claim Rewards"
                  )}
                </button>
              </div>
            )}

          {/* Show completion status if available */}
          {completionStatus && (
            <div
              className={`mt-4 p-4 rounded-md ${
                completionStatus.success
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              <p className="font-medium">
                {completionStatus.success ? "Success!" : "Error"}
              </p>
              <p className="text-sm mt-1">{completionStatus.message}</p>

              {completionStatus.transactionHash && (
                <a
                  href={`https://mumbai.polygonscan.com/tx/${completionStatus.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs mt-2 inline-block underline"
                >
                  View transaction
                </a>
              )}
            </div>
          )}

          {/* If challenge is completed */}
          {status === "COMPLETED" && (
            <div className="bg-green-50 text-green-700 border border-green-200 rounded-md p-3">
              <p className="font-medium">Challenge Completed!</p>
              <p className="text-sm mt-1">
                You successfully completed this challenge and earned your
                rewards.
              </p>
            </div>
          )}

          {/* If challenge is failed */}
          {status === "FAILED" && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-md p-3">
              <p className="font-medium">Challenge Failed</p>
              <p className="text-sm mt-1">
                Unfortunately, this challenge was not completed successfully.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleCompleteChallenge = async () => {
    if (!userParticipation || userParticipation.status !== "ACTIVE") {
      return;
    }

    try {
      setIsCompletingChallenge(true);
      setCompletionError(null);

      const res = await fetch("/api/challenges/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userChallengeId: userParticipation.id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to complete challenge");
      }

      const data = await res.json();

      // Show success message
      setCompletionStatus({
        success: true,
        message: `Congratulations! You've completed the challenge and earned ${formatCurrency(data.reward)}`,
        transactionHash: data.transactionHash,
      });

      // Refresh challenge data after a short delay
      setTimeout(() => {
        router.refresh();
      }, 3000);
    } catch (error) {
      console.error("Error completing challenge:", error);
      setCompletionError(error.message || "Failed to complete challenge");
      setCompletionStatus({
        success: false,
        message: error.message || "Failed to complete challenge",
      });
    } finally {
      setIsCompletingChallenge(false);
    }
  };

  const handleJoinSuccess = (txHash) => {
    // Refresh the page data after successful join
    router.refresh();
    setShowJoinFlow(false);
  };

  // Get language flag emoji
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <LoadingState message="Loading challenge details..." height="96" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <ErrorMessage
            title="Failed to load challenge"
            message={error}
            retry={() => router.refresh()}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (!challenge) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <div className="text-center max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Challenge Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The challenge you're looking for doesn't exist or has been
              removed.
            </p>
            <button
              onClick={() => router.push("/dashboard/challenges")}
              className="cursor-pointer px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg hover:from-cyan-600 hover:to-teal-600"
            >
              View All Challenges
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show Join Flow if requested
  if (showJoinFlow) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <JoinChallengeFlow
            challenge={challenge}
            onSuccess={handleJoinSuccess}
            onCancel={() => setShowJoinFlow(false)}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Challenge header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-4 text-white">
              <div className="flex items-center">
                <span className="text-3xl mr-3">
                  {getLanguageFlag(challenge.languageCode)}
                </span>
                <h1 className="text-2xl font-bold">{challenge.title}</h1>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">{challenge.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="font-medium text-gray-700 mb-2">Duration</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {challenge.durationDays} days
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="font-medium text-gray-700 mb-2">
                    Daily Requirement
                  </h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {challenge.dailyRequirement} min/day
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="font-medium text-gray-700 mb-2">
                    Stake Amount
                  </h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(challenge.stakeAmount)}
                  </p>
                </div>
              </div>

              {/* Yield Information */}
              {userParticipation ? (
                <YieldInformation
                  stakedAmount={challenge.stakeAmount}
                  yieldPercentage={challenge.yieldPercentage}
                  durationDays={challenge.durationDays}
                  challengeStartDate={userParticipation.startDate}
                  isHardcore={challenge.isHardcore}
                />
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-amber-800 mb-2">
                    Reward Potential
                  </h3>
                  <p className="text-gray-700">
                    Complete this challenge to earn back your{" "}
                    {formatCurrency(challenge.stakeAmount)} stake plus up to{" "}
                    {challenge.yieldPercentage}% in additional rewards.
                  </p>
                </div>
              )}

              {challenge.isHardcore && !userParticipation && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-red-800 mb-2">
                    Hardcore Challenge
                  </h3>
                  <p className="text-gray-700">
                    This is a hardcore challenge. If you fail to meet the daily
                    requirements, your stake will be forfeited to the community
                    pool.
                  </p>
                </div>
              )}

              {userParticipation ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-green-800 mb-2">
                    You're Participating!
                  </h3>
                  <p className="text-gray-700 mb-4">
                    You joined this challenge on{" "}
                    {new Date(userParticipation.startDate).toLocaleDateString()}
                    . Your current progress is{" "}
                    {userParticipation.progressPercentage}%.
                  </p>

                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/learn?challengeId=${challenge.id}`
                      )
                    }
                    className="cursor-pointer bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all w-full"
                  >
                    Continue Practice
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowJoinFlow(true)}
                  className="cursor-pointer bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all w-full disabled:opacity-50"
                >
                  {`Stake ${formatCurrency(challenge.stakeAmount)} & Join Challenge`}
                </button>
              )}
            </div>
          </div>

          {/* Challenge details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                How This Challenge Works
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 mr-4">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1">
                      Stake your USDC
                    </h3>
                    <p className="text-gray-600">
                      Commit to your learning by staking{" "}
                      {formatCurrency(challenge.stakeAmount)}. Your funds are
                      securely locked in our smart contract.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 mr-4">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1">
                      Practice daily
                    </h3>
                    <p className="text-gray-600">
                      Complete at least {challenge.dailyRequirement} minutes of
                      language practice each day with our AI tutors.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 mr-4">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1">
                      Track your progress
                    </h3>
                    <p className="text-gray-600">
                      Monitor your learning streak and vocabulary growth on your
                      dashboard. Our AI will evaluate your language
                      improvements.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 mr-4">
                    4
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1">
                      Earn rewards
                    </h3>
                    <p className="text-gray-600">
                      Complete the {challenge.durationDays}-day challenge to
                      earn back your stake plus additional rewards from
                      generated yield.
                    </p>
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
