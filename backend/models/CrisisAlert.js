const mongoose = require('mongoose');

const crisisAlertSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  userId: { type: String, default: 'anonymous' },
  alertLevel: { 
    type: String, 
    enum: ['medium', 'high', 'critical'], 
    required: true 
  },
  triggerText: { type: String, required: true },
  triggerWords: [String],
  riskScore: { type: Number, default: 0 },
  sentimentScore: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
  
  // Response tracking
  responseTime: { type: Number }, // milliseconds
  actionTaken: {
    type: String,
    enum: ['notification_sent', 'resources_provided', 'emergency_contacted', 'resolved'],
    default: 'notification_sent'
  },
  resolved: { type: Boolean, default: false },
  
  // Context data
  messageCount: { type: Number, default: 0 },
  conversationHistory: [String],
  
  // Emergency contacts
  emergencyContactsNotified: [String],
  helplinesSuggested: [String],
}, {
  timestamps: true
});

// Index for faster queries
crisisAlertSchema.index({ sessionId: 1, timestamp: -1 });
crisisAlertSchema.index({ alertLevel: 1, resolved: 1 });

module.exports = mongoose.model('CrisisAlert', crisisAlertSchema);
