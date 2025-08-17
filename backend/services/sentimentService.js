// backend/services/sentimentService.js

const Sentiment = require('sentiment');
const sentiment = new Sentiment();

// Analyze sentiment of text and return score and comparative data
function analyzeSentiment(text) {
  const result = sentiment.analyze(text);
  return {
    score: result.comparative, // Normalized sentiment score
    positive: result.positive,
    negative: result.negative,
    calculation: result.calculation
  };
}

// Enhanced mood detection with 15+ different emotional states
function determineMood(text, sentimentData) {
  const lowerText = text.toLowerCase();
  const score = sentimentData.score;
  
  // Academic/exam stress detection
  if (lowerText.includes('exam') || lowerText.includes('jee') || lowerText.includes('neet') || 
      lowerText.includes('study') || lowerText.includes('marks') || lowerText.includes('coaching')) {
    if (score < -0.3) return 'stressed';
    if (score < 0) return 'academic_anxiety';
    return 'focused';
  }
  
  // Family/relationship issues
  if (lowerText.includes('parent') || lowerText.includes('family') || lowerText.includes('friend') ||
      lowerText.includes('mother') || lowerText.includes('father')) {
    if (score < -0.5) return 'frustrated';
    if (score < 0) return 'conflicted';
    return 'grateful';
  }
  
  // Emotional intensity detection
  if (lowerText.includes('hate') || lowerText.includes('angry') || lowerText.includes('furious') ||
      lowerText.includes('mad') || lowerText.includes('rage')) {
    return 'angry';
  }
  
  if (lowerText.includes('scared') || lowerText.includes('afraid') || lowerText.includes('panic') ||
      lowerText.includes('terrified') || lowerText.includes('fear')) {
    return 'fearful';
  }
  
  if (lowerText.includes('excited') || lowerText.includes('amazing') || lowerText.includes('fantastic') ||
      lowerText.includes('awesome') || lowerText.includes('wonderful')) {
    return 'excited';
  }
  
  if (lowerText.includes('tired') || lowerText.includes('exhausted') || lowerText.includes('drained') ||
      lowerText.includes('sleepy') || lowerText.includes('weary')) {
    return 'exhausted';
  }
  
  if (lowerText.includes('confused') || lowerText.includes('lost') || lowerText.includes("don't know") ||
      lowerText.includes('puzzled') || lowerText.includes('uncertain')) {
    return 'confused';
  }
  
  if (lowerText.includes('hopeless') || lowerText.includes('give up') || lowerText.includes('pointless') ||
      lowerText.includes('useless') || lowerText.includes('worthless')) {
    return 'hopeless';
  }
  
  if (lowerText.includes('proud') || lowerText.includes('accomplished') || lowerText.includes('achieved') ||
      lowerText.includes('success') || lowerText.includes('victory')) {
    return 'proud';
  }
  
  if (lowerText.includes('lonely') || lowerText.includes('alone') || lowerText.includes('isolated') ||
      lowerText.includes('empty') || lowerText.includes('abandon')) {
    return 'lonely';
  }

  // Sentiment score-based fallback
  if (score > 0.6) return 'joyful';
  if (score > 0.3) return 'happy';
  if (score > 0) return 'content';
  if (score > -0.3) return 'neutral';
  if (score > -0.6) return 'sad';
  return 'distressed';
}

// Calculate risk level based on text content and sentiment
function calculateRiskLevel(text, sentimentData) {
  const lowerText = text.toLowerCase();
  const score = sentimentData.score;
  
  // High-risk indicators
  const highRiskWords = [
    'suicide', 'kill myself', 'end it all', 'worthless', 'hopeless',
    'can\'t go on', 'give up', 'no point', 'hurt myself', 'die'
  ];
  
  const hasHighRiskWords = highRiskWords.some(word => lowerText.includes(word));
  
  if (hasHighRiskWords || score < -0.8) {
    return 'high';
  }
  
  // Medium risk indicators
  const mediumRiskWords = [
    'depressed', 'anxiety', 'panic', 'overwhelmed', 'stressed',
    'can\'t cope', 'breaking down', 'falling apart'
  ];
  
  const hasMediumRiskWords = mediumRiskWords.some(word => lowerText.includes(word));
  
  if (hasMediumRiskWords || score < -0.5) {
    return 'medium';
  }
  
  return 'low';
}

// Test function to verify sentiment analysis is working
function testSentiment() {
  console.log('Testing sentiment analysis...');
  
  const testTexts = [
    "I'm so excited about my results!",
    "JEE prep is killing me",
    "I feel hopeless and alone",
    "My parents don't understand me",
    "I'm proud of my achievements"
  ];
  
  testTexts.forEach(text => {
    const sentimentData = analyzeSentiment(text);
    const mood = determineMood(text, sentimentData);
    const risk = calculateRiskLevel(text, sentimentData);
    
    console.log(`Text: "${text}"`);
    console.log(`Mood: ${mood}, Risk: ${risk}, Score: ${sentimentData.score}`);
    console.log('---');
  });
}

module.exports = {
  analyzeSentiment,
  determineMood,
  calculateRiskLevel,
  testSentiment
};
