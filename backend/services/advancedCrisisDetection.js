const natural = require('natural');
const sentiment = require('sentiment');

class AdvancedCrisisDetectionService {
  constructor() {
    // Enhanced crisis keywords with Indian context
    this.criticalKeywords = [
      'kill myself', 'end it all', 'suicide', 'want to die', 'death wish',
      'can\'t go on', 'no point living', 'want to disappear', 'better off dead',
      'harm myself', 'cut myself', 'overdose', 'jump off', 'hang myself',
      'pills', 'razor', 'bridge', 'train', 'building', 'rope'
    ];
    
    this.highRiskPhrases = [
      'nobody cares', 'hopeless', 'worthless', 'burden', 'useless',
      'can\'t take it', 'everything is falling apart', 'give up',
      'no future', 'trapped', 'escape this pain', 'tired of living',
      'failed at everything', 'disappointment', 'mistake', 'waste of space'
    ];
    
    this.mediumRiskPhrases = [
      'depressed', 'anxiety', 'panic', 'overwhelmed', 'stressed',
      'can\'t cope', 'breaking down', 'falling apart', 'losing control',
      'scared', 'alone', 'empty', 'numb', 'exhausted'
    ];
    
    // Indian cultural context phrases
    this.culturalStressIndicators = [
      'parents don\'t understand', 'family pressure', 'arranged marriage',
      'career expectations', 'jee stress', 'neet pressure', 'board exams',
      'coaching classes', 'rank obsession', 'comparison with others',
      'society expectations', 'bringing shame', 'family honor'
    ];
    
    this.sentimentAnalyzer = new sentiment();
    this.tokenizer = new natural.WordTokenizer();
  }

  analyzeMessage(text, conversationHistory = []) {
    const analysis = {
      riskLevel: 'low',
      riskScore: 0,
      triggerWords: [],
      recommendations: [],
      interventionType: 'none',
      urgency: 'low',
      culturalContext: [],
      emotionalPattern: 'stable'
    };

    const lowerText = text.toLowerCase();
    const tokens = this.tokenizer.tokenize(lowerText);
    
    // Sentiment analysis
    const sentimentResult = this.sentimentAnalyzer.analyze(text);
    analysis.sentimentScore = sentimentResult.comparative;

    // Critical keyword detection
    const criticalMatches = this.findMatches(lowerText, this.criticalKeywords);
    if (criticalMatches.length > 0) {
      analysis.riskLevel = 'critical';
      analysis.riskScore += 20;
      analysis.triggerWords.push(...criticalMatches);
      analysis.interventionType = 'immediate';
      analysis.urgency = 'critical';
      analysis.recommendations.push('immediate_intervention', 'emergency_services', 'crisis_helpline');
    }

    // High-risk phrase detection
    const highRiskMatches = this.findMatches(lowerText, this.highRiskPhrases);
    if (highRiskMatches.length > 0) {
      analysis.riskScore += highRiskMatches.length * 5;
      analysis.triggerWords.push(...highRiskMatches);
      if (analysis.riskLevel !== 'critical') {
        analysis.interventionType = 'professional_support';
        analysis.urgency = 'high';
      }
    }

    // Medium-risk phrase detection
    const mediumRiskMatches = this.findMatches(lowerText, this.mediumRiskPhrases);
    if (mediumRiskMatches.length > 0) {
      analysis.riskScore += mediumRiskMatches.length * 2;
      analysis.triggerWords.push(...mediumRiskMatches);
    }

    // Cultural stress indicators
    const culturalMatches = this.findMatches(lowerText, this.culturalStressIndicators);
    if (culturalMatches.length > 0) {
      analysis.culturalContext = culturalMatches;
      analysis.riskScore += culturalMatches.length * 1.5;
      analysis.recommendations.push('cultural_support', 'family_counseling');
    }

    // Sentiment-based scoring
    if (sentimentResult.comparative < -0.8) {
      analysis.riskScore += 8;
    } else if (sentimentResult.comparative < -0.5) {
      analysis.riskScore += 4;
    }

    // Pattern analysis from conversation history
    if (conversationHistory.length > 0) {
      const patternAnalysis = this.analyzeConversationPattern(conversationHistory);
      analysis.emotionalPattern = patternAnalysis.pattern;
      analysis.riskScore += patternAnalysis.riskIncrease;
    }

    // Determine final risk level
    if (analysis.riskScore >= 20) {
      analysis.riskLevel = 'critical';
      analysis.interventionType = 'immediate';
      analysis.urgency = 'critical';
    } else if (analysis.riskScore >= 10) {
      analysis.riskLevel = 'high';
      analysis.interventionType = 'professional_support';
      analysis.urgency = 'high';
    } else if (analysis.riskScore >= 5) {
      analysis.riskLevel = 'medium';
      analysis.interventionType = 'monitoring_support';
      analysis.urgency = 'medium';
    }

    return analysis;
  }

