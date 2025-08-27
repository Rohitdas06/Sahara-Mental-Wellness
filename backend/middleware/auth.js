// backend/middleware/auth.js


const crypto = require('crypto');

// In-memory session store (in production, use Redis or database)
const sessions = new Map();
const guestSessions = new Set();

// Generate a unique session ID
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

// Middleware to handle authentication and session management
const authMiddleware = (req, res, next) => {
  // Get session ID from header or create new guest session
  let sessionId = req.headers['x-session-id'] || req.headers['authorization'];
  
  if (!sessionId) {
    // Create new guest session
    sessionId = generateSessionId();
    guestSessions.add(sessionId);
    
    // Set session info
    req.sessionId = sessionId;
    req.isGuest = true;
    req.userId = `guest_${sessionId}`;
    
    // Return session ID to client
    res.setHeader('X-Session-ID', sessionId);
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
    } else {
      // Invalid session, create new guest session
      sessionId = generateSessionId();
      guestSessions.add(sessionId);
      req.sessionId = sessionId;
      req.isGuest = true;
      req.userId = `guest_${sessionId}`;
      res.setHeader('X-Session-ID', sessionId);
    }
  }
  
  next();
};

// Function to create authenticated user session
function createUserSession(userId) {
  const sessionId = generateSessionId();
  sessions.set(sessionId, {
    userId: userId,
    createdAt: new Date(),
    lastAccessed: new Date()
  });
  return sessionId;
}

// Function to end guest session and clear data
function endGuestSession(sessionId) {
  if (guestSessions.has(sessionId)) {
    guestSessions.delete(sessionId);
    return true;
  }
  return false;
}

// Function to logout user session
function logoutUserSession(sessionId) {
  if (sessions.has(sessionId)) {
    sessions.delete(sessionId);
    return true;
  }
  return false;
}

module.exports = {
  authMiddleware,
  createUserSession,
  endGuestSession,
  logoutUserSession,
  generateSessionId
};
