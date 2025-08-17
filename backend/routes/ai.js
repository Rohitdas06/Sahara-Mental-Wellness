// backend/routes/ai.js
const express = require('express');
const router = express.Router();

// This will be enhanced later with Google Cloud AI
// For now, it provides structured responses

// Get AI response for a message
router.post('/respond', async (req, res) => {
  const { message, sessionId, context } = req.body;
  
  try {
    // Simple AI response logic (will be replaced with Gemini API)
    const response = generateAIResponse(message, context);
    
    res.json({
      success: true,
      response: response.text,
      sentiment: response.sentiment,
      riskLevel: response.riskLevel,
      suggestions: response.suggestions
    });
    
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI response'
    });
  }
});

// Analyze sentiment of a message
router.post('/sentiment', (req, res) => {
  const { message } = req.body;
  
  const sentiment = analyzeSentiment(message);
  
  res.json({
    success: true,
    sentiment: sentiment.mood,
    confidence: sentiment.confidence,
    riskLevel: sentiment.riskLevel
  });
});

// Get coping strategies based on mood
router.get('/coping-strategies/:mood', (req, res) => {
  const { mood } = req.params;
  
  const strategies = getCopingStrategies(mood);
  
  res.json({
    success: true,
    mood,
    strategies
  });
});

// Helper functions (will be enhanced with actual AI)
function generateAIResponse(message, context = {}) {
  const lowerMessage = message.toLowerCase();
  let sentiment = 'neutral';
  let riskLevel = 'low';
  let suggestions = [];
  
  // Crisis detection
  const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'not worth living', 'want to die'];
  if (crisisKeywords.some(keyword => lowerMessage.includes(keyword))) {
    riskLevel = 'high';
    return {
      text: "I'm deeply concerned about what you're sharing with me. Your life has immense value, and there are people who care about you and want to help. Please reach out to a crisis helpline immediately: AASRA (91-22-2754-6669) is available 24/7. You don't have to go through this alone. Can you tell me if there's a trusted person in your life you could contact right now?",
      sentiment: 'crisis',
      riskLevel: 'high',
      suggestions: [
        'Contact AASRA: 91-22-2754-6669',
        'Reach out to a trusted friend or family member',
        'Visit the nearest emergency room',
        'Contact your local emergency services'
      ]
    };
  }
  
  // Academic stress
  if (lowerMessage.includes('exam') || lowerMessage.includes('study') || lowerMessage.includes('academic') || lowerMessage.includes('marks') || lowerMessage.includes('grade')) {
    sentiment = 'anxious';
    riskLevel = 'medium';
    suggestions = [
      'Practice the 4-7-8 breathing technique',
      'Break study sessions into smaller chunks',
      'Talk to a teacher or counselor',
      'Remember: You are more than your grades'
    ];
    
    return {
      text: "Academic pressure is incredibly intense in India, and what you're feeling is completely understandable. Your worth as a person isn't determined by your exam scores or grades. It's important to remember that while education is valuable, your mental health and well-being are equally important. Are you able to take regular breaks while studying? Sometimes our minds need rest to perform better.",
      sentiment,
      riskLevel,
      suggestions
    };
  }
  
  // Family issues
  if (lowerMessage.includes('family') || lowerMessage.includes('parents') || lowerMessage.includes('home')) {
    sentiment = 'sad';
    suggestions = [
      'Try writing down your feelings first',
      'Consider talking to a trusted relative',
      'Practice patience - change takes time',
      'Focus on what you can control'
    ];
    
    return {
      text: "Family relationships can be complex, especially when mental health isn't well understood in Indian families. It's natural to feel frustrated when you feel unheard or misunderstood. Remember that your feelings are valid, even if others don't understand them yet. Sometimes families need time to learn about mental health. Would you like to talk about strategies for communicating with your family about how you're feeling?",
      sentiment,
      riskLevel: 'medium',
      suggestions
    };
  }
  
  // Emotional states
  if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('hopeless')) {
    sentiment = 'sad';
    riskLevel = 'medium';
    suggestions = [
      'Try gentle physical activity like walking',
      'Connect with a friend or loved one',
      'Practice self-compassion',
      'Consider professional support if feelings persist'
    ];
    
    return {
      text: "I hear how much pain you're in right now, and I want you to know that what you're feeling is valid. Depression and sadness can feel overwhelming, but these feelings don't define you and they won't last forever. It takes courage to reach out and talk about these feelings. Have you been able to talk to anyone else about how you're feeling? Even small steps toward connection and self-care can help.",
      sentiment,
      riskLevel,
      suggestions
    };
  }
  
  if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('panic') || lowerMessage.includes('stressed')) {
    sentiment = 'anxious';
    suggestions = [
      'Try the 5-4-3-2-1 grounding technique',
      'Practice deep breathing exercises',
      'Limit caffeine intake',
      'Establish a calming bedtime routine'
    ];
    
    return {
      text: "Anxiety can feel really overwhelming, especially when you're juggling multiple responsibilities and pressures. What you're experiencing is your body's natural response to stress, and it's more common than you might think. Let's try a quick grounding exercise: Can you name 5 things you can see around you right now? This can help bring you back to the present moment. What specific situation is causing you the most anxiety right now?",
      sentiment,
      riskLevel: 'medium',
      suggestions
    };
  }
  
  // Positive responses
  if (lowerMessage.includes('better') || lowerMessage.includes('good') || lowerMessage.includes('happy') || lowerMessage.includes('grateful')) {
    sentiment = 'happy';
    suggestions = [
      'Keep a gratitude journal',
      'Share your positivity with others',
      'Build on this momentum',
      'Remember this feeling for difficult times'
    ];
    
    return {
      text: "It's wonderful to hear that you're feeling better! These positive moments are so important to acknowledge and celebrate. What's been helping you feel this way? It's great that you're recognizing these good feelings - this awareness can help you build resilience for future challenges.",
      sentiment,
      riskLevel: 'low',
      suggestions
    };
  }
  
  // Default empathetic responses
  const defaultResponses = [
    {
      text: "Thank you for sharing that with me. I can sense that this is important to you. Your feelings are completely valid, and it takes strength to talk about what you're going through. Would you like to explore this topic more, or is there something specific that would be helpful right now?",
      sentiment: 'neutral',
      riskLevel: 'low',
      suggestions: ['Take deep breaths', 'Be patient with yourself', 'Remember you\'re not alone', 'One step at a time']
    },
    {
      text: "I'm here to listen and support you through this. Sometimes just having someone who hears you can make a difference. What you're experiencing matters, and so do you. Is there anything specific that's been on your mind that you'd like to talk about?",
      sentiment: 'neutral',
      riskLevel: 'low',
      suggestions: ['Practice self-compassion', 'Take things one day at a time', 'Reach out to trusted people', 'Focus on small positive steps']
    }
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

function analyzeSentiment(message) {
  const lowerMessage = message.toLowerCase();
  
  // Crisis indicators
  const crisisWords = ['suicide', 'kill myself', 'end it all', 'not worth living'];
  if (crisisWords.some(word => lowerMessage.includes(word))) {
    return { mood: 'crisis', confidence: 0.95, riskLevel: 'high' };
  }
  
  // Negative emotions
  const sadWords = ['sad', 'depressed', 'hopeless', 'worthless', 'empty'];
  const anxiousWords = ['anxious', 'worried', 'panic', 'stressed', 'overwhelmed'];
  const angryWords = ['angry', 'furious', 'hate', 'frustrated'];
  
  // Positive emotions
  const happyWords = ['happy', 'good', 'better', 'grateful', 'positive', 'excited'];
  
  if (sadWords.some(word => lowerMessage.includes(word))) {
    return { mood: 'sad', confidence: 0.8, riskLevel: 'medium' };
  }
  
  if (anxiousWords.some(word => lowerMessage.includes(word))) {
    return { mood: 'anxious', confidence: 0.8, riskLevel: 'medium' };
  }
  
  if (angryWords.some(word => lowerMessage.includes(word))) {
    return { mood: 'angry', confidence: 0.75, riskLevel: 'low' };
  }
  
  if (happyWords.some(word => lowerMessage.includes(word))) {
    return { mood: 'happy', confidence: 0.8, riskLevel: 'low' };
  }
  
  return { mood: 'neutral', confidence: 0.6, riskLevel: 'low' };
}

function getCopingStrategies(mood) {
  const strategies = {
    sad: [
      'Practice gentle self-care activities',
      'Reach out to supportive friends or family',
      'Try light physical exercise like walking',
      'Consider talking to a counselor',
      'Write in a journal about your feelings'
    ],
    anxious: [
      'Practice deep breathing exercises',
      'Try the 5-4-3-2-1 grounding technique',
      'Limit caffeine and sugar intake',
      'Create a calming environment',
      'Break overwhelming tasks into smaller steps'
    ],
    angry: [
      'Take deep breaths and count to 10',
      'Try physical exercise to release tension',
      'Write about what\'s bothering you',
      'Talk to someone you trust',
      'Practice progressive muscle relaxation'
    ],
    happy: [
      'Savor and appreciate this positive feeling',
      'Share your happiness with others',
      'Keep a gratitude journal',
      'Use this energy for positive activities',
      'Remember this feeling for difficult times'
    ],
    neutral: [
      'Focus on mindfulness and being present',
      'Engage in activities you enjoy',
      'Connect with friends and family',
      'Set small, achievable goals',
      'Practice regular self-care'
    ]
  };
  
  return strategies[mood] || strategies.neutral;
}

module.exports = router;