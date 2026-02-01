const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MentalHealth = require('../models/MentalHealth');

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
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized' });
  }
};

// @route   GET /api/mental-health
// @desc    Get user's mental health data
router.get('/', protect, async (req, res) => {
  try {
    let data = await MentalHealth.findOne({ user: req.user._id });
    if (!data) {
      data = await MentalHealth.create({ user: req.user._id });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/mental-health/moods
// @desc    Get user's mood history
router.get('/moods', protect, async (req, res) => {
  try {
    let data = await MentalHealth.findOne({ user: req.user._id });
    if (!data) {
      data = await MentalHealth.create({ user: req.user._id });
    }
    res.json({ 
      success: true, 
      moods: data.moodHistory || [],
      trend: data.sentimentTrend 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/mental-health/mood
// @desc    Log a mood entry
router.post('/mood', protect, async (req, res) => {
  try {
    const { score, label, notes, triggers, activities } = req.body;
    
    let data = await MentalHealth.findOne({ user: req.user._id });
    if (!data) {
      data = await MentalHealth.create({ user: req.user._id });
    }

    data.moodHistory.push({ score, label, notes, triggers, activities });
    
    // Update sentiment trend
    const recentMoods = data.moodHistory.slice(-7);
    const avgScore = recentMoods.reduce((sum, m) => sum + m.score, 0) / recentMoods.length;
    const prevAvg = data.moodHistory.slice(-14, -7).reduce((sum, m) => sum + m.score, 0) / 7 || avgScore;
    
    data.sentimentTrend = {
      current: avgScore >= 7 ? 'positive' : avgScore >= 4 ? 'neutral' : 'negative',
      previous: prevAvg >= 7 ? 'positive' : prevAvg >= 4 ? 'neutral' : 'negative',
      direction: avgScore > prevAvg ? 'improving' : avgScore < prevAvg ? 'declining' : 'stable',
    };

    await data.save();

    // Update user wellness
    await User.findByIdAndUpdate(req.user._id, {
      'wellness.currentMoodScore': score,
      'wellness.lastCheckIn': new Date(),
    });

    res.json({ success: true, moodEntry: data.moodHistory[data.moodHistory.length - 1] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/mental-health/intervention
// @desc    Log an intervention
router.post('/intervention', protect, async (req, res) => {
  try {
    const { type, title, description, duration, completed, effectiveness } = req.body;
    
    let data = await MentalHealth.findOne({ user: req.user._id });
    if (!data) {
      data = await MentalHealth.create({ user: req.user._id });
    }

    data.interventions.push({ type, title, description, duration, completed, effectiveness });
    await data.save();

    res.json({ success: true, intervention: data.interventions[data.interventions.length - 1] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/mental-health/journal
// @desc    Add a journal entry
router.post('/journal', protect, async (req, res) => {
  try {
    const { content } = req.body;
    
    let data = await MentalHealth.findOne({ user: req.user._id });
    if (!data) {
      data = await MentalHealth.create({ user: req.user._id });
    }

    // AI reflection would come from the AI service
    data.journalEntries.push({ content, aiReflection: '' });
    await data.save();

    res.json({ success: true, entry: data.journalEntries[data.journalEntries.length - 1] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/mental-health/insights
// @desc    Get wellness insights
router.get('/insights', protect, async (req, res) => {
  try {
    const data = await MentalHealth.findOne({ user: req.user._id });
    if (!data) {
      return res.json({ success: true, insights: { avgMood: 5, trend: 'stable', interventionsCompleted: 0 } });
    }

    const last7Days = data.moodHistory.slice(-7);
    const avgMood = last7Days.length ? last7Days.reduce((s, m) => s + m.score, 0) / last7Days.length : 5;
    const completedInterventions = data.interventions.filter(i => i.completed).length;

    res.json({
      success: true,
      insights: {
        avgMood: Math.round(avgMood * 10) / 10,
        trend: data.sentimentTrend?.direction || 'stable',
        interventionsCompleted: completedInterventions,
        journalEntries: data.journalEntries.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
