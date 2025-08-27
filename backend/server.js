// backend/server.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const crypto = require('crypto');
const journalRoutes = require('./routes/journal');
require('dotenv').config();

const app = express();

// ✅ ENHANCED: Session management with better isolation
const sessions = new Map(); // authenticated sessions
const guestSessions = new Set(); // guest session IDs
const conversations = new Map(); // sessionId -> conversation history
const userConversations = new Map(); // userId -> conversation history

// ✅ NEW: Journal data storage (in-memory for demo - replace with your database)
const journalEntries = new Map(); // sessionId -> array of journal entries

// ✅ ENHANCED: Generate unique session IDs with better entropy
function generateSessionId(isGuest = false) {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const prefix = isGuest ? 'guest' : 'auth';
  return `${prefix}_${timestamp}_${randomBytes}`;
}

// ✅ ENHANCED: Session extraction middleware
const extractSessionId = (req, res, next) => {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing X-Session-ID header' 
    });
  }
  req.sessionId = sessionId;
  next();
};

// ✅ ENHANCED: Auth middleware with better session management
const authMiddleware = (req, res, next) => {
  // Get session ID from header
  let sessionId = req.headers['x-session-id'] || req.headers['authorization'];
  
  if (!sessionId) {
    // Create new guest session with better ID generation
    sessionId = generateSessionId(true);
    guestSessions.add(sessionId);
    
    // Set session info
    req.sessionId = sessionId;
    req.isGuest = true;
    req.userId = `guest_user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // Return session ID to client
    res.setHeader('X-Session-ID', sessionId);
    
    console.log(`👤 New guest session created: ${req.userId} | Session: ${sessionId}`);
  } else {
    // Check if it's a guest session
    if (guestSessions.has(sessionId)) {
      req.sessionId = sessionId;
      req.isGuest = true;
      req.userId = `guest_${sessionId}`;
    } else if (sessions.has(sessionId)) {
      // Authenticated user session
      const session = sessions.get(sessionId);
      req.sessionId = sessionId;
      req.isGuest = false;
      req.userId = session.userId;
      
      // Update last accessed time
      session.lastAccessed = new Date();
    } else {
      // Invalid session, create new guest session
      sessionId = generateSessionId(true);
      guestSessions.add(sessionId);
      req.sessionId = sessionId;
      req.isGuest = true;
      req.userId = `guest_${sessionId}`;
      res.setHeader('X-Session-ID', sessionId);
      
      console.log(`👤 Invalid session, new guest created: ${req.userId} | Session: ${sessionId}`);
    }
  }
  
  next();
};

// Middleware
app.use(express.json());
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
  exposedHeaders: ['X-Session-ID'] // Expose session ID header to frontend
}));

// Apply auth middleware to all routes
app.use(authMiddleware);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ ENHANCED: Journal routes with session isolation
app.use('/api/journal', journalRoutes);

// ===== NEW ENDPOINTS FOR COMPLETE DATA CLEARING =====

// ✅ DELETE /api/journal/clear-all - Clear ALL journal entries for session
app.delete('/api/journal/clear-all', extractSessionId, async (req, res) => {
  try {
    const sessionId = req.sessionId;
    const beforeCount = journalEntries.get(sessionId)?.length || 0;
    
    // Clear all journal entries for this session
    journalEntries.delete(sessionId);
    
    console.log(`✅ Cleared ${beforeCount} journal entries for session: ${sessionId}`);
    
    res.json({ 
      success: true, 
      message: `${beforeCount} journal entries cleared for session`,
      deletedCount: beforeCount,
      sessionId: sessionId
    });
  } catch (error) {
    console.error('❌ Error clearing journal data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear journal data' 
    });
  }
});

// ✅ DELETE /api/chat/clear-all - Clear ALL chat messages for session
app.delete('/api/chat/clear-all', extractSessionId, async (req, res) => {
  try {
    const sessionId = req.sessionId;
    const userId = req.userId;
    
    // Clear conversation history for this user
    const beforeCount = userConversations.get(userId)?.length || 0;
    userConversations.delete(userId);
    
    // Also clear from conversations map if exists
    conversations.delete(sessionId);
    
    console.log(`✅ Cleared ${beforeCount} chat messages for session: ${sessionId} | User: ${userId}`);
    
    res.json({ 
      success: true, 
      message: `${beforeCount} chat messages cleared for session`,
      deletedCount: beforeCount,
      sessionId: sessionId,
      userId: userId
    });
  } catch (error) {
    console.error('❌ Error clearing chat data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear chat data' 
    });
  }
});

// ✅ POST /api/journal/end-session - End journal session
app.post('/api/journal/end-session', extractSessionId, async (req, res) => {
  try {
    const sessionId = req.sessionId;
    
    // Remove session from active sessions
    if (req.isGuest) {
      guestSessions.delete(sessionId);
    } else {
      sessions.delete(sessionId);
    }
    
    console.log(`📝 Journal session ended for: ${sessionId}`);
    
    res.json({ 
      success: true, 
      message: `Journal session ended for: ${sessionId}`,
      sessionId: sessionId
    });
  } catch (error) {
    console.error('❌ Error ending journal session:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to end journal session' 
    });
  }
});

// Helper function to get user's conversation history
function getUserConversation(userId) {
  if (!userConversations.has(userId)) {
    userConversations.set(userId, []);
  }
  return userConversations.get(userId);
}

// ✅ ENHANCED: Chat routes with better user isolation
app.post('/api/chat/:sessionId/message', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    // Use user-specific conversation history
    const history = getUserConversation(userId);

    // Add user message to history
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

    // Add bot response to history
    history.push({ role: 'assistant', content: botReply });

    // Format messages for frontend
    const formattedMessages = history.slice(-20).map((msg, index) => ({
      id: Date.now() - (20 - index),
      text: msg.content,
      sender: msg.role === 'user' ? 'user' : 'ai',
      timestamp: new Date().toISOString()
    }));

    console.log(`💬 Chat message processed for ${req.isGuest ? 'guest' : 'user'}: ${userId}`);

    res.json({
      success: true,
      messages: formattedMessages,
      mood: analyzeMood(text),
      riskLevel: assessRisk(text),
      sentimentScore: getSentimentScore(analyzeMood(text)),
      isGuest: req.isGuest,
      sessionId: req.sessionId,
      userId: req.userId
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate response'
    });
  }
});

// Start chat session (user-specific)
app.post('/api/chat/start', (req, res) => {
  const userId = req.userId;
  const sessionId = req.sessionId;
  
  // Initialize user conversation if not exists
  if (!userConversations.has(userId)) {
    userConversations.set(userId, []);
  }
  
  console.log(`🎯 Chat session started for ${req.isGuest ? 'guest' : 'user'}: ${userId}`);
  
  res.json({
    success: true,
    sessionId: sessionId,
    userId: userId,
    isGuest: req.isGuest,
    message: req.isGuest ? 'Guest chat session started' : 'User chat session started'
  });
});

// ✅ ENHANCED: End session and clear data (improved for both guests and users)
app.post('/api/chat/end-session', (req, res) => {
  try {
    const userId = req.userId;
    const sessionId = req.sessionId;

    // Clear chat history for this user (both guest and authenticated)
    const beforeCount = userConversations.get(userId)?.length || 0;
    userConversations.delete(userId);
    
    // Clear from conversations map
    conversations.delete(sessionId);
    
    if (req.isGuest) {
      // Remove guest session
      guestSessions.delete(sessionId);
      console.log(`🔚 Guest chat session ended and data cleared: ${userId} | Cleared ${beforeCount} messages`);
    } else {
      // For authenticated users, also clear but keep session if wanted
      console.log(`🔚 Auth user chat session ended and data cleared: ${userId} | Cleared ${beforeCount} messages`);
    }
    
    res.json({
      success: true,
      message: `Chat session ended and ${beforeCount} messages cleared`,
      sessionEnded: true,
      clearedData: true,
      deletedCount: beforeCount,
      sessionId: sessionId,
      userId: userId
    });
    
  } catch (error) {
    console.error('❌ Error ending chat session:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to end chat session' 
    });
  }
});

// Get chat history for current user
app.get('/api/chat/history', (req, res) => {
  try {
    const userId = req.userId;
    const history = getUserConversation(userId);
    
    const formattedMessages = history.map((msg, index) => ({
      id: Date.now() - (history.length - index),
      text: msg.content,
      sender: msg.role === 'user' ? 'user' : 'ai',
      timestamp: new Date().toISOString()
    }));

    res.json({
      success: true,
      messages: formattedMessages,
      userId: userId,
      isGuest: req.isGuest,
      messageCount: history.length,
      sessionId: req.sessionId
    });

  } catch (error) {
    console.error('❌ Error retrieving chat history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve chat history' 
    });
  }
});

// ✅ ENHANCED: Get session info with better details
app.get('/api/session-info', (req, res) => {
  res.json({
    success: true,
    sessionId: req.sessionId,
    userId: req.userId,
    isGuest: req.isGuest,
    timestamp: new Date().toISOString(),
    hasConversation: userConversations.has(req.userId),
    conversationLength: userConversations.get(req.userId)?.length || 0,
    hasJournalEntries: journalEntries.has(req.sessionId),
    journalEntriesCount: journalEntries.get(req.sessionId)?.length || 0
  });
});

// ✅ ENHANCED: Create authenticated user session with unique session ID
app.post('/api/auth/login', (req, res) => {
  const { username, password, timestamp, randomId } = req.body;
  
  // Mock authentication (implement real authentication here)
  if (username && password) {
    const sessionId = generateSessionId(false); // authenticated session
    const userId = `auth_user_${username}_${Date.now()}`;
    
    sessions.set(sessionId, {
      userId: userId,
      username: username,
      createdAt: new Date(),
      lastAccessed: new Date()
    });

    console.log(`🔐 User authenticated: ${userId} | Session: ${sessionId}`);

    // Set session header
    res.setHeader('X-Session-ID', sessionId);

    res.json({
      success: true,
      sessionId: sessionId,
      userId: userId,
      username: username,
      isGuest: false,
      message: 'Login successful'
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

// ✅ ENHANCED: Logout with complete data clearing
app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.sessionId;
  const userId = req.userId;
  
  try {
    // Clear chat data
    const chatCount = userConversations.get(userId)?.length || 0;
    userConversations.delete(userId);
    conversations.delete(sessionId);
    
    // Clear journal data
    const journalCount = journalEntries.get(sessionId)?.length || 0;
    journalEntries.delete(sessionId);
    
    // Remove session
    if (sessions.has(sessionId)) {
      sessions.delete(sessionId);
    }
    if (guestSessions.has(sessionId)) {
      guestSessions.delete(sessionId);
    }
    
    console.log(`🔓 Complete logout for ${userId}: ${chatCount} chat messages + ${journalCount} journal entries cleared`);
    
    res.json({
      success: true,
      message: 'Logged out successfully and all data cleared',
      clearedChatMessages: chatCount,
      clearedJournalEntries: journalCount,
      sessionId: sessionId,
      userId: userId
    });
  } catch (error) {
    console.error('❌ Error during logout:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
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

// ✅ ENHANCED: Cleanup function with better session management
function cleanupExpiredSessions() {
  const now = new Date();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const TWO_HOURS = 2 * 60 * 60 * 1000;

  let cleanedSessions = 0;
  let cleanedConversations = 0;
  let cleanedJournalEntries = 0;

  // Clean up authenticated sessions older than 24 hours
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastAccessed > TWENTY_FOUR_HOURS) {
      sessions.delete(sessionId);
      
      // Clean up associated data
      const userId = session.userId;
      if (userConversations.has(userId)) {
        userConversations.delete(userId);
        cleanedConversations++;
      }
      if (journalEntries.has(sessionId)) {
        journalEntries.delete(sessionId);
        cleanedJournalEntries++;
      }
      
      cleanedSessions++;
      console.log(`🧹 Cleaned up expired session: ${sessionId}`);
    }
  }

  // Clean up guest sessions older than 2 hours
  const expiredGuestSessions = [];
  for (const sessionId of guestSessions) {
    // Extract timestamp from session ID
    if (sessionId.startsWith('guest_')) {
      const timestampStr = sessionId.split('_')[1];
      if (timestampStr && !isNaN(timestampStr)) {
        const sessionTime = parseInt(timestampStr);
        if (now - sessionTime > TWO_HOURS) {
          expiredGuestSessions.push(sessionId);
        }
      }
    }
  }

  // Remove expired guest sessions and their data
  for (const sessionId of expiredGuestSessions) {
    guestSessions.delete(sessionId);
    
    // Clean up associated data
    const guestUserId = `guest_${sessionId}`;
    if (userConversations.has(guestUserId)) {
      userConversations.delete(guestUserId);
      cleanedConversations++;
    }
    if (journalEntries.has(sessionId)) {
      journalEntries.delete(sessionId);
      cleanedJournalEntries++;
    }
    
    cleanedSessions++;
  }

  if (cleanedSessions > 0) {
    console.log(`🧹 Cleanup completed: ${cleanedSessions} sessions, ${cleanedConversations} conversations, ${cleanedJournalEntries} journal entries removed`);
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Sahara AI Server running on http://localhost:${PORT}`);
  console.log('📝 Journal API available at /api/journal');
  console.log('💬 Chat API available at /api/chat');
  console.log('🔐 Enhanced session management enabled');
  console.log('👤 Complete session isolation for guest and authenticated users');
  console.log('🧹 Auto-cleanup enabled for expired sessions');
  
  // ✅ NEW: Log available clearing endpoints
  console.log('\n📋 Data clearing endpoints:');
  console.log('   DELETE /api/journal/clear-all - Clear journal entries');
  console.log('   DELETE /api/chat/clear-all - Clear chat messages');
  console.log('   POST   /api/journal/end-session - End journal session');
  console.log('   POST   /api/chat/end-session - End chat session');
});
