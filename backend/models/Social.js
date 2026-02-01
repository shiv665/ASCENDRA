const mongoose = require('mongoose');

const clusterSchema = new mongoose.Schema({
  name: String,
  description: String,
  type: {
    type: String,
    enum: ['study', 'interest', 'support', 'project'],
  },
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['member', 'moderator', 'admin'], default: 'member' },
      joinedAt: { type: Date, default: Date.now },
    },
  ],
  toxicityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  isActive: { type: Boolean, default: true },
  tags: [String],
});

const skillSwapSchema = new mongoose.Schema({
  offerSkill: String,
  wantSkill: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['available', 'matched', 'in-progress', 'completed'],
    default: 'available',
  },
  matchedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

// NEW: Connection request schema for peer connections
const connectionRequestSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['skill-swap', 'study-buddy', 'project-partner', 'mentor', 'general'],
    default: 'general',
  },
  message: String,
  relatedSkillSwap: { type: mongoose.Schema.Types.ObjectId },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
  respondedAt: Date,
});

// NEW: Connection schema for accepted connections
const connectionSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  type: {
    type: String,
    enum: ['skill-swap', 'study-buddy', 'project-partner', 'mentor', 'general'],
    default: 'general',
  },
  createdAt: { type: Date, default: Date.now },
  lastInteraction: { type: Date, default: Date.now },
  chatEnabled: { type: Boolean, default: true },
});

const goalRoomSchema = new mongoose.Schema({
  name: String,
  goal: String,
  deadline: Date,
  participants: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      progress: { type: Number, min: 0, max: 100, default: 0 },
      lastUpdate: Date,
    },
  ],
  type: {
    type: String,
    enum: ['certification', 'project', 'fitness', 'learning'],
  },
  isPrivate: { type: Boolean, default: false },
});

const localResourceSchema = new mongoose.Schema({
  name: String,
  type: {
    type: String,
    enum: ['food-bank', 'housing', 'legal-aid', 'healthcare', 'transport', 'community-center'],
  },
  address: String,
  distance: String,
  rating: Number,
  phone: String,
  website: String,
  verifiedBy: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
  },
});

const socialSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clusters: [clusterSchema],
    skillSwaps: [skillSwapSchema],
    goalRooms: [goalRoomSchema],
    localResources: [localResourceSchema],
    // NEW: Connections with other users
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    connectionRequests: [connectionRequestSchema],
    lonelinessSentinel: {
      lastSocialInteraction: Date,
      socialHealthScore: { type: Number, min: 0, max: 100 },
      alertsEnabled: { type: Boolean, default: true },
    },
    preferences: {
      visibilityLevel: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'friends',
      },
      matchNotifications: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

socialSchema.index({ 'localResources.location': '2dsphere' });

// Export Connection model separately for global queries
const Connection = mongoose.model('Connection', connectionSchema);

const Social = mongoose.model('Social', socialSchema);

module.exports = { Social, Connection };
