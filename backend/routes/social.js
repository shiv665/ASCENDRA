const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Social, Connection } = require('../models/Social');

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

// @route   GET /api/social
router.get('/', protect, async (req, res) => {
  try {
    let data = await Social.findOne({ user: req.user._id });
    if (!data) {
      data = await Social.create({ user: req.user._id });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/social/clusters
router.get('/clusters', protect, async (req, res) => {
  try {
    const data = await Social.findOne({ user: req.user._id });
    res.json({ success: true, clusters: data?.clusters || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/social/clusters
router.post('/clusters', protect, async (req, res) => {
  try {
    const { cluster } = req.body;
    let data = await Social.findOne({ user: req.user._id });
    if (!data) {
      data = await Social.create({ user: req.user._id });
    }
    cluster.members = [{ user: req.user._id, role: 'admin' }];
    data.clusters.push(cluster);
    await data.save();
    res.json({ success: true, cluster: data.clusters[data.clusters.length - 1] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/social/skill-swaps
router.get('/skill-swaps', protect, async (req, res) => {
  try {
    const data = await Social.findOne({ user: req.user._id });
    res.json({ success: true, skillSwaps: data?.skillSwaps || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/social/skill-swaps
router.post('/skill-swaps', protect, async (req, res) => {
  try {
    const { offerSkill, wantSkill } = req.body;
    let data = await Social.findOne({ user: req.user._id });
    if (!data) {
      data = await Social.create({ user: req.user._id });
    }
    data.skillSwaps.push({ offerSkill, wantSkill, user: req.user._id });
    await data.save();
    res.json({ success: true, skillSwap: data.skillSwaps[data.skillSwaps.length - 1] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// NEW: REAL PEER MATCHING ENDPOINTS
// ============================================

// @route   GET /api/social/find-matches
// @desc    Find real users with complementary skills
router.get('/find-matches', protect, async (req, res) => {
  try {
    const currentUser = req.user;
    const currentUserSocial = await Social.findOne({ user: currentUser._id });
    
    // Get current user's skill swaps (what they offer and want)
    const userOfferSkills = currentUserSocial?.skillSwaps?.map(s => s.offerSkill?.toLowerCase()) || [];
    const userWantSkills = currentUserSocial?.skillSwaps?.map(s => s.wantSkill?.toLowerCase()) || [];
    const userInterests = currentUser.profile?.interests?.map(i => i.toLowerCase()) || [];
    const userSkills = currentUser.profile?.skills?.map(s => s.toLowerCase()) || [];
    
    // Find all other users
    const allUsers = await User.find({ _id: { $ne: currentUser._id } }).select('-password');
    const allSocialData = await Social.find({ user: { $ne: currentUser._id } });
    
    const matches = [];
    
    for (const otherUser of allUsers) {
      const otherSocial = allSocialData.find(s => s.user.toString() === otherUser._id.toString());
      const otherOfferSkills = otherSocial?.skillSwaps?.map(s => s.offerSkill?.toLowerCase()) || [];
      const otherWantSkills = otherSocial?.skillSwaps?.map(s => s.wantSkill?.toLowerCase()) || [];
      const otherInterests = otherUser.profile?.interests?.map(i => i.toLowerCase()) || [];
      const otherSkills = otherUser.profile?.skills?.map(s => s.toLowerCase()) || [];
      
      let matchScore = 0;
      let matchReasons = [];
      let matchType = 'general';
      
      // Check skill swap compatibility (what they offer matches what you want, and vice versa)
      const theyOfferWhatIWant = userWantSkills.filter(skill => 
        otherOfferSkills.some(os => os.includes(skill) || skill.includes(os))
      );
      const iOfferWhatTheyWant = userOfferSkills.filter(skill => 
        otherWantSkills.some(ow => ow.includes(skill) || skill.includes(ow))
      );
      
      if (theyOfferWhatIWant.length > 0 && iOfferWhatTheyWant.length > 0) {
        matchScore += 40;
        matchReasons.push(`Perfect skill swap: They teach ${theyOfferWhatIWant.join(', ')}, you teach ${iOfferWhatTheyWant.join(', ')}`);
        matchType = 'skill-swap';
      } else if (theyOfferWhatIWant.length > 0) {
        matchScore += 25;
        matchReasons.push(`They can teach you: ${theyOfferWhatIWant.join(', ')}`);
        matchType = 'mentor';
      } else if (iOfferWhatTheyWant.length > 0) {
        matchScore += 25;
        matchReasons.push(`You can teach them: ${iOfferWhatTheyWant.join(', ')}`);
        matchType = 'mentor';
      }
      
      // Check shared interests
      const sharedInterests = userInterests.filter(i => otherInterests.includes(i));
      if (sharedInterests.length > 0) {
        matchScore += sharedInterests.length * 10;
        matchReasons.push(`Shared interests: ${sharedInterests.join(', ')}`);
        if (matchType === 'general') matchType = 'study-buddy';
      }
      
      // Check complementary skills
      const complementarySkills = otherSkills.filter(s => userWantSkills.some(w => s.includes(w) || w.includes(s)));
      if (complementarySkills.length > 0) {
        matchScore += complementarySkills.length * 8;
        matchReasons.push(`Has skills you want: ${complementarySkills.join(', ')}`);
      }
      
      // Same college bonus
      if (currentUser.profile?.college && otherUser.profile?.college && 
          currentUser.profile.college.toLowerCase() === otherUser.profile.college.toLowerCase()) {
        matchScore += 15;
        matchReasons.push('Same college');
      }
      
      // Same course bonus
      if (currentUser.profile?.course && otherUser.profile?.course &&
          currentUser.profile.course.toLowerCase() === otherUser.profile.course.toLowerCase()) {
        matchScore += 10;
        matchReasons.push('Same course');
      }
      
      // Only include if there's some match
      if (matchScore > 0) {
        // Check if already connected
        const isConnected = currentUserSocial?.connections?.includes(otherUser._id);
        
        // Check for pending requests
        const pendingRequest = currentUserSocial?.connectionRequests?.find(
          r => (r.from.toString() === otherUser._id.toString() || r.to?.toString() === otherUser._id.toString()) 
               && r.status === 'pending'
        );
        
        matches.push({
          user: {
            _id: otherUser._id,
            name: otherUser.name,
            avatar: otherUser.avatar,
            college: otherUser.profile?.college,
            course: otherUser.profile?.course,
            year: otherUser.profile?.year,
            skills: otherUser.profile?.skills || [],
            interests: otherUser.profile?.interests || [],
          },
          matchScore: Math.min(matchScore, 100),
          matchType,
          reasons: matchReasons,
          skillSwaps: otherSocial?.skillSwaps?.filter(s => s.status === 'available') || [],
          isConnected,
          hasPendingRequest: !!pendingRequest,
          pendingRequestId: pendingRequest?._id,
        });
      }
    }
    
    // Sort by match score
    matches.sort((a, b) => b.matchScore - a.matchScore);
    
    res.json({ success: true, matches: matches.slice(0, 20) });
  } catch (error) {
    console.error('Find matches error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/social/connect
// @desc    Send a connection request to another user
router.post('/connect', protect, async (req, res) => {
  try {
    const { targetUserId, type, message, skillSwapId } = req.body;
    
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't connect with yourself" });
    }
    
    // Get or create social data for current user
    let mySocial = await Social.findOne({ user: req.user._id });
    if (!mySocial) {
      mySocial = await Social.create({ user: req.user._id });
    }
    
    // Check if already connected
    if (mySocial.connections?.includes(targetUserId)) {
      return res.status(400).json({ message: 'Already connected with this user' });
    }
    
    // Check for existing pending request
    const existingRequest = mySocial.connectionRequests?.find(
      r => r.to?.toString() === targetUserId && r.status === 'pending'
    );
    if (existingRequest) {
      return res.status(400).json({ message: 'Connection request already sent' });
    }
    
    // Create connection request
    const request = {
      from: req.user._id,
      to: targetUserId,
      type: type || 'general',
      message: message || `Hi! I'd like to connect with you.`,
      relatedSkillSwap: skillSwapId,
      status: 'pending',
      createdAt: new Date(),
    };
    
    mySocial.connectionRequests.push(request);
    await mySocial.save();
    
    // Also add to target user's social data
    let targetSocial = await Social.findOne({ user: targetUserId });
    if (!targetSocial) {
      targetSocial = await Social.create({ user: targetUserId });
    }
    targetSocial.connectionRequests.push({
      ...request,
      from: req.user._id,
      to: targetUserId,
    });
    await targetSocial.save();
    
    res.json({ success: true, message: 'Connection request sent!', request });
  } catch (error) {
    console.error('Connect error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/social/connection-requests
// @desc    Get pending connection requests
router.get('/connection-requests', protect, async (req, res) => {
  try {
    const mySocial = await Social.findOne({ user: req.user._id });
    
    // Get incoming requests (where I am the target)
    const incomingRequests = mySocial?.connectionRequests?.filter(
      r => r.to?.toString() === req.user._id.toString() && r.status === 'pending'
    ) || [];
    
    // Get outgoing requests (where I am the sender)
    const outgoingRequests = mySocial?.connectionRequests?.filter(
      r => r.from?.toString() === req.user._id.toString() && r.status === 'pending'
    ) || [];
    
    // Populate user info for incoming requests
    const populatedIncoming = await Promise.all(
      incomingRequests.map(async (req) => {
        const fromUser = await User.findById(req.from).select('name avatar profile');
        return { ...req.toObject(), fromUser };
      })
    );
    
    res.json({ 
      success: true, 
      incoming: populatedIncoming, 
      outgoing: outgoingRequests 
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/social/respond-request
// @desc    Accept or reject a connection request
router.post('/respond-request', protect, async (req, res) => {
  try {
    const { requestId, action } = req.body; // action: 'accept' or 'reject'
    
    let mySocial = await Social.findOne({ user: req.user._id });
    if (!mySocial) {
      return res.status(404).json({ message: 'Social data not found' });
    }
    
    const requestIndex = mySocial.connectionRequests.findIndex(
      r => r._id.toString() === requestId
    );
    
    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    const request = mySocial.connectionRequests[requestIndex];
    
    if (action === 'accept') {
      // Update request status
      mySocial.connectionRequests[requestIndex].status = 'accepted';
      mySocial.connectionRequests[requestIndex].respondedAt = new Date();
      
      // Add to connections
      if (!mySocial.connections) mySocial.connections = [];
      if (!mySocial.connections.includes(request.from)) {
        mySocial.connections.push(request.from);
      }
      
      // Also update the other user's data
      let otherSocial = await Social.findOne({ user: request.from });
      if (otherSocial) {
        if (!otherSocial.connections) otherSocial.connections = [];
        if (!otherSocial.connections.includes(req.user._id)) {
          otherSocial.connections.push(req.user._id);
        }
        // Update their copy of the request
        const otherReqIdx = otherSocial.connectionRequests.findIndex(
          r => r.to?.toString() === req.user._id.toString() && r.from?.toString() === request.from.toString()
        );
        if (otherReqIdx !== -1) {
          otherSocial.connectionRequests[otherReqIdx].status = 'accepted';
          otherSocial.connectionRequests[otherReqIdx].respondedAt = new Date();
        }
        await otherSocial.save();
      }
      
      // Create a Connection document
      await Connection.create({
        users: [req.user._id, request.from],
        type: request.type,
        createdAt: new Date(),
      });
      
      await mySocial.save();
      res.json({ success: true, message: 'Connection accepted!' });
    } else {
      // Reject
      mySocial.connectionRequests[requestIndex].status = 'rejected';
      mySocial.connectionRequests[requestIndex].respondedAt = new Date();
      await mySocial.save();
      res.json({ success: true, message: 'Request declined' });
    }
  } catch (error) {
    console.error('Respond request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/social/connections
// @desc    Get all connections
router.get('/connections', protect, async (req, res) => {
  try {
    const mySocial = await Social.findOne({ user: req.user._id });
    
    if (!mySocial?.connections?.length) {
      return res.json({ success: true, connections: [] });
    }
    
    // Populate connection user info
    const connections = await User.find({ 
      _id: { $in: mySocial.connections } 
    }).select('name avatar profile');
    
    res.json({ success: true, connections });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/social/available-skill-swaps
// @desc    Get all available skill swaps from other users (marketplace)
router.get('/available-skill-swaps', protect, async (req, res) => {
  try {
    // Get all social data except current user
    const allSocialData = await Social.find({ 
      user: { $ne: req.user._id },
      'skillSwaps.status': 'available'
    }).populate('user', 'name avatar profile');
    
    const availableSwaps = [];
    
    for (const social of allSocialData) {
      const userSwaps = social.skillSwaps?.filter(s => s.status === 'available') || [];
      for (const swap of userSwaps) {
        availableSwaps.push({
          ...swap.toObject(),
          user: {
            _id: social.user._id,
            name: social.user.name,
            avatar: social.user.avatar,
            college: social.user.profile?.college,
          }
        });
      }
    }
    
    res.json({ success: true, skillSwaps: availableSwaps });
  } catch (error) {
    console.error('Available skill swaps error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// EXISTING ROUTES (unchanged)
// ============================================

// @route   GET /api/social/goal-rooms
router.get('/goal-rooms', protect, async (req, res) => {
  try {
    const data = await Social.findOne({ user: req.user._id });
    res.json({ success: true, goalRooms: data?.goalRooms || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/social/goal-rooms
router.post('/goal-rooms', protect, async (req, res) => {
  try {
    const { name, goal, deadline, type } = req.body;
    let data = await Social.findOne({ user: req.user._id });
    if (!data) {
      data = await Social.create({ user: req.user._id });
    }
    data.goalRooms.push({
      name, goal, deadline, type,
      participants: [{ user: req.user._id, progress: 0 }],
    });
    await data.save();
    res.json({ success: true, goalRoom: data.goalRooms[data.goalRooms.length - 1] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/social/local-resources
router.get('/local-resources', protect, async (req, res) => {
  try {
    const data = await Social.findOne({ user: req.user._id });
    res.json({ success: true, localResources: data?.localResources || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/social/loneliness-sentinel
router.put('/loneliness-sentinel', protect, async (req, res) => {
  try {
    let data = await Social.findOne({ user: req.user._id });
    if (!data) {
      data = await Social.create({ user: req.user._id });
    }
    data.lonelinessSentinel.lastSocialInteraction = new Date();
    await data.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
