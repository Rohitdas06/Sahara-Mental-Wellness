const sentimentService = require('../services/sentimentService');

// ... inside your sendMessage route handler
const { text, sender } = req.body;
let sentimentData = null;
let riskLevel = 'low';
let mood = 'neutral';

if (sender === 'user') {
  sentimentData = sentimentService.analyzeSentiment(text);
  riskLevel = sentimentService.calculateRiskLevel(text, sentimentData);
  mood = sentimentService.determineMood(text, sentimentData);

  // You can log these for debugging
  console.log({ text, score: sentimentData.score, riskLevel, mood });
}

// create your message object and send as response, including riskLevel and mood if you want!
