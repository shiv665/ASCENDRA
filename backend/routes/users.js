const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        profile: user.profile,
        preferences: user.preferences,
        wellness: user.wellness,
        finance: user.finance,
        academic: user.academic,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, avatar, profile, preferences } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;
    if (profile) updateData.profile = { ...req.user.profile, ...profile };
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        profile: user.profile,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/wellness
// @desc    Update wellness data
// @access  Private
router.put('/wellness', protect, async (req, res) => {
  try {
    const { currentMoodScore, stressLevel } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        wellness: {
          ...req.user.wellness,
          currentMoodScore,
          stressLevel,
          lastCheckIn: new Date(),
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      wellness: user.wellness,
    });
  } catch (error) {
    console.error('Update wellness error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/finance
// @desc    Update finance data
// @access  Private
router.put('/finance', protect, async (req, res) => {
  try {
    const { educationLoan, loanPaid, monthlyIncome, monthlyExpenses } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        finance: {
          ...req.user.finance,
          educationLoan,
          loanPaid,
          monthlyIncome,
          monthlyExpenses,
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      finance: user.finance,
    });
  } catch (error) {
    console.error('Update finance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/dashboard
// @desc    Get dashboard summary
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Calculate dashboard metrics
    const dashboardData = {
      wellness: {
        score: user.wellness?.currentMoodScore || 5,
        stressLevel: user.wellness?.stressLevel || 'moderate',
        lastCheckIn: user.wellness?.lastCheckIn,
      },
      finance: {
        debtProgress: user.finance?.educationLoan
          ? Math.round((user.finance.loanPaid / user.finance.educationLoan) * 100)
          : 0,
        savingsRate: user.finance?.monthlyIncome
          ? Math.round(
              ((user.finance.monthlyIncome - user.finance.monthlyExpenses) /
                user.finance.monthlyIncome) *
                100
            )
          : 0,
      },
      academic: {
        gpa: user.academic?.gpa || 0,
        completedCredits: user.academic?.completedCredits || 0,
      },
      goals: user.agentMemory?.longTermGoals || [],
    };

    res.json({
      success: true,
      dashboard: dashboardData,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
