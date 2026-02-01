const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  level: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  status: {
    type: String,
    enum: ['strong', 'good', 'needs work', 'gap'],
    default: 'gap',
  },
  source: {
    type: String,
    enum: ['self-assessment', 'project', 'certification', 'course'],
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const opportunitySchema = new mongoose.Schema({
  title: String,
  company: String,
  type: {
    type: String,
    enum: ['internship', 'job', 'freelance', 'project'],
  },
  salary: String,
  deadline: Date,
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  requiredSkills: [String],
  status: {
    type: String,
    enum: ['new', 'applied', 'interviewing', 'offered', 'rejected', 'accepted'],
    default: 'new',
  },
  sourceUrl: String,
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  targetSkill: String,
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
  },
  estimatedHours: Number,
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: Date,
});

const careerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skills: [skillSchema],
    curriculumGaps: [
      {
        skill: String,
        industryDemand: Number,
        currentLevel: Number,
        priority: { type: String, enum: ['high', 'medium', 'low'] },
      },
    ],
    opportunities: [opportunitySchema],
    microProjects: [projectSchema],
    resume: {
      lastUpdated: Date,
      autoUpdatesEnabled: { type: Boolean, default: true },
      highlights: [String],
    },
    mockInterviews: [
      {
        date: Date,
        focusArea: String,
        score: Number,
        feedback: String,
        weakAreas: [String],
      },
    ],
    alumniConnections: [
      {
        name: String,
        role: String,
        company: String,
        batch: String,
        connected: { type: Boolean, default: false },
        mutualInterests: [String],
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Career', careerSchema);
