// // frontend/src/App.jsx
// import React, { useState, useEffect } from 'react';
// import { MessageCircle, Heart, Shield, Users, LogOut, Eye, EyeOff, User, Lock } from 'lucide-react';
// import ChatInterface from './components/ChatInterface';
// import MoodTracker from './components/MoodTracker';
// import './index.css';

// const BACKEND_URL = "http://localhost:3001";

// // Session management utilities
// class SessionManager {
//   static sessionId = null;
//   static userId = null;
//   static isGuest = null;

//   static setSession(sessionId, userId, isGuest) {
//     this.sessionId = sessionId;
//     this.userId = userId;
//     this.isGuest = isGuest;
//   }

//   static clearSession() {
//     this.sessionId = null;
//     this.userId = null;
//     this.isGuest = null;
//   }

//   static getHeaders() {
//     return {
//       'Content-Type': 'application/json',
//       ...(this.sessionId && { 'X-Session-ID': this.sessionId })
//     };
//   }
// }

// function App() {
//   const [currentView, setCurrentView] = useState('home');
//   const [sessionId, setSessionId] = useState(null);
//   const [user, setUser] = useState(null);
//   const [sessionInfo, setSessionInfo] = useState(null);
  
//   const [globalMoodData, setGlobalMoodData] = useState({
//     mood: "neutral",
//     riskLevel: "low",
//     moodHistory: [],
//     sentimentScore: 0,
//     totalMessages: 0,
//     lastUpdated: new Date().toISOString()
//   });

//   // Initialize session with backend on login
//   const initializeSession = async (username, isGuestUser = false) => {
//     try {
//       let response;
      
//       if (isGuestUser) {
//         // Guest login - backend creates session automatically
//         response = await fetch(`${BACKEND_URL}/api/session-info`, {
//           method: 'GET',
//           headers: { 'Content-Type': 'application/json' }
//         });
//       } else {
//         // Regular user login 
//         response = await fetch(`${BACKEND_URL}/api/auth/login`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ username, password: 'temp_password' })
//         });
//       }

//       if (response.ok) {
//         const data = await response.json();
//         const newSessionId = response.headers.get('X-Session-ID') || data.sessionId;
//         const userId = data.userId;
//         const isGuest = data.isGuest !== undefined ? data.isGuest : isGuestUser;

//         // Update session manager
//         SessionManager.setSession(newSessionId, userId, isGuest);
        
//         setSessionId(newSessionId);
//         setSessionInfo(data);
//         setUser({ 
//           username, 
//           loginTime: new Date().toISOString(),
//           isAnonymous: true,
//           isGuest: isGuest,
//           userId: userId
//         });

//         console.log(`✅ Session initialized - ${isGuest ? 'Guest' : 'User'}: ${userId}`);
        
//         return { success: true, sessionId: newSessionId, userId, isGuest };
//       }
//     } catch (error) {
//       console.error('Error initializing session:', error);
//     }
    
//     return { success: false };
//   };

//   const startChat = () => {
//     setCurrentView('chat');
//   };

//   const goHome = () => {
//     setCurrentView('home');
//     setGlobalMoodData({
//       mood: "neutral",
//       riskLevel: "low",
//       moodHistory: [],
//       sentimentScore: 0,
//       totalMessages: 0,
//       lastUpdated: new Date().toISOString()
//     });
//   };

//   const handleLogin = async (username) => {
//     console.log('🔐 Starting login process for:', username);
//     const result = await initializeSession(username, false);
    
//     if (result.success) {
//       setCurrentView('home');
//     } else {
//       console.error('Login failed');
//     }
//   };

//   const handleGuestLogin = async (guestName) => {
//     console.log('👤 Starting guest session for:', guestName);
//     const result = await initializeSession(guestName, true);
    
//     if (result.success) {
//       setCurrentView('home');
//     } else {
//       console.error('Guest login failed');
//     }
//   };

//   const handleLogout = async () => {
//     console.log('🔄 Starting complete logout process...');
    
//     try {
//       // Call backend to end session and clear data
//       if (SessionManager.sessionId) {
//         const endSessionPromises = [
//           fetch(`${BACKEND_URL}/api/journal/end-session`, {
//             method: 'POST',
//             headers: SessionManager.getHeaders()
//           }),
//           fetch(`${BACKEND_URL}/api/chat/end-session`, {
//             method: 'POST', 
//             headers: SessionManager.getHeaders()
//           })
//         ];

