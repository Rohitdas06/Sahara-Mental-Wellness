// backend/routes/journal.js
const express = require('express');
const router = express.Router();
const sentimentService = require('../services/sentimentService');
const multer = require('multer');
const FormData = require('form-data');
const { Readable } = require('stream');
const axios = require('axios');

// Configure multer for file upload
const upload = multer();

// ✅ ENHANCED: Store journal entries with session isolation (in production, use database)
const journalEntries = new Map(); // sessionId -> array of entries
let entryIdCounter = 1;

// ✅ NEW: Session extraction middleware
const extractSessionId = (req, res, next) => {
  const sessionId = req.headers['x-session-id'];
  const userId = req.headers['x-user-id'];
  const isGuest = req.headers['x-is-guest'] === 'true';
  
  if (!sessionId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing X-Session-ID header' 
    });
  }
  
  req.sessionId = sessionId;
  req.userId = userId;
  req.isGuest = isGuest;
  next();
};

// ✅ ENHANCED: Get journal entries filtered by session
router.get('/entries', extractSessionId, (req, res) => {
  try {
    const sessionId = req.sessionId;
    const sessionEntries = journalEntries.get(sessionId) || [];
    
    // Sort by creation date (newest first)
    const sortedEntries = sessionEntries.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    console.log(`📖 Retrieved ${sortedEntries.length} journal entries for ${req.isGuest ? 'guest' : 'auth'} session: ${sessionId}`);
    
    res.json({
      success: true,
      entries: sortedEntries,
      count: sortedEntries.length,
      sessionId: sessionId,
      userId: req.userId,
      isGuest: req.isGuest
    });
  } catch (error) {
    console.error('❌ Error retrieving journal entries:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve journal entries' 
    });
  }
});

// ✅ NEW: Clear all journal entries for a session
router.delete('/clear-all', extractSessionId, (req, res) => {
  try {
    const sessionId = req.sessionId;
    const beforeCount = journalEntries.get(sessionId)?.length || 0;
    
    // Delete all entries for this session
    journalEntries.delete(sessionId);
    
    console.log(`✅ Cleared ${beforeCount} journal entries for session: ${sessionId}`);
    
    res.json({ 
      success: true, 
      message: `${beforeCount} journal entries cleared for session`,
      deletedCount: beforeCount,
      sessionId: sessionId,
      userId: req.userId,
      isGuest: req.isGuest
    });
  } catch (error) {
    console.error('❌ Error clearing journal entries:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear journal entries' 
    });
  }
});

// ✅ NEW: End session (cleanup associated data)
router.post('/end-session', extractSessionId, (req, res) => {
  try {
    const sessionId = req.sessionId;
    const entriesCount = journalEntries.get(sessionId)?.length || 0;
    
    console.log(`📝 Journal session ended for: ${sessionId} (${entriesCount} entries exist)`);
    
    res.json({ 
      success: true, 
      message: `Journal session ended for: ${sessionId}`,
      entriesCount: entriesCount,
      sessionId: sessionId,
      userId: req.userId,
      isGuest: req.isGuest
    });
  } catch (error) {
    console.error('❌ Error ending journal session:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to end journal session' 
    });
  }
});

// ✅ ENHANCED: Voice transcription endpoint with session logging
router.post('/transcribe', extractSessionId, upload.single('audio'), async (req, res) => {
  try {
    const audioFile = req.file;
    if (!audioFile) {
      return res.status(400).json({ 
        success: false, 
        error: 'No audio file provided' 
      });
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'OpenAI API key not configured' 
      });
    }

    const formData = new FormData();
    const audioStream = Readable.from(audioFile.buffer);
    formData.append('file', audioStream, { 
      filename: 'recording.wav', 
      contentType: audioFile.mimetype 
    });
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // Can be changed to 'hi' for Hindi or 'auto' for auto-detection

    const config = {
      headers: {
        "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      timeout: 30000, // 30 second timeout
    };

    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions', 
      formData, 
      config
    );

    console.log(`🎤 Voice transcription successful for ${req.isGuest ? 'guest' : 'auth'} session ${req.sessionId}:`, {
      originalSize: audioFile.size,
      transcribedLength: response.data.text.length,
      preview: response.data.text.substring(0, 100) + '...'
    });

    res.json({ 
      success: true, 
      transcription: response.data.text,
      sessionId: req.sessionId,
      userId: req.userId
    });

  } catch (error) {
    console.error(`❌ Error transcribing audio for session ${req.sessionId}:`, error);
    
    if (error.response) {
      // OpenAI API error
      res.status(error.response.status).json({ 
        success: false,
        error: 'OpenAI API error: ' + (error.response.data.error?.message || 'Unknown error')
      });
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      res.status(408).json({ 
        success: false,
        error: 'Request timeout. Please try with a shorter audio clip.' 
      });
    } else {
      // Other errors
      res.status(500).json({ 
        success: false,
        error: 'Error transcribing audio. Please try again.' 
      });
    }
  }
});

