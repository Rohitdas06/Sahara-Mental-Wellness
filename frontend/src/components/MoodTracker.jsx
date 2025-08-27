// frontend/src/components/MoodTracker.jsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, Heart, AlertTriangle, Smile, Meh, Frown, Shield, MessageCircle, Activity, Sparkles, Brain } from 'lucide-react';

function MoodTracker({ sessionId, moodData }) {
  const [currentMood, setCurrentMood] = useState('neutral');
  const [riskLevel, setRiskLevel] = useState('low');
  const [moodHistory, setMoodHistory] = useState([]);
  const [totalMessages, setTotalMessages] = useState(0);

  useEffect(() => {
    if (moodData) {
      console.log('🎭 MoodTracker received data:', moodData); // Debug log
      setCurrentMood(moodData.mood || 'neutral');
      setRiskLevel(moodData.riskLevel || 'low');
      setMoodHistory(moodData.moodHistory || []);
      setTotalMessages(moodData.totalMessages || 0);
    }
  }, [moodData]);

  const getMoodIcon = (mood) => {
    switch (mood) {
      case 'happy':
      case 'joyful':
      case 'excited':
        return <Smile className="w-8 h-8 text-green-500" />;
      case 'sad':
      case 'distressed':
        return <Frown className="w-8 h-8 text-red-500" />;
      case 'anxious':
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      default:
        return <Meh className="w-8 h-8 text-gray-500" />;
    }
  };

  const getMoodGradient = (mood) => {
    switch (mood) {
      case 'happy':
      case 'joyful':
        return 'from-green-400 to-emerald-600';
      case 'sad':
      case 'distressed':
        return 'from-red-400 to-red-600';
      case 'anxious':
        return 'from-yellow-400 to-orange-500';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getMoodColor = (mood) => {
    switch (mood) {
      case 'happy':
      case 'joyful':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'sad':
      case 'distressed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'anxious':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getRiskStyle = (risk) => {
    switch (risk) {
      case 'high':
        return {
          color: 'text-white',
          bg: 'bg-gradient-to-r from-red-500 to-red-600',
          borderBg: 'bg-red-100 border-red-300',
          icon: <AlertTriangle className="w-5 h-5" />,
          pulse: 'animate-pulse',
          text: 'CRITICAL',
          description: 'Immediate support recommended'
        };
      case 'medium':
        return {
          color: 'text-white',
          bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
          borderBg: 'bg-yellow-100 border-yellow-300',
          icon: <AlertTriangle className="w-5 h-5" />,
          pulse: '',
          text: 'ELEVATED',
          description: 'Monitor closely, consider support'
        };
      default:
        return {
          color: 'text-white',
          bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
          borderBg: 'bg-green-100 border-green-300',
          icon: <Shield className="w-5 h-5" />,
          pulse: '',
          text: 'SAFE',
          description: 'All systems normal'
        };
    }
  };

  const riskStyle = getRiskStyle(riskLevel);

  return (
    <div className="space-y-4 p-1">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 rounded-xl text-white p-4 shadow-lg">
        <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-5 rounded-full translate-y-8 -translate-x-8"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-full">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Live Mood Insights</h3>
                <p className="text-purple-100 text-sm">AI-powered emotional analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-purple-100">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Mood - Enhanced Card */}
      <div className="relative overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${getMoodGradient(currentMood)}`}></div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                {getMoodIcon(currentMood)}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800">Current Mood</h4>
                <p className="text-sm text-gray-500">Real-time emotional state</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className={`px-6 py-3 rounded-full border-2 ${getMoodColor(currentMood)} font-bold text-lg shadow-sm`}>
              {currentMood.charAt(0).toUpperCase() + currentMood.slice(1)}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Status</div>
              <div className="text-sm font-bold text-green-600 flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Level - Enhanced */}
      <div className={`bg-white rounded-xl shadow-lg border-2 ${riskStyle.borderBg} p-5 hover:shadow-xl transition-all duration-300`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-600" />
            <h4 className="text-lg font-bold text-gray-800">Risk Assessment</h4>
          </div>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            AI Analysis
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`p-4 ${riskStyle.bg} rounded-2xl ${riskStyle.pulse} shadow-lg`}>
            {React.cloneElement(riskStyle.icon, { className: "w-6 h-6 text-white" })}
          </div>
          <div className="flex-1">
            <div className={`inline-flex items-center px-4 py-2 rounded-full ${riskStyle.bg} ${riskStyle.color} font-bold text-sm shadow-md`}>
              {riskStyle.text}
            </div>
            <p className="text-sm text-gray-600 mt-2 font-medium">
              {riskStyle.description}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Counter - Enhanced */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-100 p-5 shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">{totalMessages}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-blue-600">{totalMessages}</span>
              <span className="text-sm text-blue-500 font-semibold uppercase tracking-wide">Messages</span>
            </div>
            <p className="text-sm text-blue-600 opacity-75 font-medium">Conversation depth tracker</p>
          </div>
        </div>
      </div>

      {/* Mood Trend - Enhanced */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800">Mood Journey</h4>
              <p className="text-xs text-gray-500">Emotional progression</p>
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            Recent
          </div>
        </div>
        
        {moodHistory.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {moodHistory.slice(-6).map((mood, index) => (
                <div
                  key={index}
                  className={`px-3 py-2 rounded-full text-sm border-2 ${getMoodColor(mood)} font-semibold transition-all hover:scale-105 shadow-sm hover:shadow-md cursor-pointer`}
                >
                  {mood}
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-600 font-medium">Latest emotional states</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {Math.min(moodHistory.length, 6)} of {moodHistory.length}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h5 className="text-lg font-semibold text-gray-600 mb-2">Start Your Journey</h5>
            <p className="text-sm text-gray-500 mb-1">Begin chatting to see your emotional patterns</p>
            <p className="text-xs text-gray-400">Your mood trends will appear here</p>
          </div>
        )}
      </div>

      {/* Privacy & Info Notice - Enhanced */}
      <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-green-500 rounded-lg">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-bold text-green-800">AI-Powered Privacy</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-xs text-green-700 leading-relaxed">
              🔐 Your emotional data is analyzed in real-time using advanced AI algorithms. 
              All analysis happens securely and updates automatically during conversations.
            </p>
            <div className="mt-2 text-xs text-green-600 font-medium">
              📊 Insights • 🛡️ Private • ⚡ Real-time • 🤖 AI-powered
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MoodTracker;
