// frontend/src/components/ChatInterface.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, AlertTriangle } from 'lucide-react';
import { io } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:3001';

function ChatInterface({ sessionId, setSessionId }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const initializeChat = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        setSessionId(data.sessionId);
        setMessages([{
          id: 1,
          text: "Hello! I'm Sahara, your mental wellness companion. This is a safe, anonymous space where you can share anything on your mind. How are you feeling today?",
          sender: 'ai',
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  }, [setSessionId]);

  useEffect(() => {
    // Initialize chat session
    if (!sessionId) {
      initializeChat();
    }
  }, [sessionId, initializeChat]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('receive-message', (message) => {
      setMessages(prev => [...prev, message]);
      setIsLoading(false);
    });

    return () => newSocket.close();
  }, []); // Empty dependency array is correct for socket setup

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send to backend API
      await fetch(`${BACKEND_URL}/api/chat/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputMessage, sender: 'user' })
      });

      // Send via socket for real-time AI response
      if (socket && isConnected) {
        socket.emit('send-message', {
          message: inputMessage,
          userId: sessionId,
          timestamp: new Date().toISOString()
        });
      } else {
        // Fallback response if socket is not connected
        setTimeout(() => {
          const aiResponse = getAIResponse(inputMessage);
          setMessages(prev => [...prev, {
            id: Date.now(),
            text: aiResponse,
            sender: 'ai',
            timestamp: new Date().toISOString()
          }]);
          setIsLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const getAIResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Crisis detection
    if (lowerMessage.includes('suicide') || lowerMessage.includes('kill myself') || lowerMessage.includes('end it all')) {
      return "I'm really concerned about what you're going through. Your life has value, and there are people who want to help. Please consider reaching out to a crisis helpline: AASRA (91-22-2754-6669) or contact a trusted friend or family member. Would you like to talk about what's making you feel this way?";
    }
    
    // Emotional responses
    if (lowerMessage.includes('sad') || lowerMessage.includes('depressed')) {
      return "I hear that you're feeling really down right now. It's brave of you to share that with me. Sadness is a natural human emotion, and it's okay to feel this way. Can you tell me more about what's been contributing to these feelings?";
    }
    
    if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('stressed')) {
      return "Anxiety and stress can feel overwhelming, especially with academic and social pressures. You're not alone in feeling this way. Let's try a quick breathing exercise: Take a deep breath in for 4 counts, hold for 4, and exhale for 6. What specific situation is causing you the most stress right now?";
    }
    
    if (lowerMessage.includes('exam') || lowerMessage.includes('study') || lowerMessage.includes('academic')) {
      return "Academic pressure is something many students in India face intensely. Remember that your worth isn't defined by your grades or exam performance. It's important to balance studying with self-care. Are you getting enough sleep and taking breaks? What specific academic challenge is bothering you most?";
    }
    
    if (lowerMessage.includes('family') || lowerMessage.includes('parents')) {
      return "Family dynamics can be complex, especially when it comes to mental health discussions in Indian families. It's common to feel misunderstood sometimes. Remember that your feelings are valid. Would you like to talk about a specific situation with your family, or would you prefer some strategies for communicating with them?";
    }
    
    // Positive responses
    if (lowerMessage.includes('better') || lowerMessage.includes('good') || lowerMessage.includes('happy')) {
      return "I'm so glad to hear you're feeling better! It's wonderful when we have those moments of positivity. What's been helping you feel this way? It's good to recognize and celebrate these positive feelings.";
    }
    
    // Default empathetic response
    const responses = [
      "Thank you for sharing that with me. I'm here to listen and support you. Can you tell me more about how this is affecting your daily life?",
      "I appreciate you opening up. Your feelings are completely valid, and it takes courage to talk about them. What would be most helpful for you right now?",
      "It sounds like you're dealing with something challenging. Remember that seeking support is a sign of strength, not weakness. How long have you been feeling this way?",
      "I'm here with you in this moment. Sometimes just being heard can make a difference. Would you like to explore this topic further or talk about something else?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Sahara AI Companion</h3>
              <p className="text-sm text-gray-600">
                {isConnected ? 'Online • Anonymous Chat' : 'Connecting...'}
              </p>
            </div>
          </div>
          {!isConnected && (
            <div className="text-yellow-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex space-x-3 max-w-xs lg:max-w-md ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}>
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-3 max-w-xs lg:max-w-md">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Bot className="w-4 h-4 text-gray-600" />
              </div>
              <div className="bg-gray-100 rounded-lg rounded-bl-none p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex space-x-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here... (Press Enter to send)"
            className="flex-1 border rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="1"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;