// ✅ ENHANCED: Create journal entry with session isolation
router.post('/save', extractSessionId, async (req, res) => {
  const { content, date, prompt } = req.body;
  
  if (!content || !content.trim()) {
    return res.status(400).json({ 
      success: false, 
      error: 'Content is required' 
    });
  }

  try {
    const sessionId = req.sessionId;
    
    // Analyze sentiment and mood for the journal entry
    const sentimentData = sentimentService.analyzeSentiment(content);
    const mood = sentimentService.determineMood(content, sentimentData);
    const riskLevel = sentimentService.calculateRiskLevel(content, sentimentData);

    const entry = {
      id: entryIdCounter++,
      content: content.trim(),
      date: date || new Date().toISOString().split('T')[0],
      prompt: prompt || '',
      createdAt: new Date().toISOString(),
      sessionId: sessionId, // ✅ Associate with session
      userId: req.userId,   // ✅ Associate with user
      isGuest: req.isGuest, // ✅ Track guest status
      mood: mood,
      sentiment: sentimentData.score,
      riskLevel: riskLevel,
      analysis: {
        mood: mood,
        sentiment: sentimentData.score >= 0 ? 'positive' : 'negative',
        sentimentScore: sentimentData.score,
        riskLevel: riskLevel,
        keyThemes: extractKeyThemes(content),
        moodEmoji: getMoodEmoji(mood),
        insights: generateInsights(mood, riskLevel, content)
      }
    };

    // ✅ ENHANCED: Store entry in session-specific array
    if (!journalEntries.has(sessionId)) {
      journalEntries.set(sessionId, []);
    }
    journalEntries.get(sessionId).push(entry);

    console.log(`📝 Journal entry saved for ${req.isGuest ? 'guest' : 'auth'} session ${sessionId}:`, {
      entryId: entry.id,
      userId: req.userId,
      mood: mood,
      sentiment: sentimentData.score,
      riskLevel: riskLevel,
      contentLength: content.length,
      totalEntries: journalEntries.get(sessionId).length
    });

    // Return in format expected by frontend
    res.json({
      success: true,
      entry: entry,
      analysis: entry.analysis,
      message: 'Journal entry saved successfully',
      sessionId: sessionId,
      userId: req.userId,
      isGuest: req.isGuest
    });

  } catch (error) {
    console.error(`❌ Error processing journal entry for session ${req.sessionId}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process journal entry' 
    });
  }
});

// ✅ ENHANCED: Keep original entry endpoint for compatibility with session isolation
router.post('/entry', extractSessionId, async (req, res) => {
  const { content, date } = req.body;
  
  if (!content || !content.trim()) {
    return res.status(400).json({ 
      success: false, 
      error: 'Content is required' 
    });
  }

  try {
    const sessionId = req.sessionId;
    const sentimentData = sentimentService.analyzeSentiment(content);
    const mood = sentimentService.determineMood(content, sentimentData);
    const riskLevel = sentimentService.calculateRiskLevel(content, sentimentData);

    const entry = {
      id: entryIdCounter++,
      content: content.trim(),
      date: date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      sessionId: sessionId, // ✅ Associate with session
      userId: req.userId,   // ✅ Associate with user
      isGuest: req.isGuest, // ✅ Track guest status
      mood: mood,
      sentiment: sentimentData.score,
      riskLevel: riskLevel
    };

    // ✅ Store entry in session-specific array
    if (!journalEntries.has(sessionId)) {
      journalEntries.set(sessionId, []);
    }
    journalEntries.get(sessionId).push(entry);

    const analysis = {
      mood: mood,
      sentiment: sentimentData.score >= 0 ? 'positive' : 'negative',
      riskLevel,
      keyThemes: extractKeyThemes(content)
    };

    console.log(`📝 Journal entry saved (legacy endpoint) for session ${sessionId}`);

    res.json({
      success: true,
      entry: entry,
      analysis: analysis,
      message: 'Journal entry saved successfully',
      sessionId: sessionId
    });

  } catch (error) {
    console.error(`❌ Error processing journal entry (legacy) for session ${req.sessionId}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process journal entry' 
    });
  }
});

