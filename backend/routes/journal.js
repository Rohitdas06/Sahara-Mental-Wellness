// backend/routes/journal.js
const express = require('express');
const router = express.Router();
const sentimentService = require('../services/sentimentService');

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

// Create a new journal entry
router.post('/entry', async (req, res) => {
  const { content, date } = req.body;
  
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
      createdAt: new Date().toISOString(),
      mood: mood,
      sentiment: sentimentData.score,
      riskLevel: riskLevel
    };

    journalEntries.set(entry.id, entry);

    console.log('📝 Journal Entry Analysis:', {
      mood: mood,
      sentiment: sentimentData.score,
      riskLevel: riskLevel,
      preview: content.substring(0, 50) + '...'
    });

    res.json({
      success: true,
      entry: entry,
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

module.exports = router;
