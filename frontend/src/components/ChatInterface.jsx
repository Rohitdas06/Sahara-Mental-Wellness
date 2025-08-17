// frontend/src/components/ChatInterface.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import LiveMoodInsights from './LiveMoodInsights';

const BACKEND_URL = 'http://localhost:3001';

// Helper functions for localStorage
const getStoredSessionId = () => {
  try {
    return localStorage.getItem('sahara-session-id');
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

const saveSessionId = (sessionId) => {
  try {
    if (sessionId) {
      localStorage.setItem('sahara-session-id', sessionId);
    } else {
      localStorage.removeItem('sahara-session-id');
    }
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

function ChatInterface({ sessionId, setSessionId }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [moodData, setMoodData] = useState({
    mood: 'neutral',
    riskLevel: 'low',
    moodHistory: [],
    sentimentScore: 0
  });
  const messagesEndRef = useRef(null);

  // Restore session on page load
  useEffect(() => {
    const storedSessionId = getStoredSessionId();
    if (storedSessionId && !sessionId) {
      setSessionId(storedSessionId);
    }
  }, [sessionId, setSessionId]);

  // Initialize new chat session
  const initializeChat = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSessionId(data.sessionId);
        saveSessionId(data.sessionId); // Save to localStorage
        setIsConnected(true);
        
        const welcomeMessage = {
          id: Date.now(),
          text: "Hello! I'm Sahara, your mental wellness companion. This is a safe, anonymous space where you can share anything on your mind. How are you feeling today?",
          sender: 'ai',
          timestamp: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
        
        console.log('✅ Chat session initialized:', data.sessionId);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      setIsConnected(false);
    }
  }, [setSessionId]);

  // Load existing chat history
  const loadChatHistory = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/${sessionId}/messages`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages || []);
        setIsConnected(true);
        
        // Load existing mood data if available
        if (data.mood || data.riskLevel) {
          setMoodData({
            mood: data.mood || 'neutral',
            riskLevel: data.riskLevel || 'low',
            moodHistory: data.moodHistory || [],
            sentimentScore: data.sentimentScore || 0
          });
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setIsConnected(false);
    }
  }, [sessionId]);

  // Clear session and start new chat
  const clearSession = () => {
    saveSessionId(null);
    setSessionId(null);
    setMessages([]);
    setMoodData({
      mood: 'neutral',
      riskLevel: 'low',
      moodHistory: [],
      sentimentScore: 0
    });
  };

  useEffect(() => {
    if (!sessionId) {
      initializeChat();
    } else {
      loadChatHistory();
    }
  }, [sessionId, initializeChat, loadChatHistory]);

  // Auto-scroll function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send message function
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !sessionId || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    const typingIndicator = {
      id: Date.now() + 1,
      text: '...',
      sender: 'ai',
      timestamp: new Date().toISOString(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingIndicator]);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: userMessage.text, 
          sender: 'user' 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.messages) {
          setMessages(data.messages);
        } else {
          setMessages(prev => prev.filter(msg => !msg.isTyping));
        }
        
        // Update mood data state
        if (data.mood || data.riskLevel) {
          setMoodData({
            mood: data.mood || 'neutral',
            riskLevel: data.riskLevel || 'low',
            moodHistory: data.moodHistory || [],
            sentimentScore: data.sentimentScore || 0
          });
        }
        
        console.log('🎭 Real-time Mood Analysis:', {
          mood: data.mood,
          riskLevel: data.riskLevel,
          score: data.sentimentScore
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      const errorMessage = {
        id: Date.now() + 2,
        text: "I'm sorry, I'm having trouble connecting right now. Please try again.",
        sender: 'ai',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, sessionId, isLoading]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageStyle = (sender, isTyping, isError) => {
    if (isError) return 'bg-red-100 text-red-800 border border-red-200';
    if (isTyping) return 'bg-gray-100 text-gray-600 animate-pulse';
    return sender === 'user' 
      ? 'bg-blue-500 text-white' 
      : 'bg-gray-200 text-gray-800';
  };

  if (!isConnected && !sessionId) {
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
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Sahara AI Companion</h2>
              <p className="text-blue-100 text-sm">
                {isConnected ? 'Online • Anonymous Chat' : 'Connecting...'}
              </p>
            </div>
          </div>
          
          {/* New Chat Button */}
          <button
            onClick={clearSession}
            className="text-xs text-blue-100 hover:text-white px-3 py-1 rounded-full border border-blue-200 hover:border-white transition-colors"
          >
            New Chat
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.sender === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-purple-500 text-white'
            }`}>
              {message.sender === 'user' ? (
                <User className="w-5 h-5" />
              ) : (
                <Bot className="w-5 h-5" />
              )}
            </div>

            <div className="max-w-xs lg:max-w-md">
              <div
                className={`px-4 py-3 rounded-2xl ${getMessageStyle(
                  message.sender, 
                  message.isTyping, 
                  message.isError
                )} ${message.sender === 'user' 
                  ? 'rounded-br-sm' 
                  : 'rounded-bl-sm'
                }`}
              >
                <p className="text-sm leading-relaxed">
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
                  message.sender === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {formatTimestamp(message.timestamp)}
                </p>
              )}
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="1"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className={`p-3 rounded-full transition-all duration-200 ${
              inputMessage.trim() && !isLoading
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
  );
}

export default ChatInterface;