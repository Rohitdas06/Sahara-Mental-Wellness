const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Store conversations in memory (use database in production)
const conversations = new Map();

// 🔥 HUMAN-LIKE CONVERSATION API using Gemini
app.post('/api/chat/:sessionId/message', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { text } = req.body;

    // Get or create conversation history
    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, []);
    }
    const history = conversations.get(sessionId);

    // Add user message to history
    history.push({ role: 'user', content: text });

    // 🔥 SMART SYSTEM PROMPT for Gemini - Makes responses human-like
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

RESPONSE STYLE:
- Warm and conversational, not robotic
- "It sounds like..." "That must feel..." "I can understand why..."
- Ask specific follow-ups: "How did that make you feel?" "What happened after that?"
- Validate emotions: "It's completely normal to feel that way"
- Show active listening: "When you mentioned [specific thing], it reminded me..."

EXAMPLES OF GOOD RESPONSES:
User: "namaste" → "Namaste! It's wonderful to meet you. I sense you might have something on your mind today - what's been weighing on you lately?"
User: "I'm stressed about work" → "Work stress can be overwhelming. What specifically is happening at your job that's creating this stress for you?"
User: "My boss is demanding" → "Having a demanding boss sounds exhausting. How long have you been dealing with this pressure, and how is it affecting your daily life?"

Current user message: "${text}"

Respond naturally and empathetically, building on our conversation:`;

    // Get Gemini model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.8,        // More creative responses
        topP: 0.9,              // Diverse word choices
        topK: 40,               // Vocabulary variety
        maxOutputTokens: 200,   // Response length
      },
    });

    // Generate response
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const botReply = response.text();

    // Add bot response to history
    history.push({ role: 'assistant', content: botReply });

    // Format messages for frontend
    const formattedMessages = history.slice(-20).map((msg, index) => ({
      id: Date.now() - (20 - index),
      text: msg.content,
      sender: msg.role === 'user' ? 'user' : 'ai',
      timestamp: new Date().toISOString()
    }));

    // Analyze mood and risk
    const mood = analyzeMood(text);
    const riskLevel = assessRisk(text);

    res.json({
      success: true,
      messages: formattedMessages,
      mood: mood,
      riskLevel: riskLevel,
      sentimentScore: getSentimentScore(mood)
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate response'
    });
  }
});

// 🔥 HELPER FUNCTIONS
function analyzeMood(text) {
  const lower = text.toLowerCase();
  
  // Check for emotions in order of priority
  if (lower.includes('suicide') || lower.includes('kill myself') || lower.includes('want to die') || lower.includes("don't want to live")) {
    return 'distressed';
  }
  if (lower.includes('sad') || lower.includes('depressed') || lower.includes('down') || lower.includes('crying')) {
    return 'sad';
  }
  if (lower.includes('anxious') || lower.includes('worried') || lower.includes('nervous') || lower.includes('panic')) {
    return 'anxious';
  }
  if (lower.includes('angry') || lower.includes('mad') || lower.includes('frustrated') || lower.includes('furious')) {
    return 'angry';
  }
  if (lower.includes('happy') || lower.includes('great') || lower.includes('excited') || lower.includes('wonderful')) {
    return 'happy';
  }
  return 'neutral';
}

function assessRisk(text) {
  const lower = text.toLowerCase();
  
  const criticalKeywords = [
    'want to die', 'kill myself', 'suicide', "don't want to live", 
    'end my life', 'hurt myself', 'over myself'
  ];
  
  const mediumRiskKeywords = [
    'hate my life', 'worthless', 'hopeless', 'can\'t take it',
    'nothing matters', 'no point'
  ];
  
  if (criticalKeywords.some(keyword => lower.includes(keyword))) {
    return 'high';
  }
  
  if (mediumRiskKeywords.some(keyword => lower.includes(keyword))) {
    return 'medium';
  }
  
  return 'low';
}

function getSentimentScore(mood) {
  const scores = {
    'distressed': -0.9,
    'sad': -0.6,
    'anxious': -0.4,
    'angry': -0.3,
    'neutral': 0,
    'happy': 0.7
  };
  return scores[mood] || 0;
}

// Start chat session
app.post('/api/chat/start', (req, res) => {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  conversations.set(sessionId, []);
  
  res.json({
    success: true,
    sessionId: sessionId
  });
});

// Get chat history
app.get('/api/chat/:sessionId/messages', (req, res) => {
  const { sessionId } = req.params;
  const history = conversations.get(sessionId) || [];
  
  const formattedMessages = history.map((msg, index) => ({
    id: Date.now() - (history.length - index),
    text: msg.content,
    sender: msg.role === 'user' ? 'user' : 'ai',
    timestamp: new Date().toISOString()
  }));

  res.json({
    success: true,
    messages: formattedMessages
  });
});

app.listen(3001, () => {
  console.log('🤖 Sahara AI Server (Gemini) running on http://localhost:3001');
  console.log('Make sure GEMINI_API_KEY is set in your .env file');
});
