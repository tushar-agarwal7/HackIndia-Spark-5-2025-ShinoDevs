"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { motion, AnimatePresence } from "framer-motion";
import AdvancedAITutorAvatar from "@/components/learn/AdvancedAITutorAvatar";

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
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState("idle"); // idle, connecting, active, completed, error
  const [selectedTopic, setSelectedTopic] = useState("");
  const [availableTopics, setAvailableTopics] = useState([]);
  const [userFeedback, setUserFeedback] = useState(null);
  const [callEnded, setCallEnded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarType, setAvatarType] = useState("robot");
  const [transcript, setTranscript] = useState([]);
  const [ultravoxSession, setUltravoxSession] = useState(null);
  const [isMicActive, setIsMicActive] = useState(true);
  const durationTimerRef = useRef(null);
  const webRTCContainerRef = useRef(null);

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
      
      // End ultravox session if active
      if (ultravoxSession) {
        try {
          ultravoxSession.leaveCall();
        } catch (e) {
          console.error("Error leaving call:", e);
        }
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
    // Map language codes to Ultravox voice IDs
    const voices = {
      en: "b0e6b5c1-3100-44d5-8578-9015aa3023ae", // Jessica voice ID
      es: "b084d8f2-c9f9-491c-8059-d39dde80d58b", // Andrea-Spanish voice ID
      fr: "ab4eaa72-5cf3-40c1-a921-bca62a884bb4", // Alize-French voice ID
      de: "0191cf63-44b7-4277-bffe-be2f5dcc950c", // Susi-German voice ID
      it: "ee16d0ab-a1fe-4ff1-a63c-3ad8a0fdee8a", // Linda-Italian voice ID
      ja: "0985443f-644b-47a5-942a-39b2daf230fd", // Asahi-Japanese voice ID
      zh: "8b79b46f-3b1c-4280-9521-2cac1b6eabd5", // Maya-Chinese voice ID
      ko: "b0e6b5c1-3100-44d5-8578-9015aa3023ae", // Fallback to Jessica for Korean
      ru: "a8244028-72c3-4ae6-9fbe-3ad3da168dda", // Nadia-Russian voice ID
      pt: "2e6148f5-4c06-49db-8fa5-57bc30b31eeb", // Rosa-Portuguese voice ID
      ar: "9d7bc57b-2e1c-4622-acb7-39c4f32dacfb", // Salma-Arabic voice ID
      hi: "ebae2397-0ba1-4222-9d5b-5313ddeb04b5", // Anjali-Hindi-Urdu voice ID
    };

    return voices[languageCode] || "b0e6b5c1-3100-44d5-8578-9015aa3023ae"; // Default to Jessica voice ID
  };

  // Initialize Ultravox session and join call
  const initializeCall = async (joinUrl) => {
    try {
      // Dynamically import the ultravox-client library
      const { UltravoxSession } = await import('ultravox-client');
      
      // Create a new audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Initialize the Ultravox session
      const session = new UltravoxSession({
        experimentalMessages: new Set(["debug"]),
        audioContext: audioContext,
      });
      
      // Add event listener for status updates
      session.addEventListener('status', (e) => {
        const newStatus = e.target._status;
        console.log('Ultravox status:', newStatus);
        setCallStatus(newStatus === 'active' ? 'active' : newStatus);
        
        if (newStatus === 'idle') {
          setIsMicActive(true);
        }
      });
      
      // Add event listener for transcripts
      session.addEventListener('transcripts', (e) => {
        const transcripts = e.target._transcripts;
        const formattedTranscripts = transcripts
          .filter((t) => t && t.speaker)
          .map((t) => ({
            text: t.text,
            speaker: t.speaker === "user" ? "You" : "AI Tutor"
          }))
          .map((t) => `${t.speaker}: ${t.text}`);
        
        setTranscript(formattedTranscripts);
      });
      
      // Add event listener for agent speaking state
      session.addEventListener('agent_speaking', (e) => {
        setIsSpeaking(e.target._isAgentSpeaking);
      });
      
      // Join the call
      console.log('Joining call with URL:', joinUrl);
      await session.joinCall(joinUrl);
      
      // Save the session reference
      setUltravoxSession(session);
      
      console.log('Call joined successfully');
      return session;
    } catch (error) {
      console.error('Error initializing Ultravox session:', error);
      throw error;
    }
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

      console.log("Starting call with voice:", getVoiceForLanguage(languageCode));

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
      console.log("Call created successfully:", data);

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

      // Initialize Ultravox session
      try {
        await initializeCall(data.data.joinUrl);
        setCallStatus("active");
      } catch (error) {
        console.error("Error initializing call:", error);
        throw new Error("Failed to connect to the speaking practice. Please make sure your microphone is enabled and try again.");
      }
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

  // Toggle microphone
  const toggleMic = () => {
    if (ultravoxSession) {
      ultravoxSession.toggleMic();
      setIsMicActive(!isMicActive);
    }
  };

  // End the call and save results
  const endSpeakingPractice = async () => {
    try {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }

      // End the Ultravox session
      if (ultravoxSession) {
        await ultravoxSession.leaveCall();
        setUltravoxSession(null);
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

  // Format time for display (MM:SS)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Render topic selection
  const renderTopicSelection = () => {
    return (
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Speaking Practice
          </h1>
          <p className="text-gray-600 mt-2">
            Choose a topic to start practicing your{" "}
            {getLanguageName(languageCode)} speaking skills
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3">
            <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 mb-4">
        
              <div className="flex  justify-center gap-2 mb-4">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-lg border-2 cursor-pointer ${
                    avatarType === 'robot' 
                      ? 'border-amber-500 bg-amber-50' 
                      : 'border-gray-200 hover:border-amber-300'
                  }`}
                  onClick={() => setAvatarType('robot')}
                >
                  <div className="aspect-square h-[100px] bg-gradient-to-b from-slate-700 to-slate-900 rounded-lg flex items-center justify-center text-white text-2xl">
                    🤖
                  </div>
                  <p className="text-xs text-center mt-1">Robot</p>
                </motion.div>

               
              </div>

              <div className="mt-4">
                <AdvancedAITutorAvatar 
                  isActive={true}
                  isSpeaking={false}
                  languageCode={languageCode}
                  avatarType={avatarType}
                />

                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
                  <h3 className="font-medium mb-2">Meet Your AI Tutor</h3>
                  <p className="text-sm">Your personal language tutor will guide you through this conversation practice, providing feedback and corrections.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/3">
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Select a Conversation Topic
              </h2>

              <div className="space-y-3 mb-6">
                {availableTopics.map((topic, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ x: 5 }}
                    className={`p-3 rounded-lg border ${
                      selectedTopic === topic
                        ? 'bg-amber-50 border-amber-500'
                        : 'border-gray-200 hover:border-gray-300'
                    } cursor-pointer transition-colors`}
                    onClick={() => setSelectedTopic(topic)}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                          selectedTopic === topic
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-100'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="text-gray-900">{topic}</span>
                    </div>
                  </motion.div>
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
                      availableTopics.includes(selectedTopic)
                        ? ''
                        : selectedTopic
                    }
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    placeholder="Enter a custom topic..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startSpeakingPractice}
                  disabled={!selectedTopic}
                  className="cursor-pointer px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg disabled:opacity-50 font-medium flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Start Speaking Practice
                </motion.button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 mt-4">
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
        </div>
      </motion.div>
    );
  };

  // Render active call with WebRTC
  const renderWebRTCCall = () => {
    return (
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Avatar section - 1/3 of width on medium+ screens */}
          <div className="md:col-span-1">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-medium text-gray-900">Your AI Tutor</h2>
              </div>
              
              <div className="p-4">
                <AdvancedAITutorAvatar 
                  isActive={true}
                  isSpeaking={isSpeaking}
                  languageCode={languageCode}
                  avatarType={avatarType}
                />
                
                <div className="mt-4">
                  <div className="flex items-center mb-2">
                    <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'} mr-2`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {isSpeaking ? 'AI is speaking...' : 'AI is listening...'}
                    </span>
                  </div>
                  
                  <div className="bg-gray-100 rounded-lg p-3">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Practicing</h3>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{getLanguageName(languageCode)}</span> - {
                        proficiencyLevel.charAt(0) + proficiencyLevel.slice(1).toLowerCase()
                      } Level
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Topic: {selectedTopic}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
              <h3 className="font-medium mb-2">Speaking Tips</h3>
              <ul className="text-xs space-y-1">
                <li>• Speak naturally at a comfortable pace</li>
                <li>• Mistakes are part of learning - keep going!</li>
                <li>• Ask for repetition if needed</li>
                <li>• Use vocabulary you know</li>
              </ul>
            </div>
          </div>

          {/* WebRTC section - 2/3 of width on medium+ screens */}
          <div className="md:col-span-2">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200" ref={webRTCContainerRef}>
              <div className="relative bg-gray-50 p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm text-gray-600">
                    Status: <span className="font-medium">{callStatus}</span>
                  </div>
                  <button 
                    onClick={toggleMic} 
                    className={`p-2 rounded-full ${isMicActive ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}
                  >
                    {isMicActive ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  </div>

{/* Conversation transcript area */}
<div className="h-[300px] overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white mb-4">
  {callStatus === "connecting" ? (
    <div className="flex flex-col items-center justify-center h-full">
      <LoadingSpinner size="medium" />
      <p className="mt-4 text-gray-600">Connecting to your speaking practice...</p>
      <p className="text-sm text-gray-500 mt-2">Please allow microphone access when prompted</p>
    </div>
  ) : transcript.length === 0 ? (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
      <p>Your conversation will appear here</p>
      <p className="text-sm mt-1">Speak when the AI tutor asks you a question</p>
    </div>
  ) : (
    transcript.map((line, index) => (
      <div key={index} className="mb-3">
        <p className={`py-2 px-3 rounded-lg inline-block max-w-[85%] ${
          line.startsWith("You") 
            ? "bg-blue-50 text-blue-800 ml-auto" 
            : "bg-gray-100 text-gray-800"
        }`}>
          {line}
        </p>
      </div>
    ))
  )}
</div>

{/* Action buttons */}
<div className="flex justify-between mt-4">
  <div className="text-sm text-gray-500">
    {isMicActive ? (
      <span className="flex items-center">
        <span className="relative flex h-3 w-3 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        Microphone active
      </span>
    ) : (
      <span className="flex items-center">
        <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
        Microphone muted
      </span>
    )}
  </div>

  <button
    onClick={endSpeakingPractice}
    className="flex items-center px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
    </svg>
    End Call
  </button>
</div>
</div>

<div className="p-4 border-t border-gray-200">
<h3 className="font-medium text-gray-800 mb-3">Conversation Transcript</h3>
<div className="text-xs text-gray-500 mb-2">
  Your conversation will be saved for your learning history
</div>
{transcript.length > 0 && (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={endSpeakingPractice}
    className="cursor-pointer px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg w-full flex items-center justify-center mt-2"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
    </svg>
    End Practice Session
  </motion.button>
)}
</div>
</div>
</div>
</div>
</motion.div>
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
<motion.div 
className="text-center"
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}
>
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
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${stat.value}%` }}
          transition={{ duration: 1, delay: index * 0.2 }}
          className={`${stat.color} h-2 rounded-full`}
        ></motion.div>
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
<motion.button
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
onClick={() => {
setCallStatus("idle");
setCallEnded(false);
setJoinUrl(null);
setCallId(null);
setCallDuration(0);
setUserFeedback(null);
setTranscript([]);
setUltravoxSession(null);
}}
className="cursor-pointer px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium"
>
Practice Again
</motion.button>

<motion.button
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}
onClick={() => router.push("/dashboard/learn")}
className="cursor-pointer px-4 py-3 border border-gray-300 text-gray-700 rounded-lg"
>
Return to Dashboard
</motion.button>
</div>
</div>
</motion.div>
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
<div className="max-w-6xl mx-auto">
<AnimatePresence mode="wait">
{callStatus === "idle" && !callEnded && renderTopicSelection()}
{["connecting", "active"].includes(callStatus) && renderWebRTCCall()}
{callEnded && renderResults()}
</AnimatePresence>
</div>
</div>
</DashboardLayout>
);
}