//         await Promise.all(endSessionPromises);
//         console.log('✅ Backend session ended and data cleared');
//       }
//     } catch (error) {
//       console.error('Error ending backend session:', error);
//     }

//     // Clear frontend state
//     SessionManager.clearSession();
//     setUser(null);
//     setCurrentView('home');
//     setSessionId(null);
//     setSessionInfo(null);
//     setGlobalMoodData({
//       mood: "neutral",
//       riskLevel: "low", 
//       moodHistory: [],
//       sentimentScore: 0,
//       totalMessages: 0,
//       lastUpdated: new Date().toISOString()
//     });
    
//     // Clear any local storage
//     if (typeof window !== 'undefined') {
//       try {
//         localStorage.clear();
//         sessionStorage.clear();
//         console.log('✅ All browser storage cleared');
//       } catch (error) {
//         console.error('Error clearing storage:', error);
//       }
//     }
    
//     setTimeout(() => {
//       window.location.reload();
//     }, 100);
//   };

//   useEffect(() => {
//     console.log('🎭 Global mood data updated:', globalMoodData);
//   }, [globalMoodData]);

//   useEffect(() => {
//     const handleBeforeUnload = async () => {
//       if (user && SessionManager.sessionId) {
//         // Call backend to clear session data
//         try {
//           await fetch(`${BACKEND_URL}/api/journal/end-session`, {
//             method: 'POST',
//             headers: SessionManager.getHeaders()
//           });
//           await fetch(`${BACKEND_URL}/api/chat/end-session`, {
//             method: 'POST',
//             headers: SessionManager.getHeaders()
//           });
//         } catch (error) {
//           console.error('Error clearing session on page unload:', error);
//         }
        
//         localStorage.clear();
//         sessionStorage.clear();
//       }
//     };

//     window.addEventListener('beforeunload', handleBeforeUnload);
//     return () => window.removeEventListener('beforeunload', handleBeforeUnload);
//   }, [user]);

//   if (!user) {
//     return <LoginPage onLogin={handleLogin} onGuestLogin={handleGuestLogin} />;
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
//       {currentView === 'home' ? (
//         <HomePage onStartChat={startChat} user={user} onLogout={handleLogout} sessionInfo={sessionInfo} />
//       ) : (
//         <div className="flex flex-col h-screen">
//           <header className="bg-white shadow-sm border-b p-4 flex-shrink-0">
//             <div className="max-w-4xl mx-auto flex items-center justify-between">
//               <div className="flex items-center space-x-3">
//                 <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
//                   <Heart className="w-5 h-5 text-white" />
//                 </div>
//                 <div>
//                   <h1 className="text-xl font-bold text-gray-800">Sahara</h1>
//                   <p className="text-sm text-gray-600">
//                     {user.isGuest ? 'Guest Session' : 'Welcome'}, {user.username}
//                   </p>
//                 </div>
//               </div>
//               <div className="flex items-center space-x-4">
//                 <button
//                   onClick={goHome}
//                   className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 font-bold transition-colors"
//                 >
//                   Home
//                 </button>
//                 <button
//                   onClick={handleLogout}
//                   className="flex items-center space-x-2 text-red-600 hover:text-red-800 px-4 py-2 rounded-lg hover:bg-red-50 font-bold transition-colors"
//                 >
//                   <LogOut className="w-4 h-4" />
//                   <span>End Session</span>
//                 </button>
//               </div>
//             </div>
//           </header>
          
//           <div className="flex-1 flex min-h-0 p-4 gap-4">
//             <div className="flex-1 min-h-0">
//               <ChatInterface 
//                 sessionId={sessionId}
//                 setSessionId={setSessionId}
//                 setGlobalMoodData={setGlobalMoodData}
//                 user={user}
//                 onLogout={handleLogout}
//                 globalMoodData={globalMoodData}
//                 sessionManager={SessionManager}
//               />
//             </div>
            
