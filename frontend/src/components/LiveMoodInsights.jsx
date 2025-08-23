// frontend/src/components/LiveMoodInsights.jsx
import React, { useEffect } from 'react';
import { getMoodInfo } from '../utils/moodMapping';

function LiveMoodInsights({ moodData }) {
  // 🔥 ADDED: Debug logging to see what data is received
  useEffect(() => {
    console.log('🔍 LiveMoodInsights received moodData:', moodData);
  }, [moodData]);

  // 🔥 UPDATED: Extract values from moodData object instead of separate props
  const currentMood = moodData?.mood || 'neutral';
  const riskLevel = moodData?.riskLevel || 'low';
  const messageCount = moodData?.totalMessages || 0;
  const moodHistory = moodData?.moodHistory || [];
  const sentimentScore = moodData?.sentimentScore || 0;

  const moodInfo = getMoodInfo(currentMood);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        💜 Live Mood Insights
      </h3>

      {/* Dynamic Current Mood Display */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-600">Current Mood:</label>
        <div className={`inline-flex items-center px-3 py-2 rounded-full mt-2 ${moodInfo.color}`}>
          <span className="text-lg mr-2">{moodInfo.emoji}</span>
          <span className="font-medium">{moodInfo.label}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{moodInfo.description}</p>
        
        {/* 🔥 ADDED: Show status for debugging */}
        <p className="text-xs text-blue-500 mt-1">
          Status: {moodData ? 'Active' : 'No Data'}
        </p>
      </div>

      {/* Risk Level with Dynamic Colors */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-600">Risk Level:</label>
        <div className={`inline-flex items-center px-3 py-2 rounded-full mt-2 ${getRiskLevelColor(riskLevel)}`}>
          <span className="text-sm font-semibold">{riskLevel?.toUpperCase() || 'LOW'}</span>
        </div>
        
        {/* 🔥 ADDED: Show sentiment score for debugging */}
        {sentimentScore !== 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Sentiment: {sentimentScore.toFixed(2)}
          </p>
        )}
      </div>

      {/* Recent Mood Changes */}
      {moodHistory && moodHistory.length > 1 && (
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-600">Recent Changes:</label>
          <div className="flex flex-wrap gap-1 mt-2">
            {moodHistory.slice(-5).map((mood, index) => {
              const info = getMoodInfo(mood);
              return (
                <span key={index} className="text-xs" title={info.label}>
                  {info.emoji}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600">
        Messages: <span className="font-semibold">{messageCount}</span>
      </div>

      {/* 🔥 ADDED: Debug info - remove after testing */}
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-500">
        <div>Debug Info:</div>
        <div>Mood: {currentMood}</div>
        <div>Risk: {riskLevel}</div>
        <div>Score: {sentimentScore}</div>
        <div>History: {moodHistory.length} items</div>
      </div>
    </div>
  );
}

// 🔥 UPDATED: Better risk level colors with more contrast
function getRiskLevelColor(riskLevel) {
  switch(riskLevel?.toLowerCase()) {
    case 'critical':
    case 'high': 
      return 'bg-red-100 text-red-800 border-2 border-red-300';
    case 'medium': 
    case 'moderate':
      return 'bg-orange-100 text-orange-800 border-2 border-orange-300';
    case 'low': 
      return 'bg-green-100 text-green-800 border-2 border-green-300';
    default: 
      return 'bg-gray-100 text-gray-700 border-2 border-gray-300';
  }
}

export default LiveMoodInsights;
