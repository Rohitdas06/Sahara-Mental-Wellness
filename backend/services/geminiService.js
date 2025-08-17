// backend/services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateResponse(userMessage, mood, riskLevel, conversationHistory = []) {
    try {
      // Create context-aware prompt
      const prompt = this.createPrompt(userMessage, mood, riskLevel, conversationHistory);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('🤖 Gemini AI Response Generated:', text.substring(0, 100) + '...');
      return text;
      
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getFallbackResponse(mood, riskLevel);
    }
  }

  createPrompt(userMessage, mood, riskLevel, conversationHistory) {
    let contextualInfo = "";
    
    // Add conversation context if available
    if (conversationHistory.length > 0) {
      const recentMessages = conversationHistory.slice(-3)
        .map(msg => `${msg.sender}: ${msg.text}`)
        .join('\n');
      contextualInfo = `\n\nRecent conversation:\n${recentMessages}`;
    }

    return `You are Sahara, a compassionate mental health companion specifically designed for Indian students and young adults.

Context:
- User's message: "${userMessage}"
- Detected mood: ${mood}
- Risk level: ${riskLevel}
- You understand Indian family dynamics, academic pressure (JEE, NEET, board exams), and cultural values${contextualInfo}

Instructions:
- Respond with empathy and cultural awareness
- Keep response to 2-3 sentences maximum
- Ask a thoughtful follow-up question
- Use supportive, non-judgmental language
- If discussing academic stress, acknowledge the competitive environment in India
- If discussing family issues, respect cultural values while supporting the user's wellbeing
- Never give medical advice or diagnose
- Be conversational and warm, like talking to a trusted friend

Generate a response that feels natural and personally relevant to their situation.`;
  }

  getFallbackResponse(mood, riskLevel) {
    const fallbacks = {
      'high': "I'm really concerned about you right now. Please know that you're not alone, and there are people who want to help. Consider reaching out to AASRA at +91-22-2754-6669.",
      'sad': "I can hear that you're going through a difficult time. Your feelings are valid, and I'm here to listen. What's been weighing on your heart lately?",
      'anxious': "It sounds like you're feeling quite anxious right now. That can be overwhelming. What's been causing you the most worry?",
      'angry': "I sense there's some frustration in what you're sharing. It's okay to feel angry sometimes. What's been bothering you?",
      'happy': "I'm glad to hear some positivity from you! What's been going well in your life lately?",
      'neutral': "Thank you for sharing that with me. I'm here to listen and support you. How are you feeling right now?"
    };

    return fallbacks[riskLevel === 'high' ? 'high' : mood] || fallbacks['neutral'];
  }

  // Generate specific responses for different scenarios
  async generateCrisisResponse(userMessage) {
    // For crisis situations, always use predefined safe responses
    return "I'm really concerned about what you're sharing. Your life has value, and there are people who want to help. Please consider reaching out to AASRA Crisis Helpline at +91-22-2754-6669 right now. You don't have to go through this alone.";
  }

  async generateAcademicStressResponse(userMessage, mood) {
    try {
      const prompt = `You are Sahara, a mental health companion for Indian students.

User said: "${userMessage}"
This seems related to academic stress/pressure.
Their mood: ${mood}

Provide a supportive response that:
- Acknowledges the competitive academic environment in India
- Validates their feelings about exam/study pressure
- Offers gentle perspective without dismissing their concerns
- Asks a helpful follow-up question
- Keeps response to 2-3 sentences

Be empathetic and culturally aware of Indian education system pressures.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
      
    } catch (error) {
      return "I understand the academic pressure can feel overwhelming, especially in India's competitive environment. Your worth isn't defined by exam results. What aspect of your studies is causing you the most stress?";
    }
  }
}

module.exports = new GeminiService();
