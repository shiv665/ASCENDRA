import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, TrendingUp, Calendar, Heart, Wind, BookOpen, Sparkles, Loader2, X, Smartphone, Moon, Battery, AlertTriangle, Activity, Coffee, Droplets, Target } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store'
import api from '../api'
import { StatFlipCard } from '../components/FlipCard'

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000'

const moodEmojis = [
  { value: 1, emoji: '😢', label: 'terrible', displayLabel: 'Very Low', color: 'from-red-600 to-red-500' },
  { value: 2, emoji: '😔', label: 'bad', displayLabel: 'Low', color: 'from-red-500 to-orange-500' },
  { value: 3, emoji: '😕', label: 'poor', displayLabel: 'Down', color: 'from-orange-500 to-yellow-500' },
  { value: 4, emoji: '😐', label: 'okay', displayLabel: 'Neutral', color: 'from-yellow-500 to-yellow-400' },
  { value: 5, emoji: '🙂', label: 'fine', displayLabel: 'Okay', color: 'from-yellow-400 to-lime-400' },
  { value: 6, emoji: '😊', label: 'good', displayLabel: 'Good', color: 'from-lime-400 to-green-400' },
  { value: 7, emoji: '😄', label: 'great', displayLabel: 'Happy', color: 'from-green-400 to-green-500' },
  { value: 8, emoji: '😁', label: 'excellent', displayLabel: 'Great', color: 'from-green-500 to-emerald-500' },
  { value: 9, emoji: '🤩', label: 'amazing', displayLabel: 'Excellent', color: 'from-emerald-500 to-cyan-500' },
  { value: 10, emoji: '🥳', label: 'perfect', displayLabel: 'Amazing', color: 'from-cyan-500 to-blue-500' },
]

