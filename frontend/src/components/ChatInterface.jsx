// frontend/src/components/ChatInterface.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Bot, User, Loader2, Mic, MicOff, AlertTriangle, Shield } from "lucide-react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import Journal from "./Journal";
import CrisisAlert from './crisisAlert';

import { CURRENT_BACKEND_URL } from '../config';
import apiService from '../services/apiService';
const BACKEND_URL = CURRENT_BACKEND_URL;

const PurpleHeartLogo = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#8B5CF6"/>
  </svg>
);

//  UPDATED: Add onResetChat prop to function signature
function ChatInterface({ 
  sessionId, 
  setSessionId, 
  setGlobalMoodData, 
  user, 
  sessionManager, 
  onResetChat  //  New prop for handling chat reset
}) {
  // Debug session info
  console.log('🔍 ChatInterface received props:', {
    sessionId,
    user,
    sessionManager: {
      sessionId: sessionManager.sessionId,
      userId: sessionManager.userId,
      isGuest: sessionManager.isGuest
    }
  });

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

  const [crisisAlert, setCrisisAlert] = useState(null);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Initialize session if not already done
  useEffect(() => {
    if (sessionId && user && (!sessionManager.sessionId || !sessionManager.userId)) {
      console.log('🔄 Initializing session in ChatInterface:', {
        sessionId,
        userId: user.userId,
        isGuest: user.isGuest
      });
      sessionManager.setSession(sessionId, user.userId, user.isGuest);
    }
  }, [sessionId, user, sessionManager]);

  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      if (sessionManager.sessionId && sessionManager.userId && !initialized) {
        try {
          console.log('📚 Loading chat history...');
          const data = await apiService.getChatHistory(sessionManager.userId);
          if (data.success && data.messages && data.messages.length > 0) {
            console.log('📚 Loaded chat history:', data.messages.length, 'messages');
            setMessages(data.messages);
            setInitialized(true);
            setIsConnected(true);
          }
        } catch (error) {
          console.error('❌ Error loading chat history:', error);
        }
      }
    };

    loadChatHistory();
  }, [sessionManager.sessionId, sessionManager.userId, initialized]);

  //  UPDATED: clearSession function that uses parent reset
  const clearSession = useCallback(() => {
    console.log('🎙️ Triggering chat reset via parent...');
    if (onResetChat) {
      onResetChat(); //  This triggers the parent reset function
    } else {
      // Fallback if onResetChat is not provided
      console.warn('onResetChat prop not provided, using fallback reset');
      setMessages([]);
      setInitialized(false);
      setInputMessage('');
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
    }
  }, [onResetChat]);

  // Voice Recognition Setup with all 5 commands
  const commands = [
    {
      command: 'send message',
      callback: () => {
        console.log('🎙️ Voice command: Send message');
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
        console.log('🎙️ Voice command: Clear input');
        setInputMessage('');
        resetTranscript();
      }
    },
    //  Clear Chat - Now uses parent reset function
    {
      command: 'clear chat',
      callback: () => {
        console.log('🎙️ Voice command: Clear chat');
        clearSession(); //  This now properly resets everything
      }
    },
    //  Open Journal
    {
      command: 'open journal',
      callback: () => {
        console.log('🎙️ Voice command: Open journal');
        setShowJournal(true);
      }
    },
    //  Close Journal
    {
      command: 'close journal',
      callback: () => {
        console.log('🎙️ Voice command: Close journal');
        setShowJournal(false);
      }
    }
  ];

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition({ commands });

  useEffect(() => {
    setVoiceSupported(browserSupportsSpeechRecognition);
  }, [browserSupportsSpeechRecognition]);

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

  // Update global mood data
  useEffect(() => {
    if (setGlobalMoodData) {
      console.log('📊 Updating global mood data:', moodData);
      setGlobalMoodData(moodData);
    }
  }, [moodData, setGlobalMoodData]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  useEffect(() => {
    window.openJournal = () => {
      setShowJournal(true);
    };

    return () => {
      delete window.openJournal;
    };
  }, []);

  // Enhanced scroll to bottom function
  const scrollToBottom = useCallback((behavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: behavior,
        block: "nearest",
        inline: "start"
      });
    }
  }, []);

  // Handle scrolling when messages update
  useEffect(() => {
    if (shouldScroll && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom("smooth");
        setShouldScroll(false);
      }, 50);
    }
  }, [messages, scrollToBottom, shouldScroll]);

  // Auto-scroll on initial load
  useEffect(() => {
    if (messages.length > 0 && initialized) {
      setTimeout(() => {
        scrollToBottom("auto");
      }, 100);
    }
  }, [initialized, scrollToBottom]);

  // Initialize chat session with enhanced welcome message
  const initializeChat = useCallback(async () => {
    if (initialized) return;
    setInitialized(true);

    try {
      // Check if session is properly initialized
      if (!sessionManager.sessionId || !sessionManager.userId) {
        console.error('❌ Session not properly initialized:', {
          sessionId: sessionManager.sessionId,
          userId: sessionManager.userId,
          isGuest: sessionManager.isGuest
        });
        return;
      }

      // Use API service for chat initialization
      const data = await apiService.startChat(sessionManager.sessionId, sessionManager.userId);

      if (data.success) {
        setIsConnected(true);

        // Only show welcome message if no existing messages
        if (messages.length === 0) {
          // Enhanced welcome message
          const welcomeMessage = {
            id: Date.now(),
            text: `Hello ${user?.username ? `, ${user.username}` : ''}! 👋

I'm Sahara, your mental wellness companion. Welcome to your safe, private space where you can share anything that's on your mind.

${user?.isGuest ? 
  ' You\'re in a guest session - your conversations will be automatically cleared when you end the session for complete privacy.' : 
  ' You\'re in a private session - your data is completely isolated from other users and stays secure.'
}

I'm here to listen and support you. You can type your thoughts, use the voice feature by clicking the microphone, or explore your journal to reflect on your feelings.

How are you feeling today? ❤️`,
            sender: "ai",
            timestamp: new Date().toISOString(),
          };
          
          setMessages([welcomeMessage]);
        }
        
        // Force scroll to show welcome message
        setTimeout(() => {
          setShouldScroll(true);
        }, 200);

        console.log(` Chat session initialized for ${user?.isGuest ? 'guest' : 'user'}: ${data.userId}`);
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
      setIsConnected(false);
      setInitialized(false);
    }
  }, [initialized, sessionId, setSessionId, user, sessionManager]);

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    if (!sessionManager.sessionId || initialized) return;
    setInitialized(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/history`, {
        headers: sessionManager.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.messages && data.messages.length > 0) {
          setMessages(data.messages);
          setIsConnected(true);
          setTimeout(() => setShouldScroll(true), 100);
          console.log(` Chat history loaded for ${data.isGuest ? 'guest' : 'user'}: ${data.userId}`);
        } else {
          // No history found, initialize new chat
          initializeChat();
        }
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      initializeChat(); // Fallback to new chat
    }
  }, [sessionManager, initialized, initializeChat]);

  useEffect(() => {
    if (!initialized) {
      if (sessionManager.sessionId) {
        loadChatHistory();
      } else {
        initializeChat();
      }
    }
  }, [sessionManager.sessionId, initializeChat, loadChatHistory, initialized]);

  // Voice control functions
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

  // Enhanced mood detection with better risk level detection
  const detectMoodFromMessage = useCallback((message) => {
    const text = message.toLowerCase().trim();
    let emotionScore = 0;
    let detectedEmotion = 'neutral';
    let riskLevel = 'low';
    
    // HIGH RISK patterns (Crisis detection)
    const crisisPatterns = [
      { pattern: /(?:want to|going to|thinking about|planning to).*(?:die|kill myself|end (?:my )?life)/i, score: -10 },
      { pattern: /(?:don't want to|can't|won't) live/i, score: -10 },
      { pattern: /suicide|suicidal thoughts?|end(?:ing)? it all/i, score: -10 },
      { pattern: /kill myself|hurt myself|harm myself/i, score: -10 },
    ];
    
    // MEDIUM RISK patterns
    const mediumRiskPatterns = [
      { pattern: /(?:really|very|so|extremely) (?:sad|down|blue|low|depressed)/i, score: -6 },
      { pattern: /(?:feel|feeling) (?:terrible|awful|horrible|miserable)/i, score: -6 },
      { pattern: /(?:really|very|so) (?:anxious|worried|scared|nervous)/i, score: -5 },
      { pattern: /(?:can't (?:take|handle)|unable to cope)/i, score: -5 },
      { pattern: /(?:hate (?:my )?life|life (?:is|feels) (?:meaningless|pointless))/i, score: -6 },
      { pattern: /(?:completely|totally) (?:hopeless|worthless|broken)/i, score: -6 },
    ];
    
    // LOW RISK negative patterns
    const negativePatterns = [
      { pattern: /(?:sad|down|blue|low)/i, score: -3 },
      { pattern: /(?:anxious|worried|nervous)/i, score: -3 },
      { pattern: /(?:stressed|tired|exhausted)/i, score: -2 },
      { pattern: /(?:upset|frustrated|annoyed)/i, score: -2 },
    ];
    
    // POSITIVE patterns
    const positivePatterns = [
      { pattern: /(?:really|very|so|extremely) (?:happy|excited|joyful|elated|thrilled)/i, score: 4 },
      { pattern: /(?:happy|good|great|fine|okay|wonderful|amazing)/i, score: 2 },
      { pattern: /(?:love|enjoy|excited|grateful)/i, score: 3 },
    ];
    
    const allPatterns = [...crisisPatterns, ...mediumRiskPatterns, ...negativePatterns, ...positivePatterns];
    
    // Find the strongest matching pattern
    for (const { pattern, score } of allPatterns) {
      if (pattern.test(text)) {
        emotionScore = score;
        break;
      }
    }
    
    // Determine emotion and risk level based on score
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
      detectedEmotion = 'happy';
      riskLevel = 'low';
    }
    
    console.log('🎭 Enhanced Mood Detection:', { 
      text: text.substring(0, 50) + '...', 
      emotion: detectedEmotion, 
      risk: riskLevel, 
      score: emotionScore 
    });
    
    return {
      mood: detectedEmotion,
      riskLevel: riskLevel,
      sentimentScore: Math.max(-1, Math.min(1, emotionScore / 10)),
      rawScore: emotionScore
    };
  }, []);

  // Send message
  const sendMessage = useCallback(async () => {
    const cleanedMessage = inputMessage.replace(/\s*send message\s*$/i, '').trim();
    
    if (!cleanedMessage || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: cleanedMessage,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    const detectedMood = detectMoodFromMessage(cleanedMessage);
    
    const newMoodData = {
      mood: detectedMood.mood,
      riskLevel: detectedMood.riskLevel,
      moodHistory: [...moodData.moodHistory, detectedMood.mood],
      sentimentScore: detectedMood.sentimentScore,
      totalMessages: (moodData.totalMessages || 0) + 1
    };
    
    console.log('📊 Setting new mood data:', newMoodData);
    setMoodData(newMoodData);

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
    setShouldScroll(true);

    const isCriticalSituation = detectedMood.rawScore <= -8;

    if (isCriticalSituation) {
      const fallbackCrisisData = {
        success: true,
        analysis: { 
          riskLevel: 'critical', 
          urgency: 'critical', 
          riskScore: Math.abs(detectedMood.rawScore)
        },
        response: { 
          message: 'I\'m very concerned about what you\'ve shared. You don\'t have to go through this alone.',
          priority: 'urgent' 
        }
      };
      
      setCrisisAlert(fallbackCrisisData);
      setShowCrisisAlert(true);
    }

    try {
      // Debug session info
      console.log('🔍 Debug session info:', {
        sessionId: sessionManager.sessionId,
        userId: sessionManager.userId,
        isGuest: sessionManager.isGuest
      });
      
      // Use API service for sending messages
      const data = await apiService.sendMessage(sessionManager.sessionId, cleanedMessage, sessionManager.userId);

      if (data.success) {
        if (data.messages) {
          setMessages(data.messages);
        } else {
          setMessages(prev => prev.filter(msg => !msg.isTyping));
        }
        setShouldScroll(true);

        // Use mock API mood data
        if (data.mood || data.riskLevel || data.sentimentScore !== undefined) {
          console.log('🌐 Mock API mood data received:', {
            mood: data.mood,
            riskLevel: data.riskLevel,
            sentimentScore: data.sentimentScore
          });
          
          setMoodData(prevMoodData => ({
            mood: data.mood || prevMoodData.mood,
            riskLevel: data.riskLevel || prevMoodData.riskLevel,
            moodHistory: [...prevMoodData.moodHistory, data.mood],
            sentimentScore: data.sentimentScore !== undefined ? data.sentimentScore : prevMoodData.sentimentScore,
            totalMessages: prevMoodData.totalMessages + 1
          }));
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
  }, [inputMessage, isLoading, moodData, resetTranscript, detectMoodFromMessage, sessionManager]);

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

  if (!isConnected && !sessionManager.sessionId && messages.length === 0) {
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
                <span>{isConnected ? `Online • ${user?.isGuest ? 'Guest' : 'Private'} Session` : "Connecting..."}</span>
                {voiceSupported && (
                  <span className="flex items-center space-x-1">
                    <Mic className="w-3 h-3" />
                    <span className="text-xs">Voice Enabled</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Always visible buttons */}
          <div className="flex space-x-2" style={{ minWidth: '160px' }}>
            <button
              onClick={() => setShowJournal(!showJournal)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                showJournal 
                  ? 'bg-white text-blue-600 border-white' 
                  : 'text-blue-100 hover:text-white border-blue-200 hover:border-white'
              }`}
              style={{ minWidth: '70px' }}
            >
              📝 Journal
            </button>
            {/*  New Chat button - Now properly clears everything */}
            <button
              onClick={clearSession}
              className="text-xs text-blue-100 hover:text-white px-3 py-1 rounded-full border border-blue-200 hover:border-white transition-colors"
              style={{ minWidth: '80px' }}
            >
              New Chat
            </button>
          </div>
        </div>
      </div>

      {/* Session Notice */}
      <div className="flex-shrink-0 bg-green-50 border-b border-green-200 px-4 py-2">
        <div className="flex items-center justify-center space-x-2 text-green-700">
          <Shield className="w-4 h-4" />
          <p className="text-xs">
             {user?.isGuest ? 'Guest' : 'Private'} session active for {user?.username || 'User'} - Data isolated from other users
            {user?.isGuest && ' (auto-cleared on logout)'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {showJournal ? (
          <div className="flex-1 overflow-y-auto p-4">
            <Journal user={user} sessionManager={sessionManager} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Messages container with independent scrolling */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
              style={{ 
                minHeight: "300px",
                maxHeight: "calc(100vh - 420px)",
                overflowY: "auto",
                scrollBehavior: "smooth"
              }}
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

              {/* Scroll anchor */}
              <div ref={messagesEndRef} style={{ height: '1px' }} />
            </div>

            {/* Enhanced Voice Status with available commands */}
            {isVoiceMode && (
              <div className="flex-shrink-0 bg-blue-50 border-t border-blue-200 p-3">
                <div className="flex items-center justify-center space-x-2 text-blue-600 mb-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <span className="text-sm font-medium">
                    {listening ? 'Listening... Say a command or speak your message' : 'Voice ready - Click mic to start'}
                  </span>
                </div>
                
                <div className="text-center">
                  <div className="text-xs text-blue-600 font-medium mb-1">Available Commands:</div>
                  <div className="flex flex-wrap justify-center gap-1 text-xs text-blue-500">
                    <span className="bg-blue-100 px-2 py-1 rounded-full">"send message"</span>
                    <span className="bg-blue-100 px-2 py-1 rounded-full">"clear input"</span>
                    <span className="bg-green-100 px-2 py-1 rounded-full text-green-600">"clear chat"</span>
                    <span className="bg-purple-100 px-2 py-1 rounded-full text-purple-600">"open journal"</span>
                    <span className="bg-purple-100 px-2 py-1 rounded-full text-purple-600">"close journal"</span>
                  </div>
                </div>
              </div>
            )}

            {/* Input Area */}
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
                    {isVoiceMode ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
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

              {/* Instructions with all 5 voice commands */}
              <p className="text-xs text-gray-500 mt-2 text-center">
                Your conversations are isolated and {user?.isGuest ? 'automatically cleared on logout' : 'completely private'}
                {voiceSupported && (
                  <span className="block mt-1">
                    🎤 Voice commands: "send message", "clear input", "clear chat", "open journal", "close journal"
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Crisis Alert */}
      <CrisisAlert
        isVisible={showCrisisAlert}
        crisisData={crisisAlert}
        onClose={() => setShowCrisisAlert(false)}
        onActionTaken={(action) => console.log('Crisis action taken:', action)}
      />
    </div>
  );
}

export default ChatInterface;
