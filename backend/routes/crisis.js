const express = require('express');
const router = express.Router();
const CrisisAlert = require('../models/CrisisAlert');
const advancedCrisisDetection = require('../services/advancedCrisisDetection');

// Analyze message for crisis indicators
router.post('/analyze', async (req, res) => {
  try {
    const { text, sessionId, conversationHistory = [] } = req.body;
    
    if (!text || !sessionId) {
      return res.status(400).json({ 
        error: 'Text and sessionId are required' 
      });
    }

    console.log(`🔍 Crisis Analysis for session: ${sessionId}`);
    
    // Perform advanced crisis analysis
    const analysis = advancedCrisisDetection.analyzeMessage(text, conversationHistory);
    
    console.log(`🚨 Crisis Analysis Result:`, {
      riskLevel: analysis.riskLevel,
      riskScore: analysis.riskScore,
      triggerWords: analysis.triggerWords,
      urgency: analysis.urgency
    });

    // Save crisis alert if risk is medium or higher
    if (analysis.riskLevel !== 'low') {
      const crisisAlert = new CrisisAlert({
        sessionId,
        alertLevel: analysis.riskLevel,
        triggerText: text,
        triggerWords: analysis.triggerWords,
        riskScore: analysis.riskScore,
        sentimentScore: analysis.sentimentScore,
        messageCount: conversationHistory.length + 1,
        conversationHistory: conversationHistory.slice(-5).map(msg => 
          typeof msg === 'string' ? msg : msg.text || ''
        )
      });

      await crisisAlert.save();
      console.log(`💾 Crisis alert saved: ${crisisAlert._id}`);
    }

    // Generate appropriate response
    const response = advancedCrisisDetection.generateCrisisResponse(analysis);

    res.json({
      success: true,
      analysis: {
        riskLevel: analysis.riskLevel,
        riskScore: analysis.riskScore,
        urgency: analysis.urgency,
        interventionType: analysis.interventionType,
        triggerWords: analysis.triggerWords,
        culturalContext: analysis.culturalContext,
        emotionalPattern: analysis.emotionalPattern
      },
      response,
      alertCreated: analysis.riskLevel !== 'low'
    });

  } catch (error) {
    console.error('❌ Crisis analysis error:', error);
    res.status(500).json({ 
      error: 'Crisis analysis failed',
      fallbackResponse: {
        message: "I want to make sure you're safe. If you're having thoughts of hurting yourself, please reach out for help immediately:\n\n• AASRA: +91-22-2754-6669\n• Emergency Services: 102",
        priority: 'Safety First'
      }
    });
  }
});

// Get crisis alerts for session
router.get('/alerts/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const alerts = await CrisisAlert.find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      success: true,
      alerts,
      count: alerts.length
    });

  } catch (error) {
    console.error('Error fetching crisis alerts:', error);
    res.status(500).json({ error: 'Failed to fetch crisis alerts' });
  }
});

// Update crisis alert status
router.patch('/alert/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { actionTaken, resolved = true } = req.body;

    const alert = await CrisisAlert.findByIdAndUpdate(
      alertId,
      { 
        actionTaken, 
        resolved,
        responseTime: Date.now() - new Date(alert.timestamp).getTime()
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Crisis alert not found' });
    }

    console.log(`✅ Crisis alert resolved: ${alertId}`);

    res.json({
      success: true,
      alert
    });

  } catch (error) {
    console.error('Error updating crisis alert:', error);
    res.status(500).json({ error: 'Failed to update crisis alert' });
  }
});

// Get crisis statistics
router.get('/stats/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const stats = await CrisisAlert.aggregate([
      { $match: { sessionId } },
      {
        $group: {
          _id: '$alertLevel',
          count: { $sum: 1 },
          avgRiskScore: { $avg: '$riskScore' },
          resolved: { $sum: { $cond: ['$resolved', 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching crisis stats:', error);
    res.status(500).json({ error: 'Failed to fetch crisis statistics' });
  }
});

module.exports = router;
