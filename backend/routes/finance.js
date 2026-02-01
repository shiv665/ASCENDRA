const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Finance = require('../models/Finance');

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

// @route   GET /api/finance
router.get('/', protect, async (req, res) => {
  try {
    let data = await Finance.findOne({ user: req.user._id });
    if (!data) {
      data = await Finance.create({ user: req.user._id });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/finance/scholarships
router.get('/scholarships', protect, async (req, res) => {
  try {
    const data = await Finance.findOne({ user: req.user._id });
    res.json({ success: true, scholarships: data?.scholarships || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/finance/scholarships
router.post('/scholarships', protect, async (req, res) => {
  try {
    const { scholarship } = req.body;
    console.log('Received scholarship:', scholarship);
    
    if (!scholarship) {
      return res.status(400).json({ message: 'Scholarship data is required' });
    }
    
    let data = await Finance.findOne({ user: req.user._id });
    if (!data) {
      data = await Finance.create({ user: req.user._id });
    }
    data.scholarships.push(scholarship);
    await data.save();
    console.log('Scholarship saved successfully');
    res.json({ success: true, scholarship: data.scholarships[data.scholarships.length - 1] });
  } catch (error) {
    console.error('Save scholarship error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/finance/scholarships/:index/status
router.put('/scholarships/:index/status', protect, async (req, res) => {
  try {
    const { status, amountReceived } = req.body;
    const data = await Finance.findOne({ user: req.user._id });
    if (data && data.scholarships[req.params.index]) {
      data.scholarships[req.params.index].status = status;
      
      if (status === 'applied') {
        data.scholarships[req.params.index].appliedAt = new Date();
      }
      
      if (status === 'awarded') {
        data.scholarships[req.params.index].awardedAt = new Date();
        const amount = amountReceived || data.scholarships[req.params.index].amount || 0;
        data.scholarships[req.params.index].amountReceived = amount;
        data.totalScholarshipReceived = (data.totalScholarshipReceived || 0) + amount;
      }
      
      await data.save();
      res.json({ success: true, scholarship: data.scholarships[req.params.index] });
    } else {
      res.status(404).json({ message: 'Scholarship not found' });
    }
  } catch (error) {
    console.error('Update scholarship status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/finance/scholarships/:index
router.delete('/scholarships/:index', protect, async (req, res) => {
  try {
    const data = await Finance.findOne({ user: req.user._id });
    if (data && data.scholarships[req.params.index]) {
      data.scholarships.splice(req.params.index, 1);
      await data.save();
      res.json({ success: true });
    } else {
      res.status(404).json({ message: 'Scholarship not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/finance/expenses
router.get('/expenses', protect, async (req, res) => {
  try {
    const data = await Finance.findOne({ user: req.user._id });
    res.json({ 
      success: true, 
      expenses: data?.expenses || [],
      totalExpenses: data?.totalExpenses || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/finance/expenses
router.post('/expenses', protect, async (req, res) => {
  try {
    const { expense } = req.body;
    let data = await Finance.findOne({ user: req.user._id });
    if (!data) {
      data = await Finance.create({ user: req.user._id });
    }
    
    const now = new Date();
    const newExpense = {
      ...expense,
      month: expense.month || now.getMonth() + 1,
      year: expense.year || now.getFullYear(),
      date: expense.date || now
    };
    
    data.expenses.push(newExpense);
    data.totalExpenses = (data.totalExpenses || 0) + (expense.amount || 0);
    await data.save();
    
    res.json({ success: true, expense: data.expenses[data.expenses.length - 1] });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/finance/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const data = await Finance.findOne({ user: req.user._id });
    
    // Calculate monthly expenses for current month
    const now = new Date();
    const currentMonthExpenses = data?.expenses?.filter(e => 
      e.month === now.getMonth() + 1 && e.year === now.getFullYear()
    ).reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    
    const summary = {
      totalScholarshipReceived: data?.totalScholarshipReceived || 0,
      totalExpenses: data?.totalExpenses || 0,
      currentMonthExpenses,
      scholarshipsAwarded: data?.scholarships?.filter(s => s.status === 'awarded').length || 0,
      scholarshipsApplied: data?.scholarships?.filter(s => s.status === 'applied').length || 0,
      scholarshipsTracked: data?.scholarships?.length || 0,
    };
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
