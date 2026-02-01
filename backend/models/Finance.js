const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
  name: String,
  provider: String,
  amount: Number,
  amountReceived: { type: Number, default: 0 },
  deadline: Date,
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  eligibilityCriteria: [String],
  status: {
    type: String,
    enum: ['eligible', 'applied', 'reviewing', 'awarded', 'rejected', 'expired'],
    default: 'eligible',
  },
  applicationUrl: String,
  essayDraft: String,
  appliedAt: Date,
  awardedAt: Date,
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const expenseSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  category: {
    type: String,
    enum: ['tuition', 'books', 'housing', 'food', 'transport', 'utilities', 'entertainment', 'other'],
    default: 'other',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  month: Number,
  year: Number,
});

const gigSchema = new mongoose.Schema({
  title: String,
  type: {
    type: String,
    enum: ['tutoring', 'freelance', 'data-entry', 'content', 'development', 'other'],
  },
  rate: String,
  estimatedEarnings: Number,
  platform: String,
  requests: Number,
  status: {
    type: String,
    enum: ['available', 'applied', 'ongoing', 'completed'],
    default: 'available',
  },
});

const subscriptionSchema = new mongoose.Schema({
  name: String,
  amount: Number,
  frequency: {
    type: String,
    enum: ['monthly', 'yearly', 'weekly'],
    default: 'monthly',
  },
  lastUsed: Date,
  daysUnused: Number,
  cancelled: {
    type: Boolean,
    default: false,
  },
});

const financeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scholarships: [scholarshipSchema],
    expenses: [expenseSchema],
    totalScholarshipReceived: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    debtInfo: {
      totalLoan: { type: Number, default: 0 },
      paidAmount: { type: Number, default: 0 },
      interestRate: Number,
      projectedClearDate: Date,
      monthlyEMI: Number,
    },
    budget: {
      monthlyIncome: { type: Number, default: 0 },
      monthlyExpenses: { type: Number, default: 0 },
      savingsRate: Number,
      categories: [
        {
          name: String,
          budgeted: Number,
          spent: Number,
        },
      ],
    },
    earnings: {
      totalScholarships: { type: Number, default: 0 },
      totalGigEarnings: { type: Number, default: 0 },
      savingsFromAudit: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Finance', financeSchema);
