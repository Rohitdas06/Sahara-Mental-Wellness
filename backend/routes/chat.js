// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const sentimentService = require('../services/sentimentService');
const geminiService = require('../services/geminiService');

// Store chat sessions in memory (in production, use database)
const chatSessions = new Map();

// Start a new chat session
router.post('/start', (req, res) => {
  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  chatSessions.set(sessionId, {
    id: sessionId,
    messages: [],
    createdAt: new Date(),
    mood: 'neutral',
    riskLevel: 'low',
    moodHistory: []
  });

  res.json({ 
    success: true, 
    sessionId,
    message: 'Chat session started. You can share anything here safely and anonymously.' 
  });
});

// Get chat history
router.get('/:sessionId/messages', (req, res) => {
  const { sessionId } = req.params;
  const session = chatSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  res.json({ 
    success: true, 
    messages: session.messages,
    mood: session.mood,
    riskLevel: session.riskLevel,
    moodHistory: session.moodHistory || []
  });
});

// Enhanced message posting with Gemini AI sentiment analysis
router.post('/:sessionId/message', async (req, res) => {
  const { sessionId } = req.params;
  const { text, sender } = req.body;
  const session = chatSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  const message = {
    id: Date.now(),
    text,
    sender,
    timestamp: new Date().toISOString()
  };

  session.messages.push(message);
  
  // Advanced AI-powered mood and risk analysis for user messages
  if (sender === 'user') {
    try {
      // Analyze sentiment using your working sentiment service
      const sentimentData = sentimentService.analyzeSentiment(text);
      const newMood = sentimentService.determineMood(text, sentimentData);
      const newRiskLevel = sentimentService.calculateRiskLevel(text, sentimentData);
      
      // Update session data
      session.mood = newMood;
      session.riskLevel = newRiskLevel;
      session.lastSentimentScore = sentimentData.score;

      // 🆕 Track mood history
      if (!session.moodHistory) session.moodHistory = [];
      session.moodHistory.push({
        mood: newMood,
        timestamp: new Date().toISOString(),
        message: text.substring(0, 100) // First 100 chars for context
      });
      
      // Keep only last 10 mood entries
      if (session.moodHistory.length > 10) {
        session.moodHistory = session.moodHistory.slice(-10);
      }
      
      // Log for debugging
      console.log(`📊 Sentiment Analysis:`, {
        text: text.substring(0, 50) + '...',
        mood: newMood,
        riskLevel: newRiskLevel,
        score: sentimentData.score
      });

      // 🤖 Generate AI response using Gemini
      let aiResponse;
      
      if (newRiskLevel === 'high') {
        // Use predefined crisis response for safety
        aiResponse = await geminiService.generateCrisisResponse(text);
        console.log('🚨 CRISIS DETECTED - Using safety response');
      } else if (text.toLowerCase().includes('exam') || text.toLowerCase().includes('study') || 
                 text.toLowerCase().includes('jee') || text.toLowerCase().includes('neet') ||
                 text.toLowerCase().includes('coaching') || text.toLowerCase().includes('marks')) {
        // Specialized academic stress response
        console.log('📚 Academic stress detected - Using specialized response');
        aiResponse = await geminiService.generateAcademicStressResponse(text, newMood);
      } else {
        // General AI response with conversation context
        console.log('🤖 Generating contextual Gemini response');
        const recentMessages = session.messages.slice(-4); // Last 4 messages for context
        aiResponse = await geminiService.generateResponse(text, newMood, newRiskLevel, recentMessages);
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      session.messages.push(aiMessage);

      console.log(`🤖 AI Response: ${aiResponse.substring(0, 100)}...`);

    } catch (error) {
      console.error('AI processing error:', error);
      // Fallback response if Gemini fails
      const fallbackResponse = {
        id: Date.now() + 1,
        text: "I'm here to listen and support you. How are you feeling today?",
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      session.messages.push(fallbackResponse);
    }
  }

  // 🆕 Updated response with mood history
  res.json({ 
    success: true, 
    messages: session.messages, // Send all messages including AI response
    mood: session.mood,
    riskLevel: session.riskLevel,
    moodHistory: session.moodHistory ? session.moodHistory.map(entry => entry.mood) : [],
    sentimentScore: session.lastSentimentScore || 0
  });
});

// Get current mood for a session
router.get('/:sessionId/mood', (req, res) => {
  const { sessionId } = req.params;
  const session = chatSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  res.json({ 
    success: true, 
    mood: session.mood,
    riskLevel: session.riskLevel,
    messageCount: session.messages.length 
  });
});

module.exports = router;
