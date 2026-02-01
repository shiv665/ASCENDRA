const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Career = require('../models/Career');

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

// @route   GET /api/career
router.get('/', protect, async (req, res) => {
  try {
    let data = await Career.findOne({ user: req.user._id });
    if (!data) {
      data = await Career.create({ user: req.user._id });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/career/skills
router.post('/skills', protect, async (req, res) => {
  try {
    const { skills } = req.body;
    let data = await Career.findOne({ user: req.user._id });
    if (!data) {
      data = await Career.create({ user: req.user._id });
    }
    
    skills.forEach(skill => {
      const existing = data.skills.find(s => s.name.toLowerCase() === skill.name.toLowerCase());
      if (existing) {
        existing.level = skill.level;
        existing.status = skill.level >= 80 ? 'strong' : skill.level >= 60 ? 'good' : skill.level >= 40 ? 'needs work' : 'gap';
        existing.lastUpdated = new Date();
      } else {
        data.skills.push({
          ...skill,
          status: skill.level >= 80 ? 'strong' : skill.level >= 60 ? 'good' : skill.level >= 40 ? 'needs work' : 'gap',
        });
      }
    });

    await data.save();
    res.json({ success: true, skills: data.skills });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/career/opportunities
router.get('/opportunities', protect, async (req, res) => {
  try {
    const data = await Career.findOne({ user: req.user._id });
    res.json({ success: true, opportunities: data?.opportunities || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/career/opportunities
router.post('/opportunities', protect, async (req, res) => {
  try {
    const { opportunity } = req.body;
    let data = await Career.findOne({ user: req.user._id });
    if (!data) {
      data = await Career.create({ user: req.user._id });
    }
    data.opportunities.push(opportunity);
    await data.save();
    res.json({ success: true, opportunity: data.opportunities[data.opportunities.length - 1] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/career/projects
router.post('/projects', protect, async (req, res) => {
  try {
    const { project } = req.body;
    let data = await Career.findOne({ user: req.user._id });
    if (!data) {
      data = await Career.create({ user: req.user._id });
    }
    data.microProjects.push(project);
    await data.save();
    res.json({ success: true, project: data.microProjects[data.microProjects.length - 1] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/career/projects/:index
router.put('/projects/:index', protect, async (req, res) => {
  try {
    const { progress, completed } = req.body;
    const data = await Career.findOne({ user: req.user._id });
    if (data && data.microProjects[req.params.index]) {
      data.microProjects[req.params.index].progress = progress;
      if (completed) {
        data.microProjects[req.params.index].completed = true;
        data.microProjects[req.params.index].completedAt = new Date();
      }
      await data.save();
    }
    res.json({ success: true, project: data.microProjects[req.params.index] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/career/gap-analysis
router.get('/gap-analysis', protect, async (req, res) => {
  try {
    const data = await Career.findOne({ user: req.user._id });
    res.json({ success: true, gaps: data?.curriculumGaps || [], skills: data?.skills || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/career/skills
router.get('/skills', protect, async (req, res) => {
  try {
    const data = await Career.findOne({ user: req.user._id });
    res.json({ success: true, skills: data?.skills || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/career/goals
router.get('/goals', protect, async (req, res) => {
  try {
    const data = await Career.findOne({ user: req.user._id });
    res.json({ success: true, goals: data?.careerGoals || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/career/goals
router.post('/goals', protect, async (req, res) => {
  try {
    const goalData = req.body.goal || req.body;
    let data = await Career.findOne({ user: req.user._id });
    if (!data) {
      data = await Career.create({ user: req.user._id });
    }
    
    if (!data.careerGoals) {
      data.careerGoals = [];
    }
    
    data.careerGoals.push({
      title: goalData.title,
      description: goalData.description,
      targetDate: goalData.targetDate || goalData.deadline,
      status: goalData.status || 'in-progress'
    });
    
    await data.save();
    res.json({ success: true, goal: data.careerGoals[data.careerGoals.length - 1] });
  } catch (error) {
    console.error('Add goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