//             <div className="w-80 bg-white rounded-lg shadow-sm">
//               <div 
//                 className="overflow-y-auto h-full" 
//                 style={{ 
//                   maxHeight: 'calc(100vh - 180px)',
//                   overflowY: 'auto'
//                 }}
//               >
//                 <MoodTracker sessionId={sessionId} moodData={globalMoodData} />
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // Updated LoginPage component
// function LoginPage({ onLogin, onGuestLogin }) {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState('');
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       localStorage.clear();
//       sessionStorage.clear();
//     }
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setIsLoading(true);

//     if (!username.trim()) {
//       setError('Please enter a username');
//       setIsLoading(false);
//       return;
//     }

//     if (!password.trim()) {
//       setError('Please enter a password');
//       setIsLoading(false);
//       return;
//     }

//     if (password.length < 4) {
//       setError('Password must be at least 4 characters');
//       setIsLoading(false);
//       return;
//     }

//     setTimeout(() => {
//       onLogin(username);
//       setIsLoading(false);
//     }, 1000);
//   };

//   const handleGuestLogin = () => {
//     const guestName = `Guest_${Math.random().toString(36).substr(2, 6)}`;
//     onGuestLogin(guestName);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 pt-8">
//       <div className="w-full max-w-md">
//         <div className="text-center mb-8 mt-8">
//           <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
//             <Heart className="w-8 h-8 text-white" />
//           </div>
//           <h1 className="text-3xl font-bold text-gray-800 mb-2">
//             Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Sahara</span>
//           </h1>
//           <p className="text-gray-600">Your anonymous mental wellness companion</p>
//         </div>

//         <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
//           <div className="flex items-start space-x-2">
//             <Shield className="w-5 h-5 text-green-600 mt-0.5" />
//             <div>
//               <h3 className="text-sm font-semibold text-green-800">100% Private & Anonymous</h3>
//               <p className="text-xs text-green-700 mt-1">
//                 ✓ No personal data stored<br/>
//                 ✓ No chat history saved permanently<br/>
//                 ✓ Complete session isolation<br/>
//                 ✓ Data cleared on logout
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 <User className="w-4 h-4 inline mr-2" />
//                 Choose a Username
//               </label>
//               <input
//                 type="text"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//                 placeholder="Enter any username (session only)"
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//                 disabled={isLoading}
//               />
//               <p className="text-xs text-gray-500 mt-1">Just for this session - isolated from other users</p>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 <Lock className="w-4 h-4 inline mr-2" />
//                 Session Password
//               </label>
//               <div className="relative">
//                 <input
//                   type={showPassword ? 'text' : 'password'}
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="Enter any password (session only)"
//                   className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//                   disabled={isLoading}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
//                 >
//                   {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//                 </button>
//               </div>
//               <p className="text-xs text-gray-500 mt-1">Used only for this session - your data is isolated</p>
//             </div>

//             {error && (
//               <div className="bg-red-50 border border-red-200 rounded-lg p-3">
//                 <p className="text-red-700 text-sm">{error}</p>
//               </div>
//             )}

//             <button
//               type="submit"
//               disabled={isLoading}
//               className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
//                 isLoading
//                   ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                   : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
//               }`}
//             >
//               {isLoading ? (
//                 <div className="flex items-center justify-center space-x-2">
//                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                   <span>Creating Isolated Session...</span>
//                 </div>
//               ) : (
//                 'Start Private Session'
//               )}
//             </button>
//           </form>

//           <div className="mt-6 pt-6 border-t border-gray-200">
//             <button
//               onClick={handleGuestLogin}
//               disabled={isLoading}
//               className="w-full py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
//             >
//               Continue as Guest (Auto-Generated Session)
//             </button>
//           </div>
//         </div>

//         <div className="text-center mt-8 text-sm text-gray-600">
//           <p>🔒 Your privacy is our priority</p>
//           <p className="mt-2">Each user gets completely isolated data storage</p>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Updated HomePage component
// function HomePage({ onStartChat, user, onLogout, sessionInfo }) {
//   return (
//     <div className="min-h-screen flex flex-col pt-8">
//       <div className="flex-1 flex items-center justify-center px-4">
//         <div className="max-w-4xl mx-auto text-center">
//           <div className="mb-8 mt-8">
//             <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
//               <Heart className="w-10 h-10 text-white" />
//             </div>
//             <h1 className="text-5xl font-bold text-gray-800 mb-4">
//               Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{user.username}</span>
//             </h1>
//             <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
//               Your safe, isolated space for mental wellness support. 
//               {user.isGuest ? 'Guest session' : 'Private session'} with complete data isolation.
//             </p>
//           </div>

