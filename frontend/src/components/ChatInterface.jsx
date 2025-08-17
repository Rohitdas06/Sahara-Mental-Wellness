// frontend/src/components/ChatInterface.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import LiveMoodInsights from "./LiveMoodInsights";
import Journal from './Journal';

const BACKEND_URL = "http://localhost:3001";

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

function ChatInterface({ sessionId, setSessionId }) {
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
  });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null); // 🔧 NEW: Input reference for auto-focus

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

  // 🔧 NEW: Auto-focus input after sending message
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  // 🔧 NEW: Make journal function globally accessible for MoodTracker
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
    // Only scroll if it's a new message being added, not on initial load
    if (shouldScroll && messages.length > 0) {
      scrollToBottom();
      setShouldScroll(false);
    }
  }, [messages, scrollToBottom, shouldScroll]);

  // Restore session on page load - runs only once
  useEffect(() => {
    const storedSessionId = getStoredSessionId();
    if (storedSessionId && !sessionId) {
      setSessionId(storedSessionId);
    }
  }, []);

  // Initialize new chat session with proper dependencies
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
          text: "Hello! I'm Sahara, your mental wellness companion. This is a safe, anonymous space where you can share anything on your mind. How are you feeling today?",
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

  // Load existing chat history with proper dependencies
  const loadChatHistory = useCallback(async () => {
    if (!sessionId || initialized) return;
    setInitialized(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/${sessionId}/messages`);
      const data = await response.json();

      if (data.success) {
        const serverMessages = data.messages || [];
        const storedMessages = getStoredMessages();
        
        // Use stored messages if they exist and are more recent
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

  // Clear session and messages only when button clicked
  const clearSession = () => {
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
    });
    setShowJournal(false);
    console.log("🔄 Chat cleared manually");
    
    // 🔧 NEW: Focus input after clearing
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // Session management - runs only when sessionId changes or component mounts
  useEffect(() => {
    if (!initialized) {
      // If we have stored messages, don't initialize new chat
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

  // Send message function with controlled scrolling
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage.trim(),
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setShouldScroll(true);
    setInputMessage("");
    setIsLoading(true);

    const typingIndicator = {
      id: Date.now() + 1,
      text: "...",
      sender: "ai",
      timestamp: new Date().toISOString(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingIndicator]);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: userMessage.text,
          sender: "user",
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.messages) {
          setMessages(data.messages);
          setShouldScroll(true);
        } else {
          setMessages(prev => prev.filter(msg => !msg.isTyping));
          setShouldScroll(true);
        }

        // Update mood data state
        if (data.mood || data.riskLevel) {
          setMoodData({
            mood: data.mood || "neutral",
            riskLevel: data.riskLevel || "low",
            moodHistory: data.moodHistory || [],
            sentimentScore: data.sentimentScore || 0,
          });
        }

        console.log("🎭 Real-time Mood Analysis:", {
          mood: data.mood,
          riskLevel: data.riskLevel,
          score: data.sentimentScore,
        });
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
  }, [inputMessage, sessionId, isLoading]);

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

  const getMessageStyle = (sender, isTyping, isError) => {
    if (isError) return "bg-red-100 text-red-800 border border-red-200";
    if (isTyping) return "bg-gray-100 text-gray-600 animate-pulse";
    return sender === "user"
      ? "bg-blue-500 text-white"
      : "bg-gray-200 text-gray-800";
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
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Sahara AI Companion</h2>
              <p className="text-blue-100 text-sm">
                {isConnected ? "Online • Anonymous Chat" : "Connecting..."}
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

      {/* Main Content Area - Input always visible */}
      <div className="flex-1 flex flex-col min-h-0">
        {showJournal ? (
          <div className="flex-1 overflow-y-auto p-4">
            <Journal />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Messages Container - Calculated height to keep input visible */}
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
                    message.sender === "user" ? "bg-blue-500 text-white" : "bg-purple-500 text-white"
                  }`}>
                    {message.sender === "user" ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>

                  <div className="max-w-xs lg:max-w-md">
                    <div className={`px-4 py-3 rounded-2xl ${getMessageStyle(
                      message.sender, message.isTyping, message.isError
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

            {/* Input Area - Always visible with proper spacing */}
            <div className="flex-shrink-0 border-t bg-gray-50 p-4">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    ref={inputRef} // 🔧 NEW: Added ref for auto-focus
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Share what's on your mind..."
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
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatInterface;