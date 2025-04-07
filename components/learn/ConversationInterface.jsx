'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ConversationInterface({ languageCode, userChallengeId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [practiceTime, setPracticeTime] = useState(0);
  const [practiceStatus, setPracticeStatus] = useState({
    isActive: true,
    dailyGoal: 0,
    progress: 0,
    isCompleted: false
  });
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const messagesEndRef = useRef(null);
  const router = useRouter();
  
  // Initialize practice session and fetch daily goal
  useEffect(() => {
    const fetchPracticeInfo = async () => {
      if (!userChallengeId) return;
      
      try {
        const response = await fetch(`/api/challenges/practice-info?userChallengeId=${userChallengeId}`);
        if (response.ok) {
          const data = await response.json();
          setPracticeStatus({
            isActive: true,
            dailyGoal: data.dailyRequirement || 20,
            progress: data.todayProgress || 0,
            isCompleted: data.todayCompleted || false
          });
        }
      } catch (error) {
        console.error('Error fetching practice info:', error);
      }
    };
    
    fetchPracticeInfo();
    setSessionStartTime(new Date());
  }, [userChallengeId]);
  
  // Timer for practice tracking - update every minute
  useEffect(() => {
    let timer;
    if (sessionStartTime) {
      // Initial calculation
      const calculatePracticeTime = () => {
        const now = new Date();
        const elapsedMinutes = Math.floor((now - sessionStartTime) / 60000);
        setPracticeTime(elapsedMinutes);
        
        // Update progress if part of a challenge
        if (userChallengeId) {
          setPracticeStatus(prev => ({
            ...prev,
            progress: prev.progress + 1,
            isCompleted: prev.progress + 1 >= prev.dailyGoal
          }));
          
          // Send progress update to server
          updatePracticeProgress(elapsedMinutes);
        }
      };
      
      // Set timer to run every minute
      timer = setInterval(calculatePracticeTime, 60000);
    }
    
    return () => clearInterval(timer);
  }, [sessionStartTime, userChallengeId]);
  
  // Function to update practice progress on server
  const updatePracticeProgress = async (minutes) => {
    if (!userChallengeId) return;
    
    try {
      await fetch('/api/challenges/update-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userChallengeId,
          minutes: 1 // We track 1 minute at a time
        }),
      });
    } catch (error) {
      console.error('Error updating practice progress:', error);
    }
  };
  
  // Start conversation with initial greeting
  useEffect(() => {
    const startConversation = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'Hello, I would like to practice conversation.',
            languageCode,
            userChallengeId
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to start conversation');
        }
        
        const data = await response.json();
        
        setMessages([
          { sender: 'user', content: 'Hello, I would like to practice conversation.' },
          { sender: 'ai', content: data.content }
        ]);
        setConversationId(data.conversationId);
      } catch (error) {
        console.error('Error starting conversation:', error);
        setMessages([
          { 
            sender: 'system', 
            content: 'There was an error starting the conversation. Please try again or contact support.' 
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (languageCode && messages.length === 0) {
      startConversation();
    }
  }, [languageCode, userChallengeId]);
  
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    
    // Add user message immediately
    setMessages(prev => [...prev, { sender: 'user', content: userMessage }]);
    
    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          languageCode,
          userChallengeId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Add AI response
      setMessages(prev => [...prev, { sender: 'ai', content: data.content }]);
      
      // Update conversation ID if it's a new conversation
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        sender: 'system', 
        content: 'Sorry, there was an error processing your message. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEndSession = async () => {
    try {
      // Calculate final practice time
      const finalMinutes = practiceTime;
      
      // Ensure we save the final practice minutes
      if (userChallengeId && finalMinutes > 0) {
        await fetch('/api/challenges/update-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userChallengeId,
            minutes: finalMinutes,
            isSessionEnd: true,
            conversationId
          }),
        });
      }
      
      // Optionally get a summary of the session
      if (conversationId) {
        await fetch('/api/conversation/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId
          }),
        });
      }
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Error ending session:', error);
      router.push('/dashboard');
    }
  };


  const renderProgressBar = () => {
    if (!userChallengeId) return null;
    
    const percentage = Math.min(100, (practiceStatus.progress / practiceStatus.dailyGoal) * 100);
    
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm text-slate-500 mb-1">
          <span>Daily Goal: {practiceStatus.progress}/{practiceStatus.dailyGoal} minutes</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              practiceStatus.isCompleted 
                ? 'bg-green-500' 
                : 'bg-gradient-to-r from-cyan-400 to-teal-500'
            }`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        {practiceStatus.isCompleted && (
          <p className="text-sm text-green-600 mt-1">
            ✓ Daily goal completed! Keep practicing for extra progress.
          </p>
        )}
      </div>
    );
  };
  
  
  return (
    <div className="flex flex-col h-full max-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center">
                {languageCode === 'ja' ? '🇯🇵' : 
                 languageCode === 'ko' ? '🇰🇷' : 
                 languageCode === 'zh' ? '🇨🇳' : 
                 languageCode === 'en' ? '🇬🇧' : 
                 languageCode === 'es' ? '🇪🇸' : 
                 languageCode === 'fr' ? '🇫🇷' : '🌐'}
              </div>
            </div>
            <div>
              <h2 className="font-bold text-slate-800">
                {languageCode === 'ja' ? 'Japanese' : 
                 languageCode === 'ko' ? 'Korean' : 
                 languageCode === 'zh' ? 'Chinese' : 
                 languageCode === 'en' ? 'English' : 
                 languageCode === 'es' ? 'Spanish' : 
                 languageCode === 'fr' ? 'French' : 'Conversation'} Practice
              </h2>
              <p className="text-sm text-slate-500">Practice time: {practiceTime} minutes</p>
            </div>
          </div>
          <button 
            onClick={handleEndSession}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
          >
            End Session
          </button>
        </div>
        {renderProgressBar()}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-lg p-4 ${
              message.sender === 'user' 
                ? 'bg-cyan-100 text-slate-800' 
                : message.sender === 'ai'
                ? 'bg-white border border-slate-200 text-slate-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-lg p-4 max-w-[75%]">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="border-t border-slate-200 p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
      
    </div>
  );
}