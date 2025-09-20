// frontend/src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Heart, Shield, Users, LogOut, Eye, EyeOff, User, Lock } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import MoodTracker from './components/MoodTracker';
import './index.css';

import { CURRENT_BACKEND_URL } from './config';
import apiService from './services/apiService';
const BACKEND_URL = CURRENT_BACKEND_URL;

// ✅ ENHANCED: Session management utilities with better isolation
class SessionManager {
  static sessionId = null;
  static userId = null;
  static isGuest = null;

  static setSession(sessionId, userId, isGuest) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.isGuest = isGuest;
    // ✅ Store in localStorage for persistence across refreshes
    localStorage.setItem('sahara_session', JSON.stringify({
      sessionId, userId, isGuest, timestamp: Date.now()
    }));
    console.log('📦 Session stored:', { sessionId, userId, isGuest });
  }

  static clearSession() {
    this.sessionId = null;
    this.userId = null;
    this.isGuest = null;
    // ✅ Clear from localStorage
    localStorage.removeItem('sahara_session');
    console.log('🧹 Session cleared from memory and storage');
  }

  static loadSession() {
    try {
      const stored = localStorage.getItem('sahara_session');
      if (stored) {
        const session = JSON.parse(stored);
        // ✅ Check if session is not too old (24 hours max)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (Date.now() - session.timestamp < maxAge) {
          this.sessionId = session.sessionId;
          this.userId = session.userId;
          this.isGuest = session.isGuest;
          console.log('📂 Session loaded from storage:', session);
          return session;
        } else {
          console.log('⏰ Session expired, clearing...');
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('❌ Error loading session:', error);
      this.clearSession();
    }
    return null;
  }

  static getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.sessionId && { 'X-Session-ID': this.sessionId }),
      ...(this.userId && { 'X-User-ID': this.userId }),
      ...(this.isGuest !== null && { 'X-Is-Guest': this.isGuest.toString() })
    };
  }
}

