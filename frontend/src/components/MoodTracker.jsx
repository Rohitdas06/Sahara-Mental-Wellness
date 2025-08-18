// frontend/src/components/MoodTracker.jsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, Heart, MessageSquare, Activity, RefreshCw } from 'lucide-react';
import { getMoodInfo } from '../utils/moodMapping';

const BACKEND_URL = 'http://localhost:3001';

function MoodTracker({ sessionId }) {
  const [moodData, setMoodData] = useState({
    mood: 'neutral',
    riskLevel: 'low',
    messages: 0,
    moodHistory: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showResources, setShowResources] = useState(false);

  // 🔧 ENHANCED: More aggressive real-time updates with localStorage check
  useEffect(() => {
    if (sessionId) {
      fetchMoodData();
      
      // Fetch data every 2 seconds for real-time updates
      const interval = setInterval(() => {
        fetchMoodData();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [sessionId]);

  // 🔧 COMPLETELY UPDATED: Enhanced data fetching with localStorage fallback
  const fetchMoodData = async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      // Get real message count from localStorage first
      const getLocalMessageCount = () => {
        try {
          const storedMessages = JSON.parse(localStorage.getItem('sahara-messages') || '[]');
          return storedMessages.length;
        } catch {
          return 0;
        }
      };

      const localMessageCount = getLocalMessageCount();

      // Try multiple endpoints for comprehensive data
      const [moodResponse, messagesResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/api/chat/${sessionId}/mood`).catch(() => null),
        fetch(`${BACKEND_URL}/api/chat/${sessionId}/messages`).catch(() => null)
      ]);

      let updatedData = { ...moodData };

      // Get mood data from API
      if (moodResponse && moodResponse.ok) {
        const moodResult = await moodResponse.json();
        console.log('📊 Mood API response:', moodResult);
        
        if (moodResult.success || moodResult.mood) {
          updatedData.mood = moodResult.mood || updatedData.mood;
          updatedData.riskLevel = moodResult.riskLevel || updatedData.riskLevel;
          updatedData.moodHistory = moodResult.moodHistory || updatedData.moodHistory;
        }
      }

      // Get message count from messages API or localStorage
      if (messagesResponse && messagesResponse.ok) {
        const messagesResult = await messagesResponse.json();
        console.log('💬 Messages API response:', messagesResult);
        
        if (messagesResult.success && messagesResult.messages) {
          updatedData.messages = messagesResult.messages.length;
        } else {
          updatedData.messages = localMessageCount;
        }
      } else {
        // Fallback to localStorage count
        updatedData.messages = localMessageCount;
      }

      // Always ensure we have the latest localStorage count
      const currentLocalCount = getLocalMessageCount();
      if (currentLocalCount > updatedData.messages) {
        updatedData.messages = currentLocalCount;
      }

      setMoodData(updatedData);
      console.log('📊 Final mood data:', updatedData);

    } catch (error) {
      console.error('Error fetching mood data:', error);
      
      // Even on error, try to get localStorage message count
      try {
        const storedMessages = JSON.parse(localStorage.getItem('sahara-messages') || '[]');
        setMoodData(prev => ({
          ...prev,
          messages: storedMessages.length
        }));
      } catch (e) {
        console.error('Error reading localStorage:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    fetchMoodData();
  };

  const getRiskLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Mental Health Resources functionality
  const handleShowResources = () => {
    setShowResources(!showResources);
  };

  // Quick Action handlers
  const handleBreathingExercise = () => {
    alert('🧘 Starting breathing exercise...\n\n1. Breathe in for 4 counts\n2. Hold for 4 counts\n3. Breathe out for 6 counts\n4. Repeat 5 times');
  };

  const handleJournalThoughts = () => {
    // Call parent component to open journal
    if (window.openJournal) {
      window.openJournal();
    } else {
      alert('📝 Journal feature: Click the "Journal" button in the chat header to start writing!');
    }
  };

  const handlePlayMusic = () => {
    alert('🎵 Playing calming music...\n\nRecommended apps:\n• Calm\n• Headspace\n• Spotify (Lo-fi Hip Hop)\n• YouTube (Nature Sounds)');
  };

  const handleFindSupport = () => {
    alert('📞 Mental Health Support in India:\n\n• AASRA: +91-22-2754-6669\n• Sneha: +91-44-2464-0050\n• iCall: +91-22-2556-3291\n• Vandrevala: 1860-266-2345');
  };

  // 🔧 NEW: Get real-time message count
  const getRealTimeMessageCount = () => {
    try {
      const storedMessages = JSON.parse(localStorage.getItem('sahara-messages') || '[]');
      return Math.max(storedMessages.length, moodData.messages);
    } catch {
      return moodData.messages || 0;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header - Enhanced with refresh button */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5" />
            <h2 className="font-semibold">Live Mood Insights</h2>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content - Scrollable with better spacing */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Current Mood - Enhanced */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-purple-100 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Current Mood:</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{getMoodInfo(moodData.mood).emoji}</span>
              <span className="font-bold text-lg text-gray-800 capitalize">{moodData.mood}</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Status</div>
              <div className="text-sm font-medium text-purple-600">
                {sessionId ? 'Active' : 'Waiting...'}
              </div>
            </div>
          </div>
        </div>

        {/* Risk Level - Enhanced */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Risk Level:</h3>
          <div className="flex items-center justify-center">
            <div className={`inline-flex items-center px-4 py-2 rounded-full border-2 text-sm font-bold ${getRiskLevelColor(moodData.riskLevel)}`}>
              ✅ {moodData.riskLevel?.toUpperCase() || 'LOW'}
            </div>
          </div>
        </div>

        {/* Messages Count - ENHANCED with real-time localStorage count */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Messages:</h3>
          <div className="flex items-center justify-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-center">
              <span className="text-3xl font-bold text-gray-800 block">
                {getRealTimeMessageCount()}
              </span>
              <span className="text-xs text-gray-500">
                {isLoading ? 'Updating...' : 'Total messages'}
              </span>
            </div>
          </div>
        </div>

        {/* Mood Trend - Enhanced with real data */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <div className="p-1 bg-blue-100 rounded-full">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-700">Mood Trend</h3>
          </div>
          
          {getRealTimeMessageCount() > 0 ? (
            <div className="text-center py-6">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Mood: <span className="capitalize text-blue-600">{moodData.mood}</span>
              </p>
              <p className="text-xs text-gray-500 mb-2">
                Based on {getRealTimeMessageCount()} messages
              </p>
              <div className="mt-2 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${Math.min((getRealTimeMessageCount() / 10) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Progress: {Math.min(getRealTimeMessageCount(), 10)}/10 messages
              </p>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Start chatting to see trends...</p>
            </div>
          )}
        </div>

        {/* Mental Health Resources - Enhanced with functionality */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Mental Health Resources</h3>
          <button 
            onClick={handleShowResources}
            className="w-full bg-white hover:bg-gray-50 text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-300 rounded-lg py-2 px-3 text-sm font-medium transition-all duration-200 shadow-sm"
          >
            {showResources ? 'Hide Resources' : 'Show Resources'}
          </button>
          
          {/* Expandable resources section */}
          {showResources && (
            <div className="mt-3 pt-3 border-t border-green-200 space-y-2">
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Crisis Helplines:</strong></p>
                <p>• AASRA: +91-22-2754-6669</p>
                <p>• Champak: +91-44-2464-0050</p>
                <p>• iCall: +91-22-2556-3291</p>
                <p><strong>Apps:</strong> Calm, Headspace, Sanvello</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions - Enhanced with full functionality */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={handleBreathingExercise}
              className="w-full flex items-center space-x-3 bg-white hover:bg-purple-50 text-gray-700 hover:text-purple-700 border border-gray-200 hover:border-purple-300 rounded-lg py-3 px-4 text-sm font-medium transition-all duration-200 shadow-sm"
            >
              <span className="text-lg" role="img" aria-label="meditation">🧘</span>
              <span>Start breathing exercise</span>
            </button>
            <button 
              onClick={handleJournalThoughts}
              className="w-full flex items-center space-x-3 bg-white hover:bg-purple-50 text-gray-700 hover:text-purple-700 border border-gray-200 hover:border-purple-300 rounded-lg py-3 px-4 text-sm font-medium transition-all duration-200 shadow-sm"
            >
              <span className="text-lg" role="img" aria-label="writing">📝</span>
              <span>Journal your thoughts</span>
            </button>
            <button 
              onClick={handlePlayMusic}
              className="w-full flex items-center space-x-3 bg-white hover:bg-purple-50 text-gray-700 hover:text-purple-700 border border-gray-200 hover:border-purple-300 rounded-lg py-3 px-4 text-sm font-medium transition-all duration-200 shadow-sm"
            >
              <span className="text-lg" role="img" aria-label="music">🎵</span>
              <span>Play calming music</span>
            </button>
            <button 
              onClick={handleFindSupport}
              className="w-full flex items-center space-x-3 bg-white hover:bg-purple-50 text-gray-700 hover:text-purple-700 border border-gray-200 hover:border-purple-300 rounded-lg py-3 px-4 text-sm font-medium transition-all duration-200 shadow-sm"
            >
              <span className="text-lg" role="img" aria-label="phone">📞</span>
              <span>Find local support</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MoodTracker;
