// frontend/src/components/ChatInterface.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Bot, User, Loader2, Mic, MicOff, AlertTriangle } from "lucide-react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import Journal from './Journal';
import CrisisAlert from './CrisisAlert';

const BACKEND_URL = "http://localhost:3001";

// Purple Heart Logo Component
const PurpleHeartLogo = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#8B5CF6"/>
  </svg>
);

// Helper functions for localStorage
const getStoredSessionId = () => {
  try {
    return localStorage.getItem("sahara-session-id");
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return null;
  }
};

const saveSessionId = (sessionId) => {
  try {
    if (sessionId) {
      localStorage.setItem("sahara-session-id", sessionId);
    } else {
      localStorage.removeItem("sahara-session-id");
    }
  } catch (error) {
    console.error("Error writing to localStorage:", error);
  }
};

// Message persistence functions
const getStoredMessages = () => {
  try {
    const messages = localStorage.getItem("sahara-messages");
    return messages ? JSON.parse(messages) : [];
  } catch (error) {
    console.error("Error reading messages from localStorage:", error);
    return [];
  }
};

const saveMessages = (messages) => {
  try {
    localStorage.setItem("sahara-messages", JSON.stringify(messages));
  } catch (error) {
    console.error("Error saving messages to localStorage:", error);
  }
};

const clearStoredMessages = () => {
  try {
    localStorage.removeItem("sahara-messages");
  } catch (error) {
    console.error("Error clearing messages from localStorage:", error);
  }
};

