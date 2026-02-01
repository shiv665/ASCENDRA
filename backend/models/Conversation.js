const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  reasoning: String,
  actions: [String],
  metadata: {
    category: {
      type: String,
      enum: ['mental', 'career', 'finance', 'social', 'academic', 'general'],
    },
    sentiment: String,
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
    },
    messages: [messageSchema],
    summary: String,
    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Conversation', conversationSchema);