//           <div className="grid md:grid-cols-3 gap-8 mb-12">
//             <div className="bg-white p-6 rounded-xl shadow-lg">
//               <Shield className="w-8 h-8 text-green-500 mb-4 mx-auto" />
//               <h3 className="text-lg font-semibold mb-2">Complete Isolation</h3>
//               <p className="text-gray-600">Your data is completely separate from other users. No crossover, no sharing.</p>
//             </div>
//             <div className="bg-white p-6 rounded-xl shadow-lg">
//               <MessageCircle className="w-8 h-8 text-blue-500 mb-4 mx-auto" />
//               <h3 className="text-lg font-semibold mb-2">Session-Based Storage</h3>
//               <p className="text-gray-600">Data exists only during your session. {user.isGuest ? 'Guest data auto-clears.' : 'Private session data.'}</p>
//             </div>
//             <div className="bg-white p-6 rounded-xl shadow-lg">
//               <Users className="w-8 h-8 text-purple-500 mb-4 mx-auto" />
//               <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
//               <p className="text-gray-600">No user can access another's data. Complete privacy guaranteed.</p>
//             </div>
//           </div>

//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <button
//               onClick={onStartChat}
//               className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
//             >
//               Start {user.isGuest ? 'Guest' : 'Private'} Chat
//             </button>
//             <button
//               onClick={onLogout}
//               className="border-2 border-red-300 text-red-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-red-50 hover:border-red-400 transition-all duration-200"
//             >
//               End Session & Clear Data
//             </button>
//           </div>

//           <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
//             <p className="text-sm text-blue-800">
//               🔐 {user.isGuest ? 'Guest' : 'Private'} session active since {new Date(user.loginTime).toLocaleString()}
//             </p>
//             <p className="text-xs text-blue-600 mt-1">
//               {user.isGuest 
//                 ? 'Guest data automatically cleared when session ends'
//                 : 'Your data is completely isolated from other users'
//               }
//             </p>
//             {sessionInfo && (
//               <p className="text-xs text-blue-600 mt-1">
//                 Session ID: {sessionInfo.sessionId?.substring(0, 8)}... | User ID: {sessionInfo.userId}
//               </p>
//             )}
//           </div>

//           <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
//             <p className="text-xs text-yellow-800">
//               ⚠️ Closing your browser will automatically end your session and clear all data
//             </p>
//           </div>
//         </div>
//       </div>

//       <footer className="bg-white border-t p-8">
//         <div className="max-w-4xl mx-auto text-center">
//           <p className="text-gray-600 mb-4">
//             🔒 Your session is completely private and isolated
//           </p>
//           <p className="text-gray-600 mb-4">
//             If you are in immediate crisis, please contact:
//           </p>
//           <div className="flex justify-center space-x-8 text-sm text-gray-700">
//             <div>
//               <strong>AASRA:</strong> +91 22 2754 6669
//             </div>
//             <div>
//               <strong>Champak:</strong> +91 44 2464 0050
//             </div>
//             <div>
//               <strong>iCall:</strong> +91 22 2556 3291
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }

// export default App;












// frontend/src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Heart, Shield, Users, LogOut, Eye, EyeOff, User, Lock } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import MoodTracker from './components/MoodTracker';
import './index.css';

const BACKEND_URL = "http://localhost:3001";

// Session management utilities
class SessionManager {
  static sessionId = null;
  static userId = null;
  static isGuest = null;