  findMatches(text, keywords) {
    const matches = [];
    keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        matches.push(keyword);
      }
    });
    return matches;
  }

  analyzeConversationPattern(history) {
    // Analyze last 5 messages for escalating patterns
    const recentMessages = history.slice(-5);
    let patternRisk = 0;
    let pattern = 'stable';

    // Check for escalating negative sentiment
    const sentiments = recentMessages.map(msg => 
      this.sentimentAnalyzer.analyze(msg.text || msg).comparative
    );

    if (sentiments.length >= 3) {
      const trend = this.calculateTrend(sentiments);
      if (trend < -0.1) {
        pattern = 'deteriorating';
        patternRisk += 3;
      } else if (trend > 0.1) {
        pattern = 'improving';
        patternRisk -= 1;
      }
    }

    // Check for repeated crisis themes
    const allText = recentMessages.join(' ').toLowerCase();
    const crisisThemeCount = this.criticalKeywords.filter(keyword => 
      allText.includes(keyword)
    ).length;

    if (crisisThemeCount >= 2) {
      pattern = 'crisis_escalating';
      patternRisk += 5;
    }

    return { pattern, riskIncrease: Math.max(0, patternRisk) };
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = n * (n - 1) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumXX = n * (n - 1) * (2 * n - 1) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  // 🔥 UPDATED: Much more comprehensive crisis responses
  generateCrisisResponse(analysis) {
    const responses = {
      critical: {
        message: `I'm very concerned about what you've shared with me. Your life has immense value, and there are people who want to help you right now. You don't have to face this pain alone.

🆘 **IMMEDIATE HELP AVAILABLE - PLEASE REACH OUT NOW:**

📞 **24/7 Crisis Helplines:**
• AASRA: +91-22-2754-6669 (Mumbai, 24/7)
• Sneha India: +91-44-2464-0050 (Chennai, 24/7)
• iCall: +91-22-2556-3291 (Psychosocial helpline)
• Vandrevala Foundation: 1860-266-2345 (24/7)

🏥 **Right Now You Can:**
• Go to your nearest emergency room
• Call a trusted friend or family member immediately  
• Text "HELLO" to +91-9152987821 for support
• Stay with someone - don't be alone

💙 **Remember:** This intense pain you're feeling is temporary. You matter. Your life has meaning. There are people trained to help you through this moment.

Can you please contact one of these numbers right now? Or is there someone you trust who can stay with you?`,
        actions: ['emergency_services', 'crisis_helpline', 'immediate_support'],
        priority: 'P1 - Critical - Immediate Intervention Required'
      },
      
      high: {
        message: `I can hear how much pain you're carrying right now. These feelings are incredibly overwhelming, but you don't have to bear this burden alone. Help is available, and you deserve support.

🤝 **PROFESSIONAL SUPPORT AVAILABLE:**

📞 **Crisis Support Lines:**
• AASRA: +91-22-2754-6669 (24/7 emotional support)
• iCall: +91-22-2556-3291 (Professional counselors)
• Vandrevala Foundation: 1860-266-2345 (Free counseling)

💻 **Online Mental Health Services:**
• BetterLYF (online therapy sessions)
• ePsyClinic (immediate consultation)
• MindPeers (24/7 chat support)

🧘 **Immediate Coping Techniques:**
• **4-7-8 Breathing:** Breathe in for 4 counts, hold for 7, exhale for 8
• **Grounding Exercise:** Name 5 things you can see, 4 you can hear, 3 you can touch, 2 you can smell, 1 you can taste
• **Progressive Muscle Relaxation:** Tense and release each muscle group for 5 seconds

Would you like me to help you connect with professional support, or would you prefer to try some immediate coping techniques together? You've been incredibly brave in sharing this with me.`,
        actions: ['professional_help', 'coping_strategies', 'monitoring'],
        priority: 'P2 - High Priority Support Needed'
      },
      
      medium: {
        message: `I can sense you're going through some challenging feelings right now. It's completely understandable to feel this way, and I want you to know that reaching out here shows real strength and self-awareness.

💙 **SUPPORT OPTIONS AVAILABLE TO YOU:**

🌱 **Self-Care & Immediate Relief:**
• **Breathing Space:** Take 3 deep breaths with me - in through your nose, out through your mouth
• **Gentle Movement:** A 5-minute walk can help shift your energy
• **Hydration Check:** When did you last have water? Sometimes our body needs basic care first

📱 **Digital Support Tools:**
• Mood tracking through our journal feature
• Guided meditation apps (Calm, Headspace)
• Crisis support when needed: AASRA +91-22-2754-6669

👥 **Professional Support (When Ready):**
• Online counselors available through platforms like BetterLYF
• Local mental health professionals in your area
• Student counseling services if you're in college

🎯 **Right Now Focus:**
• Your feelings are completely valid - there's nothing wrong with feeling this way
• This difficult period is temporary, though I know it doesn't feel like it
• Taking this step to share shows you have the courage to seek better days

What would feel most helpful for you right now? Would you like to try a quick breathing exercise together, or would you prefer to talk about what's been weighing on your heart lately?`,
        actions: ['coping_strategies', 'self_care', 'monitoring'],
        priority: 'P3 - Supportive Monitoring & Care'
      }
    };

    const response = responses[analysis.riskLevel] || responses.medium;
    
    // Add cultural context if present
    if (analysis.culturalContext.length > 0) {
      response.culturalSupport = this.generateCulturalSupport(analysis.culturalContext);
    }

    return response;
  }

  // 🔥 UPDATED: Enhanced cultural support
  generateCulturalSupport(culturalContext) {
    const culturalSupport = {
      message: "",
      resources: []
    };

    if (culturalContext.some(ctx => ctx.includes('family') || ctx.includes('parents'))) {
      culturalSupport.message += `

🏠 **UNDERSTANDING INDIAN FAMILY DYNAMICS:**
I understand that family expectations and pressure can feel overwhelming in our culture. Your feelings are completely valid, even if your family doesn't understand mental health concepts yet. Many Indian families are still learning about emotional wellness, and that's not your fault.

**Remember:** You can love your family AND take care of your mental health. These aren't mutually exclusive. Sometimes families need time and education to understand, but your wellbeing matters right now.`;
      culturalSupport.resources.push("Family counselors who understand Indian culture", "Culturally-sensitive therapy options");
    }

    if (culturalContext.some(ctx => ctx.includes('jee') || ctx.includes('neet') || ctx.includes('exam'))) {
      culturalSupport.message += `

📚 **ACADEMIC PRESSURE IN INDIA:**
The competitive education system in India creates immense pressure that can feel crushing. Your worth as a human being is NOT defined by your JEE rank, NEET score, or board exam results. I know everyone says that, but it's true.

**Perspective:** Many successful people had average academic performance. Your mental health is more important than any rank or score. There are multiple paths to success, and taking care of yourself is the foundation for any meaningful achievement.`;
      culturalSupport.resources.push("Academic stress counselors", "Alternative career guidance", "Student support groups for competitive exams");
    }

    if (culturalContext.some(ctx => ctx.includes('society') || ctx.includes('shame') || ctx.includes('honor'))) {
      culturalSupport.message += `

🌏 **SOCIETAL EXPECTATIONS:**
The weight of societal expectations and family honor can feel suffocating. Remember that seeking help for mental health is actually a sign of strength and wisdom, not weakness or shame. You're taking responsibility for your wellbeing.

**Modern Perspective:** Mental health awareness is growing in India. You're part of a generation that's breaking stigmas and prioritizing emotional wellness. That takes courage.`;
      culturalSupport.resources.push("Support groups for cultural stress", "Counselors experienced with societal pressure");
    }

    return culturalSupport;
  }
}

module.exports = new AdvancedCrisisDetectionService();
