"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function QuickLearnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("");
  const [sessionProgress, setSessionProgress] = useState(0);
  const [remainingTime, setRemainingTime] = useState(600); // 10 minutes in seconds
  const [sessionComplete, setSessionComplete] = useState(false);
  const messagesEndRef = useRef(null);
  const [popularLanguages, setPopularLanguages] = useState([
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
    { code: "zh", name: "Chinese", flag: "🇨🇳" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "it", name: "Italian", flag: "🇮🇹" },
    { code: "ko", name: "Korean", flag: "🇰🇷" },
    { code: "ru", name: "Russian", flag: "🇷🇺" },
  ]);
  const [conversationId, setConversationId] = useState(null);
  const [userChallengeId, setUserChallengeId] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Start countdown timer when session begins
  useEffect(() => {
    let timer;
    if (sessionStarted && remainingTime > 0 && !sessionComplete) {
      timer = setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime <= 1) {
            // End session when timer runs out
            clearInterval(timer);
            setSessionComplete(true);
            sendSystemMessage("Time's up! You've completed your 10-minute language crash course!");
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sessionStarted, remainingTime, sessionComplete]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start new learning session
  const startSession = async (languageCode) => {
    if (isLoading) return;

    setIsLoading(true);
    setTargetLanguage(languageCode);
    setSessionStarted(true);
    setSessionProgress(0);
    setRemainingTime(600); // Reset to 10 minutes

    // Add initial welcome message
    const initialMessage = {
      id: Date.now().toString(),
      sender: "system",
      content: `Welcome to your 10-minute ${getLanguageName(languageCode)} crash course! I'll help you learn essential phrases and vocabulary quickly. Let's get started!`,
    };

    setMessages([initialMessage]);

    try {
      // Create a new quick learn session
      const response = await fetch("/api/learn/quick-learn/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          languageCode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start session");
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setConversationId(data.conversationId);

      // Send first AI message to initiate the conversation
      sendFirstMessage(languageCode);
    } catch (error) {
      console.error("Error starting session:", error);
      sendSystemMessage("There was an error starting your session. Please try again.");
      setSessionStarted(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Get language name from code
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

  // Get flag emoji for a language
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

  // Send system message
  const sendSystemMessage = (content) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: Date.now().toString(),
        sender: "system",
        content,
      },
    ]);
  };

  // Send first AI message after session starts
  const sendFirstMessage = async (languageCode) => {
    try {
      const response = await fetch("/api/learn/quick-learn/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          conversationId,
          isFirstMessage: true,
          languageCode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now().toString(),
          sender: "ai",
          content: data.message,
        },
      ]);

      // Update progress (start at 10%)
      setSessionProgress(10);
    } catch (error) {
      console.error("Error getting AI response:", error);
      sendSystemMessage("There was an error communicating with the AI tutor. Please try again.");
    }
  };

  // Handle user input submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userInput.trim() || isLoading) return;

    const userMessage = userInput.trim();
    setUserInput("");
    setIsLoading(true);

    // Add user message to the chat
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: Date.now().toString(),
        sender: "user",
        content: userMessage,
      },
    ]);

    try {
      // Send message to API
      const response = await fetch("/api/learn/quick-learn/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
          conversationId,
          languageCode: targetLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      // Add AI response to chat
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now().toString(),
          sender: "ai",
          content: data.message,
        },
      ]);

      // Update progress (increment by 5-10% each exchange, capped at 95%)
      // Final 5% reserved for completion
      setSessionProgress((prev) => Math.min(95, prev + Math.floor(Math.random() * 5) + 5));

      // Check if session should complete (either by time or by completion signal from AI)
      if (data.isCompleted) {
        setSessionComplete(true);
        setSessionProgress(100);
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      sendSystemMessage("There was an error getting a response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // End session and return to dashboard
  const endSession = async () => {
    if (sessionId) {
      try {
        await fetch("/api/learn/quick-learn/end", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            conversationId,
          }),
        });
      } catch (error) {
        console.error("Error ending session:", error);
      }
    }

    // Redirect back to learn page
    router.push("/dashboard/learn");
  };

  // Restart session
  const restartSession = () => {
    setMessages([]);
    setSessionStarted(false);
    setSessionComplete(false);
    setSessionProgress(0);
    setTargetLanguage("");
  };

  // Render language selection screen
  const renderLanguageSelection = () => (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Language in 10 Minutes</h1>
        <p className="text-lg opacity-90">
          Pick a language and learn essential phrases in just 10 minutes!
        </p>
      </div>

      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Popular Languages</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {popularLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => startSession(language.code)}
                className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:shadow-md"
              >
                <span className="text-4xl mb-2">{language.flag}</span>
                <span className="font-medium text-gray-800">{language.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            How It Works
          </h2>
          <ul className="space-y-2 text-blue-700">
            <li className="flex items-start">
              <span className="inline-block h-5 w-5 mr-2 flex-shrink-0 text-blue-600">•</span>
              <span>You'll have a <strong>10-minute crash course</strong> with our AI language tutor</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block h-5 w-5 mr-2 flex-shrink-0 text-blue-600">•</span>
              <span>Learn <strong>essential greetings</strong>, <strong>basic phrases</strong>, and <strong>useful vocabulary</strong></span>
            </li>
            <li className="flex items-start">
              <span className="inline-block h-5 w-5 mr-2 flex-shrink-0 text-blue-600">•</span>
              <span>Interactive dialogue with pronunciation guides</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block h-5 w-5 mr-2 flex-shrink-0 text-blue-600">•</span>
              <span>Perfect for travelers or beginners looking for a quick introduction</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  // Render the chat interface after language selection
  const renderChatInterface = () => (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden h-[80vh] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4 text-white flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
            {getLanguageFlag(targetLanguage)}
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {getLanguageName(targetLanguage)} in 10 Minutes
            </h1>
            <div className="text-sm opacity-90 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Time remaining: {formatTime(remainingTime)}
            </div>
          </div>
        </div>
        <button
          onClick={endSession}
          className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          End Session
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-gray-100 w-full">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
          style={{ width: `${sessionProgress}%` }}
        ></div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.sender === "user"
                    ? "bg-blue-500 text-white"
                    : message.sender === "ai"
                    ? "bg-white shadow-sm border border-gray-100"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                {message.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-4 max-w-[80%]">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-blue-300 rounded-full animate-bounce"></div>
                <div
                  className="w-3 h-3 bg-blue-300 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-3 h-3 bg-blue-300 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!sessionComplete ? (
        <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-white">
          <div className="flex space-x-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isLoading}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg disabled:opacity-50 font-medium"
            >
              Send
            </button>
          </div>
        </form>
      ) : (
        <div className="border-t border-gray-200 p-5 bg-white space-y-4">
          <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-green-800">
            <h3 className="font-medium text-lg mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Crash Course Complete!
            </h3>
            <p>
              Congratulations! You've completed your 10-minute crash course in {getLanguageName(targetLanguage)}. 
              You've learned some essential phrases that will help you in basic conversations.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={restartSession}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium"
            >
              Try Another Language
            </button>
            <button
              onClick={endSession}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Render loading state
  if (isLoading && !sessionStarted) {
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
      <div className="container mx-auto py-8 px-4">
        {!sessionStarted ? renderLanguageSelection() : renderChatInterface()}
      </div>
    </DashboardLayout>
  );
}