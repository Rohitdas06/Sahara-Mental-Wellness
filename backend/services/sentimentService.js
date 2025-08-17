// backend/services/sentimentService.js
const { LanguageServiceClient } = require('@google-cloud/language');
const axios = require('axios');
require('dotenv').config();

class SentimentService {
  constructor() {
    this.apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  }

  // Crisis keywords for immediate detection
  getCrisisKeywords() {
    return [
      'suicide', 'kill myself', 'end it all', 'want to die', 
      'no point living', 'better off dead', 'can\'t go on',
      'self harm', 'hurt myself', 'overdose'
    ];
  }

  // Analyze sentiment using Google Natural Language API
  async analyzeSentiment(text) {
    try {
      const response = await axios.post(
        `https://language.googleapis.com/v1/documents:analyzeSentiment?key=${this.apiKey}`,
        {
          document: {
            type: 'PLAIN_TEXT',
            content: text
          }
        }
      );

      const sentiment = response.data.documentSentiment;
      return {
        score: sentiment.score,      // -1 (negative) to 1 (positive)
        magnitude: sentiment.magnitude, // 0 to infinity (intensity)
        confidence: this.calculateConfidence(sentiment)
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      // Fallback to basic keyword analysis
      return this.fallbackSentimentAnalysis(text);
    }
  }

  // Calculate risk level based on sentiment and keywords
  calculateRiskLevel(text, sentiment) {
    const lowerText = text.toLowerCase();
    
    // Check for crisis keywords
    const crisisKeywords = this.getCrisisKeywords();
    const hasCrisisKeyword = crisisKeywords.some(keyword => 
      lowerText.includes(keyword)
    );

    if (hasCrisisKeyword) {
      return 'high';
    }

    // Check sentiment scores
    if (sentiment.score < -0.6 && sentiment.magnitude > 0.8) {
      return 'high';
    } else if (sentiment.score < -0.3 && sentiment.magnitude > 0.5) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  // Determine mood from sentiment
  determineMood(sentiment) {
    const score = sentiment.score;
    const magnitude = sentiment.magnitude;

    if (score > 0.3) return 'happy';
    if (score < -0.3 && magnitude > 0.6) return 'sad';
    if (magnitude > 0.8) return 'anxious';
    if (score < -0.1 && magnitude < 0.4) return 'angry';
    return 'neutral';
  }

  // Fallback analysis if API fails
  fallbackSentimentAnalysis(text) {
    const lowerText = text.toLowerCase();
    
    const positiveWords = ['happy', 'good', 'great', 'better', 'fine'];
    const negativeWords = ['sad', 'bad', 'terrible', 'worse', 'awful'];
    
    let score = 0;
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 0.3;
    });
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 0.3;
    });

    return {
      score: Math.max(-1, Math.min(1, score)),
      magnitude: 0.5,
      confidence: 0.6
    };
  }

  calculateConfidence(sentiment) {
    return Math.min(0.9, sentiment.magnitude / 2);
  }
}

module.exports = new SentimentService();
