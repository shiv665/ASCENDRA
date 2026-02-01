const mongoose = require('mongoose');

const moodEntrySchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  label: {
    type: String,
    enum: ['terrible', 'bad', 'poor', 'okay', 'fine', 'good', 'great', 'excellent', 'amazing', 'perfect'],
  },
  notes: String,
  triggers: [String],
  activities: [String],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const interventionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['breathing', 'meditation', 'journaling', 'exercise', 'social', 'sleep', 'crisis'],
    required: true,
  },
  title: String,
  description: String,
  duration: Number, // in minutes
  completed: {
    type: Boolean,
    default: false,
  },
  effectiveness: {
    type: Number,
    min: 1,
    max: 5,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const mentalHealthSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    moodHistory: [moodEntrySchema],
    interventions: [interventionSchema],
    journalEntries: [
      {
        content: String,
        aiReflection: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    alerts: [
      {
        type: { type: String, enum: ['warning', 'info', 'critical'] },
        message: String,
        acknowledged: { type: Boolean, default: false },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    sentimentTrend: {
      current: String,
      previous: String,
      direction: { type: String, enum: ['improving', 'stable', 'declining'] },
    },
    consentGiven: {
      digitalDetox: { type: Boolean, default: false },
      wearableIntegration: { type: Boolean, default: false },
      crisisHotRouting: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MentalHealth', mentalHealthSchema);
