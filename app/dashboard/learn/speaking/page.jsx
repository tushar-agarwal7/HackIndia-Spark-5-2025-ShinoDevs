"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function SpeakingPracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [languageCode, setLanguageCode] = useState("");
  const [proficiencyLevel, setProficiencyLevel] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [userChallengeId, setUserChallengeId] = useState(null);
  const [joinUrl, setJoinUrl] = useState(null);
  const [callId, setCallId] = useState(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState("idle"); // idle, connecting, active, completed, error
  const [selectedTopic, setSelectedTopic] = useState("");
  const [availableTopics, setAvailableTopics] = useState([]);
  const [userFeedback, setUserFeedback] = useState(null);
  const [callEnded, setCallEnded] = useState(false);
  const iframeRef = useRef(null);
  const durationTimerRef = useRef(null);

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
            setNativeLanguage(profileData.nativeLanguage || "en");

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

        // Generate available topics based on language and level
        generateTopicSuggestions(language);
      } catch (error) {
        console.error("Error loading speaking practice data:", error);
        setError("Failed to load practice data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();

    // Cleanup on component unmount
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [searchParams, router]);

  // Function to generate topic suggestions based on language and level
  const generateTopicSuggestions = (language) => {
    // Basic topics for all languages
    const basicTopics = [
      "Introduce yourself",
      "Talk about your hobbies",
      "Describe your daily routine",
      "Talk about your family",
      "Describe your favorite food",
    ];

    // Add language-specific topics
    let topics = [...basicTopics];

    if (language === "ja") {
      topics.push("Japanese culture", "Anime and manga", "Travel in Japan");
    } else if (language === "es") {
      topics.push(
        "Hispanic culture",
        "Latin American food",
        "Travel in Spanish-speaking countries"
      );
    } else if (language === "fr") {
      topics.push("French cuisine", "Art and museums", "French literature");
    }

    // Set available topics
    setAvailableTopics(topics);
  };

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

  // Get appropriate voice for language
  const getVoiceForLanguage = (languageCode) => {
    const voices = {
      en: "alloy",
      es: "nova",
      fr: "alloy",
      de: "nova",
      it: "alloy",
      ja: "nova",
      zh: "alloy",
      ko: "nova",
      ru: "alloy",
      pt: "nova",
      ar: "alloy",
      hi: "nova",
    };

    return voices[languageCode] || "alloy";
  };

  // Start WebRTC call with Ultravox AI
  const startSpeakingPractice = async () => {
    if (!languageCode || !selectedTopic) return;

    try {
      setCallStatus("connecting");

      // Construct the system prompt based on language, proficiency, and topic
      const systemPrompt = createSystemPrompt(
        languageCode,
        proficiencyLevel,
        selectedTopic,
        nativeLanguage
      );

      // Call our API to create an Ultravox call
      const response = await fetch("/api/learn/speaking/start-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          languageCode,
          proficiencyLevel,
          systemPrompt,
          voice: getVoiceForLanguage(languageCode),
          topic: selectedTopic,
          userChallengeId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start speaking practice");
      }

      const data = await response.json();

      // Store the joining URL and call ID
      setJoinUrl(data.data.joinUrl);
      setCallId(data.data.callId);

      // Set call start time
      const startTime = new Date();
      setCallStartTime(startTime);

      // Start a timer to track call duration
      durationTimerRef.current = setInterval(() => {
        const now = new Date();
        const durationInSeconds = Math.floor((now - startTime) / 1000);
        setCallDuration(durationInSeconds);
      }, 1000);

      setCallStatus("active");
    } catch (error) {
      console.error("Error starting speaking practice:", error);
      setError(error.message || "Failed to start speaking practice");
      setCallStatus("error");
    }
  };

  // Create system prompt for Ultravox AI
  const createSystemPrompt = (
    languageCode,
    proficiencyLevel,
    topic,
    nativeLanguage
  ) => {
    const languageName = getLanguageName(languageCode);
    const level = proficiencyLevel.toLowerCase();

    return `You are a friendly and supportive ${languageName} language tutor named Shinobi. Your mission is to help the student practice speaking ${languageName}.

The student's proficiency level is ${level}, and their native language is ${nativeLanguage || "English"}.

Current conversation topic: ${topic}

Guidelines:
1. Speak naturally and conversationally in ${languageName}, adjusting your complexity to the student's ${level} level.
2. For beginners, use simple vocabulary and sentence structures. For advanced learners, use more complex language.
3. Allow the student time to respond and formulate their thoughts.
4. If the student makes mistakes, gently correct them by repeating their sentence correctly.
5. Ask open-ended questions to encourage the student to speak more.
6. Keep the conversation flowing naturally around the topic.
7. If the student struggles significantly, you can briefly provide a word or phrase in English to help them, but primarily stay in ${languageName}.
8. At the end of the conversation, provide brief feedback on what the student did well and areas for improvement.

Remember that your primary goal is to build the student's confidence in speaking ${languageName}. Be encouraging and supportive!

First, greet the student in ${languageName} and introduce yourself as their language tutor. Then ask a simple question about the topic to get the conversation started.`;
  };

  // End the call and save results
  const endSpeakingPractice = async () => {
    try {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }

      setCallStatus("completed");
      setCallEnded(true);

      // If there's a challenge ID, update progress
      if (userChallengeId) {
        // Calculate practice minutes (rounded up)
        const practiceMinutes = Math.ceil(callDuration / 60);

        try {
          await fetch("/api/challenges/update-progress", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userChallengeId,
              minutes: practiceMinutes,
              isSessionEnd: true,
              activityType: "SPEAKING",
            }),
          });
        } catch (progressError) {
          console.error("Error updating challenge progress:", progressError);
        }
      }

      // Save practice session details
      try {
        await fetch("/api/learn/speaking/save-result", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            languageCode,
            proficiencyLevel,
            pronunciationScore: userFeedback?.pronunciation || 70, // Default value if no feedback
            fluencyScore: userFeedback?.fluency || 70,
            accuracyScore: userFeedback?.accuracy || 70,
            overallScore: userFeedback?.overall || 70,
            prompt: selectedTopic,
            userChallengeId: userChallengeId || null,
            durationSeconds: callDuration,
          }),
        });
      } catch (saveError) {
        console.error("Error saving speaking practice results:", saveError);
      }
    } catch (error) {
      console.error("Error ending speaking practice:", error);
      setError(
        "Failed to save practice results, but your practice session was completed."
      );
    }
  };

  // Handle iframe message events
  useEffect(() => {
    const handleMessage = (event) => {
      // Check if the message is from Ultravox
      if (event.data && event.data.type === "ULTRAVOX_EVENT") {
        console.log("Ultravox event:", event.data);

        // Handle call ended event
        if (event.data.event === "CALL_ENDED") {
          endSpeakingPractice();

          // If there's feedback data in the event, save it
          if (event.data.feedback) {
            try {
              const feedback = JSON.parse(event.data.feedback);
              setUserFeedback(feedback);
            } catch (e) {
              console.error("Error parsing feedback:", e);
            }
          }
        }

        // Handle call started event
        if (event.data.event === "CALL_STARTED") {
          setCallStatus("active");
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [
    callId,
    userChallengeId,
    callDuration,
    selectedTopic,
    languageCode,
    proficiencyLevel,
  ]);

  // Format time for display (MM:SS)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Render topic selection
  const renderTopicSelection = () => {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Speaking Practice
          </h1>
          <p className="text-gray-600 mt-2">
            Choose a topic to start practicing your{" "}
            {getLanguageName(languageCode)} speaking skills
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Select a Conversation Topic
          </h2>

          <div className="space-y-3 mb-6">
            {availableTopics.map((topic, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  selectedTopic === topic
                    ? "bg-amber-50 border-amber-500"
                    : "border-gray-200 hover:border-gray-300"
                } cursor-pointer transition-colors`}
                onClick={() => setSelectedTopic(topic)}
              >
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                      selectedTopic === topic
                        ? "bg-amber-500 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-gray-900">{topic}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-700 mb-2">
              Or suggest your own topic:
            </h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={
                  selectedTopic === availableTopics.includes(selectedTopic)
                    ? ""
                    : selectedTopic
                }
                onChange={(e) => setSelectedTopic(e.target.value)}
                placeholder="Enter a custom topic..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={startSpeakingPractice}
              disabled={!selectedTopic}
              className="cursor-pointer px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg disabled:opacity-50"
            >
              Start Speaking Practice
            </button>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
          <h3 className="font-medium mb-2">How Speaking Practice Works</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>You'll have a real conversation with our AI language tutor</li>
            <li>
              Speak naturally and try to express your thoughts in{" "}
              {getLanguageName(languageCode)}
            </li>
            <li>
              The tutor will adjust to your proficiency level and help you
              improve
            </li>
            <li>
              You'll receive feedback on your pronunciation, fluency, and
              grammar
            </li>
            <li>Allow microphone access when prompted</li>
          </ul>
        </div>
      </div>
    );
  };

  // Render active call with WebRTC
  const renderWebRTCCall = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">
            Speaking Practice: {selectedTopic}
          </h1>
          <div className="flex items-center bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">{formatTime(callDuration)}</span>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
          <div className="aspect-w-16 aspect-h-9 relative">
            {joinUrl && (
              <iframe
                ref={iframeRef}
                src={joinUrl}
                className="w-full h-[600px] border-0"
                allow="camera; microphone; clipboard-write"
                onLoad={() => setIframeLoaded(true)}
              ></iframe>
            )}

            {!iframeLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
                <LoadingSpinner size="large" />
                <p className="mt-4 text-gray-600">
                  Connecting to your speaking practice session...
                </p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  Practicing:{" "}
                  <span className="font-medium text-gray-900">
                    {getLanguageName(languageCode)}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Topic:{" "}
                  <span className="font-medium text-gray-900">
                    {selectedTopic}
                  </span>
                </p>
              </div>

              <button
                onClick={endSpeakingPractice}
                className="cursor-pointer px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
              >
                End Practice
              </button>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
          <h3 className="font-medium mb-2">
            Tips for a Great Practice Session
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Speak clearly and at a comfortable pace</li>
            <li>
              Don't worry about making mistakes - they're part of learning!
            </li>
            <li>Try to express your thoughts using vocabulary you know</li>
            <li>
              If you don't understand something, ask: "Could you repeat that?"
              or "Could you speak more slowly?"
            </li>
            <li>
              Take your time to formulate responses - pauses are natural in
              conversation
            </li>
          </ul>
        </div>
      </div>
    );
  };

  // Render practice results
  const renderResults = () => {
    // Create feedback stats if we have user feedback
    const feedbackStats = userFeedback
      ? [
          {
            name: "Pronunciation",
            value: userFeedback.pronunciation,
            color: "bg-blue-500",
          },
          {
            name: "Fluency",
            value: userFeedback.fluency,
            color: "bg-green-500",
          },
          {
            name: "Accuracy",
            value: userFeedback.accuracy,
            color: "bg-purple-500",
          },
          {
            name: "Overall",
            value: userFeedback.overall,
            color: "bg-amber-500",
          },
        ]
      : [];

    return (
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Practice Complete!
          </h1>
          <p className="text-gray-600 mt-2">
            You've completed your {getLanguageName(languageCode)} speaking
            practice.
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-8 border border-gray-200 mb-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Your Practice Summary
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                <p className="text-sm text-amber-800">Practice Duration</p>
                <p className="text-xl font-bold text-amber-900">
                  {formatTime(callDuration)}
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-sm text-blue-800">Language</p>
                <p className="text-xl font-bold text-blue-900">
                  {getLanguageName(languageCode)}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <p className="text-sm text-green-800">Topic</p>
                <p className="text-xl font-bold text-green-900 truncate">
                  {selectedTopic}
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <p className="text-sm text-purple-800">Level</p>
                <p className="text-xl font-bold text-purple-900">
                  {proficiencyLevel.charAt(0) +
                    proficiencyLevel.slice(1).toLowerCase()}
                </p>
              </div>
            </div>

            {/* Display user feedback if available */}
            {userFeedback && (
              <div className="mt-8">
                <h3 className="text-md font-bold text-gray-800 mb-4">
                  Performance Scores
                </h3>

                <div className="space-y-4">
                  {feedbackStats.map((stat, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {stat.name}
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {stat.value}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${stat.color} h-2 rounded-full`}
                          style={{ width: `${stat.value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {userFeedback.suggestions &&
                  userFeedback.suggestions.length > 0 && (
                    <div className="mt-6 text-left">
                      <h3 className="text-md font-bold text-gray-800 mb-2">
                        Improvement Suggestions
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        {userFeedback.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={() => {
                setCallStatus("idle");
                setCallEnded(false);
                setJoinUrl(null);
                setCallId(null);
                setIframeLoaded(false);
                setCallDuration(0);
                setUserFeedback(null);
              }}
              className="cursor-pointer px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg"
            >
              Practice Again
            </button>

            <button
              onClick={() => router.push("/dashboard/learn")}
              className="cursor-pointer px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex flex-col justify-center items-center min-h-[400px]">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-500">Loading speaking practice...</p>
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
            title="Failed to load speaking practice"
            message={error}
            retry={() => window.location.reload()}
          />
        </div>
      </DashboardLayout>
    );
  }

  // Render main content based on current state
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {callStatus === "idle" && !callEnded && renderTopicSelection()}
          {["connecting", "active"].includes(callStatus) && renderWebRTCCall()}
          {callEnded && renderResults()}
        </div>
      </div>
    </DashboardLayout>
  );
}
