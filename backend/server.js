// backend/server.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const journalRoutes = require('./routes/journal');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Store conversations in memory (use database in production)
const conversations = new Map();

// Routes
app.use('/api/journal', journalRoutes);

// Chat routes (your existing chat functionality)
app.post('/api/chat/:sessionId/message', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { text } = req.body;

    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, []);
    }
    const history = conversations.get(sessionId);

    history.push({ role: 'user', content: text });

    const systemPrompt = `You are Sahara, a warm, empathetic mental health companion. You respond like a caring human therapist who remembers the conversation context.

CONVERSATION CONTEXT:
${history.slice(-8).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

CONVERSATION RULES:
- ALWAYS respond directly to what the user just said
- Build on previous parts of the conversation naturally  
- Ask specific follow-up questions based on their exact situation
- Show genuine interest in their feelings and experiences
- Use their exact words when referring back to what they said
- NEVER ask generic questions like "What would you like to talk about?"
- Remember details they've shared and reference them naturally

Current user message: "${text}"

Respond naturally and empathetically, building on our conversation:`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 200,
      },
    });

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const botReply = response.text();

    history.push({ role: 'assistant', content: botReply });

    const formattedMessages = history.slice(-20).map((msg, index) => ({
      id: Date.now() - (20 - index),
      text: msg.content,
      sender: msg.role === 'user' ? 'user' : 'ai',
      timestamp: new Date().toISOString()
    }));

    res.json({
      success: true,
      messages: formattedMessages,
      mood: analyzeMood(text),
      riskLevel: assessRisk(text),
      sentimentScore: getSentimentScore(analyzeMood(text))
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate response'
    });
  }
});

app.post('/api/chat/start', (req, res) => {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  conversations.set(sessionId, []);
  
  res.json({
    success: true,
    sessionId: sessionId
  });
});

// Helper functions
function analyzeMood(text) {
  const lower = text.toLowerCase();
  if (lower.includes('suicide') || lower.includes('kill myself') || lower.includes('want to die')) return 'distressed';
  if (lower.includes('sad') || lower.includes('depressed') || lower.includes('down')) return 'sad';
  if (lower.includes('anxious') || lower.includes('worried') || lower.includes('nervous')) return 'anxious';
  if (lower.includes('angry') || lower.includes('mad') || lower.includes('frustrated')) return 'angry';
  if (lower.includes('happy') || lower.includes('great') || lower.includes('excited')) return 'happy';
  return 'neutral';
}

function assessRisk(text) {
  const lower = text.toLowerCase();
  const criticalKeywords = ['want to die', 'kill myself', 'suicide', "don't want to live"];
  const mediumRiskKeywords = ['hate my life', 'worthless', 'hopeless'];
  
  if (criticalKeywords.some(keyword => lower.includes(keyword))) return 'high';
  if (mediumRiskKeywords.some(keyword => lower.includes(keyword))) return 'medium';
  return 'low';
}

function getSentimentScore(mood) {
  const scores = { 'distressed': -0.9, 'sad': -0.6, 'anxious': -0.4, 'angry': -0.3, 'neutral': 0, 'happy': 0.7 };
  return scores[mood] || 0;
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Sahara AI Server running on http://localhost:${PORT}`);
  console.log('📝 Journal API available at /api/journal');
});
