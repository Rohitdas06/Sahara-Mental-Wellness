// Mock API service for when backend is not available
class MockApiService {
  constructor() {
    this.sessions = new Map();
    this.conversations = new Map();
    this.journalEntries = new Map();
  }

  generateSessionId() {
    return `guest_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  generateUserId() {
    return `guest_user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  async getSessionInfo() {
    const sessionId = this.generateSessionId();
    const userId = this.generateUserId();
    
    this.sessions.set(sessionId, { userId, isGuest: true });
    
    return {
      success: true,
      sessionId,
      userId,
      isGuest: true,
      timestamp: new Date().toISOString(),
      hasConversation: false,
      conversationLength: 0,
      hasJournalEntries: false,
      journalEntriesCount: 0
    };
  }

  async startChat(sessionId, userId) {
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, []);
    }
    
    return {
      success: true,
      sessionId,
      userId,
      isGuest: true,
      message: 'Guest chat session started'
    };
  }

  async sendMessage(sessionId, text, userId) {
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, []);
    }
    
    const history = this.conversations.get(userId);
    
    // Add user message
    history.push({ role: 'user', content: text });
    
    // Generate mock AI response
    const mockResponses = [
      "I understand you're going through a lot right now. It's completely normal to feel this way. Can you tell me more about what's been on your mind?",
      "Thank you for sharing that with me. It takes courage to open up about your feelings. How has this been affecting your daily life?",
      "I hear you, and I want you to know that your feelings are valid. What would help you feel more supported right now?",
      "It sounds like you're dealing with some challenging emotions. Remember, it's okay to not be okay sometimes. What's one small thing that usually helps you feel better?",
      "I'm here to listen and support you. Your wellbeing matters. Is there anything specific you'd like to talk about or work through together?"
    ];
    
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    
    // Add AI response
    history.push({ role: 'assistant', content: randomResponse });
    
    // Analyze mood
    const mood = this.analyzeMood(text);
    const riskLevel = this.assessRisk(text);
    
    const formattedMessages = history.slice(-20).map((msg, index) => ({
      id: Date.now() - (20 - index),
      text: msg.content,
      sender: msg.role === 'user' ? 'user' : 'ai',
      timestamp: new Date().toISOString()
    }));
    
    return {
      success: true,
      messages: formattedMessages,
      mood: mood,
      riskLevel: riskLevel,
      sentimentScore: this.getSentimentScore(mood),
      isGuest: true,
      sessionId: sessionId,
      userId: userId
    };
  }

  async getChatHistory(userId) {
    const history = this.conversations.get(userId) || [];
    
    const formattedMessages = history.map((msg, index) => ({
      id: Date.now() - (history.length - index),
      text: msg.content,
      sender: msg.role === 'user' ? 'user' : 'ai',
      timestamp: new Date().toISOString()
    }));
    
    return {
      success: true,
      messages: formattedMessages,
      userId: userId,
      isGuest: true,
      messageCount: history.length,
      sessionId: this.generateSessionId()
    };
  }

  async getJournalEntries(sessionId) {
    const entries = this.journalEntries.get(sessionId) || [];
    
    return {
      success: true,
      entries: entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      count: entries.length,
      sessionId: sessionId,
      userId: this.generateUserId(),
      isGuest: true
    };
  }

  async saveJournalEntry(sessionId, content, date, prompt) {
    if (!this.journalEntries.has(sessionId)) {
      this.journalEntries.set(sessionId, []);
    }
    
    const entry = {
      id: Date.now(),
      content: content.trim(),
      date: date || new Date().toISOString().split('T')[0],
      prompt: prompt || '',
      createdAt: new Date().toISOString(),
      sessionId: sessionId,
      userId: this.generateUserId(),
      isGuest: true,
      mood: this.analyzeMood(content),
      sentiment: this.analyzeSentiment(content).score,
      riskLevel: this.assessRisk(content),
      analysis: {
        mood: this.analyzeMood(content),
        sentiment: this.analyzeSentiment(content).score >= 0 ? 'positive' : 'negative',
        sentimentScore: this.analyzeSentiment(content).score,
        riskLevel: this.assessRisk(content),
        keyThemes: this.extractKeyThemes(content),
        moodEmoji: this.getMoodEmoji(this.analyzeMood(content)),
        insights: this.generateInsights(this.analyzeMood(content), this.assessRisk(content), content)
      }
    };
    
    this.journalEntries.get(sessionId).push(entry);
    
    return {
      success: true,
      entry: entry,
      analysis: entry.analysis,
      message: 'Journal entry saved successfully',
      sessionId: sessionId,
      userId: this.generateUserId(),
      isGuest: true
    };
  }

  // Helper methods
  analyzeMood(text) {
    const lower = text.toLowerCase();
    if (lower.includes('suicide') || lower.includes('kill myself') || lower.includes('want to die')) return 'distressed';
    if (lower.includes('sad') || lower.includes('depressed') || lower.includes('down')) return 'sad';
    if (lower.includes('anxious') || lower.includes('worried') || lower.includes('nervous')) return 'anxious';
    if (lower.includes('angry') || lower.includes('mad') || lower.includes('frustrated')) return 'angry';
    if (lower.includes('happy') || lower.includes('great') || lower.includes('excited')) return 'happy';
    return 'neutral';
  }

  assessRisk(text) {
    const lower = text.toLowerCase();
    const criticalKeywords = ['want to die', 'kill myself', 'suicide', "don't want to live"];
    const mediumRiskKeywords = ['hate my life', 'worthless', 'hopeless'];
    
    if (criticalKeywords.some(keyword => lower.includes(keyword))) return 'high';
    if (mediumRiskKeywords.some(keyword => lower.includes(keyword))) return 'medium';
    return 'low';
  }

  getSentimentScore(mood) {
    const scores = { 'distressed': -0.9, 'sad': -0.6, 'anxious': -0.4, 'angry': -0.3, 'neutral': 0, 'happy': 0.7 };
    return scores[mood] || 0;
  }

  analyzeSentiment(text) {
    const positiveWords = ['happy', 'good', 'great', 'wonderful', 'amazing', 'excited', 'joyful'];
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'horrible', 'depressed', 'angry'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    return { score: score / words.length };
  }

  extractKeyThemes(content) {
    const themes = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('exam') || lowerContent.includes('study')) themes.push('academics');
    if (lowerContent.includes('family') || lowerContent.includes('parents')) themes.push('family');
    if (lowerContent.includes('friend') || lowerContent.includes('social')) themes.push('friendship');
    if (lowerContent.includes('stress') || lowerContent.includes('pressure')) themes.push('stress');
    if (lowerContent.includes('happy') || lowerContent.includes('grateful')) themes.push('positivity');
    
    return themes.length > 0 ? themes : ['general'];
  }

  getMoodEmoji(mood) {
    const emojiMap = {
      'happy': '😊', 'sad': '😢', 'angry': '😠', 'anxious': '😰',
      'neutral': '😐', 'excited': '🤗', 'stressed': '😤', 'calm': '😌'
    };
    return emojiMap[mood] || '😐';
  }

  generateInsights(mood, riskLevel, content) {
    if (riskLevel === 'high') {
      return "I notice you might be going through a difficult time. Remember that it's okay to seek support from friends, family, or professionals.";
    }
    if (mood === 'anxious' || mood === 'stressed') {
      return "It sounds like you're feeling some pressure. Consider taking breaks and practicing deep breathing exercises.";
    }
    if (mood === 'happy' || mood === 'joyful') {
      return "It's wonderful to see you feeling positive! These moments of joy are important to remember and celebrate.";
    }
    return "Thank you for sharing your thoughts. Reflecting through journaling is a great way to understand your emotions better.";
  }
}

export default new MockApiService();
