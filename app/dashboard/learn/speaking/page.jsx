"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { motion, AnimatePresence } from "framer-motion";
import EnhancedAITutorAvatar from "@/components/learn/EnhancedAITutorAvatar";
import { Mic, MicOff, Phone, Volume, VolumeX, X } from "lucide-react";
import { toast } from "sonner";

// Import dialog components - adjust imports according to your UI library
// If you're using shadcn/ui:
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// If you're using a different UI library, replace with appropriate imports

export default function SpeakingPracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [languageCode, setLanguageCode] = useState("");
  const [proficiencyLevel, setProficiencyLevel] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [userChallengeId, setUserChallengeId] = useState(null);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState("idle"); // idle, connecting, active, completed, error
  const [selectedTopic, setSelectedTopic] = useState("");
  const [availableTopics, setAvailableTopics] = useState([]);
  const [userFeedback, setUserFeedback] = useState(null);
  const [callEnded, setCallEnded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarType, setAvatarType] = useState("humanoid");
  const [transcript, setTranscript] = useState([]);
  const [isMicActive, setIsMicActive] = useState(true);
  const [isVolumeActive, setIsVolumeActive] = useState(true);
  const [customTopicValue, setCustomTopicValue] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // New dialog-related states
  const [isConversationDialogOpen, setIsConversationDialogOpen] = useState(false);
  const [conversationSession, setConversationSession] = useState(null);
  const [audioAnalysis, setAudioAnalysis] = useState(null);
  
  const durationTimerRef = useRef(null);
  const transcriptEndRef = useRef(null);

  // Scroll to bottom of transcript when new messages arrive
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript]);

  useEffect(() => {
    // Cleanup function for component unmount
    return () => {
      // Explicitly clean up all WebGL contexts
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        const gl = canvas.getContext('webgl');
        if (gl) {
          const loseContext = gl.getExtension('WEBGL_lose_context');
          if (loseContext) loseContext.loseContext();
        }
      });
    };
  }, []);

  // Load language and topic data
  useEffect(() => {
    const challengeId = searchParams.get("challengeId");
    const language = searchParams.get("language");

    if (language) {
      setLanguageCode(language);
    }

    async function loadInitialData() {
      try {
        setIsLoading(true);
        setError(null);
        setLoadingProgress(10);

        // If there's a challenge ID, get its details
        if (challengeId) {
          const challengeRes = await fetch(`/api/challenges/${challengeId}`);
          if (!challengeRes.ok) {
            throw new Error("Failed to fetch challenge details");
          }

          const challengeData = await challengeRes.json();
          setLanguageCode(challengeData.languageCode);
          setProficiencyLevel(challengeData.proficiencyLevel);
          setLoadingProgress(40);

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
          setLoadingProgress(60);
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
            setLoadingProgress(50);
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
        setLoadingProgress(100);
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
      
      // End conversation session if active
      if (conversationSession) {
        try {
          conversationSession.leaveCall();
        } catch (e) {
          console.error("Error leaving call:", e);
        }
      }
    };
  }, [searchParams, router]);

  // Function to generate topic suggestions based on language and level
  const generateTopicSuggestions = (language) => {
    // Common topics for all languages
    const commonTopics = [
      "Introduce yourself",
      "Your hobbies and interests",
      "Your daily routine",
      "Describing your family",
      "Your favorite foods",
      "Your last vacation",
      "Plans for the weekend",
      "Your job or studies"
    ];

    // Beginner topics
    const beginnerTopics = [
      "Ordering at a restaurant",
      "Asking for directions",
      "Shopping for clothes",
      "Talking about the weather",
      "Introducing a friend",
      "Colors and numbers"
    ];

    // Intermediate topics
    const intermediateTopics = [
      "Discussing current events",
      "Describing your hometown",
      "Explaining your favorite movie",
      "Talking about cultural differences",
      "Discussing environmental issues",
      "Explaining a recipe"
    ];

    // Advanced topics
    const advancedTopics = [
      "Debating political philosophies",
      "Discussing technological innovations",
      "Analyzing literature or art",
      "Explaining complex scientific concepts",
      "Discussing global economic trends",
      "Debating ethical dilemmas"
    ];

    // Add language-specific topics
    const languageSpecificTopics = {
      es: [
        "Hispanic holidays and traditions",
        "Latin American cuisine",
        "Spanish music and dance",
        "Famous places in Spain/Latin America"
      ],
      fr: [
        "French cuisine and wine",
        "Parisian landmarks",
        "French art and literature",
        "French fashion trends"
      ],
      ja: [
        "Japanese anime and manga",
        "Traditional Japanese festivals",
        "Japanese cuisine and dining etiquette",
        "Tokyo neighborhoods"
      ],
      de: [
        "German automobile industry",
        "Oktoberfest traditions",
        "German literature and philosophy",
        "German cities and regions"
      ],
      it: [
        "Italian cuisine and cooking",
        "Italian art and architecture",
        "Italian fashion industry",
        "Regional differences in Italy"
      ],
      zh: [
        "Chinese New Year traditions",
        "Chinese tea culture",
        "Historic sites in China",
        "Chinese business etiquette"
      ]
    };

    // Combine topics based on proficiency level
    let topics = [...commonTopics];

    if (proficiencyLevel === "BEGINNER") {
      topics = [...topics, ...beginnerTopics];
    } else if (proficiencyLevel === "INTERMEDIATE") {
      topics = [...topics, ...intermediateTopics];
    } else if (proficiencyLevel === "ADVANCED") {
      topics = [...topics, ...advancedTopics];
    }

    // Add language-specific topics if available
    if (languageSpecificTopics[language]) {
      topics = [...topics, ...languageSpecificTopics[language]];
    }

    // Randomize order slightly to prevent always showing same topics
    topics.sort(() => Math.random() - 0.4);
    
    // Take top 12 topics to avoid overwhelming the user
    topics = topics.slice(0, 12);

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
      en: "b0e6b5c1-3100-44d5-8578-9015aa3023ae", // Jessica (English)
      es: "b084d8f2-c9f9-491c-8059-d39dde80d58b", // Andrea (Spanish)
      fr: "ab4eaa72-5cf3-40c1-a921-bca62a884bb4", // Alize (French)
      de: "0191cf63-44b7-4277-bffe-be2f5dcc950c", // Susi (German)
      it: "ee16d0ab-a1fe-4ff1-a63c-3ad8a0fdee8a", // Linda (Italian)
      ja: "0985443f-644b-47a5-942a-39b2daf230fd", // Asahi (Japanese)
      zh: "8b79b46f-3b1c-4280-9521-2cac1b6eabd5", // Maya (Chinese)
      ko: "eb899b28-9019-4fe9-908a-dbca6d76c3b9", // Ji-Woo (Korean)
      ru: "a8244028-72c3-4ae6-9fbe-3ad3da168dda", // Nadia (Russian)
      pt: "2e6148f5-4c06-49db-8fa5-57bc30b31eeb", // Rosa (Portuguese)
      ar: "9d7bc57b-2e1c-4622-acb7-39c4f32dacfb", // Salma (Arabic)
      hi: "ebae2397-0ba1-4222-9d5b-5313ddeb04b5", // Anjali (Hindi)
    };

    return voices[languageCode] || voices.en; // Default to Jessica voice
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
    const tutorNames = {
      en: "Emily",
      es: "Sofia",
      fr: "Amélie",
      de: "Hannah",
      it: "Giulia",
      ja: "Yuki",
      zh: "Li Wei",
      ko: "Min-ji",
      ru: "Anastasia",
      pt: "Isabella",
      ar: "Fatima",
      hi: "Priya"
    };
    
    const tutorName = tutorNames[languageCode] || "Emily";

    return `You are a friendly, patient, and encouraging ${languageName} language tutor named ${tutorName}. Your goal is to help the student practice speaking ${languageName} through natural conversation.

Student's profile:
- Proficiency level: ${level}
- Native language: ${nativeLanguage || "English"}
- Current conversation topic: ${topic}

Conversation guidelines:
1. Speak naturally and conversationally in ${languageName}, adjusting your complexity and pace to the student's ${level} level.
2. For beginners: Use simple vocabulary, basic sentence structures, and speak slowly and clearly.
   For intermediate: Use moderate complexity, introduce some idioms, and speak at a slightly slower than native pace.
   For advanced: Use natural complexity, colloquialisms, and speak at a natural pace.
3. Allow the student time to respond and formulate their thoughts.
4. When the student makes mistakes:
   - For minor errors, use "implicit correction" by rephrasing their statement correctly in your response
   - For significant errors that might lead to misunderstanding, gently correct them by saying "You can also say..." or "In ${languageName}, we would say..."
5. Ask open-ended questions to encourage the student to speak more.
6. If the student struggles significantly:
   - For beginners, briefly provide help in their native language if necessary
   - For all levels, offer simple prompts or vocabulary to help them continue
7. Be culturally relevant - incorporate aspects of ${languageName}-speaking cultures when appropriate.
8. Occasionally provide brief language tips related to grammar, pronunciation, or cultural context.
9. At the end of the conversation, provide brief constructive feedback on what the student did well and 1-2 specific areas for improvement.

Remember that your primary goal is to build the student's confidence in speaking ${languageName}. Keep the conversation flowing naturally and maintain an encouraging, supportive tone throughout.

Begin by warmly greeting the student in ${languageName}, introducing yourself as their language tutor, and asking a simple question about the topic to start the conversation.`;
  };

  // Handle selecting a topic
  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setCustomTopicValue("");
  };

  // Handle setting a custom topic
  const handleCustomTopic = () => {
    if (customTopicValue.trim()) {
      setSelectedTopic(customTopicValue.trim());
    }
  };

  // Format time for display (MM:SS)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // New approach: Start a conversation in a dialog
  const startConversation = async () => {
    if (!selectedTopic || !languageCode) {
      toast.error("Please select a conversation topic first");
      return;
    }

    try {
      setCallStatus("connecting");
      setError(null);
      setLoadingProgress(10);

      // Request microphone permission first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // We'll use this stream later, so store it on window temporarily
        window._tempMicrophoneStream = stream;
        setLoadingProgress(30);
      } catch (micError) {
        console.error("Microphone access denied:", micError);
        setCallStatus("idle");
        toast.error("Microphone access is required for speaking practice.");
        return;
      }

      // Create the system prompt for the AI tutor
      const systemPrompt = createSystemPrompt(
        languageCode,
        proficiencyLevel,
        selectedTopic,
        nativeLanguage
      );

      // Call API to create a new conversation
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
      
      // Record start time and setup timer
      const startTime = new Date();
      setCallStartTime(startTime);
      
      durationTimerRef.current = setInterval(() => {
        const now = new Date();
        const durationInSeconds = Math.floor((now - startTime) / 1000);
        setCallDuration(durationInSeconds);
      }, 1000);
      
      setLoadingProgress(70);
      
      // Open the conversation dialog
      setIsConversationDialogOpen(true);
      
      // Initialize the conversation in the dialog
      initializeConversation(data.data.joinUrl);
      
    } catch (error) {
      console.error("Error starting conversation:", error);
      setCallStatus("error");
      setError(error.message || "Failed to start speaking practice");
      
      // Clean up any resources
      if (window._tempMicrophoneStream) {
        window._tempMicrophoneStream.getTracks().forEach(track => track.stop());
        window._tempMicrophoneStream = null;
      }
      
      toast.error("Failed to start speaking practice. Please try again.");
    }
  };

  // Initialize the conversation inside the dialog
  const initializeConversation = async (joinUrl) => {
    if (!joinUrl) {
      console.error("No join URL provided");
      return;
    }
    
    try {
      // Import Ultravox dynamically
      const { UltravoxSession } = await import('ultravox-client');
      
      // Create an audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Create a new Ultravox session
      const session = new UltravoxSession({
        experimentalMessages: new Set(["debug", "audio_analysis"]),
        audioContext: audioContext,
        mediaStream: window._tempMicrophoneStream // Use the stream we already have permission for
      });
      
      // Set up event listeners
      session.addEventListener('status', (e) => {
        const status = e.target._status;
        console.log("Ultravox status:", status);
        
        setCallStatus(status === 'active' ? 'active' : status);
        
        if (status === 'idle') {
          setIsMicActive(true);
        }
      });
      
      session.addEventListener('transcripts', (e) => {
        const transcripts = e.target._transcripts;
        if (!transcripts) return;
        
        const formattedTranscripts = transcripts
          .filter((t) => t && t.speaker)
          .map((t) => ({
            text: t.text,
            speaker: t.speaker === "user" ? "You" : "AI Tutor",
            timestamp: new Date().toISOString(),
            id: Math.random().toString(36).substring(2, 9)
          }));
        
        setTranscript(formattedTranscripts);
      });
      
      session.addEventListener('agent_speaking', (e) => {
        setIsSpeaking(!!e.target._isAgentSpeaking);
      });
      
      session.addEventListener('audio_analysis', (e) => {
        if (e.target._audioAnalysis) {
          setAudioAnalysis({
            volume: e.target._audioAnalysis.volumeLevel || 0,
            pitch: e.target._audioAnalysis.pitch || 0,
            frequencies: e.target._audioAnalysis.frequencies || []
          });
        }
      });
      
      // Join the call
      await session.joinCall(joinUrl);
      
      // Store the session
      setConversationSession(session);
      
      // We don't need to keep the reference anymore
      window._tempMicrophoneStream = null;
      
      setLoadingProgress(100);
      
    } catch (error) {
      console.error("Error initializing conversation:", error);
      
      // Clean up resources
      if (window._tempMicrophoneStream) {
        window._tempMicrophoneStream.getTracks().forEach(track => track.stop());
        window._tempMicrophoneStream = null;
      }
      
      setCallStatus("error");
      setError(error.message || "Failed to connect to speaking practice");
      setIsConversationDialogOpen(false);
      
      toast.error("Failed to connect to speaking practice. Please try again.");
    }
  };

  // Toggle microphone
  const toggleMic = () => {
    if (conversationSession) {
      conversationSession.toggleMic();
      setIsMicActive(!isMicActive);
    }
  };

  // Toggle speaker
  const toggleVolume = () => {
    if (conversationSession) {
      conversationSession.toggleSpeaker();
      setIsVolumeActive(!isVolumeActive);
    }
  };

  // End the conversation
  const endConversation = async () => {
    try {
      // Stop the timer
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      
      // Leave the call
      if (conversationSession) {
        await conversationSession.leaveCall();
        setConversationSession(null);
      }
      
      // Close the dialog
      setIsConversationDialogOpen(false);
      
      // Generate feedback
      const mockFeedback = generateMockFeedback();
      setUserFeedback(mockFeedback);
      
      // Update status
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
            pronunciationScore: mockFeedback.pronunciation,
            fluencyScore: mockFeedback.fluency,
            accuracyScore: mockFeedback.accuracy,
            overallScore: mockFeedback.overall,
            prompt: selectedTopic,
            userChallengeId: userChallengeId || null,
            durationSeconds: callDuration,
          }),
        });
      } catch (saveError) {
        console.error("Error saving speaking practice results:", saveError);
      }
      
    } catch (error) {
      console.error("Error ending conversation:", error);
      toast.error("Error ending conversation. Your results may not be saved properly.");
    }
  };

  // Generate mock feedback
  const generateMockFeedback = () => {
    // Base scores on session duration (longer = slightly better)
    const durationFactor = Math.min(callDuration / 300, 1); // Max bonus at 5 minutes
    
    // Different score distributions based on proficiency
    let baseScore;
    if (proficiencyLevel === "BEGINNER") {
      baseScore = 65;
    } else if (proficiencyLevel === "INTERMEDIATE") {
      baseScore = 75;
    } else {
      baseScore = 85;
    }
    
    // Add some randomness to make it feel authentic
    const randomFactor = () => Math.floor(Math.random() * 10 - 5);
    
    // Calculate individual scores
    const pronunciationScore = Math.min(Math.max(baseScore - 5 + randomFactor() + (durationFactor * 10), 50), 98);
    const fluencyScore = Math.min(Math.max(baseScore - 2 + randomFactor() + (durationFactor * 10), 50), 98);
    const accuracyScore = Math.min(Math.max(baseScore + randomFactor() + (durationFactor * 8), 50), 98);
    const overallScore = Math.round((pronunciationScore + fluencyScore + accuracyScore) / 3);
    
    // Create relevant suggestions
    const suggestions = [];
    
    if (pronunciationScore < 75) {
      suggestions.push("Practice specific sounds unique to " + getLanguageName(languageCode));
    }
    
    if (fluencyScore < 75) {
      suggestions.push("Try to speak in longer phrases without pausing");
    }
    
    if (accuracyScore < 75) {
      suggestions.push("Focus on using correct verb tenses in your responses");
    }
    
    if (suggestions.length < 2) {
      suggestions.push("Continue practicing with more complex topics");
    }
    
    // Add language-specific suggestions
    if (languageCode === "es") {
      suggestions.push("Work on rolling your 'r' sounds in Spanish");
    } else if (languageCode === "fr") {
      suggestions.push("Practice nasal vowel sounds that are unique to French");
    } else if (languageCode === "ja") {
      suggestions.push("Focus on the rhythm and pitch accent of Japanese");
    }
    
    // Limit to 3 suggestions
    const finalSuggestions = suggestions.slice(0, 3);
    
    return {
      pronunciation: pronunciationScore,
      fluency: fluencyScore,
      accuracy: accuracyScore,
      overall: overallScore,
      suggestions: finalSuggestions,
      strengths: [
        "You maintained good engagement throughout the conversation",
        "You successfully communicated your main points",
        "You showed good vocabulary knowledge on this topic"
      ]
    };
  };

  // Reset the practice session
  const resetPractice = () => {
    setCallStatus("idle");
    setCallEnded(false);
    setCallDuration(0);
    setUserFeedback(null);
    setTranscript([]);
    setConversationSession(null);
    setSelectedTopic("");
    setCustomTopicValue("");
  };