  static setSession(sessionId, userId, isGuest) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.isGuest = isGuest;
  }

  static clearSession() {
    this.sessionId = null;
    this.userId = null;
    this.isGuest = null;
  }

  static getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.sessionId && { 'X-Session-ID': this.sessionId })
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

  // ✅ NEW: Reset chat function that forces component remount
  const resetChat = useCallback(async () => {
    console.log('🔄 Resetting chat completely...');
    
    try {
      // Call backend to clear session data first
      if (SessionManager.sessionId) {
        await fetch(`${BACKEND_URL}/api/chat/end-session`, {
          method: 'POST',
          headers: SessionManager.getHeaders()
        });
        console.log('✅ Backend session cleared');
      }
    } catch (error) {
      console.error('Error clearing backend session:', error);  
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

  // Initialize session with backend on login
  const initializeSession = async (username, isGuestUser = false) => {
    try {
      let response;
      
      if (isGuestUser) {
        // Guest login - backend creates session automatically
        response = await fetch(`${BACKEND_URL}/api/session-info`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // Regular user login 
        response = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password: 'temp_password' })
        });
      }

      if (response.ok) {
        const data = await response.json();
        const newSessionId = response.headers.get('X-Session-ID') || data.sessionId;
        const userId = data.userId;
        const isGuest = data.isGuest !== undefined ? data.isGuest : isGuestUser;

        // Update session manager
        SessionManager.setSession(newSessionId, userId, isGuest);
        
        setSessionId(newSessionId);
        setSessionInfo(data);
        setUser({ 
          username, 
          loginTime: new Date().toISOString(),
          isAnonymous: true,
          isGuest: isGuest,
          userId: userId
        });

        console.log(`✅ Session initialized - ${isGuest ? 'Guest' : 'User'}: ${userId}`);
        
        return { success: true, sessionId: newSessionId, userId, isGuest };
      }
    } catch (error) {
      console.error('Error initializing session:', error);
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
      console.error('Login failed');
    }
  };

  const handleGuestLogin = async (guestName) => {
    console.log('👤 Starting guest session for:', guestName);
    const result = await initializeSession(guestName, true);
    
    if (result.success) {
      setCurrentView('home');
    } else {
      console.error('Guest login failed');
    }
  };

  const handleLogout = async () => {
    console.log('🔄 Starting complete logout process...');
    
    try {
      // Call backend to end session and clear data
      if (SessionManager.sessionId) {
        const endSessionPromises = [
          fetch(`${BACKEND_URL}/api/journal/end-session`, {
            method: 'POST',
            headers: SessionManager.getHeaders()
          }),
          fetch(`${BACKEND_URL}/api/chat/end-session`, {
            method: 'POST', 
            headers: SessionManager.getHeaders()
          })
        ];

        await Promise.all(endSessionPromises);
        console.log('✅ Backend session ended and data cleared');
      }
    } catch (error) {
      console.error('Error ending backend session:', error);
    }

    // Clear frontend state
    SessionManager.clearSession();
    setUser(null);
    setCurrentView('home');
    setSessionId(null);
    setSessionInfo(null);
    setGlobalMoodData({
      mood: "neutral",
      riskLevel: "low", 
      moodHistory: [],
      sentimentScore: 0,
      totalMessages: 0,
      lastUpdated: new Date().toISOString()
    });
    
    // Clear any local storage
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ All browser storage cleared');
      } catch (error) {
        console.error('Error clearing storage:', error);
      }
    }
    
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  useEffect(() => {
    console.log('🎭 Global mood data updated:', globalMoodData);
  }, [globalMoodData]);

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user && SessionManager.sessionId) {
        // Call backend to clear session data
        try {
          await fetch(`${BACKEND_URL}/api/journal/end-session`, {
            method: 'POST',
            headers: SessionManager.getHeaders()
          });
          await fetch(`${BACKEND_URL}/api/chat/end-session`, {
            method: 'POST',
            headers: SessionManager.getHeaders()
          });
        } catch (error) {
          console.error('Error clearing session on page unload:', error);
        }
        
        localStorage.clear();
        sessionStorage.clear();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

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
                key={chatKey}  // ✅ This forces component remount when chatKey changes
                sessionId={sessionId}
                setSessionId={setSessionId}
                setGlobalMoodData={setGlobalMoodData}
                user={user}
                onLogout={handleLogout}
                globalMoodData={globalMoodData}
                sessionManager={SessionManager}
                onResetChat={resetChat}  // ✅ Pass reset function
              />
            </div>
            
            <div className="w-80 bg-white rounded-lg shadow-sm">
              <div 
                className="overflow-y-auto h-full" 
                style={{ 
                  maxHeight: 'calc(100vh - 180px)',
                  overflowY: 'auto'
                }}
              >
                <MoodTracker sessionId={sessionId} moodData={globalMoodData} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Updated LoginPage component
function LoginPage({ onLogin, onGuestLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
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
                'Start Private Session'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Continue as Guest (Auto-Generated Session)
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
