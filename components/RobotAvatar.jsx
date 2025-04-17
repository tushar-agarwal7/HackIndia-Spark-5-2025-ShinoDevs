"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AIAssistantChat from "./AIAssistantChat";

export default function RobotAvatar({ 
  size = "medium", 
  userProfile,
  showSpeechBubble = true
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [speechBubble, setSpeechBubble] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  
  const sizeClasses = {
    small: "w-10 h-10",
    medium: "w-16 h-16",
    large: "w-24 h-24",
  };

  const messageBubbleVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.8 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.8 },
  };

  // Random speech bubbles to show
  const speechBubbles = [
    "Need help with your language learning?",
    "こんにちは! Click me for assistance!",
    "Questions about your lessons?",
    "Let's practice your language skills!",
    "Want some learning tips?",
    "How's your challenge going?",
  ];

  // Choose a random speech bubble on mount and when animation changes
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * speechBubbles.length);
    setSpeechBubble(speechBubbles[randomIndex]);
    
    // Set periodic animation
    const animationInterval = setInterval(() => {
      setIsAnimating(prev => !prev);
    }, 5000);
    
    return () => clearInterval(animationInterval);
  }, []);

  // Toggle chat open/closed
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };
  
  // Extra animations when robot is clicked
  const handleClick = () => {
    setIsAnimating(true);
    toggleChat();
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 1000);
  };

  return (
    <>
      <div className="relative">
        <motion.div
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          onClick={handleClick}
          className={`relative cursor-pointer ${sizeClasses[size]}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            rotate: isAnimating ? [0, -10, 10, -10, 10, 0] : 0,
            y: isAnimating ? [0, -5, 0] : 0,
          }}
          transition={{
            duration: isAnimating ? 0.5 : 0.2,
            ease: "easeInOut",
          }}
        >
          <div 
            className={`relative bg-gradient-to-br from-cyan-400 to-teal-500 rounded-2xl w-full h-full flex items-center justify-center overflow-hidden border-2 ${
              isHovered || isAnimating ? "border-cyan-400 shadow-lg shadow-cyan-200/50" : "border-cyan-300 shadow-md"
            } transition-all duration-300`}
          >
            {/* Eyes */}
            <div className="flex space-x-2">
              <motion.div 
                className="bg-yellow-300 rounded-full w-1/4 h-1/4 flex items-center justify-center border border-yellow-400"
                animate={{
                  scale: isAnimating ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.5 }}
              >
                <motion.div 
                  className="bg-black rounded-full w-1/2 h-1/2"
                  animate={{
                    x: isHovered ? 1 : 0,
                    y: isHovered ? -1 : 0,
                  }}
                ></motion.div>
              </motion.div>
              <motion.div 
                className="bg-yellow-300 rounded-full w-1/4 h-1/4 flex items-center justify-center border border-yellow-400"
                animate={{
                  scale: isAnimating ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <motion.div 
                  className="bg-black rounded-full w-1/2 h-1/2"
                  animate={{
                    x: isHovered ? 1 : 0,
                    y: isHovered ? -1 : 0,
                  }}
                ></motion.div>
              </motion.div>
            </div>

            {/* Antenna */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <div className="w-1 h-3 bg-slate-600"></div>
              <motion.div 
                className="w-2 h-2 rounded-full bg-red-500"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              ></motion.div>
            </div>

            {/* Mouth */}
            <motion.div 
              className="absolute bottom-2 w-1/2 h-1 bg-slate-700 rounded-full"
              animate={{
                width: isHovered || isAnimating ? "60%" : "50%",
                height: isHovered || isAnimating ? "2px" : "1px",
              }}
              transition={{ duration: 0.3 }}
            ></motion.div>
          </div>

          {/* Shadow effect */}
          <motion.div 
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4/5 h-1 bg-black opacity-10 rounded-full blur-sm"
            animate={{
              width: isHovered ? "90%" : "80%",
              opacity: isHovered ? 0.15 : 0.1,
            }}
            transition={{ duration: 0.3 }}
          ></motion.div>
        </motion.div>

        {/* Speech bubble */}
        {showSpeechBubble && !isChatOpen && (
          <AnimatePresence>
            {(isHovered || isAnimating) && (
              <motion.div
                className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-white px-3 py-2 rounded-xl shadow-md border border-slate-200 text-slate-700 text-sm whitespace-nowrap z-10"
                variants={messageBubbleVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <div className="relative">
                  {speechBubble}
                  <div className="absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2">
                    <div className="w-0 h-0 border-t-8 border-r-8 border-b-8 border-transparent border-r-white"></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Chat interface */}
      <AnimatePresence>
        {isChatOpen && (
          <AIAssistantChat 
            onClose={() => setIsChatOpen(false)} 
            userProfile={userProfile}
          />
        )}
      </AnimatePresence>
    </>
  );
}