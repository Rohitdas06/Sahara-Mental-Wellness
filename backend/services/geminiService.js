// backend/services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateResponse(userMessage, mood, riskLevel, conversationHistory = []) {
    try {
      // Determine user context from conversation history and current message
      const userContext = this.analyzeUserContext(userMessage, conversationHistory);
      
      // Create context-aware prompt
      const prompt = this.createContextAwarePrompt(userMessage, mood, riskLevel, conversationHistory, userContext);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('🤖 Context-Aware Response Generated:', text.substring(0, 100) + '...');
      console.log('📊 User Context:', userContext);
      return text;
      
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getContextualFallbackResponse(mood, riskLevel, userMessage, conversationHistory);
    }
  }

  // 🔥 NEW: Analyze user context before responding
  analyzeUserContext(userMessage, conversationHistory) {
    const context = {
      educationLevel: 'unknown',
      stream: 'unknown', 
      currentStage: 'unknown',
      mainConcerns: [],
      hasSharedPersonalInfo: false,
      conversationDepth: conversationHistory.length
    };

    // Combine current message with recent conversation
    const allMessages = [...conversationHistory, { text: userMessage }];
    const combinedText = allMessages.map(msg => msg.text || '').join(' ').toLowerCase();

    // Detect education level and stage
    if (combinedText.includes('class 8') || combinedText.includes('class 9') || combinedText.includes('class 10')) {
      context.educationLevel = 'school';
      context.currentStage = 'middle_school';
    } else if (combinedText.includes('class 11') || combinedText.includes('class 12') || combinedText.includes('12th')) {
      context.educationLevel = 'school';
      context.currentStage = 'high_school';
    } else if (combinedText.includes('college') || combinedText.includes('university') || combinedText.includes('degree')) {
      context.educationLevel = 'college';
      context.currentStage = 'college';
    } else if (combinedText.includes('job') || combinedText.includes('work') || combinedText.includes('office')) {
      context.educationLevel = 'working';
      context.currentStage = 'professional';
    }

    // Detect stream/field
    if (combinedText.includes('science') || combinedText.includes('pcm') || combinedText.includes('physics')) {
      context.stream = 'science';
    } else if (combinedText.includes('commerce') || combinedText.includes('accounts') || combinedText.includes('economics')) {
      context.stream = 'commerce';
    } else if (combinedText.includes('arts') || combinedText.includes('humanities')) {
      context.stream = 'arts';
    }

    // Detect specific exam preparations
    if (combinedText.includes('jee') || combinedText.includes('iit')) {
      context.mainConcerns.push('jee_preparation');
    }
    if (combinedText.includes('neet') || combinedText.includes('medical')) {
      context.mainConcerns.push('neet_preparation');
    }
    if (combinedText.includes('board exam')) {
      context.mainConcerns.push('board_exams');
    }

    // Detect other concerns
    if (combinedText.includes('family') || combinedText.includes('parents')) {
      context.mainConcerns.push('family_issues');
    }
    if (combinedText.includes('friend') || combinedText.includes('relationship')) {
      context.mainConcerns.push('social_issues');
    }

    // Check if user has shared personal details
    context.hasSharedPersonalInfo = context.educationLevel !== 'unknown' || 
                                  context.stream !== 'unknown' || 
                                  context.mainConcerns.length > 0;

    return context;
  }

  // 🔥 UPDATED: Context-aware prompt that discovers before assuming
  createContextAwarePrompt(userMessage, mood, riskLevel, conversationHistory, userContext) {
    let contextualInfo = "";
    
    if (conversationHistory.length > 0) {
      const recentMessages = conversationHistory.slice(-3)
        .map(msg => `${msg.sender}: ${msg.text}`)
        .join('\n');
      contextualInfo = `\n\nRecent conversation:\n${recentMessages}`;
    }

    // Create dynamic instructions based on what we know about the user
    let discoveryInstructions = "";
    
    if (!userContext.hasSharedPersonalInfo && conversationHistory.length < 2) {
      discoveryInstructions = `
DISCOVERY PHASE - Learn about the user first:
- Ask ONE open-ended question to understand their situation
- Don't assume they're in school, college, or preparing for specific exams
- Examples: "What's been on your mind lately?" or "Tell me a bit about yourself"
- Avoid mentioning JEE/NEET/board exams unless they bring it up first
- Be warm and inviting, let them share what's important to them`;
    } else if (userContext.hasSharedPersonalInfo) {
      discoveryInstructions = `
CONTEXT KNOWN - Respond appropriately:
- Education Level: ${userContext.educationLevel}
- Stream: ${userContext.stream}
- Current Stage: ${userContext.currentStage}
- Main Concerns: ${userContext.mainConcerns.join(', ')}
- Tailor your response to their specific situation
- Reference their actual context, not generic assumptions`;
    } else {
      discoveryInstructions = `
GRADUAL DISCOVERY - Build understanding:
- Gently learn more about their situation
- Ask contextual follow-up questions
- Don't make assumptions about their education level or concerns`;
    }

    return `You are Sahara, a warm and empathetic mental health companion for Indian youth.

CONTEXT:
- User just said: "${userMessage}"
- Their current mood: ${mood}
- Risk assessment: ${riskLevel}
- Conversation depth: ${conversationHistory.length} messages
- What we know: ${JSON.stringify(userContext)}${contextualInfo}

${discoveryInstructions}

CORE PRINCIPLES:
- NEVER assume someone is preparing for JEE/NEET unless they mention it
- NEVER assume education level - they could be in Class 8, college, or working
- FIRST understand their actual situation, THEN provide relevant support
- Be culturally aware but don't stereotype
- If they say "everything is fine," explore gently what makes them feel that way
- Match your language to their context (school student vs college vs professional)

RESPONSE GUIDELINES:
- Keep responses to 2-3 sentences maximum
- Be conversational and warm, like a caring friend
- Ask thoughtful questions that help you understand them better
- Show genuine interest in their unique situation
- Avoid mental health jargon - speak naturally

Generate a response that either discovers more about them OR provides contextually appropriate support based on what you now know about their situation.`;
  }

  // 🔥 UPDATED: Contextual fallback responses
  getContextualFallbackResponse(mood, riskLevel, userMessage, conversationHistory) {
    const userContext = this.analyzeUserContext(userMessage, conversationHistory);
    
    // High-risk situations always get crisis support
    if (riskLevel === 'high' || riskLevel === 'critical') {
      return "I'm concerned about what you've shared. Please know that support is available - you can reach AASRA at +91-22-2754-6669 anytime. You don't have to go through this alone.";
    }

    // Context-based responses
    if (!userContext.hasSharedPersonalInfo && conversationHistory.length < 2) {
      const discoveryResponses = [
        "I'm here to listen and support you. What's been on your mind lately?",
        "Thank you for connecting with me. What would you like to talk about today?",
        "I'm glad you're here. Tell me a bit about what's going on in your life right now.",
        "It's good to meet you! What's something that's been important to you lately?"
      ];
      return discoveryResponses[Math.floor(Math.random() * discoveryResponses.length)];
    }

    // Known context - provide relevant support
    if (userContext.educationLevel === 'school') {
      if (userContext.currentStage === 'high_school') {
        return "I understand that 11th and 12th can be really stressful years. What's been the most challenging part for you lately?";
      } else {
        return "School can bring its own set of challenges and pressures. What's been going on that's been on your mind?";
      }
    } else if (userContext.educationLevel === 'college') {
      return "College life has its own unique pressures and opportunities. What's been your experience so far?";
    } else if (userContext.educationLevel === 'working') {
      return "Balancing work and personal wellbeing can be challenging. How have things been for you lately?";
    }

    // Default empathetic response
    return "I appreciate you sharing that with me. What would be most helpful to talk about right now?";
  }

  // 🔥 UPDATED: Better crisis detection
  async generateCrisisResponse(userMessage) {
    const crisisResponses = [
      "I'm very concerned about what you've shared. Your life has real value, and there are people who want to help right now. Please reach out to AASRA at +91-22-2754-6669 - they're available 24/7. You don't have to face this pain alone.",
      "What you're going through sounds incredibly difficult. Please know that immediate help is available. AASRA Crisis Helpline (+91-22-2754-6669) has trained counselors ready to support you right now. Your life matters.",
      "I'm deeply worried about your safety right now. These intense feelings you're having are a signal that you need support immediately. Please call AASRA at +91-22-2754-6669 or reach out to someone you trust. You deserve help and support."
    ];
    
    return crisisResponses[Math.floor(Math.random() * crisisResponses.length)];
  }

  // 🔥 NEW: Context-aware academic response
  async generateContextualAcademicResponse(userMessage, mood, userContext) {
    let academicPrompt = `You are Sahara, providing mental health support for an Indian student.

STUDENT CONTEXT:
- Education Level: ${userContext.educationLevel}
- Current Stage: ${userContext.currentStage}
- Stream: ${userContext.stream}
- Specific Concerns: ${userContext.mainConcerns.join(', ')}

User said: "${userMessage}"
Their mood: ${mood}

Provide support that's specifically relevant to their education level and concerns. Don't mention other exams or levels they're not dealing with. Keep response to 2-3 sentences with one thoughtful follow-up question.`;

    try {
      const result = await this.model.generateContent(academicPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      // Contextual fallbacks based on their actual situation
      if (userContext.mainConcerns.includes('jee_preparation')) {
        return "JEE preparation can feel overwhelming with all the competition and pressure. It's completely normal to feel stressed about it. What specific aspect of your JEE prep is causing you the most anxiety?";
      } else if (userContext.currentStage === 'middle_school') {
        return "School can sometimes feel stressful even in earlier classes. It's important to talk about these feelings. What's been bothering you most about school lately?";
      } else if (userContext.educationLevel === 'college') {
        return "College brings its own academic pressures and adjustments. It's okay to feel overwhelmed sometimes. What part of your college experience has been most challenging?";
      }
      
      return "Academic pressure can affect anyone at any level of education. Your feelings about this are completely valid. What would help you feel more supported in your studies?";
    }
  }
}

module.exports = new GeminiService();
