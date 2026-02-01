import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Plus, CheckCircle, Clock, Calendar, X, ListTodo, Brain, Sparkles, Loader2, FileText, Users, Zap, Copy, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store'
import api from '../api'
import { StatFlipCard } from '../components/FlipCard'
import { useGlobalLoader } from '../components/HourglassLoader'

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000'

export default function Academic() {
  const { user, token } = useAuthStore()
  const globalLoader = useGlobalLoader()
  const [activeTab, setActiveTab] = useState('tasks')
  const [tasks, setTasks] = useState([])
  const [flashcards, setFlashcards] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalType, setModalType] = useState('')
  
  // AI Generation states
  const [aiTopic, setAiTopic] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [generatedFlashcards, setGeneratedFlashcards] = useState([]) // Preview before saving

  // Form states
  const [taskForm, setTaskForm] = useState({ title: '', subject: '', dueDate: '', priority: 'medium', status: 'pending' })
  const [flashcardForm, setFlashcardForm] = useState({ question: '', answer: '', subject: '' })

  // Content Distiller states
  const [distillContent, setDistillContent] = useState('')
  const [distillFormat, setDistillFormat] = useState('summary')
  const [distillResult, setDistillResult] = useState(null)
  const [distillLoading, setDistillLoading] = useState(false)

  // Study Coordinator states
  const [studyTopic, setStudyTopic] = useState('')
  const [studyDuration, setStudyDuration] = useState('2 hours')
  const [studyGoal, setStudyGoal] = useState('exam-prep')
  const [studyPlan, setStudyPlan] = useState(null)
  const [studyLoading, setStudyLoading] = useState(false)

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tasksRes, flashcardsRes] = await Promise.all([
        api.get('/academic/tasks', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/academic/flashcards', { headers: { Authorization: `Bearer ${token}` } })
      ])
      setTasks(tasksRes.data.tasks || [])
      setFlashcards(flashcardsRes.data.flashcards || [])
    } catch (error) {
      console.error('Failed to fetch academic data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async () => {
    if (!taskForm.title) {
      toast.error('Please enter a task title')
      return
    }
    globalLoader.show('Adding task...')
    try {
      await api.post('/academic/tasks', taskForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Task added!')
      setShowAddModal(false)
      setTaskForm({ title: '', subject: '', dueDate: '', priority: 'medium', status: 'pending' })
      fetchData()
    } catch (error) {
      console.error('Add task error:', error)
      toast.error('Failed to add task')
    } finally {
      globalLoader.hide()
    }
  }

  const handleAddFlashcard = async () => {
    if (!flashcardForm.question || !flashcardForm.answer) {
      toast.error('Please fill in question and answer')
      return
    }
    globalLoader.show('Adding flashcard...')
    try {
      await api.post('/academic/flashcards', flashcardForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Flashcard added!')
      setShowAddModal(false)
      setFlashcardForm({ question: '', answer: '', subject: '' })
      fetchData()
    } catch (error) {
      console.error('Add flashcard error:', error)
      toast.error('Failed to add flashcard')
    } finally {
      globalLoader.hide()
    }
  }

  const handleGenerateFlashcards = async () => {
    if (!aiTopic.trim()) {
      toast.error('Please enter a topic')
      return
    }
    
    setAiGenerating(true)
    globalLoader.show('AI is generating flashcards...')
    
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/generate-flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, count: 5 })
      })
      
      const result = await response.json()
      
      if (result.success && result.flashcards) {
        // Show preview - user can save individually
        setGeneratedFlashcards(result.flashcards.map((fc, i) => ({ ...fc, subject: aiTopic, id: i })))
        toast.success(`Generated ${result.flashcards.length} flashcards! Click to save the ones you want.`)
      } else {
        toast.error('Failed to generate flashcards')
      }
    } catch (error) {
      console.error('Generate flashcards error:', error)
      toast.error('AI service unavailable')
    } finally {
      setAiGenerating(false)
      globalLoader.hide()
    }
  }

  // Save individual generated flashcard
  const handleSaveGeneratedFlashcard = async (flashcard) => {
    try {
      await api.post('/academic/flashcards', {
        question: flashcard.question,
        answer: flashcard.answer,
        subject: flashcard.subject
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Flashcard saved!')
      // Remove from preview
      setGeneratedFlashcards(prev => prev.filter(fc => fc.id !== flashcard.id))
      fetchData()
    } catch (error) {
      toast.error('Failed to save flashcard')
    }
  }

  // Dismiss a generated flashcard without saving
  const handleDismissFlashcard = (id) => {
    setGeneratedFlashcards(prev => prev.filter(fc => fc.id !== id))
  }

  const handleToggleTask = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    try {
      await api.patch(`/academic/tasks/${taskId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchData()
    } catch (error) {
      toast.error('Failed to update task')
    }
  }

  const openModal = (type) => {
    setModalType(type)
    setShowAddModal(true)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400'
      default: return 'bg-green-500/20 text-green-400'
    }
  }

  // Content Distiller Handler
  const handleDistillContent = async () => {
    if (!distillContent.trim()) {
      toast.error('Please enter content to distill')
      return
    }
    setDistillLoading(true)
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/distill-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: distillContent,
          format: distillFormat
        })
      })
      const result = await response.json()
      if (result.success) {
        setDistillResult(result.distilled)
        toast.success('Content distilled!')
      } else {
        toast.error('Failed to distill content')
      }
    } catch (error) {
      console.error('Distill error:', error)
      toast.error('AI service unavailable')
    } finally {
      setDistillLoading(false)
    }
  }

  // Study Coordinator Handler
  const handleCreateStudyPlan = async () => {
    if (!studyTopic.trim()) {
      toast.error('Please enter a study topic')
      return
    }
    setStudyLoading(true)
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/study-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: studyTopic,
          duration: studyDuration,
          goal: studyGoal
        })
      })
      const result = await response.json()
      if (result.success) {
        setStudyPlan(result.plan)
        toast.success('Study plan created!')
      } else {
        toast.error('Failed to create study plan')
      }
    } catch (error) {
      console.error('Study plan error:', error)
      toast.error('AI service unavailable')
    } finally {
      setStudyLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'flashcards', label: 'Flashcards', icon: Brain },
    { id: 'distiller', label: 'Content Distiller', icon: FileText },
    { id: 'study', label: 'Study Coordinator', icon: Users },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-500" />
            Academic Hub
          </h1>
          <p className="text-slate-600 mt-1">Manage your tasks and study materials</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatFlipCard
          icon={ListTodo}
          value={tasks.filter(t => t.status === 'pending').length}
          label="Pending Tasks"
          hoverInfo="Complete your tasks!"
          color="bg-blue-500/30"
          iconColor="text-blue-400"
        />
        <StatFlipCard
          icon={CheckCircle}
          value={tasks.filter(t => t.status === 'completed').length}
          label="Completed"
          hoverInfo="Great progress!"
          color="bg-green-500/30"
          iconColor="text-green-400"
        />
        <StatFlipCard
          icon={Brain}
          value={flashcards.length}
          label="Flashcards"
          hoverInfo="Study smarter"
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
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Tasks</h2>
            <button
              onClick={() => openModal('task')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 rounded-xl hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>

          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task, i) => (
                <div key={task._id || i} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTask(task._id, task.status)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.status === 'completed'
                          ? 'bg-green-500 border-green-500'
                          : 'border-dark-500 hover:border-green-500'
                      }`}
                    >
                      {task.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                    </button>
                    <div>
                      <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        {task.subject && <span>{task.subject}</span>}
                        {task.dueDate && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs capitalize ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <ListTodo className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No tasks yet</h3>
              <p className="text-slate-500 mb-4">Add tasks to keep track of your assignments and deadlines.</p>
              <button
                onClick={() => openModal('task')}
                className="px-6 py-2 bg-blue-500 rounded-xl hover:bg-blue-600"
              >
                Add Your First Task
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Flashcards Tab */}
      {activeTab === 'flashcards' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Flashcards</h2>
            <button
              onClick={() => openModal('flashcard')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 rounded-xl hover:bg-purple-600"
            >
              <Plus className="w-4 h-4" />
              Add Flashcard
            </button>
          </div>

          {/* AI Flashcard Generator */}
          <div className="bg-white border border-purple-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-slate-900">AI Flashcard Generator</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter a topic (e.g., Photosynthesis, French Revolution)..."
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 text-slate-900 placeholder:text-slate-400"
              />
              <button
                onClick={handleGenerateFlashcards}
                disabled={aiGenerating || !aiTopic.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold disabled:opacity-50 hover:opacity-90 flex items-center gap-2"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Flashcards Preview - Save individually */}
          {generatedFlashcards.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-purple-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Generated - Click to Save
                </h3>
                <button
                  onClick={() => setGeneratedFlashcards([])}
                  className="text-sm text-slate-500 hover:text-red-500"
                >
                  Dismiss All
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {generatedFlashcards.map((card) => (
                  <GeneratedFlashcardPreview
                    key={card.id}
                    card={card}
                    onSave={() => handleSaveGeneratedFlashcard(card)}
                    onDismiss={() => handleDismissFlashcard(card.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {flashcards.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {flashcards.map((card, i) => (
                <FlashcardItem key={i} card={card} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <Brain className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No flashcards yet</h3>
              <p className="text-slate-500 mb-4">Create flashcards to help you study and memorize concepts.</p>
              <button
                onClick={() => openModal('flashcard')}
                className="px-6 py-2 bg-purple-500 rounded-xl hover:bg-purple-600"
              >
                Create Your First Flashcard
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Content Distiller Tab */}
      {activeTab === 'distiller' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Content Distiller</h2>
                <p className="text-slate-500 text-sm">Transform complex content into digestible formats</p>
              </div>
            </div>

            <div className="space-y-4">
              <textarea
                placeholder="Paste your notes, article, lecture transcript, or any content you want to distill..."
                value={distillContent}
                onChange={(e) => setDistillContent(e.target.value)}
                rows={6}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 text-slate-900 placeholder:text-slate-400 resize-none"
              />
              
              <div className="flex gap-2 flex-wrap">
                {['summary', 'bullet-points', 'flashcards', 'mind-map', 'quiz'].map((format) => (
                  <button
                    key={format}
                    onClick={() => setDistillFormat(format)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      distillFormat === format
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {format.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>

              <button
                onClick={handleDistillContent}
                disabled={distillLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {distillLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Distilling...</> : <><Zap className="w-5 h-5" /> Distill Content</>}
              </button>
            </div>
          </div>

          {/* Distill Result */}
          {distillResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Distilled Content</h3>
                <button
                  onClick={() => copyToClipboard(distillResult)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>
              <div className="prose prose-slate max-w-none">
                <div className="text-slate-700 whitespace-pre-wrap">{distillResult}</div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Study Coordinator Tab */}
      {activeTab === 'study' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Study Coordinator</h2>
                <p className="text-slate-500 text-sm">Create Pomodoro-style study sessions</p>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="What topic are you studying? (e.g., Data Structures, Organic Chemistry)"
                value={studyTopic}
                onChange={(e) => setStudyTopic(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-500 text-sm mb-1 block">Study Duration</label>
                  <select
                    value={studyDuration}
                    onChange={(e) => setStudyDuration(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900"
                  >
                    <option value="30 minutes">30 minutes</option>
                    <option value="1 hour">1 hour</option>
                    <option value="2 hours">2 hours</option>
                    <option value="3 hours">3 hours</option>
                    <option value="4 hours">4 hours</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 text-sm mb-1 block">Study Goal</label>
                  <select
                    value={studyGoal}
                    onChange={(e) => setStudyGoal(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900"
                  >
                    <option value="exam-prep">Exam Preparation</option>
                    <option value="deep-learning">Deep Learning</option>
                    <option value="quick-review">Quick Review</option>
                    <option value="project-work">Project Work</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreateStudyPlan}
                disabled={studyLoading}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {studyLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating Plan...</> : '📚 Generate Study Plan'}
              </button>
            </div>
          </div>

          {/* Study Plan Result */}
          {studyPlan && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Pre-Study Checklist */}
              {studyPlan.preStudyChecklist && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">📋 Before You Start</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    {studyPlan.preStudyChecklist.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Study Sessions */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Study Sessions</h3>
                <div className="space-y-3">
                  {studyPlan.sessions?.map((session, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl ${
                        session.type === 'study'
                          ? 'bg-teal-50 border border-teal-200'
                          : 'bg-amber-50 border border-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold ${session.type === 'study' ? 'text-teal-800' : 'text-amber-800'}`}>
                          {session.type === 'study' ? `📖 Session ${session.sessionNumber}` : '☕ Break'}
                        </span>
                        <span className={`px-2 py-1 rounded text-sm ${session.type === 'study' ? 'bg-teal-200 text-teal-800' : 'bg-amber-200 text-amber-800'}`}>
                          {session.duration} min
                        </span>
                      </div>
                      {session.type === 'study' ? (
                        <>
                          <p className="text-teal-700 font-medium">{session.focus}</p>
                          {session.objectives && (
                            <ul className="text-teal-600 text-sm mt-1">
                              {session.objectives.map((obj, j) => (
                                <li key={j}>• {obj}</li>
                              ))}
                            </ul>
                          )}
                          {session.techniques && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {session.techniques.map((tech, j) => (
                                <span key={j} className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs">{tech}</span>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-amber-700">{session.activity}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Materials & Tips */}
              <div className="grid md:grid-cols-2 gap-4">
                {studyPlan.materials && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <h4 className="font-semibold text-purple-800 mb-2">📚 Recommended Materials</h4>
                    <ul className="text-purple-700 text-sm space-y-1">
                      {studyPlan.materials.map((m, i) => <li key={i}>• {m}</li>)}
                    </ul>
                  </div>
                )}
                {studyPlan.groupStudyTips && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h4 className="font-semibold text-green-800 mb-2">👥 Group Study Tips</h4>
                    <ul className="text-green-700 text-sm space-y-1">
                      {studyPlan.groupStudyTips.map((tip, i) => <li key={i}>• {tip}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {studyPlan.motivationalTip && (
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-4 text-center">
                  <p className="text-pink-700 font-medium">💪 {studyPlan.motivationalTip}</p>
                </div>
              )}
            </motion.div>
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
                {modalType === 'task' ? 'Add Task' : 'Add Flashcard'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalType === 'task' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Task Title *"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Subject (optional)"
                  value={taskForm.subject}
                  onChange={(e) => setTaskForm({ ...taskForm, subject: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
                />
                <input
                  type="date"
                  placeholder="Due Date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
                />
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  className="w-full p-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <button
                  onClick={handleAddTask}
                  className="w-full py-3 bg-blue-500 rounded-xl font-semibold hover:bg-blue-600"
                >
                  Add Task
                </button>
              </div>
            )}

            {modalType === 'flashcard' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Question *"
                  value={flashcardForm.question}
                  onChange={(e) => setFlashcardForm({ ...flashcardForm, question: e.target.value })}
                  className="w-full p-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500"
                />
                <textarea
                  placeholder="Answer *"
                  value={flashcardForm.answer}
                  onChange={(e) => setFlashcardForm({ ...flashcardForm, answer: e.target.value })}
                  className="w-full p-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500 resize-none"
                  rows={3}
                />
                <input
                  type="text"
                  placeholder="Subject (optional)"
                  value={flashcardForm.subject}
                  onChange={(e) => setFlashcardForm({ ...flashcardForm, subject: e.target.value })}
                  className="w-full p-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleAddFlashcard}
                  className="w-full py-3 bg-purple-500 rounded-xl font-semibold hover:bg-purple-600"
                >
                  Add Flashcard
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

// Generated Flashcard Preview - with Save/Dismiss buttons
function GeneratedFlashcardPreview({ card, onSave, onDismiss }) {
  return (
    <div className="min-h-[200px] bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-2xl border border-purple-500/30 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-purple-400 px-3 py-1 bg-purple-500/20 rounded-full">
          {card.subject || 'AI Generated'}
        </span>
        <button
          onClick={onDismiss}
          className="text-dark-400 hover:text-red-400 text-sm"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 space-y-3">
        <div>
          <p className="text-xs text-dark-400 mb-1">Question:</p>
          <p className="text-white font-medium text-sm">{card.question}</p>
        </div>
        <div>
          <p className="text-xs text-dark-400 mb-1">Answer:</p>
          <p className="text-green-400 text-sm">{card.answer}</p>
        </div>
      </div>
      <button
        onClick={onSave}
        className="mt-4 w-full py-2 bg-purple-500 hover:bg-purple-600 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Save This Flashcard
      </button>
    </div>
  )
}

// Flashcard component with 3D flip animation - INCREASED HEIGHT, NO HOVER
function FlashcardItem({ card }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className="flip-card cursor-pointer"
      style={{ height: '220px' }}
    >
      <div 
        className="flip-card-inner"
        style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* Question Side (Back - shows first) */}
        <div className="flip-card-back">
          <div className="flip-card-back-content p-5 h-full flex flex-col items-center justify-center">
            {card.subject && (
              <span className="text-xs text-purple-400 mb-3 block px-3 py-1 bg-purple-500/20 rounded-full">
                {card.subject}
              </span>
            )}
            <p className="text-white font-medium text-center text-sm leading-relaxed">{card.question}</p>
            <p className="text-xs text-dark-500 mt-4">Click to reveal answer</p>
          </div>
        </div>

        {/* Answer Side (Front - revealed on flip) */}
        <div className="flip-card-front">
          <div className="flip-card-circles">
            <div className="flip-card-circle green" style={{ width: 60, height: 60, top: -15, left: -15 }} />
            <div className="flip-card-circle blue" style={{ width: 40, height: 40, bottom: -10, right: -10 }} />
          </div>
          <div className="relative z-10 h-full flex flex-col items-center justify-center p-5 text-center overflow-y-auto">
            <p className="text-green-400 font-semibold text-sm leading-relaxed">{card.answer}</p>
            <p className="text-xs text-dark-500 mt-4">Click to see question</p>
          </div>
        </div>
      </div>
    </div>
  )
}