// ✅ ENHANCED: Get journal entry by date with session filtering
router.get('/entry/:date', extractSessionId, (req, res) => {
  try {
    const { date } = req.params;
    const sessionId = req.sessionId;
    const sessionEntries = journalEntries.get(sessionId) || [];
    
    // Find entry for this date in this session only
    const entry = sessionEntries.find(e => e.date === date);
    
    if (entry) {
      console.log(`📅 Retrieved journal entry for date ${date} in session ${sessionId}`);
      res.json({ 
        success: true, 
        entry,
        sessionId: sessionId
      });
    } else {
      console.log(`📅 No journal entry found for date ${date} in session ${sessionId}`);
      res.status(404).json({ 
        success: false, 
        error: 'No entry found for this date in current session' 
      });
    }
  } catch (error) {
    console.error(`❌ Error retrieving entry by date for session ${req.sessionId}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve journal entry' 
    });
  }
});

// ✅ ENHANCED: Delete journal entry with session filtering
router.delete('/:entryId', extractSessionId, (req, res) => {
  try {
    const { entryId } = req.params;
    const sessionId = req.sessionId;
    const sessionEntries = journalEntries.get(sessionId) || [];
    
    // Find entry index in this session only
    const entryIndex = sessionEntries.findIndex(entry => entry.id === parseInt(entryId));
    
    if (entryIndex !== -1) {
      // Remove the entry
      const deletedEntry = sessionEntries.splice(entryIndex, 1)[0];
      
      // Update the map
      journalEntries.set(sessionId, sessionEntries);
      
      console.log(`🗑️ Deleted journal entry ${entryId} from session ${sessionId}`);
      
      res.json({ 
        success: true, 
        message: 'Entry deleted successfully',
        deletedEntry: {
          id: deletedEntry.id,
          date: deletedEntry.date,
          preview: deletedEntry.content.substring(0, 50) + '...'
        },
        sessionId: sessionId,
        remainingEntries: sessionEntries.length
      });
    } else {
      console.log(`🗑️ Entry ${entryId} not found in session ${sessionId}`);
      res.status(404).json({ 
        success: false, 
        error: 'Entry not found in current session' 
      });
    }
  } catch (error) {
    console.error(`❌ Error deleting entry ${req.params.entryId} for session ${req.sessionId}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete journal entry' 
    });
  }
});

// ✅ NEW: Get session statistics
router.get('/stats', extractSessionId, (req, res) => {
  try {
    const sessionId = req.sessionId;
    const sessionEntries = journalEntries.get(sessionId) || [];
    
    // Calculate statistics
    const totalEntries = sessionEntries.length;
    const moods = sessionEntries.map(entry => entry.mood);
    const moodCounts = moods.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {});
    
    const averageSentiment = sessionEntries.length > 0 
      ? sessionEntries.reduce((sum, entry) => sum + entry.sentiment, 0) / sessionEntries.length 
      : 0;
    
    const riskLevels = sessionEntries.map(entry => entry.riskLevel);
    const highRiskCount = riskLevels.filter(level => level === 'high').length;
    
    console.log(`📊 Retrieved statistics for session ${sessionId}: ${totalEntries} entries`);
    
    res.json({
      success: true,
      stats: {
        totalEntries,
        moodCounts,
        averageSentiment: Math.round(averageSentiment * 100) / 100,
        highRiskCount,
        sessionId: sessionId,
        userId: req.userId,
        isGuest: req.isGuest
      }
    });
  } catch (error) {
    console.error(`❌ Error retrieving statistics for session ${req.sessionId}:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve statistics' 
    });
  }
});

// Helper function to extract key themes from content
function extractKeyThemes(content) {
  const themes = [];
  const lowerContent = content.toLowerCase();
  
  // Academic themes
  if (lowerContent.includes('exam') || lowerContent.includes('study') || 
      lowerContent.includes('test') || lowerContent.includes('marks')) {
    themes.push('academics');
  }
  
  // Family themes
  if (lowerContent.includes('family') || lowerContent.includes('parents') || 
      lowerContent.includes('mom') || lowerContent.includes('dad')) {
    themes.push('family');
  }
  
  // Friendship themes
  if (lowerContent.includes('friend') || lowerContent.includes('social')) {
    themes.push('friendship');
  }
  
  // Stress themes
  if (lowerContent.includes('stress') || lowerContent.includes('pressure') || 
      lowerContent.includes('anxious') || lowerContent.includes('worried')) {
    themes.push('stress');
  }
  
  // Positive themes
  if (lowerContent.includes('happy') || lowerContent.includes('grateful') || 
      lowerContent.includes('excited') || lowerContent.includes('good')) {
    themes.push('positivity');
  }
  
  return themes.length > 0 ? themes : ['general'];
}

// Helper function to get mood emoji
function getMoodEmoji(mood) {
  const emojiMap = {
    'happy': '😊',
    'sad': '😢',
    'angry': '😠',
    'anxious': '😰',
    'neutral': '😐',
    'excited': '🤗',
    'stressed': '😤',
    'calm': '😌',
    'joyful': '😄'
  };
  
  return emojiMap[mood] || '😐';
}

// Helper function to generate insights
function generateInsights(mood, riskLevel, content) {
  if (riskLevel === 'high') {
    return "I notice you might be going through a difficult time. Remember that it's okay to seek support from friends, family, or professionals.";
  }
  
  if (mood === 'anxious' || mood === 'stressed') {
    return "It sounds like you're feeling some pressure. Consider taking breaks and practicing deep breathing exercises.";
  }
  
  if (mood === 'happy' || mood === 'joyful') {
    return "It's wonderful to see you feeling positive! These moments of joy are important to remember and celebrate.";
  }
  
  if (content.toLowerCase().includes('exam') || content.toLowerCase().includes('study')) {
    return "Academic stress is very common. Remember to balance study time with self-care and rest.";
  }
  
  return "Thank you for sharing your thoughts. Reflecting through journaling is a great way to understand your emotions better.";
}

module.exports = router;
