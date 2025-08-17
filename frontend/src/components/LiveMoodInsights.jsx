// frontend/src/components/LiveMoodInsights.jsx

import React from 'react';
import { getMoodInfo } from '../utils/moodMapping';

function LiveMoodInsights({ currentMood, riskLevel, messageCount, moodHistory }) {
  const moodInfo = getMoodInfo(currentMood);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        ❤️ Live Mood Insights
      </h3>

      {/* Dynamic Current Mood Display */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-600">Current Mood:</label>
        <div className={`inline-flex items-center px-3 py-2 rounded-full mt-2 ${moodInfo.color}`}>
          <span className="text-lg mr-2">{moodInfo.emoji}</span>
          <span className="font-medium">{moodInfo.label}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{moodInfo.description}</p>
      </div>

      {/* Risk Level with Dynamic Colors */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-600">Risk Level:</label>
        <div className={`inline-flex items-center px-3 py-2 rounded-full mt-2 ${getRiskLevelColor(riskLevel)}`}>
          <span className="text-sm font-semibold">{riskLevel?.toUpperCase() || 'LOW'}</span>
        </div>
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
        Messages: <span className="font-semibold">{messageCount || 0}</span>
      </div>
    </div>
  );
}

function getRiskLevelColor(riskLevel) {
  switch(riskLevel) {
    case 'high': return 'bg-red-100 text-red-700 border border-red-200';
    case 'medium': return 'bg-orange-100 text-orange-700';
    case 'low': return 'bg-green-100 text-green-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export default LiveMoodInsights;
