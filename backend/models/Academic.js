const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  course: String,
  type: {
    type: String,
    enum: ['assignment', 'exam', 'project', 'quiz', 'reading', 'lab'],
  },
  deadline: Date,
  priority: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'overdue'],
    default: 'pending',
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  estimatedHours: Number,
  actualHours: Number,
  subTasks: [
    {
      title: String,
      completed: { type: Boolean, default: false },
      estimatedMinutes: Number,
    },
  ],
  cognitiveLoadScore: {
    type: Number,
    min: 1,
    max: 10,
  },
});

const studyMaterialSchema = new mongoose.Schema({
  originalContent: {
    title: String,
    type: { type: String, enum: ['video', 'article', 'textbook', 'paper'] },
    url: String,
    duration: Number, // in minutes
  },
  distilledContent: {
    summary: String,
    keyPoints: [String],
    flashcards: [
      {
        question: String,
        answer: String,
      },
    ],
    practiceQuestions: [
      {
        question: String,
        options: [String],
        correctAnswer: Number,
        explanation: String,
      },
    ],
  },
  format: {
    type: String,
    enum: ['visual', 'audio', 'text', 'interactive'],
    default: 'text',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const studySessionSchema = new mongoose.Schema({
  date: Date,
  topic: String,
  coordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  participants: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['confirmed', 'pending', 'declined'], default: 'pending' },
    },
  ],
  meetingType: {
    type: String,
    enum: ['virtual', 'in-person'],
    default: 'virtual',
  },
  meetingLink: String,
  notes: String,
});

const academicSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tasks: [taskSchema],
    studyMaterials: [studyMaterialSchema],
    studySessions: [studySessionSchema],
    ethicsFlags: [
      {
        content: String,
        type: { type: String, enum: ['plagiarism', 'citation-needed', 'over-reliance'] },
        suggestion: String,
        resolved: { type: Boolean, default: false },
        flaggedAt: { type: Date, default: Date.now },
      },
    ],
    stats: {
      averageCompletionRate: Number,
      onTimeSubmissions: Number,
      totalSubmissions: Number,
      studyHoursThisWeek: Number,
      preferredStudyTime: String,
    },
    focus: {
      distractedMinutes: { type: Number, default: 0 },
      focusedMinutes: { type: Number, default: 0 },
      consentToMonitor: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Academic', academicSchema);
