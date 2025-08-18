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

// Store journal entries in memory (in production, use database)
const journalEntries = new Map();
let entryIdCounter = 1;

// Get all journal entries
router.get('/entries', (req, res) => {
  const entries = Array.from(journalEntries.values()).sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  
  res.json({
    success: true,
    entries: entries
  });
});

// Voice transcription endpoint
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const audioFile = req.file;
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
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

    console.log('🎤 Voice transcription successful:', {
      originalSize: audioFile.size,
      transcribedText: response.data.text.substring(0, 100) + '...'
    });

    res.json({ 
      success: true, 
      transcription: response.data.text 
    });

  } catch (error) {
    console.error('Error transcribing audio:', error);
    
    if (error.response) {
      // OpenAI API error
      res.status(error.response.status).json({ 
        error: 'OpenAI API error: ' + error.response.data.error?.message || 'Unknown error'
      });
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      res.status(408).json({ error: 'Request timeout. Please try with a shorter audio clip.' });
    } else {
      // Other errors
      res.status(500).json({ error: 'Error transcribing audio. Please try again.' });
    }
  }
});

// Create a new journal entry - Updated to match frontend expectations
router.post('/save', async (req, res) => {
  const { content, date, prompt } = req.body;
  
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
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

    journalEntries.set(entry.id, entry);

    console.log('📝 Journal Entry Analysis:', {
      mood: mood,
      sentiment: sentimentData.score,
      riskLevel: riskLevel,
      preview: content.substring(0, 50) + '...'
    });

    // Return in format expected by frontend
    res.json({
      success: true,
      entry: entry,
      analysis: entry.analysis,
      message: 'Journal entry saved successfully'
    });

  } catch (error) {
    console.error('Error processing journal entry:', error);
    res.status(500).json({ error: 'Failed to process journal entry' });
  }
});

// Keep original entry endpoint for compatibility
router.post('/entry', async (req, res) => {
  const { content, date } = req.body;
  
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const sentimentData = sentimentService.analyzeSentiment(content);
    const mood = sentimentService.determineMood(content, sentimentData);
    const riskLevel = sentimentService.calculateRiskLevel(content, sentimentData);

    const entry = {
      id: entryIdCounter++,
      content: content.trim(),
      date: date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      mood: mood,
      sentiment: sentimentData.score,
      riskLevel: riskLevel
    };

    journalEntries.set(entry.id, entry);

    const analysis = {
      mood: mood,
      sentiment: sentimentData.score >= 0 ? 'positive' : 'negative',
      riskLevel,
      keyThemes: extractKeyThemes(content)
    };

    res.json({
      success: true,
      entry: entry,
      analysis: analysis,
      message: 'Journal entry saved successfully'
    });

  } catch (error) {
    console.error('Error processing journal entry:', error);
    res.status(500).json({ error: 'Failed to process journal entry' });
  }
});

// Get journal entry by date
router.get('/entry/:date', (req, res) => {
  const { date } = req.params;
  const entry = Array.from(journalEntries.values()).find(e => e.date === date);
  
  if (entry) {
    res.json({ success: true, entry });
  } else {
    res.status(404).json({ error: 'No entry found for this date' });
  }
});

// Delete journal entry
router.delete('/:entryId', (req, res) => {
  const { entryId } = req.params;
  const entryExists = journalEntries.has(parseInt(entryId));
  
  if (entryExists) {
    journalEntries.delete(parseInt(entryId));
    res.json({ success: true, message: 'Entry deleted successfully' });
  } else {
    res.status(404).json({ error: 'Entry not found' });
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
