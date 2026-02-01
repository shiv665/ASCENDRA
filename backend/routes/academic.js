const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Academic = require('../models/Academic');

const router = express.Router();

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized' });
  }
};

// @route   GET /api/academic
router.get('/', protect, async (req, res) => {
  try {
    let data = await Academic.findOne({ user: req.user._id });
    if (!data) {
      data = await Academic.create({ user: req.user._id });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/academic/tasks
router.get('/tasks', protect, async (req, res) => {
  try {
    const data = await Academic.findOne({ user: req.user._id });
    const tasks = data?.tasks || [];
    // Sort by deadline and priority
    tasks.sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/academic/tasks
router.post('/tasks', protect, async (req, res) => {
  try {
    // Support both { task } wrapper and direct form data
    const taskData = req.body.task || req.body;
    let data = await Academic.findOne({ user: req.user._id });
    if (!data) {
      data = await Academic.create({ user: req.user._id });
    }
    data.tasks.push(taskData);
    await data.save();
    res.json({ success: true, task: data.tasks[data.tasks.length - 1] });
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/academic/tasks/:id - Update task by MongoDB _id
router.patch('/tasks/:id', protect, async (req, res) => {
  try {
    const { status, progress, title, priority, dueDate } = req.body;
    const data = await Academic.findOne({ user: req.user._id });
    if (!data) {
      return res.status(404).json({ message: 'Academic data not found' });
    }
    
    const taskIndex = data.tasks.findIndex(t => t._id.toString() === req.params.id);
    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (status) data.tasks[taskIndex].status = status;
    if (progress !== undefined) data.tasks[taskIndex].progress = progress;
    if (title) data.tasks[taskIndex].title = title;
    if (priority) data.tasks[taskIndex].priority = priority;
    if (dueDate) data.tasks[taskIndex].deadline = dueDate;
    
    await data.save();
    res.json({ success: true, task: data.tasks[taskIndex] });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/academic/tasks/:id - Delete task by MongoDB _id
router.delete('/tasks/:id', protect, async (req, res) => {
  try {
    const data = await Academic.findOne({ user: req.user._id });
    if (!data) {
      return res.status(404).json({ message: 'Academic data not found' });
    }
    
    data.tasks = data.tasks.filter(t => t._id.toString() !== req.params.id);
    await data.save();
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/academic/flashcards
router.get('/flashcards', protect, async (req, res) => {
  try {
    const data = await Academic.findOne({ user: req.user._id });
    // Collect flashcards from study materials
    const flashcards = [];
    if (data?.studyMaterials) {
      data.studyMaterials.forEach((material, matIndex) => {
        if (material.distilledContent?.flashcards) {
          material.distilledContent.flashcards.forEach((fc, fcIndex) => {
            flashcards.push({
              _id: `${matIndex}-${fcIndex}`,
              question: fc.question,
              answer: fc.answer,
              subject: material.originalContent?.title || 'General'
            });
          });
        }
      });
    }
    // Also check for standalone flashcards array if exists
    if (data?.flashcards) {
      flashcards.push(...data.flashcards);
    }
    res.json({ success: true, flashcards });
  } catch (error) {
    console.error('Get flashcards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/academic/flashcards
router.post('/flashcards', protect, async (req, res) => {
  try {
    const flashcardData = req.body.flashcard || req.body;
    let data = await Academic.findOne({ user: req.user._id });
    if (!data) {
      data = await Academic.create({ user: req.user._id });
    }
    
    // Create a study material with this flashcard
    const material = {
      originalContent: {
        title: flashcardData.subject || 'Custom Flashcard',
        type: 'textbook'
      },
      distilledContent: {
        flashcards: [{
          question: flashcardData.question,
          answer: flashcardData.answer
        }]
      }
    };
    
    data.studyMaterials.push(material);
    await data.save();
    
    res.json({ 
      success: true, 
      flashcard: {
        question: flashcardData.question,
        answer: flashcardData.answer,
        subject: flashcardData.subject
      }
    });
  } catch (error) {
    console.error('Add flashcard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/academic/flashcards/generate - AI-generated flashcards
router.post('/flashcards/generate', protect, async (req, res) => {
  try {
    const { topic, count = 5 } = req.body;
    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }
    
    // Return the topic for AI service to process
    res.json({ 
      success: true, 
      topic,
      count,
      message: 'Use AI service to generate flashcards'
    });
  } catch (error) {
    console.error('Generate flashcards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/academic/tasks/:index
router.put('/tasks/:index', protect, async (req, res) => {
  try {
    const { status, progress } = req.body;
    const data = await Academic.findOne({ user: req.user._id });
    if (data && data.tasks[req.params.index]) {
      if (status) data.tasks[req.params.index].status = status;
      if (progress !== undefined) data.tasks[req.params.index].progress = progress;
      await data.save();
    }
    res.json({ success: true, task: data?.tasks[req.params.index] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/academic/tasks/:index/subtasks
router.post('/tasks/:index/subtasks', protect, async (req, res) => {
  try {
    const { subTask } = req.body;
    const data = await Academic.findOne({ user: req.user._id });
    if (data && data.tasks[req.params.index]) {
      data.tasks[req.params.index].subTasks.push(subTask);
      await data.save();
    }
    res.json({ success: true, task: data?.tasks[req.params.index] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/academic/study-materials
router.post('/study-materials', protect, async (req, res) => {
  try {
    const { material } = req.body;
    let data = await Academic.findOne({ user: req.user._id });
    if (!data) {
      data = await Academic.create({ user: req.user._id });
    }
    data.studyMaterials.push(material);
    await data.save();
    res.json({ success: true, material: data.studyMaterials[data.studyMaterials.length - 1] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/academic/study-sessions
router.get('/study-sessions', protect, async (req, res) => {
  try {
    const data = await Academic.findOne({ user: req.user._id });
    res.json({ success: true, sessions: data?.studySessions || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/academic/study-sessions
router.post('/study-sessions', protect, async (req, res) => {
  try {
    const { session } = req.body;
    let data = await Academic.findOne({ user: req.user._id });
    if (!data) {
      data = await Academic.create({ user: req.user._id });
    }
    session.coordinator = req.user._id;
    data.studySessions.push(session);
    await data.save();
    res.json({ success: true, session: data.studySessions[data.studySessions.length - 1] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/academic/ethics-check
router.post('/ethics-check', protect, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    
    // Call AI service for ethics check
    const axios = require('axios');
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    const response = await axios.post(`${AI_SERVICE_URL}/api/ethics-check`, {
      text: content
    }, { timeout: 30000 });
    
    res.json({ success: true, review: response.data.review });
  } catch (error) {
    console.error('Ethics check error:', error.message);
    // Return fallback response if AI service is unavailable
    res.json({ 
      success: true, 
      review: {
        concerns: [],
        suggestions: ['AI service unavailable. Please review your content manually.'],
        overallAssessment: 'Unable to perform automated check. Consider reviewing for originality and proper citations.'
      }
    });
  }
});

// @route   GET /api/academic/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const data = await Academic.findOne({ user: req.user._id });
    res.json({ success: true, stats: data?.stats || {} });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
