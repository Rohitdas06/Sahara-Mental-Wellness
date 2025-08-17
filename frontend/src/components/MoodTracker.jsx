// frontend/src/components/MoodTracker.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Heart, TrendingUp, AlertTriangle, Phone, Book, Users } from 'lucide-react';

const BACKEND_URL = 'http://localhost:3001';

function MoodTracker({ sessionId }) {
  const [moodData, setMoodData] = useState({
    mood: 'neutral',
    riskLevel: 'low',
    messageCount: 0
  });
  const [showResources, setShowResources] = useState(false);

  // Enhanced mood fetching with real-time updates
  const fetchMoodData = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/${sessionId}/mood`);
      const data = await response.json();
      
      if (data.success) {
        setMoodData({
          mood: data.mood,
          riskLevel: data.riskLevel,
          messageCount: data.messageCount
        });
        
        // Console log for debugging
        console.log('🎭 Live Mood Update:', {
          mood: data.mood,
          risk: data.riskLevel,
          messages: data.messageCount
        });
      }
    } catch (error) {
      console.error('Error fetching mood data:', error);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      fetchMoodData();
      // Poll every 3 seconds for real-time updates
      const interval = setInterval(fetchMoodData, 3000);
      return () => clearInterval(interval);
    }
  }, [sessionId, fetchMoodData]);

  const getMoodColor = (mood) => {
    switch (mood) {
      case 'happy': return 'text-green-600 bg-green-100 border-green-200';
      case 'sad': return 'text-red-600 bg-red-100 border-red-200';
      case 'anxious': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'angry': return 'text-orange-600 bg-orange-100 border-orange-200';
      default: return 'text-blue-600 bg-blue-100 border-blue-200';
    }
  };

  const getMoodEmoji = (mood) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'anxious': return '😰';
      case 'angry': return '😠';
      default: return '😐';
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-700 bg-red-100 border-red-300 animate-pulse';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      default: return 'text-green-700 bg-green-100 border-green-300';
    }
  };

  const resources = [
    {
      title: 'Crisis Helplines',
      icon: Phone,
      items: [
        'AASRA: 91-22-2754-6669',
        'Sneha: 91-44-2464-0050',
        'iCall: 91-22-2556-3291'
      ]
    },
    {
      title: 'Self-Help Resources',
      icon: Book,
      items: [
        'Breathing exercises',
        'Mindfulness meditation',
        'Journaling techniques',
        'Sleep hygiene tips'
      ]
    },
    {
      title: 'Support Communities',
      icon: Users,
      items: [
        'Online support groups',
        'Student counseling centers',
        'Peer support networks',
        'Mental health workshops'
      ]
    }
  ];

  if (!sessionId) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Start a conversation to see mood insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Mood Insights */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Heart className="w-5 h-5 mr-2 text-purple-600" />
          Live Mood Insights
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Current Mood:</span>
            <div className={`px-3 py-2 rounded-full text-sm font-medium border transition-all ${getMoodColor(moodData.mood)}`}>
              <span className="text-lg mr-1">{getMoodEmoji(moodData.mood)}</span>
              {moodData.mood}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Risk Level:</span>
            <div className={`px-3 py-2 rounded-full text-sm font-medium border transition-all ${getRiskLevelColor(moodData.riskLevel)}`}>
              {moodData.riskLevel === 'high' && '🚨 '}
              {moodData.riskLevel === 'medium' && '⚠️ '}
              {moodData.riskLevel === 'low' && '✅ '}
              {moodData.riskLevel.toUpperCase()}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Messages:</span>
            <span className="font-medium text-lg">{moodData.messageCount}</span>
          </div>
        </div>

        {/* Crisis Alert */}
        {moodData.riskLevel === 'high' && (
          <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg animate-pulse">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-2 animate-bounce" />
              <div>
                <p className="text-red-800 font-bold text-sm">
                  🚨 CRISIS DETECTED - Immediate Support Available
                </p>
                <p className="text-red-700 text-sm mt-1">
                  AASRA Crisis Helpline: +91-22-2754-6669 (24/7)
                </p>
                <p className="text-red-600 text-xs mt-1">
                  Your life matters. Help is available right now.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mood Trend Placeholder */}
      <div className="bg-white rounded-xl p-6 border">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Mood Trend
        </h3>
        <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500 text-sm">
            {moodData.messageCount > 0 
              ? `Analyzing conversation patterns... (${moodData.messageCount} messages)`
              : 'Start chatting to see trends...'
            }
          </p>
        </div>
      </div>

      {/* Resources Section */}
      <div className="bg-white rounded-xl p-6 border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Mental Health Resources</h3>
          <button
            onClick={() => setShowResources(!showResources)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showResources ? 'Hide' : 'Show'} Resources
          </button>
        </div>
        
        {showResources && (
          <div className="space-y-4">
            {resources.map((resource, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <resource.icon className="w-4 h-4 mr-2 text-gray-600" />
                  <h4 className="font-medium text-gray-800">{resource.title}</h4>
                </div>
                <ul className="space-y-1">
                  {resource.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-gray-600 ml-6">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 border">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="space-y-2">
          <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm">
            🧘 Start breathing exercise
          </button>
          <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm">
            📝 Journal your thoughts
          </button>
          <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-sm">
            🎵 Play calming music
          </button>
          <button className="w-full text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-sm">
            📞 Find local support
          </button>
        </div>
      </div>
    </div>
  );
}

export default MoodTracker;
