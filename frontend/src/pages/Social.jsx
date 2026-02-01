import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, MessageSquare, Target, Repeat, X, UserPlus, MapPin, Sparkles, Loader2, Trophy, Clock, Calendar, CheckCircle, XCircle, Link2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store'
import api from '../api'
import { StatFlipCard } from '../components/FlipCard'

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000'

export default function Social() {
  const { user, token } = useAuthStore()
  const [activeTab, setActiveTab] = useState('clusters')
  const [clusters, setClusters] = useState([])
  const [skillSwaps, setSkillSwaps] = useState([])
  const [goalRooms, setGoalRooms] = useState([])
  const [localResources, setLocalResources] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalType, setModalType] = useState('')
  
  // AI Matchmaking states
  const [matchLoading, setMatchLoading] = useState(false)
  const [matchResults, setMatchResults] = useState([])
  
  // Connection states
  const [connections, setConnections] = useState([])
  const [connectionRequests, setConnectionRequests] = useState({ incoming: [], outgoing: [] })
  const [availableSwaps, setAvailableSwaps] = useState([])
  const [connectingTo, setConnectingTo] = useState(null)

  // Form states
  const [clusterForm, setClusterForm] = useState({ name: '', description: '', type: 'study' })
  const [swapForm, setSwapForm] = useState({ offerSkill: '', seekSkill: '', description: '' })
  const [goalRoomForm, setGoalRoomForm] = useState({ name: '', goal: '', deadline: '', type: 'learning' })
  const [localSearchQuery, setLocalSearchQuery] = useState('')

  useEffect(() => {
    if (token) {
      fetchData()
      fetchConnectionRequests()
      fetchConnections()
      fetchAvailableSwaps()
    }
  }, [token])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [clustersRes, swapsRes, goalRoomsRes, localRes] = await Promise.all([
        api.get('/social/clusters', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/social/skill-swaps', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/social/goal-rooms', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/social/local-resources', { headers: { Authorization: `Bearer ${token}` } })
      ])
      setClusters(clustersRes.data.clusters || [])
      setSkillSwaps(swapsRes.data.skillSwaps || [])
      setGoalRooms(goalRoomsRes.data.goalRooms || [])
      setLocalResources(localRes.data.localResources || [])
    } catch (error) {
      console.error('Failed to fetch social data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCluster = async () => {
    if (!clusterForm.name) {
      toast.error('Please enter a cluster name')
      return
    }
    try {
      await api.post('/social/clusters', { cluster: clusterForm }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Cluster created!')
      setShowAddModal(false)
      setClusterForm({ name: '', description: '', type: 'study' })
      fetchData()
    } catch (error) {
      toast.error('Failed to create cluster')
    }
  }

  const handleCreateSkillSwap = async () => {
    if (!swapForm.offerSkill || !swapForm.seekSkill) {
      toast.error('Please fill in both skills')
      return
    }
    try {
      await api.post('/social/skill-swaps', {
        offerSkill: swapForm.offerSkill,
        wantSkill: swapForm.seekSkill
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Skill swap posted!')
      setShowAddModal(false)
      setSwapForm({ offerSkill: '', seekSkill: '', description: '' })
      fetchData()
    } catch (error) {
      toast.error('Failed to post skill swap')
    }
  }

  const handleCreateGoalRoom = async () => {
    if (!goalRoomForm.name || !goalRoomForm.goal) {
      toast.error('Please fill in room name and goal')
      return
    }
    try {
      await api.post('/social/goal-rooms', {
        name: goalRoomForm.name,
        goal: goalRoomForm.goal,
        deadline: goalRoomForm.deadline ? new Date(goalRoomForm.deadline) : null,
        type: goalRoomForm.type
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Goal room created!')
      setShowAddModal(false)
      setGoalRoomForm({ name: '', goal: '', deadline: '', type: 'learning' })
      fetchData()
    } catch (error) {
      toast.error('Failed to create goal room')
    }
  }

  const handleFindMatches = async () => {
    setMatchLoading(true)
    try {
      // Use the real backend endpoint for peer matching
      const response = await api.get('/social/find-matches', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        setMatchResults(response.data.matches || [])
        if (response.data.matches?.length > 0) {
          toast.success(`Found ${response.data.matches.length} potential matches!`)
        } else {
          toast.info('No matches found yet. Complete your profile to get better matches!')
        }
      }
    } catch (error) {
      console.error('Match finding error:', error)
      toast.error('Failed to find matches. Please try again.')
      setMatchResults([])
    } finally {
      setMatchLoading(false)
    }
  }

  // Send connection request to another user
  const handleConnect = async (targetUserId, matchType = 'general', message = '') => {
    setConnectingTo(targetUserId)
    try {
      const response = await api.post('/social/connect', {
        targetUserId,
        type: matchType,
        message: message || `I'd like to connect with you!`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        toast.success('Connection request sent!')
        // Refresh matches to update connection status
        handleFindMatches()
        fetchConnectionRequests()
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to send connection request'
      toast.error(errorMsg)
    } finally {
      setConnectingTo(null)
    }
  }

  // Fetch connection requests
  const fetchConnectionRequests = async () => {
    try {
      const response = await api.get('/social/connection-requests', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        setConnectionRequests({
          incoming: response.data.incoming || [],
          outgoing: response.data.outgoing || []
        })
      }
    } catch (error) {
      console.error('Failed to fetch connection requests:', error)
    }
  }

  // Fetch connections
  const fetchConnections = async () => {
    try {
      const response = await api.get('/social/connections', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        setConnections(response.data.connections || [])
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error)
    }
  }

  // Fetch available skill swaps from other users
  const fetchAvailableSwaps = async () => {
    try {
      const response = await api.get('/social/available-skill-swaps', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        setAvailableSwaps(response.data.skillSwaps || [])
      }
    } catch (error) {
      console.error('Failed to fetch available swaps:', error)
    }
  }

  // Accept or reject connection request
  const handleRespondToRequest = async (requestId, action) => {
    try {
      const response = await api.post('/social/respond-request', {
        requestId,
        action
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        toast.success(action === 'accept' ? 'Connection accepted!' : 'Request declined')
        fetchConnectionRequests()
        if (action === 'accept') {
          fetchConnections()
        }
      }
    } catch (error) {
      toast.error('Failed to respond to request')
    }
  }

  const openModal = (type) => {
    setModalType(type)
    setShowAddModal(true)
  }

  const tabs = [
    { id: 'clusters', label: 'My Clusters', icon: Users },
    { id: 'skill-swaps', label: 'Skill Swaps', icon: Repeat },
    { id: 'goal-rooms', label: 'Goal Rooms', icon: Target },
    { id: 'local', label: 'Local Navigator', icon: MapPin },
    { id: 'matchmaking', label: 'AI Matchmaking', icon: Sparkles },
    { id: 'connections', label: 'My Connections', icon: Link2 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-500" />
            Peer Mesh
          </h1>
          <p className="text-slate-600 mt-1">Connect with peers and exchange skills</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatFlipCard
          icon={Users}
          value={clusters.length}
          label="Your Clusters"
          hoverInfo="Connect with peers"
          color="bg-indigo-500/30"
          iconColor="text-indigo-400"
        />
        <StatFlipCard
          icon={Repeat}
          value={skillSwaps.length}
          label="Skill Swaps"
          hoverInfo="Learn & teach"
          color="bg-green-500/30"
          iconColor="text-green-400"
        />
        <StatFlipCard
          icon={UserPlus}
          value={clusters.reduce((sum, c) => sum + (c.members?.length || 1), 0)}
          label="Total Members"
          hoverInfo="Growing network!"
          color="bg-purple-500/30"
          iconColor="text-purple-400"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-500 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Clusters Tab */}
      {activeTab === 'clusters' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Clusters</h2>
            <button
              onClick={() => openModal('cluster')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 rounded-xl hover:bg-indigo-600"
            >
              <Plus className="w-4 h-4" />
              Create Cluster
            </button>
          </div>

          {clusters.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {clusters.map((cluster, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{cluster.name}</h3>
                      {cluster.description && (
                        <p className="text-slate-500 text-sm mt-1">{cluster.description}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs capitalize ${
                      cluster.type === 'study' ? 'bg-blue-500/20 text-blue-400' :
                      cluster.type === 'project' ? 'bg-green-500/20 text-green-400' :
                      cluster.type === 'support' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {cluster.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{cluster.members?.length || 1} member{(cluster.members?.length || 1) !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <Users className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No clusters yet</h3>
              <p className="text-slate-500 mb-4">Create a cluster to connect with peers who share your interests.</p>
              <button
                onClick={() => openModal('cluster')}
                className="px-6 py-2 bg-indigo-500 rounded-xl hover:bg-indigo-600"
              >
                Create Your First Cluster
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Skill Swaps Tab */}
      {activeTab === 'skill-swaps' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Skill Swaps</h2>
            <button
              onClick={() => openModal('swap')}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 rounded-xl hover:bg-green-600"
            >
              <Plus className="w-4 h-4" />
              Post Skill Swap
            </button>
          </div>

          {skillSwaps.length > 0 ? (
            <div className="space-y-3">
              {skillSwaps.map((swap, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-medium">Offering:</span>
                      <span className="text-slate-900">{swap.offerSkill}</span>
                    </div>
                    <Repeat className="w-4 h-4 text-slate-400" />
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-medium">Seeking:</span>
                      <span className="text-slate-900">{swap.seekSkill}</span>
                    </div>
                  </div>
                  {swap.description && (
                    <p className="text-slate-500 text-sm">{swap.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <Repeat className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No skill swaps posted</h3>
              <p className="text-slate-500 mb-4">Offer a skill you have and find someone who can teach you what you want to learn.</p>
              <button
                onClick={() => openModal('swap')}
                className="px-6 py-2 bg-green-500 rounded-xl hover:bg-green-600"
              >
                Post Your First Skill Swap
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                {modalType === 'cluster' ? 'Create Cluster' : 'Post Skill Swap'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalType === 'cluster' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Cluster Name *"
                  value={clusterForm.name}
                  onChange={(e) => setClusterForm({ ...clusterForm, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={clusterForm.description}
                  onChange={(e) => setClusterForm({ ...clusterForm, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none text-slate-900 placeholder:text-slate-400"
                  rows={3}
                />
                <select
                  value={clusterForm.type}
                  onChange={(e) => setClusterForm({ ...clusterForm, type: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900"
                >
                  <option value="study">Study Group</option>
                  <option value="project">Project Team</option>
                  <option value="interest">Interest Group</option>
                  <option value="support">Support Group</option>
                </select>
                <button
                  onClick={handleCreateCluster}
                  className="w-full py-3 bg-indigo-500 rounded-xl font-semibold hover:bg-indigo-600"
                >
                  Create Cluster
                </button>
              </div>
            )}

            {modalType === 'swap' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Skill you're offering *"
                  value={swapForm.offerSkill}
                  onChange={(e) => setSwapForm({ ...swapForm, offerSkill: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-green-500 text-slate-900 placeholder:text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Skill you're seeking *"
                  value={swapForm.seekSkill}
                  onChange={(e) => setSwapForm({ ...swapForm, seekSkill: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-green-500 text-slate-900 placeholder:text-slate-400"
                />
                <textarea
                  placeholder="Additional details (optional)"
                  value={swapForm.description}
                  onChange={(e) => setSwapForm({ ...swapForm, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-green-500 resize-none text-slate-900 placeholder:text-slate-400"
                  rows={3}
                />
                <button
                  onClick={handleCreateSkillSwap}
                  className="w-full py-3 bg-green-500 rounded-xl font-semibold hover:bg-green-600"
                >
                  Post Skill Swap
                </button>
              </div>
            )}

            {modalType === 'goalroom' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Room Name *"
                  value={goalRoomForm.name}
                  onChange={(e) => setGoalRoomForm({ ...goalRoomForm, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 text-slate-900 placeholder:text-slate-400"
                />
                <textarea
                  placeholder="What's your goal? *"
                  value={goalRoomForm.goal}
                  onChange={(e) => setGoalRoomForm({ ...goalRoomForm, goal: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 resize-none text-slate-900 placeholder:text-slate-400"
                  rows={2}
                />
                <input
                  type="date"
                  placeholder="Deadline"
                  value={goalRoomForm.deadline}
                  onChange={(e) => setGoalRoomForm({ ...goalRoomForm, deadline: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 text-slate-900"
                />
                <select
                  value={goalRoomForm.type}
                  onChange={(e) => setGoalRoomForm({ ...goalRoomForm, type: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 text-slate-900"
                >
                  <option value="learning">Study Sprint</option>
                  <option value="project">Project</option>
                  <option value="fitness">Fitness Challenge</option>
                  <option value="certification">Certification Prep</option>
                </select>
                <button
                  onClick={handleCreateGoalRoom}
                  className="w-full py-3 bg-purple-500 rounded-xl font-semibold hover:bg-purple-600"
                >
                  Create Goal Room
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Goal Rooms Tab */}
      {activeTab === 'goal-rooms' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-900">Shared Goal Rooms</h2>
            <button
              onClick={() => openModal('goalroom')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600"
            >
              <Plus className="w-4 h-4" />
              Create Goal Room
            </button>
          </div>

          {goalRooms.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {goalRooms.map((room, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        {room.name}
                      </h3>
                      <p className="text-slate-500 text-sm mt-1">{room.goal}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs capitalize ${
                      room.type === 'study' ? 'bg-blue-500/20 text-blue-600' :
                      room.type === 'project' ? 'bg-green-500/20 text-green-600' :
                      room.type === 'fitness' ? 'bg-orange-500/20 text-orange-600' :
                      'bg-purple-500/20 text-purple-600'
                    }`}>
                      {room.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Users className="w-4 h-4" />
                      {room.participants?.length || 1} participant{(room.participants?.length || 1) !== 1 ? 's' : ''}
                    </span>
                    {room.deadline && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(room.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <Target className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No goal rooms yet</h3>
              <p className="text-slate-500 mb-4">Create a goal room to collaborate with peers on shared objectives.</p>
              <button
                onClick={() => openModal('goalroom')}
                className="px-6 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600"
              >
                Create Your First Goal Room
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Local Navigator Tab */}
      {activeTab === 'local' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-semibold text-slate-900">Local Navigator</h2>
            </div>
            <p className="text-slate-500 mb-4">
              Find essential resources near your campus - hostels, PGs, food joints, libraries, and more.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {['🏠 Housing', '🍔 Food', '📚 Libraries', '🏥 Health', '🏦 Banks', '🚌 Transport', '📱 Stores', '☕ Cafes'].map((item) => (
                <button
                  key={item}
                  onClick={() => setLocalSearchQuery(item.split(' ')[1])}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors text-sm"
                >
                  {item}
                </button>
              ))}
            </div>

            {localResources.length > 0 ? (
              <div className="space-y-3">
                {localResources.map((resource, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl">
                    <h4 className="font-medium text-slate-900">{resource.name}</h4>
                    <p className="text-slate-500 text-sm">{resource.address}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Search for local resources or select a category above</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* AI Matchmaking Tab */}
      {activeTab === 'matchmaking' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-white border border-purple-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">AI Agentic Matchmaking</h2>
                <p className="text-slate-500 text-sm">Find peers with shared interests and complementary skills</p>
              </div>
            </div>
            
            <p className="text-slate-600 mb-4">
              Our AI analyzes your profile, skills, and interests to find the perfect study buddies, 
              project partners, and peer mentors for you.
            </p>

            <button
              onClick={handleFindMatches}
              disabled={matchLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {matchLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Finding Matches...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Find My Matches
                </>
              )}
            </button>
          </div>

          {/* Connection Requests Section */}
          {(connectionRequests.incoming.length > 0 || connectionRequests.outgoing.length > 0) && (
            <div className="bg-white border border-orange-200 rounded-2xl p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Pending Requests
              </h3>
              
              {/* Incoming Requests */}
              {connectionRequests.incoming.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-slate-600">Incoming Requests</p>
                  {connectionRequests.incoming.map((req) => (
                    <div key={req._id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                      <div>
                        <p className="font-medium text-slate-900">{req.from?.username || 'Unknown User'}</p>
                        <p className="text-sm text-slate-500">{req.message || 'Wants to connect'}</p>
                        <span className="text-xs text-orange-600 capitalize">{req.type}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespondToRequest(req._id, 'accept')}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRespondToRequest(req._id, 'reject')}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Outgoing Requests */}
              {connectionRequests.outgoing.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-600">Sent Requests</p>
                  {connectionRequests.outgoing.map((req) => (
                    <div key={req._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-medium text-slate-900">{req.to?.username || 'Unknown User'}</p>
                        <span className="text-xs text-slate-500 capitalize">{req.type} • Pending</span>
                      </div>
                      <Clock className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Match Results */}
          {matchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900">Suggested Matches ({matchResults.length})</h3>
              {matchResults.map((match, i) => (
                <div key={match.userId || i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900">{match.username || match.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs capitalize ${
                          match.matchType === 'skill-swap' ? 'bg-green-100 text-green-700' :
                          match.matchType === 'study-buddy' ? 'bg-blue-100 text-blue-700' :
                          match.matchType === 'project-partner' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {match.matchType || 'general'}
                        </span>
                      </div>
                      {match.college && <p className="text-slate-500 text-sm">{match.college}</p>}
                      
                      {/* Match Reasons */}
                      {match.reasons && match.reasons.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {match.reasons.map((reason, ri) => (
                            <span key={ri} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Skills Info */}
                      {(match.skillsOffered?.length > 0 || match.skillsWanted?.length > 0) && (
                        <div className="mt-2 text-sm">
                          {match.skillsOffered?.length > 0 && (
                            <p className="text-green-600">Offers: {match.skillsOffered.slice(0, 3).join(', ')}</p>
                          )}
                          {match.skillsWanted?.length > 0 && (
                            <p className="text-blue-600">Wants: {match.skillsWanted.slice(0, 3).join(', ')}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-sm font-medium ${
                        match.matchScore >= 70 ? 'text-green-600' :
                        match.matchScore >= 50 ? 'text-yellow-600' : 'text-slate-500'
                      }`}>
                        {match.matchScore}% match
                      </span>
                      
                      {match.connectionStatus === 'connected' ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-lg flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Connected
                        </span>
                      ) : match.connectionStatus === 'pending' ? (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-lg flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConnect(match.userId, match.matchType || 'general')}
                          disabled={connectingTo === match.userId}
                          className="px-3 py-1 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 disabled:opacity-50 flex items-center gap-1"
                        >
                          {connectingTo === match.userId ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <UserPlus className="w-3 h-3" />
                          )}
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Matches Found */}
          {!matchLoading && matchResults.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Find Your Perfect Match</h3>
              <p className="text-slate-500 mb-4">
                Click the button above to find peers with similar interests and complementary skills.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* My Connections Tab */}
      {activeTab === 'connections' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-900">My Connections</h2>
            <span className="text-sm text-slate-500">{connections.length} connection{connections.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Connection Requests */}
          {connectionRequests.incoming.length > 0 && (
            <div className="bg-white border border-orange-200 rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Pending Requests ({connectionRequests.incoming.length})
              </h3>
              <div className="space-y-2">
                {connectionRequests.incoming.map((req) => (
                  <div key={req._id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-900">{req.from?.username || 'Unknown User'}</p>
                      <p className="text-sm text-slate-500">{req.message}</p>
                      <span className="text-xs text-orange-600 capitalize">{req.type}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespondToRequest(req._id, 'accept')}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" /> Accept
                      </button>
                      <button
                        onClick={() => handleRespondToRequest(req._id, 'reject')}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connections List */}
          {connections.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {connections.map((connection) => (
                <div key={connection._id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {connection.user?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{connection.user?.username}</h4>
                      <p className="text-sm text-slate-500">{connection.user?.profile?.college || 'Student'}</p>
                      <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                        connection.type === 'skill-swap' ? 'bg-green-100 text-green-700' :
                        connection.type === 'study-buddy' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {connection.type}
                      </span>
                    </div>
                    <button className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg">
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <Link2 className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No connections yet</h3>
              <p className="text-slate-500 mb-4">
                Use AI Matchmaking to find and connect with peers who share your interests!
              </p>
              <button
                onClick={() => setActiveTab('matchmaking')}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90"
              >
                Find Matches
              </button>
            </div>
          )}

          {/* Available Skill Swaps from Others */}
          {availableSwaps.length > 0 && (
            <div className="bg-white border border-green-200 rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Repeat className="w-5 h-5 text-green-500" />
                Skill Swap Marketplace
              </h3>
              <div className="space-y-2">
                {availableSwaps.slice(0, 5).map((swap) => (
                  <div key={swap._id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-900">{swap.user?.username}</p>
                      <p className="text-sm">
                        <span className="text-green-600">Offers: {swap.offerSkill}</span>
                        {' → '}
                        <span className="text-blue-600">Wants: {swap.wantSkill}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleConnect(swap.user?._id, 'skill-swap', `I'm interested in swapping skills: ${swap.offerSkill} ↔ ${swap.wantSkill}`)}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
