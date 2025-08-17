// frontend/src/components/Journal.jsx
import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, TrendingUp, Save, Edit3, Eye } from 'lucide-react';
import { getMoodInfo } from '../utils/moodMapping';

const BACKEND_URL = 'http://localhost:3001';

function Journal() {
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false); // 🔧 Prevent multiple API calls

  // 🔧 FIXED: Load journal entries only once on component mount
  useEffect(() => {
    if (!initialized) {
      loadJournalEntries();
      setInitialized(true);
    }
  }, [initialized]);

  const loadJournalEntries = async () => {
    if (isLoading) return; // Prevent multiple simultaneous calls
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/journal/entries`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
        console.log('📖 Journal entries loaded:', data.entries?.length || 0);
      } else {
        console.error('Failed to load journal entries:', response.status);
      }
    } catch (error) {
      console.error('Error loading journal entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveJournalEntry = async () => {
    if (!currentEntry.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/journal/entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: currentEntry,
          date: selectedDate
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEntries(prev => [data.entry, ...prev]);
        setCurrentEntry('');
        setIsWriting(false);
        console.log('📝 Journal entry saved with mood:', data.entry.mood);
      } else {
        console.error('Failed to save journal entry:', response.status);
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEntryForDate = (date) => {
    return entries.find(entry => entry.date === date);
  };

  const todayEntry = getEntryForDate(selectedDate);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <BookOpen className="w-10 h-10 text-purple-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Your Wellness Journal</h1>
        </div>
        <p className="text-gray-600">
          Reflect on your thoughts and emotions. Your entries help track your mental wellness journey.
        </p>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Select Date</h2>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-sm text-gray-500">{formatDate(selectedDate)}</p>
      </div>

      {/* Writing Area */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {!isWriting && !todayEntry ? (
          <div className="text-center py-12">
            <Edit3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No entry for this date</h3>
            <p className="text-gray-500 mb-6">Share your thoughts, feelings, and experiences</p>
            <button
              onClick={() => setIsWriting(true)}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200"
            >
              <Edit3 className="w-4 h-4 inline mr-2" />
              Start Writing
            </button>
          </div>
        ) : isWriting ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Writing for {formatDate(selectedDate)}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {setIsWriting(false); setCurrentEntry('');}}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={saveJournalEntry}
                  disabled={!currentEntry.trim() || isLoading}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </div>
            <textarea
              value={currentEntry}
              onChange={(e) => setCurrentEntry(e.target.value)}
              placeholder="How are you feeling today? What's on your mind? Share your thoughts freely..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <div className="mt-2 text-sm text-gray-500">
              {currentEntry.length} characters • Your entries are private and secure
            </div>
          </div>
        ) : todayEntry ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Entry for {formatDate(selectedDate)}</h3>
              <div className="flex items-center space-x-4">
                {todayEntry.mood && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Mood:</span>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getMoodInfo(todayEntry.mood).color}`}>
                      <span className="mr-1">{getMoodInfo(todayEntry.mood).emoji}</span>
                      {getMoodInfo(todayEntry.mood).label}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => {setIsWriting(true); setCurrentEntry(todayEntry.content);}}
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </button>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {todayEntry.content}
              </p>
            </div>
            <div className="mt-4 text-sm text-gray-500 flex items-center justify-between">
              <span>Written on {formatDate(todayEntry.date)}</span>
              {todayEntry.sentiment && (
                <span>Sentiment Score: {todayEntry.sentiment.toFixed(2)}</span>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Recent Entries */}
      {entries.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
            <h2 className="text-lg font-semibold">Recent Entries</h2>
          </div>
          <div className="space-y-4">
            {entries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{formatDate(entry.date)}</span>
                  {entry.mood && (
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getMoodInfo(entry.mood).color}`}>
                      <span className="mr-1">{getMoodInfo(entry.mood).emoji}</span>
                      {getMoodInfo(entry.mood).label}
                    </div>
                  )}
                </div>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {entry.content.substring(0, 150)}
                  {entry.content.length > 150 && '...'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Journal;
