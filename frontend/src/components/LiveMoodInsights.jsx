// frontend/src/components/LiveMoodInsights.jsx
import React, { useEffect, useRef } from 'react';
import { Heart, TrendingUp, MessageSquare, AlertTriangle } from 'lucide-react';

function LiveMoodInsights({ moodData }) {
  const scrollRef = useRef(null);
  
  const {
    mood = "neutral",
    riskLevel = "low",
    moodHistory = [],
    sentimentScore = 0,
    totalMessages = 0
  } = moodData || {};

  // 🔥 ADDED: Auto-scroll to bottom when new mood data comes in
  useEffect(() => {
    if (scrollRef.current && moodHistory.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moodData, moodHistory]);

  // Get mood emoji
  const getMoodEmoji = (mood) => {
    const emojiMap = {
      'happy': '😊',
      'sad': '😢',
      'angry': '😠',
      'anxious': '😰',
      'distressed': '😰',
      'neutral': '😐',
      'excited': '🤗',
      'stressed': '😤',
      'calm': '😌',
      'joyful': '😄',
      'content': '🙂'
    };
    return emojiMap[mood] || '😐';
  };

  // Get risk level color and text
  const getRiskLevelStyle = (level) => {
    switch (level) {
      case 'high':
        return { color: 'text-red-600', bg: 'bg-red-100', text: 'HIGH' };
      case 'medium':
        return { color: 'text-orange-600', bg: 'bg-orange-100', text: 'MEDIUM' };
      case 'low':
      default:
        return { color: 'text-green-600', bg: 'bg-green-100', text: 'LOW' };
    }
  };

  const riskStyle = getRiskLevelStyle(riskLevel);

  // Get recent mood trend
  const getRecentTrend = () => {
    if (moodHistory.length < 2) return 'stable';
    const recent = moodHistory.slice(-3);
    const positiveCount = recent.filter(m => ['happy', 'content', 'joyful', 'excited'].includes(m)).length;
    const negativeCount = recent.filter(m => ['sad', 'angry', 'anxious', 'distressed', 'stressed'].includes(m)).length;
    
    if (positiveCount > negativeCount) return 'improving';
    if (negativeCount > positiveCount) return 'declining';
    return 'stable';
  };

  const trend = getRecentTrend();

  return (
    <div className="bg-gradient-to-br from-pink-500 to-purple-600 text-white h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-white border-opacity-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Live Mood Insights</h2>
          </div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* 🔥 FIXED: Scrollable content area with proper height */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white scrollbar-thumb-opacity-30 scrollbar-track-transparent"
        style={{ 
          maxHeight: 'calc(100vh - 200px)',
          minHeight: '400px'
        }}
      >
        {/* Current Mood */}
        <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-90">Current Mood:</span>
            <span className="text-xs opacity-75">Status: Active</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{getMoodEmoji(mood)}</span>
              <span className="text-lg font-semibold capitalize">{mood}</span>
            </div>
          </div>
        </div>

        {/* Risk Level */}
        <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-90">Risk Level:</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${riskStyle.bg} ${riskStyle.color} bg-opacity-90 text-opacity-100`}>
              {riskStyle.text}
            </div>
            {riskLevel === 'high' && (
              <AlertTriangle className="w-4 h-4 text-red-200" />
            )}
          </div>
        </div>

        {/* Messages Count */}
        <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-90">Messages:</span>
            <MessageSquare className="w-4 h-4 opacity-75" />
          </div>
          <div className="text-2xl font-bold">{totalMessages}</div>
          <div className="text-xs opacity-75">Total conversations</div>
        </div>

        {/* Mood Trend */}
        <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-90">Mood Trend</span>
            <TrendingUp className="w-4 h-4 opacity-75" />
          </div>
          <div className="flex items-center space-x-2">
            <div className={`text-sm font-medium ${
              trend === 'improving' ? 'text-green-200' :
              trend === 'declining' ? 'text-red-200' :
              'text-blue-200'
            }`}>
              {trend === 'improving' && '📈 Improving'}
              {trend === 'declining' && '📉 Needs attention'}
              {trend === 'stable' && '➡️ Stable'}
            </div>
          </div>
        </div>

        {/* 🔥 ADDED: Recent Mood History */}
        {moodHistory.length > 0 && (
          <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-sm font-medium opacity-90 mb-2">Recent Moods:</div>
            <div className="flex flex-wrap gap-2">
              {moodHistory.slice(-5).map((historyMood, index) => (
                <span key={index} className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  {getMoodEmoji(historyMood)} {historyMood}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 🔥 ADDED: Sentiment Score */}
        <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-sm font-medium opacity-90 mb-2">Sentiment Score:</div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-white bg-opacity-20 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  sentimentScore >= 0 ? 'bg-green-400' : 'bg-red-400'
                }`}
                style={{ 
                  width: `${Math.abs(sentimentScore * 100)}%`,
                  marginLeft: sentimentScore < 0 ? `${100 - Math.abs(sentimentScore * 100)}%` : '0'
                }}
              ></div>
            </div>
            <span className="text-xs font-medium">
              {sentimentScore >= 0 ? '+' : ''}{(sentimentScore * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Debug Info (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-white bg-opacity-10 rounded-lg p-3 text-xs">
            <div className="font-medium mb-1">Debug Info:</div>
            <div>Mood: {mood}</div>
            <div>Risk: {riskLevel}</div>
            <div>Score: {sentimentScore?.toFixed(2) || 0}</div>
            <div>History: {moodHistory.length} items</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveMoodInsights;