function ChatInterface({ sessionId, setSessionId, setGlobalMoodData }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [moodData, setMoodData] = useState({
    mood: "neutral",
    riskLevel: "low",
    moodHistory: [],
    sentimentScore: 0,
    totalMessages: 0
  });

  // Crisis Detection States
  const [crisisAlert, setCrisisAlert] = useState(null);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);

  // Voice Recognition States
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 🔥 ENHANCED: Advanced emotion detection function
  const detectMoodFromMessage = useCallback((message) => {
    const text = message.toLowerCase().trim();
    let emotionScore = 0;
    let detectedEmotion = 'neutral';
    let riskLevel = 'low';
    let confidence = 0.5;
    
    // 🔥 CRISIS/SUICIDAL patterns (HIGHEST PRIORITY) - Score: -10
    const crisisPatterns = [
      // Direct suicidal ideation
      { pattern: /(?:want to|going to|thinking about|planning to).*(?:die|kill myself|end (?:my )?life)/i, score: -10 },
      { pattern: /(?:don't want to|can't|won't) live/i, score: -10 },
      { pattern: /suicide|suicidal thoughts?|end(?:ing)? it all/i, score: -10 },
      
      // Self-harm patterns
      { pattern: /(?:want to|going to|thinking about).*hurt myself/i, score: -9 },
      { pattern: /self ?harm|cut(?:ting)? myself/i, score: -9 },
      { pattern: /over myself|harm myself/i, score: -9 },
      
      // Hopelessness indicators
      { pattern: /(?:nothing|no one|nobody) (?:cares|loves me|wants me)/i, score: -8 },
      { pattern: /(?:better off|everyone would be better) (?:dead|without me)/i, score: -8 },
      { pattern: /(?:no (?:point|reason)|what's the point)/i, score: -7 },
    ];
    
    // 🔥 SEVERE DEPRESSION patterns - Score: -6 to -8
    const severeDepressionPatterns = [
      { pattern: /(?:completely|totally|extremely) (?:hopeless|worthless|broken)/i, score: -7 },
      { pattern: /hate (?:my )?life|life (?:is|feels) (?:meaningless|pointless)/i, score: -7 },
      { pattern: /(?:can't (?:take|handle)|unable to cope)/i, score: -6 },
      { pattern: /(?:deeply|severely|clinically) depressed/i, score: -6 },
    ];
    
    // 🔥 MODERATE NEGATIVE emotions - Score: -3 to -5
    const moderateNegativePatterns = [
      // Sadness
      { pattern: /(?:really|very|so) (?:sad|down|blue|low)/i, score: -4 },
      { pattern: /(?:feel|feeling) (?:depressed|miserable|awful)/i, score: -4 },
      { pattern: /(?:crying|tears|weeping)/i, score: -3 },
      
      // Anxiety
      { pattern: /(?:panic(?:king)?|anxiety attack|overwhelming)/i, score: -4 },
      { pattern: /(?:really|very|so) (?:anxious|worried|scared|nervous)/i, score: -3 },
      { pattern: /(?:can't (?:sleep|focus)|racing thoughts)/i, score: -3 },
      
      // Anger
      { pattern: /(?:really|very|so) (?:angry|mad|furious|pissed)/i, score: -3 },
      { pattern: /(?:hate (?:everything|everyone)|fed up)/i, score: -4 },
      { pattern: /(?:frustrated|irritated|annoyed)/i, score: -2 },
    ];
    
    // 🔥 MILD NEGATIVE emotions - Score: -1 to -2
    const mildNegativePatterns = [
      { pattern: /(?:a (?:bit|little)|somewhat|slightly) (?:sad|down|upset|worried)/i, score: -1 },
      { pattern: /(?:not (?:great|good)|could be better)/i, score: -1 },
      { pattern: /(?:tired|exhausted|drained)/i, score: -1 },
    ];
    
    // 🔥 POSITIVE emotions - Score: +1 to +5
    const positivePatterns = [
      // High positive
      { pattern: /(?:really|very|so|extremely) (?:happy|excited|joyful|elated|thrilled)/i, score: 4 },
      { pattern: /(?:amazing|fantastic|wonderful|incredible|perfect)/i, score: 4 },
      { pattern: /(?:love (?:life|this)|feel (?:great|awesome|fantastic))/i, score: 4 },
      
      // Moderate positive
      { pattern: /(?:happy|good|great|fine|okay)/i, score: 2 },
      { pattern: /(?:excited|pleased|content|satisfied)/i, score: 2 },
      { pattern: /(?:better|improving|getting better)/i, score: 1 },
    ];
    
    // 🔥 Check all patterns and find the strongest match
    const allPatterns = [
      ...crisisPatterns,
      ...severeDepressionPatterns,
      ...moderateNegativePatterns,
      ...mildNegativePatterns,
      ...positivePatterns
    ];
    
    let strongestMatch = null;
    
    for (const { pattern, score } of allPatterns) {
      if (pattern.test(text)) {
        if (!strongestMatch || Math.abs(score) > Math.abs(strongestMatch.score)) {
          strongestMatch = { pattern, score };
        }
      }
    }
    
    if (strongestMatch) {
      emotionScore = strongestMatch.score;
      confidence = Math.min(0.95, 0.7 + Math.abs(emotionScore) * 0.05);
    }
    
    // 🔥 Determine emotion and risk level based on score
    if (emotionScore <= -8) {
      detectedEmotion = 'distressed';
      riskLevel = 'high';
    } else if (emotionScore <= -5) {
      detectedEmotion = 'sad';
      riskLevel = 'medium';
    } else if (emotionScore <= -3) {
      detectedEmotion = 'anxious';
      riskLevel = 'medium';
    } else if (emotionScore <= -1) {
      detectedEmotion = 'sad';
      riskLevel = 'low';
    } else if (emotionScore >= 3) {
      detectedEmotion = 'happy';
      riskLevel = 'low';
    } else if (emotionScore >= 1) {
      detectedEmotion = 'content';
      riskLevel = 'low';
    } else {
      detectedEmotion = 'neutral';
      riskLevel = 'low';
    }
    
    return {
      mood: detectedEmotion,
      riskLevel: riskLevel,
      sentimentScore: Math.max(-1, Math.min(1, emotionScore / 10)),
      confidence: confidence,
      rawScore: emotionScore
    };
  }, []);

  // Update global mood data when local mood data changes
  useEffect(() => {
    if (setGlobalMoodData) {
      setGlobalMoodData(moodData);
      console.log('🔄 Updated global mood data:', moodData);
    }
  }, [moodData, setGlobalMoodData]);

  // Voice Recognition Setup with cleaned command handling
  const commands = [
    {
      command: 'send message',
      callback: () => {
        const cleanedMessage = inputMessage
          .replace(/\s*send message\s*$/i, '')
          .trim();
        
        if (cleanedMessage) {
          setInputMessage(cleanedMessage);
          setTimeout(() => {
            sendMessage();
          }, 50);
        }
      }
    },
    {
      command: 'clear input',
      callback: () => {
        setInputMessage('');
        resetTranscript();
      }
    },
    {
      command: 'open journal',
      callback: () => setShowJournal(true)
    },
    {
      command: 'close journal',
      callback: () => setShowJournal(false)
    },
    {
      command: 'new chat',
      callback: () => clearSession()
    }
  ];

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition({ commands });

  // Check voice support on mount
  useEffect(() => {
    setVoiceSupported(browserSupportsSpeechRecognition);
    if (!browserSupportsSpeechRecognition) {
      console.log('Voice recognition not supported in this browser');
    }
  }, [browserSupportsSpeechRecognition]);

  // Voice transcript handling with automatic cleanup
  useEffect(() => {
    if (transcript && isVoiceMode) {
      const cleanedTranscript = transcript
        .replace(/\s*send message\s*$/i, '')
        .trim();
      
      if (cleanedTranscript !== inputMessage) {
        setInputMessage(cleanedTranscript || transcript);
      }
    }
  }, [transcript, isVoiceMode, inputMessage]);

  // Load messages from localStorage on mount
  useEffect(() => {
    const storedMessages = getStoredMessages();
    if (storedMessages.length > 0) {
      setMessages(storedMessages);
      setIsConnected(true);
    }
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages]);

  // Auto-focus input after sending message
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  // Make journal function globally accessible for MoodTracker
  useEffect(() => {
    window.openJournal = () => {
      setShowJournal(true);
    };

    return () => {
      delete window.openJournal;
    };
  }, []);

  // Smart auto-scroll that doesn't trigger on page load
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (shouldScroll && messages.length > 0) {
      scrollToBottom();
      setShouldScroll(false);
    }
  }, [messages, scrollToBottom, shouldScroll]);

  // Restore session on page load
  useEffect(() => {
    const storedSessionId = getStoredSessionId();
    if (storedSessionId && !sessionId) {
      setSessionId(storedSessionId);
    }
  }, [setSessionId, sessionId]);

  // Initialize new chat session
  const initializeChat = useCallback(async () => {
    if (initialized) return;
    setInitialized(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.sessionId);
        saveSessionId(data.sessionId);
        setIsConnected(true);

        const welcomeMessage = {
          id: Date.now(),
          text: "Hello! I'm Sahara, your mental wellness companion. This is a safe, anonymous space where you can share anything on your mind. You can type or use voice input. How are you feeling today?",
          sender: "ai",
          timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);

        console.log("✅ Chat session initialized:", data.sessionId);
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
      setIsConnected(false);
      setInitialized(false);
    }
  }, [initialized, setSessionId]);

  // Load existing chat history
  const loadChatHistory = useCallback(async () => {
    if (!sessionId || initialized) return;
    setInitialized(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/${sessionId}/messages`);
      const data = await response.json();

      if (data.success) {
        const serverMessages = data.messages || [];
        const storedMessages = getStoredMessages();
        
        if (storedMessages.length >= serverMessages.length) {
          setMessages(storedMessages);
        } else {
          setMessages(serverMessages);
        }
        setIsConnected(true);

        if (data.mood || data.riskLevel) {
          setMoodData({
            mood: data.mood || "neutral",
            riskLevel: data.riskLevel || "low",
            moodHistory: data.moodHistory || [],
            sentimentScore: data.sentimentScore || 0,
            totalMessages: data.totalMessages || 0
          });
        }
        console.log("✅ Chat history loaded for session:", sessionId);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      setIsConnected(false);
      setInitialized(false);
    }
  }, [sessionId, initialized]);

  // Voice Control Functions
  const startVoiceRecognition = useCallback(() => {
    if (!voiceSupported) {
      alert('Voice recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }
    
    setIsVoiceMode(true);
    resetTranscript();
    SpeechRecognition.startListening({ 
      continuous: true,
      language: 'en-IN'
    });
  }, [voiceSupported, resetTranscript]);

  const stopVoiceRecognition = useCallback(() => {
    setIsVoiceMode(false);
    SpeechRecognition.stopListening();
  }, []);

  // Clear session and messages
  const clearSession = useCallback(() => {
    saveSessionId(null);
    clearStoredMessages();
    setSessionId(null);
    setMessages([]);
    setInitialized(false);
    setMoodData({
      mood: "neutral",
      riskLevel: "low",
      moodHistory: [],
      sentimentScore: 0,
      totalMessages: 0
    });
    setShowJournal(false);
    setShowCrisisAlert(false);
    setCrisisAlert(null);
    resetTranscript();
    console.log("🔄 Chat cleared manually");
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, [setSessionId, resetTranscript]);

  // Session management
  useEffect(() => {
    if (!initialized) {
      const storedMessages = getStoredMessages();
      if (storedMessages.length === 0) {
        if (!sessionId) {
          initializeChat();
        } else {
          loadChatHistory();
        }
      } else {
        setIsConnected(true);
        setInitialized(true);
      }
    }
  }, [sessionId, initializeChat, loadChatHistory, initialized]);

  // 🔥 ENHANCED: Send message with advanced emotion detection
  const sendMessage = useCallback(async () => {
    const cleanedMessage = inputMessage
      .replace(/\s*send message\s*$/i, '')
      .trim();
    
    if (!cleanedMessage || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: cleanedMessage,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    // 🔥 ENHANCED: Advanced emotion detection with scoring
    const detectedMood = detectMoodFromMessage(cleanedMessage);
    console.log('🎭 Advanced mood detection:', {
      message: cleanedMessage,
      detected: detectedMood.mood,
      risk: detectedMood.riskLevel,
      score: detectedMood.rawScore,
      confidence: detectedMood.confidence
    });

    // 🔥 ENHANCED: Update mood data with better tracking
    const newMoodData = {
      mood: detectedMood.mood,
      riskLevel: detectedMood.riskLevel,
      moodHistory: [...moodData.moodHistory, detectedMood.mood],
      sentimentScore: detectedMood.sentimentScore,
      totalMessages: (moodData.totalMessages || 0) + 1
    };
    
    setMoodData(newMoodData);
    console.log('🔄 Updated mood data:', newMoodData);

    setMessages(prev => [...prev, userMessage]);
    setShouldScroll(true);
    setInputMessage("");
    setIsLoading(true);
    
    resetTranscript();

    const typingIndicator = {
      id: Date.now() + 1,
      text: "...",
      sender: "ai",
      timestamp: new Date().toISOString(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingIndicator]);

    // 🔥 UPDATED: Crisis detection now uses the advanced scoring system
    const isCriticalSituation = detectedMood.rawScore <= -8 || detectedMood.riskLevel === 'high';

    if (isCriticalSituation) {
      console.log('🚨 CRITICAL SITUATION DETECTED - Advanced scoring triggered crisis alert');

      const fallbackCrisisData = {
        success: true,
        analysis: { 
          riskLevel: 'critical', 
          urgency: 'critical', 
          riskScore: Math.abs(detectedMood.rawScore),
          triggerWords: [detectedMood.mood]
        },
        response: { 
          message: 'I\'m very concerned about what you\'ve shared. You don\'t have to go through this alone. Immediate support is available.',
          priority: 'urgent' 
        }
      };
      
      setCrisisAlert(fallbackCrisisData);
      setShowCrisisAlert(true);
      
      const crisisMessage = {
        id: Date.now() + 10,
        text: `⚠️ I notice you might be going through a difficult time. I'm here to support you.`,
        sender: "ai",
        timestamp: new Date().toISOString(),
        isCrisisNotification: true
      };
      setMessages(prev => [...prev.filter(msg => !msg.isTyping), crisisMessage]);
    }

    try {
      // Send message to chat endpoint
      const response = await fetch(`${BACKEND_URL}/api/chat/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanedMessage,
          sender: "user",
        }),
      });

      // Backend crisis detection (only if not already detected locally)
      if (!isCriticalSituation) {
        try {
          const crisisResponse = await fetch(`${BACKEND_URL}/api/crisis/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: cleanedMessage,
              sessionId: sessionId,
              conversationHistory: messages.slice(-5).map(msg => ({
                text: msg.text,
                sender: msg.sender,
                timestamp: msg.timestamp
              }))
            }),
          });

          if (crisisResponse.ok) {
            const crisisData = await crisisResponse.json();
            console.log('🔍 Backend Crisis Analysis:', crisisData.analysis);
            
            const isCriticalRisk = crisisData.success && (
              (crisisData.analysis?.riskLevel === 'critical') ||
              (crisisData.analysis?.urgency === 'critical') ||
              (crisisData.analysis?.riskLevel === 'high' && crisisData.analysis?.riskScore >= 8)
            );

            if (isCriticalRisk) {
              console.log('🚨 BACKEND CRITICAL CRISIS DETECTED');
              setCrisisAlert(crisisData);
              setShowCrisisAlert(true);
              
              const crisisMessage = {
                id: Date.now() + 10,
                text: `⚠️ I notice you might be going through a difficult time. I'm here to support you.`,
                sender: "ai",
                timestamp: new Date().toISOString(),
                isCrisisNotification: true
              };
              setMessages(prev => [...prev.filter(msg => !msg.isTyping), crisisMessage]);
            }
          }
        } catch (crisisError) {
          console.error('❌ Crisis Detection Failed:', crisisError);
        }
      }

      // Handle regular chat response
      const data = await response.json();

      if (data.success) {
        if (data.messages) {
          setMessages(data.messages);
          setShouldScroll(true);
        } else {
          setMessages(prev => prev.filter(msg => !msg.isTyping));
          setShouldScroll(true);
        }

        // 🔥 UPDATED: Prioritize local advanced detection over server response
        if (!isCriticalSituation && detectedMood.confidence < 0.7 && (data.mood || data.riskLevel || data.sentimentScore !== undefined)) {
          console.log("🎭 Server mood data available, comparing with local detection");
          
          // Only use server data if local detection has low confidence
          setMoodData(prevMoodData => ({
            mood: data.mood || prevMoodData.mood,
            riskLevel: data.riskLevel || prevMoodData.riskLevel,
            moodHistory: data.moodHistory || [...prevMoodData.moodHistory, data.mood || prevMoodData.mood],
            sentimentScore: data.sentimentScore !== undefined ? data.sentimentScore : prevMoodData.sentimentScore,
            totalMessages: prevMoodData.totalMessages
          }));
        } else {
          console.log(`🎭 Using local advanced detection (confidence: ${detectedMood.confidence.toFixed(2)})`);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => prev.filter(msg => !msg.isTyping));

      const errorMessage = {
        id: Date.now() + 2,
        text: "I'm sorry, I'm having trouble connecting right now. Please try again.",
        sender: "ai",
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
      setShouldScroll(true);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, sessionId, isLoading, messages, resetTranscript, moodData, detectMoodFromMessage]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMessageStyle = (sender, isTyping, isError, isCrisisNotification) => {
    if (isError) return "bg-red-100 text-red-800 border border-red-200";
    if (isCrisisNotification) return "bg-orange-100 text-orange-800 border border-orange-300";
    if (isTyping) return "bg-gray-100 text-gray-600 animate-pulse";
    return sender === "user"
      ? "bg-blue-500 text-white"
      : "bg-gray-200 text-gray-800";
  };

  const handleCrisisActionTaken = (action) => {
    console.log('Crisis action taken:', action);
  };

  if (!isConnected && !sessionId && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Connecting to Sahara...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <PurpleHeartLogo className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Sahara AI Companion</h2>
              <p className="text-blue-100 text-sm flex items-center space-x-2">
                <span>{isConnected ? "Online • Anonymous Chat" : "Connecting..."}</span>
                {voiceSupported && (
                  <span className="flex items-center space-x-1">
                    <Mic className="w-3 h-3" />
                    <span className="text-xs">Voice Enabled</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setShowJournal(!showJournal)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                showJournal 
                  ? 'bg-white text-blue-600 border-white' 
                  : 'text-blue-100 hover:text-white border-blue-200 hover:border-white'
              }`}
            >
              📝 Journal
            </button>
            <button
              onClick={clearSession}
              className="text-xs text-blue-100 hover:text-white px-3 py-1 rounded-full border border-blue-200 hover:border-white transition-colors"
            >
              New Chat
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {showJournal ? (
          <div className="flex-1 overflow-y-auto p-4">
            <Journal />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Messages Container */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ minHeight: "200px", maxHeight: "calc(100vh - 320px)" }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === "user" ? "bg-blue-500 text-white" : 
                    message.isCrisisNotification ? "bg-orange-500 text-white" :
                    "bg-white border-2 border-purple-500"
                  }`}>
                    {message.sender === "user" ? (
                      <User className="w-5 h-5" />
                    ) : message.isCrisisNotification ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <PurpleHeartLogo className="w-5 h-5 text-purple-500" />
                    )}
                  </div>

                  <div className="max-w-xs lg:max-w-md">
                    <div className={`px-4 py-3 rounded-2xl ${getMessageStyle(
                      message.sender, message.isTyping, message.isError, message.isCrisisNotification
                    )} ${message.sender === "user" ? "rounded-br-sm" : "rounded-bl-sm"}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.isTyping ? (
                          <span className="flex items-center space-x-1">
                            <span>Analyzing your message</span>
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </span>
                        ) : (
                          message.text
                        )}
                      </p>
                    </div>

                    {!message.isTyping && (
                      <p className={`text-xs text-gray-500 mt-1 ${
                        message.sender === "user" ? "text-right" : "text-left"
                      }`}>
                        {formatTimestamp(message.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Voice Recognition Status */}
            {isVoiceMode && (
              <div className="flex-shrink-0 bg-blue-50 border-t border-blue-200 p-2">
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <span className="text-sm font-medium">
                    {listening ? 'Listening... (Say "send message" to send)' : 'Voice ready - Click mic to start'}
                  </span>
                </div>
              </div>
            )}

            {/* Input Area with Voice Support */}
            <div className="flex-shrink-0 border-t bg-gray-50 p-4">
              <div className="flex items-end space-x-3">
                {voiceSupported && (
                  <button
                    onClick={isVoiceMode ? stopVoiceRecognition : startVoiceRecognition}
                    className={`flex-shrink-0 p-3 rounded-full transition-all duration-200 ${
                      isVoiceMode 
                        ? "bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse" 
                        : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl"
                    }`}
                    title={isVoiceMode ? "Stop voice input" : "Start voice input"}
                  >
                    {isVoiceMode ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>
                )}

                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={voiceSupported ? "Type or speak your message..." : "Share what's on your mind..."}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="1"
                    style={{ minHeight: "44px", maxHeight: "120px" }}
                    disabled={isLoading}
                  />
                </div>

                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className={`flex-shrink-0 p-3 rounded-full transition-all duration-200 ${
                    inputMessage.trim() && !isLoading
                      ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-2 text-center">
                Your conversations are completely anonymous and confidential
                {voiceSupported && (
                  <span className="block mt-1">
                    🎤 Voice commands: "send message", "clear input", "open journal", "new chat"
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Crisis Alert Modal */}
      <CrisisAlert
        isVisible={showCrisisAlert}
        crisisData={crisisAlert}
        onClose={() => setShowCrisisAlert(false)}
        onActionTaken={handleCrisisActionTaken}
      />
    </div>
  );
}

export default ChatInterface;
