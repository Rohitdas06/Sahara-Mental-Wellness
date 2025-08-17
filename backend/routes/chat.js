// backend/routes/chat.js
const express = require('express');
const router = express.Router();

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
    riskLevel: 'low'
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
    riskLevel: session.riskLevel 
  });
});

// Add a message to chat
router.post('/:sessionId/message', (req, res) => {
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
  
  // Simple mood detection (we'll enhance this with AI later)
  if (sender === 'user') {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('sad') || lowerText.includes('depressed') || lowerText.includes('hopeless')) {
      session.mood = 'sad';
    } else if (lowerText.includes('anxious') || lowerText.includes('worried') || lowerText.includes('stressed')) {
      session.mood = 'anxious';
    } else if (lowerText.includes('happy') || lowerText.includes('good') || lowerText.includes('better')) {
      session.mood = 'happy';
    }

    // Crisis detection keywords
    const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'not worth living'];
    if (crisisKeywords.some(keyword => lowerText.includes(keyword))) {
      session.riskLevel = 'high';
    }
  }

  res.json({ 
    success: true, 
    message,
    mood: session.mood,
    riskLevel: session.riskLevel 
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