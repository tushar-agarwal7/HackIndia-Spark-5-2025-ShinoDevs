"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIAssistantChat({ onClose, userProfile }) {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      content: "こんにちは! How can I help with your language learning today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(
    userProfile?.learningLanguages?.[0]?.languageCode || "ja"
  );
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  // Get language flag from code
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || isTyping) return;
    
    // Add user message
    const userMessage = {
      sender: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    
    try {
      // Send message to API
      const response = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input.trim(),
          languageCode: selectedLanguage,
          previousMessages: messages.map(msg => ({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.content
          })),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get response");
      }
      
      const data = await response.json();
      
      // Add AI response with typing effect delay
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            content: data.content,
            timestamp: new Date(),
          },
        ]);
        setIsTyping(false);
      }, 500);
    } catch (error) {
      console.error("Error in chat:", error);
      
      // Add error message
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            content: "Sorry, I had trouble processing that. Can you try again?",
            timestamp: new Date(),
            isError: true,
          },
        ]);
        setIsTyping(false);
      }, 500);
    }
  };

  // Change language handler
  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
    
    // Add system message about language change
    setMessages((prev) => [
      ...prev,
      {
        sender: "system",
        content: `Switched to ${getLanguageName(e.target.value)} ${getLanguageFlag(e.target.value)}`,
        timestamp: new Date(),
      },
    ]);
  };

  // Generate quick suggestions based on context
  const getQuickSuggestions = () => {
    const suggestions = [
      "How do I say 'hello' in Japanese?",
      "What's the best way to practice vocabulary?",
      "Can you explain counters in Japanese?",
      "Give me a beginner grammar exercise",
      "How do I stay motivated when learning a language?",
    ];

    // If studying a different language, modify first suggestion
    if (selectedLanguage !== "ja") {
      suggestions[0] = `How do I say 'hello' in ${getLanguageName(selectedLanguage)}?`;
      suggestions[2] = `What are common phrases in ${getLanguageName(selectedLanguage)}?`;
    }

    return suggestions;
  };

  // Format time for messages
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-20 right-6 z-50 bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200 w-full max-w-md flex flex-col"
      style={{ height: "550px", maxHeight: "80vh" }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white py-3 px-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-white rounded-full mr-3 flex items-center justify-center text-xl shadow-md">
            <span role="img" aria-label="Robot" className="text-cyan-500">
              🤖
            </span>
          </div>
          <div>
            <h3 className="font-bold text-white">Shinobi Assistant</h3>
            <div className="flex items-center text-xs text-cyan-100">
              <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
              <span>Language Helper Bot</span>
            </div>
          </div>
        </div>
        <div className="flex">
          <select
            value={selectedLanguage}
            onChange={handleLanguageChange}
            className="mr-2 text-sm bg-white/20 border border-white/20 text-white rounded py-1 px-2 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="ja">🇯🇵 Japanese</option>
            <option value="ko">🇰🇷 Korean</option>
            <option value="zh">🇨🇳 Chinese</option>
            <option value="en">🇬🇧 English</option>
            <option value="es">🇪🇸 Spanish</option>
            <option value="fr">🇫🇷 French</option>
            <option value="de">🇩🇪 German</option>
          </select>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-slate-50">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className="message-container">
              {message.sender === "system" ? (
                <div className="flex justify-center my-2">
                  <div className="bg-slate-200 text-slate-600 rounded-full py-1 px-3 text-xs">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.sender === "ai" && (
                    <div className="flex-shrink-0 mr-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs shadow">
                        🤖
                      </div>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.sender === "user"
                        ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
                        : message.isError
                        ? "bg-red-50 border border-red-200 text-red-600"
                        : "bg-white border border-slate-200 text-slate-700"
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <div
                      className={`text-right text-xs mt-1 ${
                        message.sender === "user"
                          ? "text-cyan-100"
                          : "text-slate-400"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                  {message.sender === "user" && (
                    <div className="flex-shrink-0 ml-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs shadow">
                        {userProfile?.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex-shrink-0 mr-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs shadow">
                  🤖
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Suggestions */}
      <div className="bg-white border-t border-slate-200 px-4 pt-2 overflow-x-auto">
        <div className="flex space-x-2 pb-2 hide-scrollbar snap-x">
          {getQuickSuggestions().map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                setInput(suggestion);
                inputRef.current?.focus();
              }}
              className="whitespace-nowrap text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full px-3 py-1.5 flex-shrink-0 transition-colors snap-start"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="bg-white p-3 border-t border-slate-200">
        <div className="flex space-x-2">
          <input
            type="text"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${getLanguageName(selectedLanguage)} or language learning...`}
            className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-700"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className={`bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 ${
              isTyping || !input.trim()
                ? "opacity-50 cursor-not-allowed"
                : "hover:from-cyan-600 hover:to-teal-600"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </form>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
}