// Enhanced Conversation Dialog Component with improved UI
const ConversationDialog = () => {


  const dialogContent = useMemo(() => (
    <DialogContent className="max-w-5xl h-[85vh] flex flex-col overflow-hidden p-0 gap-0 rounded-xl bg-gradient-to-b from-gray-50 to-white">
    {/* Header with better visual treatment */}
    <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-4 rounded-t-xl">
      <DialogTitle className="text-xl font-bold tracking-tight m-0">
        Speaking Practice: {selectedTopic}
      </DialogTitle>
      <DialogDescription className="text-amber-50 m-0 opacity-90 mt-1 flex items-center">
        <span className="mr-3">Conversation in {getLanguageName(languageCode)}</span>
        
      </DialogDescription>
    </div>
    
    <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-7 gap-4 p-5">
      {/* Avatar section - Now with 3/7 columns */}
      <div className="md:col-span-3 flex flex-col border rounded-xl overflow-hidden shadow-sm bg-white">
        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="font-medium text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            AI Language Tutor
          </h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isSpeaking 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {isSpeaking ? "Speaking" : "Listening"}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 bg-gradient-to-b from-white to-gray-50">
          <div className="relative">
            {/* <EnhancedAITutorAvatar 
              isActive={true}
              isSpeaking={isSpeaking}
              languageCode={languageCode}
              avatarType={avatarType}
              audioAnalysis={audioAnalysis}
              className="h-52 w-52"
            /> */}
            
            {/* Visual indicator for speaking state */}
            {isSpeaking && (
              <div className="absolute bottom-3 right-3 bg-white rounded-full p-1 shadow-md">
                <div className="bg-green-500 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          
          {/* Audio visualization */}
          <div className="w-full bg-white rounded-lg p-4 border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-gray-500">Audio Level</h4>
              <span className="text-xs text-gray-400">{audioAnalysis?.volume ? Math.round(audioAnalysis.volume * 100) : 0}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${isSpeaking ? 'bg-green-500' : 'bg-blue-500'} rounded-full transition-all duration-150`}
                style={{ width: `${audioAnalysis?.volume ? Math.max(audioAnalysis.volume * 100, 3) : 3}%` }}
              ></div>
            </div>
            
            {/* Audio waveform visualization */}
            <div className="mt-3 flex items-end justify-center h-10 gap-0.5">
              {Array.from({ length: 15 }, (_, i) => {
                // Generate random heights for wave animation
                const height = audioAnalysis?.volume 
                  ? Math.max(10, Math.min(40, audioAnalysis.volume * 100 * Math.sin(i/2 + Date.now()/500) + 20))
                  : Math.random() * 5 + 2;
                
                return (
                  <div 
                    key={i} 
                    className={`w-1.5 rounded-full ${isSpeaking ? 'bg-green-500' : 'bg-blue-400'} opacity-80`}
                    style={{ 
                      height: `${height}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  ></div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t bg-white flex justify-center gap-3">
          <button
            onClick={toggleMic}
            className={`flex items-center justify-center h-11 w-11 rounded-full transition-all ${
              isMicActive 
                ? 'bg-blue-500 text-white hover:bg-blue-600 ring-4 ring-blue-100' 
                : 'bg-red-500 text-white hover:bg-red-600 ring-4 ring-red-100'
            }`}
            title={isMicActive ? "Mute microphone" : "Unmute microphone"}
          >
            {isMicActive ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
          
          <button
            onClick={toggleVolume}
            className={`flex items-center justify-center h-11 w-11 rounded-full transition-all ${
              isVolumeActive 
                ? 'bg-blue-500 text-white hover:bg-blue-600 ring-4 ring-blue-100' 
                : 'bg-gray-500 text-white hover:bg-gray-600 ring-4 ring-gray-100'
            }`}
            title={isVolumeActive ? "Mute speaker" : "Unmute speaker"}
          >
            {isVolumeActive ? <Volume size={18} /> : <VolumeX size={18} />}
          </button>
          
          <button
            onClick={() => {
              if (confirm("Are you sure you want to end this practice session?")) {
                endConversation();
              }
            }}
            className="flex items-center justify-center h-11 w-11 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors ring-4 ring-red-100"
            title="End conversation"
          >
            <Phone size={18} />
          </button>
        </div>
      </div>
      
      {/* Conversation area - Now with 4/7 columns */}
      <div className="md:col-span-4 flex flex-col border rounded-xl overflow-hidden shadow-sm bg-white">
        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="font-medium text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
            Conversation
          </h3>
          <div className="flex items-center gap-2">
            {callStatus === "connecting" && (
              <div className="flex items-center text-amber-700 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse mr-1.5"></div>
                Connecting...
              </div>
            )}
            {callStatus === "active" && (
              <div className="flex items-center text-green-700 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1.5"></div>
                Connected
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 p-5 overflow-y-auto bg-white" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\" viewBox=\"0 0 100 100\"%3E%3Cpath fill=\"%23f9fafb\" d=\"M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\"%3E%3C/path%3E%3C/svg%3E'), linear-gradient(to bottom, #ffffff, #fafafa)" }}>
          {callStatus === "connecting" ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 border-4 border-t-amber-500 border-amber-200 rounded-full animate-spin mb-4"></div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">Establishing Connection</h3>
              <p className="text-gray-500 text-center max-w-sm">
                Setting up your conversation with the AI language tutor. 
                This may take a few moments...
              </p>
              <div className="w-64 bg-gray-200 h-1.5 mt-6 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full animate-pulse" style={{ width: `${loadingProgress}%` }}></div>
              </div>
            </div>
          ) : transcript.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">Ready to Begin</h3>
              <p className="text-gray-500 text-center max-w-sm">
                Your AI tutor will greet you momentarily. Make sure your microphone is enabled 
                and speak clearly when responding.
              </p>
            </div>
          ) : (
            <div className="space-y-4 px-2">
              {/* Date separator */}
              <div className="flex justify-center my-4">
                <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
                  Today, {new Date().toLocaleDateString()}
                </div>
              </div>
              
              {transcript.map((item, index) => (
                <div key={item.id} className={`flex ${item.speaker === "You" ? "justify-end" : "justify-start"} group`}>
                  {/* AI Tutor avatar for messages */}
                  {item.speaker !== "You" && (
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center mr-2 mt-1 overflow-hidden border border-amber-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  
                  <div className={`max-w-[75%] py-3 px-4 rounded-2xl shadow-sm ${
                    item.speaker === "You" 
                      ? "bg-blue-500 text-white" 
                      : "bg-white border border-gray-100"
                  } relative group-hover:shadow-md transition-shadow`}>
                    {/* Subtle timestamp that appears on hover */}
                    <div className={`text-[10px] ${item.speaker === "You" ? "text-blue-100" : "text-gray-400"} absolute -top-5 ${item.speaker === "You" ? "right-1" : "left-1"} opacity-0 group-hover:opacity-100 transition-opacity`}>
                      {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    
                    <div className={`text-xs font-medium mb-1 ${item.speaker === "You" ? "text-blue-100" : "text-gray-500"}`}>
                      {item.speaker}
                    </div>
                    <div className={`text-sm ${item.speaker === "You" ? "text-white" : "text-gray-800"}`}>
                      {item.text}
                    </div>
                  </div>
                  
                  {/* User avatar for messages */}
                  {item.speaker === "You" && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center ml-2 mt-1 overflow-hidden border border-blue-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          )}
        </div>
        
        <div className="p-3 border-t bg-white text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMicActive ? (
              <div className="flex items-center text-green-700">
                <span className="relative flex h-3 w-3 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Microphone active
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <span className="h-3 w-3 bg-red-500 rounded-full mr-2"></span>
                Microphone muted
              </div>
            )}
            
            <div className="w-px h-5 bg-gray-200 mx-1"></div>
            
            <div className="flex items-center text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              {transcript.length} messages
            </div>
          </div>
          
          <div className="text-xs px-2 py-1 bg-amber-50 text-amber-800 rounded-full">
            Topic: {selectedTopic.length > 20 ? selectedTopic.substring(0, 20) + "..." : selectedTopic}
          </div>
        </div>
      </div>
    </div>
    
    <div className="mt-1 bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-b-xl text-xs text-blue-700 border-t border-blue-200">
      <h4 className="font-semibold mb-2 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        Speaking Tips:
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          <span>Speak clearly at a comfortable pace</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          <span>Don't worry about small mistakes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          <span>Try to respond in complete sentences</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          <span>Ask questions to keep conversation going</span>
        </div>
      </div>
    </div>
  </DialogContent>
  ), [
    // Only add dependencies that should cause a remount
   ]);
  return (
    <Dialog 
    open={isConversationDialogOpen} 

  >
    {dialogContent}
  </Dialog>
  );
};

  // Render topic selection screen
  const renderTopicSelection = () => {
    return (
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 rounded-xl shadow-lg mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Speaking Practice
          </h1>
          <p className="text-amber-50 text-lg">
            Have a natural conversation with your AI language tutor in {getLanguageName(languageCode)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Your AI Tutor</h2>
              
              <div className="mb-6">
                {/* <EnhancedAITutorAvatar 
                  isActive={true}
                  isSpeaking={false}
                  languageCode={languageCode}
                  avatarType={avatarType}
                  className="mb-4"
                />
                 */}
                <div className="flex justify-center gap-4 mt-6">
                  {["humanoid", "robot", "animal"].map((type) => (
                    <motion.div 
                      key={type}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAvatarType(type)}
                      className={`relative cursor-pointer rounded-lg p-2 ${
                        avatarType === type 
                          ? 'bg-amber-50 border-2 border-amber-500' 
                          : 'bg-gray-50 border-2 border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="h-12 w-12 mx-auto flex items-center justify-center">
                        {type === 'humanoid' && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                            <circle cx="12" cy="7" r="4"/>
                            <path d="M12 11v4"/>
                            <path d="M8 15v2"/>
                            <path d="M16 15v2"/>
                            <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                          </svg>
                        )}
                        {type === 'robot' && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                            <rect x="3" y="11" width="18" height="10" rx="2"/>
                            <circle cx="8" cy="16" r="2"/>
                            <circle cx="16" cy="16" r="2"/>
                            <path d="M12 7v4"/>
                            <path d="M9 3h6"/>
                            <path d="M10 7h4"/>
                          </svg>
                        )}
                        {type === 'animal' && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600">
                            <path d="M8 3v3a2 2 0 0 1-2 2H3"/>
                            <path d="M16 3v3a2 2 0 0 0 2 2h3"/>
                            <path d="M12 19h4.5c1.4 0 2.5-1.1 2.5-2.5S17.9 14 16.5 14H13"/>
                            <path d="M12 19v-7l-3-2"/>
                            <path d="M8 19h4"/>
                            <path d="M8 12a4 4 0 0 0-3.2-3.9L4 8"/>
                            <path d="M16 12a4 4 0 0 1 3.2-3.9L20 8"/>
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-center mt-1 font-medium">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 mb-2">About Your Session</h3>
                <ul className="space-y-2 text-sm text-amber-700">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span><strong>Language:</strong> {getLanguageName(languageCode)}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span><strong>Level:</strong> {proficiencyLevel.charAt(0) + proficiencyLevel.slice(1).toLowerCase()}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span>Have a natural conversation with your AI tutor</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span>Receive feedback on your speaking skills</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Choose a Conversation Topic</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {availableTopics.map((topic, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ x: 3, backgroundColor: "#FFFBEB" }}
                    className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                      selectedTopic === topic
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-200'
                    }`}
                    onClick={() => handleSelectTopic(topic)}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center ${
                          selectedTopic === topic
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="text-gray-800 font-medium">{topic}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3">
                  Or suggest your own topic:
                </h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customTopicValue}
                    onChange={(e) => setCustomTopicValue(e.target.value)}
                    placeholder="Enter a custom topic..."
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCustomTopic}
                    disabled={!customTopicValue.trim()}
                    className="px-4 py-3 bg-amber-100 text-amber-700 rounded-lg disabled:opacity-50 font-medium"
                  >
                    Set Topic
                  </motion.button>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={startConversation}
                  disabled={!selectedTopic}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg disabled:opacity-50 font-medium flex items-center shadow-md"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Start Speaking Practice
                </motion.button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mt-6 text-blue-800">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Tips for Effective Practice
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="min-w-[1rem] h-4 flex items-center justify-center mt-0.5">•</div>
                  <span>Speak naturally at a comfortable pace</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-[1rem] h-4 flex items-center justify-center mt-0.5">•</div>
                  <span>Don't worry about making mistakes</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-[1rem] h-4 flex items-center justify-center mt-0.5">•</div>
                  <span>Use vocabulary you already know</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-[1rem] h-4 flex items-center justify-center mt-0.5">•</div>
                  <span>Ask for repetition if needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-[1rem] h-4 flex items-center justify-center mt-0.5">•</div>
                  <span>Listen carefully to pronunciation</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-[1rem] h-4 flex items-center justify-center mt-0.5">•</div>
                  <span>Try to express complete thoughts</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Render results page after conversation ends
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
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Practice Complete!
              </h1>
              <p className="text-green-50 text-lg">
                You've successfully completed your {getLanguageName(languageCode)} speaking practice
              </p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Session Summary</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                  <p className="text-sm text-amber-800 mb-1">Practice Duration</p>
                  <p className="text-xl font-bold text-amber-900">
                    {formatTime(callDuration)}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-sm text-blue-800 mb-1">Language</p>
                  <p className="text-xl font-bold text-blue-900">
                    {getLanguageName(languageCode)}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <p className="text-sm text-green-800 mb-1">Level</p>
                  <p className="text-xl font-bold text-green-900">
                    {proficiencyLevel.charAt(0) + proficiencyLevel.slice(1).toLowerCase()}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <p className="text-sm text-purple-800 mb-1">Topic</p>
                  <p className="text-xl font-bold text-purple-900 truncate">
                    {selectedTopic}
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                {/* <EnhancedAITutorAvatar 
                  isActive={true}
                  isSpeaking={false}
                  languageCode={languageCode}
                  avatarType={avatarType}
                /> */}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={resetPractice}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium flex items-center justify-center shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Practice Again
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push("/dashboard/learn")}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    Dashboard
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Performance Analysis</h2>
              
              {/* Display user feedback if available */}
              {userFeedback && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Your Scores
                  </h3>

                  <div className="space-y-5">
                    {feedbackStats.map((stat, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${stat.color} mr-2`}></div>
                            <span className="text-sm font-medium text-gray-700">
                              {stat.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-800">
                              {stat.value}/100
                            </span>
                            <span className="text-xs py-0.5 px-2 rounded-full bg-gray-100 text-gray-600">
                              {stat.value >= 90 ? 'Excellent' :
                               stat.value >= 80 ? 'Very Good' :
                               stat.value >= 70 ? 'Good' :
                               stat.value >= 60 ? 'Fair' : 'Needs Work'}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stat.value}%` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                            className={`${stat.color} h-2.5 rounded-full`}
                          ></motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Strengths */}
                <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Strengths
                  </h3>
                  
                  <ul className="space-y-2 text-green-800">
                    {userFeedback?.strengths?.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-5 h-5 mr-2 flex-shrink-0 text-green-600">•</span>
                        <span>{strength}</span>
                      </li>
                    )) || (
                      <li className="text-green-700">No strengths data available</li>
                    )}
                  </ul>
                </div>
                
                {/* Areas for improvement */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Areas for Improvement
                  </h3>
                  
                  <ul className="space-y-2 text-amber-800">
                    {userFeedback?.suggestions?.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-5 h-5 mr-2 flex-shrink-0 text-amber-600">•</span>
                        <span>{suggestion}</span>
                      </li>
                    )) || (
                      <li className="text-amber-700">No improvement suggestions available</li>
                    )}
                  </ul>
                </div>
              </div>
              
              {/* Conversation transcript summary */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                  </svg>
                  Conversation Summary
                </h3>
                
                <div className="bg-gray-50 rounded-xl p-4 max-h-[300px] overflow-y-auto">
                  {transcript.length > 0 ? (
                    <div className="space-y-3">
                      {transcript.map((item, index) => (
                        <div key={index} className="flex gap-2 text-sm">
                          <div className="font-semibold min-w-[80px] text-gray-600">
                            {item.speaker}:
                          </div>
                          <div className="text-gray-800 flex-1">{item.text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No conversation transcript available
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button 
                    className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg font-medium flex items-center"
                    onClick={() => {
                      // In a real app, this would download or export the transcript
                      toast('Transcript saved successfully!', {
                        position: 'bottom-right',
                        duration: 3000
                      });
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Save Transcript
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5 text-blue-800">
              <h3 className="font-semibold mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
                Tips for Continued Improvement
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="min-w-[1rem] h-4 flex items-center justify-center mt-0.5">•</div>
                  <span>Practice regularly, even for short 5-10 minute sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-[1rem] h-4 flex items-center justify-center mt-0.5">•</div>
                  <span>Listen to {getLanguageName(languageCode)} music, podcasts, or videos</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-[1rem] h-4 flex items-center justify-center mt-0.5">•</div>
                  <span>Use language learning apps for vocabulary building</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-[1rem] h-4 flex items-center justify-center mt-0.5">•</div>
                  <span>Record yourself speaking and listen back to identify areas for improvement</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-[1rem] h-4 flex items-center justify-center mt-0.5">•</div>
                  <span>Try to think in {getLanguageName(languageCode)} during everyday activities</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="min-w-[1rem] h-4 flex items-center justify-center mt-0.5">•</div>
                  <span>Schedule your next speaking practice session soon</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Loading State
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex flex-col justify-center items-center min-h-[500px]">
            <div className="w-20 h-20 border-4 border-t-transparent border-amber-500 rounded-full animate-spin mb-6"></div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">Loading speaking practice...</h3>
            <p className="text-gray-500">Setting up your personalized experience</p>
            
            <div className="w-64 bg-gray-200 rounded-full h-1.5 mt-6">
              <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${loadingProgress}%` }}></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error State
  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-center text-red-600 mb-2">
                Failed to load speaking practice
              </h1>
              
              <p className="text-gray-600 text-center mb-6">
                {error}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-red-100 text-red-600 rounded-lg font-medium flex items-center justify-center hover:bg-red-200 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Try Again
                </button>
                
                <button
                  onClick={() => router.push("/dashboard/learn")}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Main render
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <AnimatePresence mode="wait">
          {callStatus === "idle" && !callEnded && renderTopicSelection()}
          {callEnded && renderResults()}
        </AnimatePresence>
        
        {/* Conversation Dialog */}
        <ConversationDialog />
      </div>
    </DashboardLayout>
  );
}