function App() {
  // ✅ Add chatKey state to force ChatInterface remount
  const [chatKey, setChatKey] = useState(0);
  const [currentView, setCurrentView] = useState('home');
  const [sessionId, setSessionId] = useState(null);
  const [user, setUser] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  
  const [globalMoodData, setGlobalMoodData] = useState({
    mood: "neutral",
    riskLevel: "low",
    moodHistory: [],
    sentimentScore: 0,
    totalMessages: 0,
    lastUpdated: new Date().toISOString()
  });

  // ✅ ENHANCED: Complete data clearing helper
  const clearAllApplicationData = useCallback(() => {
    console.log('🧹 Clearing all application data...');
    
    // Clear session manager
    SessionManager.clearSession();
    
    // Clear React state
    setUser(null);
    setCurrentView('home');
    setSessionId(null);
    setSessionInfo(null);
    setChatKey(0);
    setGlobalMoodData({
      mood: "neutral",
      riskLevel: "low",
      moodHistory: [],
      sentimentScore: 0,
      totalMessages: 0,
      lastUpdated: new Date().toISOString()
    });

    // Clear browser storage completely
    if (typeof window !== 'undefined') {
      try {
        // Clear localStorage
        localStorage.clear();
        // Clear sessionStorage  
        sessionStorage.clear();
        
        // Clear any potential IndexedDB data
        if ('indexedDB' in window) {
          try {
            indexedDB.deleteDatabase('sahara-app');
          } catch (e) {
            console.log('No IndexedDB to clear');
          }
        }
        
        // Clear cookies related to the app
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        console.log('✅ All browser storage cleared');
      } catch (error) {
        console.error('❌ Error clearing browser storage:', error);
      }
    }
  }, []);

  // ✅ ENHANCED: Reset chat function that forces component remount
  const resetChat = useCallback(async () => {
    console.log('🔄 Resetting chat completely...');
    
    try {
      // Call backend to clear session data first
      if (SessionManager.sessionId) {
        // Clear both chat and journal data on backend
        const clearPromises = [
          fetch(`${BACKEND_URL}/api/chat/clear-all`, {
            method: 'DELETE',
            headers: SessionManager.getHeaders()
          }),
          fetch(`${BACKEND_URL}/api/journal/clear-all`, {
            method: 'DELETE',
            headers: SessionManager.getHeaders()
          }),
          fetch(`${BACKEND_URL}/api/chat/end-session`, {
            method: 'POST',
            headers: SessionManager.getHeaders()
          }),
          fetch(`${BACKEND_URL}/api/journal/end-session`, {
            method: 'POST',
            headers: SessionManager.getHeaders()
          })
        ];

        const results = await Promise.all(clearPromises);
        console.log('✅ Backend session and data cleared');
        
        // ✅ Log results for debugging
        results.forEach((response, index) => {
          const endpoints = ['chat/clear-all', 'journal/clear-all', 'chat/end-session', 'journal/end-session'];
          console.log(`📋 ${endpoints[index]}: ${response.status === 200 ? 'Success' : 'Failed'}`);
        });
      }
    } catch (error) {
      console.error('❌ Error clearing backend session:', error);  
    }

    // Increment chatKey to force ChatInterface remount
    setChatKey(prevKey => prevKey + 1);
    
    // Reset global mood data
    setGlobalMoodData({
      mood: "neutral",
      riskLevel: "low",
      moodHistory: [],
      sentimentScore: 0,
      totalMessages: 0,
      lastUpdated: new Date().toISOString()
    });

    console.log('✅ Chat reset completed');
  }, []);

  // ✅ ENHANCED: Initialize session with better uniqueness
  const initializeSession = async (username, isGuestUser = false) => {
    // Clear any existing data before new session
    clearAllApplicationData();
    
    try {
      let data;
      
      if (isGuestUser) {
        // Use API service for guest login
        data = await apiService.getSessionInfo();
      } else {
        // Use API service for regular user login
        data = await apiService.getSessionInfo();
        data.username = username;
        data.isGuest = false;
      }

      const newSessionId = data.sessionId;
      const userId = data.userId;
      const isGuest = data.isGuest;

      // Update session manager
      SessionManager.setSession(newSessionId, userId, isGuest);
      
      setSessionId(newSessionId);
      setSessionInfo(data);
      setUser({ 
        username, 
        loginTime: new Date().toISOString(),
        isAnonymous: true,
        isGuest: isGuest,
        userId: userId,
        sessionId: newSessionId
      });

      console.log(`✅ NEW Session created - ${isGuest ? 'Guest' : 'Auth'}: ${userId}`);
      console.log(`📋 Session ID: ${newSessionId}`);
      
      return { success: true, sessionId: newSessionId, userId, isGuest };
    } catch (error) {
      console.error('❌ Error initializing session:', error);
    }
    
    return { success: false };
  };

  const startChat = () => {
    setCurrentView('chat');
  };

  const goHome = () => {
    setCurrentView('home');
    setGlobalMoodData({
      mood: "neutral",
      riskLevel: "low",
      moodHistory: [],
      sentimentScore: 0,
      totalMessages: 0,
      lastUpdated: new Date().toISOString()
    });
  };

  const handleLogin = async (username) => {
    console.log('🔐 Starting login process for:', username);
    const result = await initializeSession(username, false);
    
    if (result.success) {
      setCurrentView('home');
    } else {
      console.error('❌ Login failed');
      alert('Login failed. Please try again.');
    }
  };

  const handleGuestLogin = async (guestName) => {
    console.log('👤 Starting guest session for:', guestName);
    const result = await initializeSession(guestName, true);
    
    if (result.success) {
      setCurrentView('home');
    } else {
      console.error('❌ Guest login failed');
      alert('Guest login failed. Please try again.');
    }
  };

  // ✅ ENHANCED: Complete logout with thorough data clearing
  const handleLogout = async () => {
    console.log('🔄 Starting complete logout and data clearing...');
    
    try {
      // **STEP 1: Clear ALL backend data (journal + chat)**
      if (SessionManager.sessionId) {
        console.log('📤 Clearing ALL backend data for session:', SessionManager.sessionId);
        
        const clearPromises = [
          // ✅ Clear journal data first
          fetch(`${BACKEND_URL}/api/journal/clear-all`, {
            method: 'DELETE',
            headers: SessionManager.getHeaders()
          }),
          // ✅ Clear chat data  
          fetch(`${BACKEND_URL}/api/chat/clear-all`, {  
            method: 'DELETE',
            headers: SessionManager.getHeaders()
          }),
          // End sessions
          fetch(`${BACKEND_URL}/api/journal/end-session`, {
            method: 'POST',
            headers: SessionManager.getHeaders()
          }),
          fetch(`${BACKEND_URL}/api/chat/end-session`, {
            method: 'POST', 
            headers: SessionManager.getHeaders()
          })
        ];

        const results = await Promise.all(clearPromises);
        console.log('✅ ALL backend data cleared - Journal + Chat + Sessions ended');
        
        // ✅ Log the results for debugging
        results.forEach((response, index) => {
          const endpoints = ['journal/clear-all', 'chat/clear-all', 'journal/end-session', 'chat/end-session'];
          console.log(`📋 ${endpoints[index]}: ${response.status === 200 ? 'Success' : 'Failed'}`);
          if (response.status !== 200) {
            console.warn(`⚠️ ${endpoints[index]} failed with status:`, response.status);
          }
        });
      }
    } catch (error) {
      console.error('❌ Error clearing backend data:', error);
    }

    // **STEP 2: Clear ALL frontend data**
    clearAllApplicationData();
    
    // **STEP 3: Force complete page reload to ensure clean state**
    console.log('🔄 Reloading page to ensure complete reset...');
    setTimeout(() => {
      window.location.href = window.location.origin; // Go to root and reload
    }, 500);
  };

  // ✅ ENHANCED: Load session on app startup
  useEffect(() => {
    const savedSession = SessionManager.loadSession();
    console.log('🔍 Session restoration check:', {
      savedSession,
      user,
      sessionManager: {
        sessionId: SessionManager.sessionId,
        userId: SessionManager.userId,
        isGuest: SessionManager.isGuest
      }
    });
    
    if (savedSession && !user) {
      console.log('🔄 Restoring session from storage...');
      setSessionId(savedSession.sessionId);
      setUser({
        username: savedSession.isGuest ? 'Guest User' : 'User',
        loginTime: new Date(savedSession.timestamp).toISOString(),
        isAnonymous: true,
        isGuest: savedSession.isGuest,
        userId: savedSession.userId,
        sessionId: savedSession.sessionId
      });
      setCurrentView('home');
    }
  }, [user]);

  useEffect(() => {
    console.log('🎭 Global mood data updated:', globalMoodData);
  }, [globalMoodData]);

  // ✅ ENHANCED: Clear data on page unload
  useEffect(() => {
    const handleBeforeUnload = async (event) => {
      if (user && SessionManager.sessionId) {
        // Call backend to clear session data
        try {
          const clearPromises = [
            fetch(`${BACKEND_URL}/api/journal/clear-all`, {
              method: 'DELETE',
              headers: SessionManager.getHeaders()
            }),
            fetch(`${BACKEND_URL}/api/chat/clear-all`, {
              method: 'DELETE',
              headers: SessionManager.getHeaders()
            }),
            fetch(`${BACKEND_URL}/api/journal/end-session`, {
              method: 'POST',
              headers: SessionManager.getHeaders()
            }),
            fetch(`${BACKEND_URL}/api/chat/end-session`, {
              method: 'POST',
              headers: SessionManager.getHeaders()
            })
          ];

          await Promise.all(clearPromises);
        } catch (error) {
          console.error('❌ Error clearing session on page unload:', error);
        }
        
        // Clear frontend storage
        clearAllApplicationData();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, clearAllApplicationData]);

  // ✅ ENHANCED: Clear storage on component mount (page refresh)
  useEffect(() => {
    // Clear any stale data when app first loads (only if no valid session)
    if (!user && !SessionManager.loadSession()) {
      clearAllApplicationData();
    }
  }, []);

  if (!user) {
    return <LoginPage onLogin={handleLogin} onGuestLogin={handleGuestLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {currentView === 'home' ? (
        <HomePage onStartChat={startChat} user={user} onLogout={handleLogout} sessionInfo={sessionInfo} />
      ) : (
        <div className="flex flex-col h-screen">
          <header className="bg-white shadow-sm border-b p-4 flex-shrink-0">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Sahara</h1>
                  <p className="text-sm text-gray-600">
                    {user.isGuest ? 'Guest Session' : 'Welcome'}, {user.username}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={goHome}
                  className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 font-bold transition-colors"
                >
                  Home
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-800 px-4 py-2 rounded-lg hover:bg-red-50 font-bold transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>End Session</span>
                </button>
              </div>
            </div>
          </header>
          
          <div className="flex-1 flex min-h-0 p-4 gap-4">
            <div className="flex-1 min-h-0">
              {/* ✅ UPDATED: Add key prop and onResetChat prop */}
              <ChatInterface 
                key={chatKey}  // This forces component remount when chatKey changes
                sessionId={sessionId}
                setSessionId={setSessionId}
                setGlobalMoodData={setGlobalMoodData}
                user={user}
                onLogout={handleLogout}
                globalMoodData={globalMoodData}
                sessionManager={SessionManager}
                onResetChat={resetChat}  // Pass reset function
              />
            </div>
            
            {/* ✅ FIXED: Removed problematic wrapper that was creating white div overlay */}
            <div className="w-80 flex flex-col h-full">
              <MoodTracker sessionId={sessionId} moodData={globalMoodData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ ENHANCED: LoginPage with better storage clearing
function LoginPage({ onLogin, onGuestLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ✅ ENHANCED: Clear storage on login page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      SessionManager.clearSession(); // ✅ Also clear session manager
      console.log('🧹 All storage cleared on login page load');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username.trim()) {
      setError('Please enter a username');
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('Please enter a password');
      setIsLoading(false);
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      onLogin(username);
      setIsLoading(false);
    }, 1000);
  };

  const handleGuestLogin = () => {
    const guestName = `Guest_${Math.random().toString(36).substr(2, 6)}`;
    onGuestLogin(guestName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 pt-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 mt-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Sahara</span>
          </h1>
          <p className="text-gray-600">Your anonymous mental wellness companion</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-2">
            <Shield className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-green-800">100% Private & Anonymous</h3>
              <p className="text-xs text-green-700 mt-1">
                ✓ No personal data stored<br/>
                ✓ No chat history saved permanently<br/>
                ✓ Complete session isolation<br/>
                ✓ Data cleared on logout
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Choose a Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter any username (session only)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">Just for this session - isolated from other users</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Session Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter any password (session only)"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Used only for this session - your data is isolated</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Isolated Session...</span>
                </div>
              ) : (
                'Start Conversation'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Continue as Guest
            </button>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-600">
          <p>🔒 Your privacy is our priority</p>
          <p className="mt-2">Each user gets completely isolated data storage</p>
        </div>
      </div>
    </div>
  );
}

// Updated HomePage component
function HomePage({ onStartChat, user, onLogout, sessionInfo }) {
  return (
    <div className="min-h-screen flex flex-col pt-8">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 mt-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{user.username}</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Your safe, isolated space for mental wellness support. 
              {user.isGuest ? 'Guest session' : 'Private session'} with complete data isolation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <Shield className="w-8 h-8 text-green-500 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Complete Isolation</h3>
              <p className="text-gray-600">Your data is completely separate from other users. No crossover, no sharing.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <MessageCircle className="w-8 h-8 text-blue-500 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Session-Based Storage</h3>
              <p className="text-gray-600">Data exists only during your session. {user.isGuest ? 'Guest data auto-clears.' : 'Private session data.'}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <Users className="w-8 h-8 text-purple-500 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
              <p className="text-gray-600">No user can access another's data. Complete privacy guaranteed.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onStartChat}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Start {user.isGuest ? 'Guest' : 'Private'} Chat
            </button>
            <button
              onClick={onLogout}
              className="border-2 border-red-300 text-red-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-red-50 hover:border-red-400 transition-all duration-200"
            >
              End Session & Clear Data
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              🔐 {user.isGuest ? 'Guest' : 'Private'} session active since {new Date(user.loginTime).toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {user.isGuest 
                ? 'Guest data automatically cleared when session ends'
                : 'Your data is completely isolated from other users'
              }
            </p>
            {sessionInfo && (
              <p className="text-xs text-blue-600 mt-1">
                Session ID: {sessionInfo.sessionId?.substring(0, 8)}... | User ID: {sessionInfo.userId}
              </p>
            )}
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              ⚠️ Closing your browser will automatically end your session and clear all data
            </p>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t p-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 mb-4">
            🔒 Your session is completely private and isolated
          </p>
          <p className="text-gray-600 mb-4">
            If you are in immediate crisis, please contact:
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-700">
            <div>
              <strong>AASRA:</strong> +91 22 2754 6669
            </div>
            <div>
              <strong>Champak:</strong> +91 44 2464 0050
            </div>
            <div>
              <strong>iCall:</strong> +91 22 2556 3291
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;