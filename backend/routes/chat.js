const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const axios = require('axios');

const router = express.Router();

// Auth middleware
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized' });
  }
};

// @route   GET /api/chat/conversations
// @desc    Get all conversations for user
// @access  Private
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .select('title tags isActive createdAt updatedAt');

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/conversations/:id
// @desc    Get a single conversation
// @access  Private
router.get('/conversations/:id', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/conversations
// @desc    Create a new conversation
// @access  Private
router.post('/conversations', protect, async (req, res) => {
  try {
    const { title } = req.body;

    const conversation = await Conversation.create({
      user: req.user._id,
      title: title || 'New Conversation',
      messages: [],
    });

    res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/message
// @desc    Send a message and get AI response
// @access  Private
router.post('/message', protect, async (req, res) => {
  try {
    const { conversationId, message } = req.body;

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        user: req.user._id,
      });
    }

    if (!conversation) {
      // Create a new conversation
      conversation = await Conversation.create({
        user: req.user._id,
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        messages: [],
      });
    }

    // Add user message
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    conversation.messages.push(userMessage);

    // Call AI service
    let aiResponse;
    try {
      const response = await axios.post(
        `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/api/chat`,
        {
          message,
          userId: req.user._id.toString(),
          conversationHistory: conversation.messages.slice(-10), // Last 10 messages for context
          userProfile: {
            name: req.user.name,
            profile: req.user.profile,
            wellness: req.user.wellness,
          },
        },
        { timeout: 30000 }
      );

      aiResponse = response.data;
    } catch (aiError) {
      console.error('AI service error:', aiError.message);
      // Fallback response
      aiResponse = {
        content: "I'm here to help you with your academic journey, mental wellness, career planning, finances, and social connections. What would you like to discuss?",
        reasoning: 'Fallback response - AI service unavailable',
        actions: [],
        category: 'general',
      };
    }

    // Add AI response
    const assistantMessage = {
      role: 'assistant',
      content: aiResponse.content,
      reasoning: aiResponse.reasoning,
      actions: aiResponse.actions,
      metadata: {
        category: aiResponse.category,
        sentiment: aiResponse.sentiment,
        urgency: aiResponse.urgency,
      },
      timestamp: new Date(),
    };
    conversation.messages.push(assistantMessage);

    await conversation.save();

    // Update user's agent memory
    await User.findByIdAndUpdate(req.user._id, {
      'agentMemory.lastInteraction': new Date(),
    });

    res.json({
      success: true,
      message: assistantMessage,
      conversationId: conversation._id,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/chat/conversations/:id
// @desc    Delete a conversation
// @access  Private
router.delete('/conversations/:id', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
