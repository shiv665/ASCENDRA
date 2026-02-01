const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['student', 'counselor', 'admin'],
      default: 'student',
    },
    profile: {
      college: String,
      course: String,
      year: Number,
      skills: [String],
      interests: [String],
      location: String,
      isFirstGen: { type: Boolean, default: false },
      isMigrant: { type: Boolean, default: false },
    },
    preferences: {
      learningStyle: {
        type: String,
        enum: ['visual', 'auditory', 'reading', 'kinesthetic'],
        default: 'visual',
      },
      notificationsEnabled: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: true },
      reasoningTraceVisible: { type: Boolean, default: true },
    },
    wellness: {
      currentMoodScore: { type: Number, min: 1, max: 10, default: 5 },
      stressLevel: {
        type: String,
        enum: ['low', 'moderate', 'high', 'critical'],
        default: 'moderate',
      },
      lastCheckIn: Date,
    },
    finance: {
      educationLoan: { type: Number, default: 0 },
      loanPaid: { type: Number, default: 0 },
      monthlyIncome: { type: Number, default: 0 },
      monthlyExpenses: { type: Number, default: 0 },
    },
    academic: {
      gpa: { type: Number, min: 0, max: 10 },
      activeCourses: [String],
      completedCredits: { type: Number, default: 0 },
    },
    agentMemory: {
      lastInteraction: Date,
      conversationContext: mongoose.Schema.Types.Mixed,
      longTermGoals: [String],
      behaviorPatterns: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