export default function MentalHealth() {
  const { user, token } = useAuthStore()
  const [activeTab, setActiveTab] = useState('mood')
  const [moodLogs, setMoodLogs] = useState([])
  const [selectedMood, setSelectedMood] = useState(null)
  const [moodNote, setMoodNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [showBreathingModal, setShowBreathingModal] = useState(false)
  const [breathingPhase, setBreathingPhase] = useState('inhale')
  const [breathingCount, setBreathingCount] = useState(0)
  const [sentimentTrend, setSentimentTrend] = useState(null)
  
  // AI Feedback
  const [showFeedback, setShowFeedback] = useState(false)
  const [aiFeedback, setAiFeedback] = useState(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  // Digital Detox States
  const [screenTime, setScreenTime] = useState({ social: 2, entertainment: 3, productive: 4 })
  const [detoxGoal, setDetoxGoal] = useState('moderate')
  const [detoxPlan, setDetoxPlan] = useState(null)
  const [detoxLoading, setDetoxLoading] = useState(false)

  // Wellness Tracking States
  const [wellnessData, setWellnessData] = useState({
    sleepHours: 7,
    waterGlasses: 6,
    exerciseMinutes: 30,
    stressLevel: 5,
    caffeine: 2
  })
  const [wellnessInsights, setWellnessInsights] = useState(null)
  const [wellnessLoading, setWellnessLoading] = useState(false)

  useEffect(() => {
    if (token) {
      fetchMoodLogs()
    }
  }, [token])

  const fetchMoodLogs = async () => {
    try {
      const { data } = await api.get('/mental-health/moods', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMoodLogs(data.moods || [])
      setSentimentTrend(data.trend || null)
    } catch (error) {
      console.error('Failed to fetch mood logs:', error)
    }
  }

  const handleLogMood = async () => {
    if (!selectedMood) {
      toast.error('Please select a mood')
      return
    }

    setLoading(true)
    try {
      // Log the mood to backend
      await api.post('/mental-health/mood', {
        score: selectedMood,
        label: moodEmojis[selectedMood - 1].label,
        notes: moodNote
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success(`Mood logged: ${moodEmojis[selectedMood - 1].displayLabel} ${moodEmojis[selectedMood - 1].emoji}`)
      
      // Fetch updated mood logs
      await fetchMoodLogs()
      
      // Get AI feedback based on mood history
      if (moodNote || moodLogs.length > 0) {
        getAIFeedback(selectedMood, moodNote)
      }
      
      setSelectedMood(null)
      setMoodNote('')
    } catch (error) {
      console.error('Log mood error:', error)
      toast.error('Failed to log mood')
    } finally {
      setLoading(false)
    }
  }

  const getAIFeedback = async (currentScore, note) => {
    setFeedbackLoading(true)
    setShowFeedback(true)
    
    try {
      const recentMoods = moodLogs.slice(-7).map(m => m.score)
      recentMoods.push(currentScore)
      
      const journalEntry = note || `Mood logged: ${moodEmojis[currentScore - 1].displayLabel}`
      
      const response = await fetch(`${AI_SERVICE_URL}/api/analyze-mood`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journalEntry,
          recentMoods
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Parse the AI response
        let analysis = result.analysis
        try {
          // Try to parse as JSON if it's a JSON string
          if (typeof analysis === 'string' && analysis.includes('{')) {
            const jsonMatch = analysis.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              analysis = JSON.parse(jsonMatch[0])
            }
          }
        } catch {
          // Keep as string if parsing fails
        }
        
        setAiFeedback(analysis)
      }
    } catch (error) {
      console.error('AI feedback error:', error)
      setAiFeedback({
        reflection: "Keep tracking your mood to help me understand your patterns better. Every entry helps build a clearer picture of your emotional journey.",
        suggestion: "Consider taking a moment for deep breathing or a short walk."
      })
    } finally {
      setFeedbackLoading(false)
    }
  }

  const startBreathingExercise = () => {
    setShowBreathingModal(true)
    setBreathingCount(0)
    runBreathingCycle()
  }

  const runBreathingCycle = () => {
    let count = 0
    const cycle = () => {
      if (count >= 4) {
        setShowBreathingModal(false)
        toast.success('Breathing exercise complete! 🧘')
        return
      }

      setBreathingPhase('inhale')
      setTimeout(() => setBreathingPhase('hold'), 4000)
      setTimeout(() => setBreathingPhase('exhale'), 8000)
      setTimeout(() => {
        count++
        setBreathingCount(count)
        if (count < 4) cycle()
        else {
          setShowBreathingModal(false)
          toast.success('Breathing exercise complete! 🧘')
        }
      }, 12000)
    }
    cycle()
  }

  const getAverageMood = () => {
    if (moodLogs.length === 0) return null
    const sum = moodLogs.reduce((acc, log) => acc + log.score, 0)
    return (sum / moodLogs.length).toFixed(1)
  }

  const getTrendEmoji = () => {
    if (!sentimentTrend) return '📊'
    switch(sentimentTrend.direction) {
      case 'improving': return '📈'
      case 'declining': return '📉'
      default: return '➡️'
    }
  }

  // Digital Detox Handler
  const generateDetoxPlan = async () => {
    setDetoxLoading(true)
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/digital-detox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenTime,
          goal: detoxGoal,
          currentMood: getAverageMood()
        })
      })
      const result = await response.json()
      if (result.success) {
        setDetoxPlan(result.plan)
        toast.success('Detox plan created!')
      } else {
        toast.error('Failed to generate plan')
      }
    } catch (error) {
      console.error('Detox error:', error)
      toast.error('AI service unavailable')
    } finally {
      setDetoxLoading(false)
    }
  }

  // Wellness Insights Handler
  const getWellnessInsights = async () => {
    setWellnessLoading(true)
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/wellness-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wellness: wellnessData,
          moodHistory: moodLogs.slice(-7).map(m => ({ score: m.score, date: m.timestamp })),
          averageMood: getAverageMood()
        })
      })
      const result = await response.json()
      if (result.success) {
        setWellnessInsights(result.insights)
        toast.success('Wellness analysis complete!')
      } else {
        toast.error('Failed to get insights')
      }
    } catch (error) {
      console.error('Wellness error:', error)
      toast.error('AI service unavailable')
    } finally {
      setWellnessLoading(false)
    }
  }

  const tabs = [
    { id: 'mood', label: 'Mood Tracker', icon: Heart },
    { id: 'detox', label: 'Digital Detox', icon: Smartphone },
    { id: 'wellness', label: 'Wellness', icon: Activity },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-500" />
            Neural Guardian
          </h1>
          <p className="text-slate-600 mt-1">Track your mental wellness journey</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatFlipCard
          icon={TrendingUp}
          value={getAverageMood() || '—'}
          label="Average Mood"
          hoverInfo={`Trend: ${sentimentTrend?.direction || 'Start tracking!'} ${getTrendEmoji()}`}
          color="bg-purple-500/30"
          iconColor="text-purple-400"
        />
        <StatFlipCard
          icon={Calendar}
          value={moodLogs.length}
          label="Mood Entries"
          hoverInfo="Keep tracking daily!"
          color="bg-blue-500/30"
          iconColor="text-blue-400"
        />
        <StatFlipCard
          icon={Heart}
          value={moodLogs.filter(m => m.score >= 7).length}
          label="Happy Days"
          hoverInfo="Celebrate every good day! 🎉"
          color="bg-green-500/30"
          iconColor="text-green-400"
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
                ? 'bg-purple-500 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mood Tab */}
      {activeTab === 'mood' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Log Mood Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold text-slate-900 mb-4">How are you feeling today?</h2>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {moodEmojis.map((mood) => (
                <motion.button
                  key={mood.value}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`relative p-3 rounded-xl transition-all ${
                    selectedMood === mood.value
                      ? `bg-gradient-to-br ${mood.color} scale-110 shadow-lg`
                      : 'bg-slate-100 hover:bg-slate-200'
                  }`}
            >
              <span className="text-2xl">{mood.emoji}</span>
              {selectedMood === mood.value && (
                <motion.div
                  layoutId="moodIndicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full"
                />
              )}
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {selectedMood && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-lg mb-4"
            >
              You selected: <span className={`font-semibold bg-gradient-to-r ${moodEmojis[selectedMood - 1].color} bg-clip-text text-transparent`}>
                {moodEmojis[selectedMood - 1].displayLabel}
              </span>
            </motion.p>
          )}
        </AnimatePresence>

        <textarea
          value={moodNote}
          onChange={(e) => setMoodNote(e.target.value)}
          placeholder="Add a note about how you're feeling (optional)... This helps the AI give better insights!"
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 resize-none mb-4 text-slate-900 placeholder-slate-400"
          rows={3}
        />

        <button
          onClick={handleLogMood}
          disabled={!selectedMood || loading}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Logging...
            </span>
          ) : 'Log Mood & Get AI Insights'}
        </button>
      </motion.div>

      {/* AI Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowFeedback(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 max-w-lg w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  AI Wellness Insights
                </h3>
                <button onClick={() => setShowFeedback(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {feedbackLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-10 h-10 text-purple-500 mx-auto mb-4 animate-spin" />
                  <p className="text-slate-500">Analyzing your mood patterns...</p>
                </div>
              ) : aiFeedback ? (
                <div className="space-y-4">
                  {typeof aiFeedback === 'string' ? (
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{aiFeedback}</p>
                  ) : (
                    <>
                      {aiFeedback.reflection && (
                        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                          <h4 className="font-medium text-purple-400 mb-2">💜 Reflection</h4>
                          <p className="text-slate-600 text-sm">{aiFeedback.reflection}</p>
                        </div>
                      )}
                      {aiFeedback.emotions && (
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                          <h4 className="font-medium text-blue-400 mb-2">🎭 Detected Emotions</h4>
                          <p className="text-slate-600 text-sm">
                            {Array.isArray(aiFeedback.emotions) ? aiFeedback.emotions.join(', ') : aiFeedback.emotions}
                          </p>
                        </div>
                      )}
                      {aiFeedback.intervention && (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                          <h4 className="font-medium text-green-400 mb-2">✨ Suggestion</h4>
                          <p className="text-slate-600 text-sm">{aiFeedback.intervention}</p>
                        </div>
                      )}
                      {aiFeedback.concerns && aiFeedback.concerns.length > 0 && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                          <h4 className="font-medium text-yellow-400 mb-2">⚠️ Things to Watch</h4>
                          <p className="text-slate-600 text-sm">
                            {Array.isArray(aiFeedback.concerns) ? aiFeedback.concerns.join(', ') : aiFeedback.concerns}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  
                  <button
                    onClick={() => setShowFeedback(false)}
                    className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
                  >
                    Got it, thanks! 💪
                  </button>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={startBreathingExercise}
          className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 text-left hover:bg-slate-50 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-cyan-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wind className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="font-semibold text-slate-900">Breathing Exercise</h3>
          </div>
          <p className="text-slate-500 text-sm">4-4-4 box breathing to calm your mind</p>
        </motion.button>

        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-500/30 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="font-semibold text-slate-900">Journaling</h3>
          </div>
          <p className="text-slate-500 text-sm">Add notes when logging mood for better AI insights</p>
        </div>
      </div>

      {/* Recent Mood Logs */}
      {moodLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Mood Logs</h2>
          <div className="space-y-3">
            {moodLogs.slice(-7).reverse().map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-gradient-to-r ${moodEmojis[log.score - 1]?.color || 'from-gray-500 to-gray-600'} bg-opacity-10`}
                style={{ background: `linear-gradient(to right, rgba(255,255,255,0.9), rgba(248,250,252,0.95))` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{moodEmojis[log.score - 1]?.emoji || '😐'}</span>
                  <div>
                    <p className="font-medium text-slate-900">{moodEmojis[log.score - 1]?.displayLabel || 'Unknown'}</p>
                    {log.notes && <p className="text-slate-500 text-sm line-clamp-1">{log.notes}</p>}
                  </div>
                </div>
                <span className="text-slate-500 text-sm">
                  {new Date(log.timestamp).toLocaleDateString()}
                </span>
              </motion.div>
            ))}
          </div>
          
          {sentimentTrend && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-600">
                <span className="text-purple-400 font-medium">Trend:</span> Your mood is{' '}
                <span className={`font-semibold ${
                  sentimentTrend.direction === 'improving' ? 'text-green-400' :
                  sentimentTrend.direction === 'declining' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {sentimentTrend.direction} {getTrendEmoji()}
                </span>
              </p>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'mood' && moodLogs.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <Brain className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No mood logs yet</h3>
          <p className="text-slate-500">Start tracking your mood to see patterns and get AI insights.</p>
        </div>
      )}
        </motion.div>
      )}

      {/* Digital Detox Tab */}
      {activeTab === 'detox' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Digital Detox Planner</h2>
                <p className="text-slate-500 text-sm">Reduce screen time, improve mental health</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-slate-700 text-sm font-medium mb-2 block">Daily Screen Time (hours)</label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <label className="text-slate-500 text-xs mb-1 block">Social Media</label>
                    <input
                      type="number"
                      value={screenTime.social}
                      onChange={(e) => setScreenTime({ ...screenTime, social: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                      min="0"
                      max="24"
                    />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <label className="text-slate-500 text-xs mb-1 block">Entertainment</label>
                    <input
                      type="number"
                      value={screenTime.entertainment}
                      onChange={(e) => setScreenTime({ ...screenTime, entertainment: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                      min="0"
                      max="24"
                    />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <label className="text-slate-500 text-xs mb-1 block">Productive</label>
                    <input
                      type="number"
                      value={screenTime.productive}
                      onChange={(e) => setScreenTime({ ...screenTime, productive: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                      min="0"
                      max="24"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-700 text-sm font-medium mb-2 block">Detox Goal</label>
                <div className="flex gap-2">
                  {['gentle', 'moderate', 'aggressive'].map((goal) => (
                    <button
                      key={goal}
                      onClick={() => setDetoxGoal(goal)}
                      className={`flex-1 py-2 rounded-xl capitalize transition-all ${
                        detoxGoal === goal
                          ? 'bg-cyan-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateDetoxPlan}
                disabled={detoxLoading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {detoxLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating Plan...</> : <><Moon className="w-5 h-5" /> Generate Detox Plan</>}
              </button>
            </div>
          </div>

          {/* Detox Plan Result */}
          {detoxPlan && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cyan-700 text-sm">Current Total Screen Time</p>
                    <p className="text-2xl font-bold text-cyan-800">{screenTime.social + screenTime.entertainment + screenTime.productive}h / day</p>
                  </div>
                  <div className="text-right">
                    <p className="text-cyan-700 text-sm">Target Reduction</p>
                    <p className="text-2xl font-bold text-green-600">{detoxPlan.targetReduction || '2h'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Your Personalized Detox Plan</h3>
                
                {detoxPlan.dailySchedule && (
                  <div className="space-y-3 mb-4">
                    {detoxPlan.dailySchedule.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                        <span className="text-xl">{item.emoji || '⏰'}</span>
                        <div>
                          <p className="font-medium text-slate-900">{item.time}</p>
                          <p className="text-slate-600 text-sm">{item.activity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {detoxPlan.alternatives && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
                    <h4 className="font-semibold text-green-800 mb-2">🌿 Healthy Alternatives</h4>
                    <ul className="text-green-700 text-sm space-y-1">
                      {detoxPlan.alternatives.map((alt, i) => <li key={i}>• {alt}</li>)}
                    </ul>
                  </div>
                )}

                {detoxPlan.tips && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <h4 className="font-semibold text-amber-800 mb-2">💡 Success Tips</h4>
                    <ul className="text-amber-700 text-sm space-y-1">
                      {detoxPlan.tips.map((tip, i) => <li key={i}>• {tip}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Wellness Tab */}
      {activeTab === 'wellness' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Wellness Tracker</h2>
                <p className="text-slate-500 text-sm">Track daily habits that affect your mental health</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <label className="text-slate-700 text-sm font-medium">Sleep (hours)</label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  value={wellnessData.sleepHours}
                  onChange={(e) => setWellnessData({ ...wellnessData, sleepHours: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-center text-indigo-600 font-bold">{wellnessData.sleepHours}h</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <label className="text-slate-700 text-sm font-medium">Water (glasses)</label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  value={wellnessData.waterGlasses}
                  onChange={(e) => setWellnessData({ ...wellnessData, waterGlasses: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-center text-blue-600 font-bold">{wellnessData.waterGlasses} glasses</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <label className="text-slate-700 text-sm font-medium">Exercise (minutes)</label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="5"
                  value={wellnessData.exerciseMinutes}
                  onChange={(e) => setWellnessData({ ...wellnessData, exerciseMinutes: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-center text-green-600 font-bold">{wellnessData.exerciseMinutes} min</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Coffee className="w-4 h-4 text-amber-600" />
                  <label className="text-slate-700 text-sm font-medium">Caffeine (cups)</label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={wellnessData.caffeine}
                  onChange={(e) => setWellnessData({ ...wellnessData, caffeine: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-center text-amber-600 font-bold">{wellnessData.caffeine} cups</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <label className="text-slate-700 text-sm font-medium">Stress Level (1-10)</label>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={wellnessData.stressLevel}
                onChange={(e) => setWellnessData({ ...wellnessData, stressLevel: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Low Stress</span>
                <span className={`font-bold ${wellnessData.stressLevel > 7 ? 'text-red-500' : wellnessData.stressLevel > 4 ? 'text-amber-500' : 'text-green-500'}`}>
                  {wellnessData.stressLevel}/10
                </span>
                <span>High Stress</span>
              </div>
            </div>

            <button
              onClick={getWellnessInsights}
              disabled={wellnessLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {wellnessLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : <><Target className="w-5 h-5" /> Get AI Wellness Insights</>}
            </button>
          </div>

          {/* Wellness Insights Result */}
          {wellnessInsights && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className={`p-4 rounded-xl border ${wellnessInsights.overallScore >= 70 ? 'bg-green-50 border-green-200' : wellnessInsights.overallScore >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Wellness Score</p>
                    <p className="text-3xl font-bold">{wellnessInsights.overallScore || 75}/100</p>
                  </div>
                  <div className="text-4xl">{wellnessInsights.overallScore >= 70 ? '🌟' : wellnessInsights.overallScore >= 50 ? '⚡' : '💪'}</div>
                </div>
              </div>

              {wellnessInsights.analysis && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Personal Analysis</h3>
                  <p className="text-slate-600">{wellnessInsights.analysis}</p>
                </div>
              )}

              {wellnessInsights.recommendations && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Recommendations</h3>
                  <div className="space-y-3">
                    {wellnessInsights.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                        <span className="text-xl">{rec.emoji || '💡'}</span>
                        <div>
                          <p className="font-medium text-slate-900">{rec.title}</p>
                          <p className="text-slate-600 text-sm">{rec.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {wellnessInsights.moodCorrelation && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <h4 className="font-semibold text-purple-800 mb-2">🔗 Mood-Wellness Correlation</h4>
                  <p className="text-purple-700 text-sm">{wellnessInsights.moodCorrelation}</p>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Breathing Modal */}
      <AnimatePresence>
        {showBreathingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="glass rounded-2xl p-8 text-center max-w-md mx-4"
            >
              <h2 className="text-2xl font-bold mb-4">Box Breathing</h2>
              <div className="relative w-40 h-40 mx-auto mb-4">
                <motion.div
                  animate={{
                    scale: breathingPhase === 'inhale' ? 1.3 : breathingPhase === 'hold' ? 1.3 : 1,
                  }}
                  transition={{ duration: 4 }}
                  className="w-full h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-2xl font-bold capitalize">{breathingPhase}</span>
                </motion.div>
              </div>
              <p className="text-dark-400 mb-4">Cycle {breathingCount + 1} of 4</p>
              <button
                onClick={() => setShowBreathingModal(false)}
                className="px-6 py-2 bg-dark-700 rounded-xl hover:bg-dark-600"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
