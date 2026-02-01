import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Rocket, Plus, Target, Briefcase, Users, Code, X, Sparkles, Loader2, TrendingUp, Mic, Hammer } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store'
import api from '../api'
import { StatFlipCard } from '../components/FlipCard'

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000'

export default function Career() {
  const { user, token } = useAuthStore()
  const [activeTab, setActiveTab] = useState('skills')
  const [skills, setSkills] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalType, setModalType] = useState('')
  
  // AI Skill Analysis states
  const [targetRole, setTargetRole] = useState('')
  const [skillAnalysis, setSkillAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  
  // Mock Interview states
  const [interviewRole, setInterviewRole] = useState('')
  const [interviewType, setInterviewType] = useState('behavioral')
  const [interviewQuestions, setInterviewQuestions] = useState(null)
  const [interviewLoading, setInterviewLoading] = useState(false)
  
  // Project Forge states
  const [forgeSkill, setForgeSkill] = useState('')
  const [forgeLevel, setForgeLevel] = useState('beginner')
  const [forgeProject, setForgeProject] = useState(null)
  const [forgeLoading, setForgeLoading] = useState(false)

  // Form states
  const [skillForm, setSkillForm] = useState({ name: '', level: 'beginner', category: 'technical' })
  const [goalForm, setGoalForm] = useState({ title: '', description: '', deadline: '', status: 'in-progress' })

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/career', { headers: { Authorization: `Bearer ${token}` } })
      setSkills(data.data?.skills || [])
      setGoals(data.data?.careerGoals || [])
    } catch (error) {
      console.error('Failed to fetch career data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSkill = async () => {
    if (!skillForm.name) {
      toast.error('Please enter a skill name')
      return
    }
    try {
      const levelMap = { beginner: 25, intermediate: 50, advanced: 75, expert: 95 }
      await api.post('/career/skills', {
        skills: [{
          name: skillForm.name,
          level: levelMap[skillForm.level] || 25,
          category: skillForm.category,
          source: 'self-reported'
        }]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Skill added!')
      setShowAddModal(false)
      setSkillForm({ name: '', level: 'beginner', category: 'technical' })
      fetchData()
    } catch (error) {
      console.error('Add skill error:', error)
      toast.error('Failed to add skill')
    }
  }

  const handleAddGoal = async () => {
    if (!goalForm.title) {
      toast.error('Please enter a goal title')
      return
    }
    try {
      await api.post('/career/goals', {
        goal: {
          title: goalForm.title,
          description: goalForm.description,
          targetDate: goalForm.deadline ? new Date(goalForm.deadline) : null,
          status: 'in-progress'
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Goal added!')
      setShowAddModal(false)
      setGoalForm({ title: '', description: '', deadline: '', status: 'in-progress' })
      fetchData()
    } catch (error) {
      console.error('Add goal error:', error)
      toast.error('Failed to add goal')
    }
  }

  const openModal = (type) => {
    setModalType(type)
    setShowAddModal(true)
  }

  // AI Skill Gap Analysis
  const handleAnalyzeSkills = async () => {
    if (!targetRole.trim()) {
      toast.error('Please enter a target role')
      return
    }
    if (skills.length === 0) {
      toast.error('Please add some skills first')
      return
    }

    setAnalyzing(true)
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/analyze-skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSkills: skills.map(s => ({
            name: s.name,
            level: typeof s.level === 'number' ? s.level : 
              s.level === 'expert' ? 95 : s.level === 'advanced' ? 75 : 
              s.level === 'intermediate' ? 50 : 25
          })),
          targetRole: targetRole
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Try to parse the analysis as JSON
        let analysis = result.analysis
        try {
          if (typeof analysis === 'string' && analysis.includes('{')) {
            const jsonMatch = analysis.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              analysis = JSON.parse(jsonMatch[0])
            }
          }
        } catch {
          // Keep as string if parsing fails
        }
        setSkillAnalysis(analysis)
        toast.success('Skill gap analysis complete!')
      } else {
        toast.error('Failed to analyze skills')
      }
    } catch (error) {
      console.error('Skill analysis error:', error)
      toast.error('AI service unavailable')
    } finally {
      setAnalyzing(false)
    }
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'expert': return 'bg-purple-500/20 text-purple-400'
      case 'advanced': return 'bg-blue-500/20 text-blue-400'
      case 'intermediate': return 'bg-green-500/20 text-green-400'
      default: return 'bg-yellow-500/20 text-yellow-400'
    }
  }

  const tabs = [
    { id: 'skills', label: 'My Skills', icon: Code },
    { id: 'goals', label: 'Career Goals', icon: Target },
    { id: 'analysis', label: 'AI Analysis', icon: Sparkles },
    { id: 'interview', label: 'Mock Interview', icon: Mic },
    { id: 'projects', label: 'Project Forge', icon: Hammer },
  ]

  // Mock Interview handler
  const handleMockInterview = async () => {
    if (!interviewRole.trim()) {
      toast.error('Please enter a target role')
      return
    }
    setInterviewLoading(true)
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/mock-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: interviewRole,
          experience: 'entry',
          questionType: interviewType
        })
      })
      const result = await response.json()
      if (result.success) {
        setInterviewQuestions(result.interview)
        toast.success('Interview questions generated!')
      }
    } catch (error) {
      toast.error('Failed to generate interview questions')
    } finally {
      setInterviewLoading(false)
    }
  }

  // Project Forge handler
  const handleForgeProject = async () => {
    if (!forgeSkill.trim()) {
      toast.error('Please enter a skill to practice')
      return
    }
    setForgeLoading(true)
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/project-forge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill: forgeSkill,
          level: forgeLevel,
          timeframe: '48 hours'
        })
      })
      const result = await response.json()
      if (result.success) {
        setForgeProject(result.project)
        toast.success('Project generated!')
      }
    } catch (error) {
      toast.error('Failed to generate project')
    } finally {
      setForgeLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Rocket className="w-8 h-8 text-orange-500" />
            Career Launchpad
          </h1>
          <p className="text-slate-600 mt-1">Track your skills and career goals</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatFlipCard
          icon={Code}
          value={skills.length}
          label="Skills Listed"
          hoverInfo="Showcase your abilities"
          color="bg-orange-500/30"
          iconColor="text-orange-400"
        />
        <StatFlipCard
          icon={Target}
          value={goals.filter(g => g.status === 'in-progress').length}
          label="Active Goals"
          hoverInfo="Track your progress"
          color="bg-blue-500/30"
          iconColor="text-blue-400"
        />
        <StatFlipCard
          icon={Briefcase}
          value={goals.filter(g => g.status === 'completed').length}
          label="Goals Achieved"
          hoverInfo="Celebrate success!"
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
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Skills</h2>
            <button
              onClick={() => openModal('skill')}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 rounded-xl hover:bg-orange-600"
            >
              <Plus className="w-4 h-4" />
              Add Skill
            </button>
          </div>

          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {skills.map((skill, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-900">{skill.name}</span>
                    <span className={`px-2 py-1 rounded text-xs capitalize ${getLevelColor(skill.level)}`}>
                      {skill.level}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm capitalize mt-1">{skill.category}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <Code className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No skills added yet</h3>
              <p className="text-slate-500 mb-4">Add your skills to track your progress and showcase your abilities.</p>
              <button
                onClick={() => openModal('skill')}
                className="px-6 py-2 bg-orange-500 rounded-xl hover:bg-orange-600"
              >
                Add Your First Skill
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Career Goals</h2>
            <button
              onClick={() => openModal('goal')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 rounded-xl hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              Add Goal
            </button>
          </div>

          {goals.length > 0 ? (
            <div className="space-y-3">
              {goals.map((goal, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-slate-900">{goal.title}</h3>
                      {goal.description && <p className="text-slate-500 text-sm mt-1">{goal.description}</p>}
                      {goal.deadline && (
                        <p className="text-slate-400 text-sm mt-2">Deadline: {new Date(goal.deadline).toLocaleDateString()}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      goal.status === 'completed' ? 'bg-green-500/20 text-green-600' :
                      goal.status === 'in-progress' ? 'bg-blue-500/20 text-blue-600' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {goal.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <Target className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No career goals yet</h3>
              <p className="text-slate-500 mb-4">Set goals to guide your career development and track your progress.</p>
              <button
                onClick={() => openModal('goal')}
                className="px-6 py-2 bg-blue-500 rounded-xl hover:bg-blue-600"
              >
                Add Your First Goal
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* AI Analysis Tab */}
      {activeTab === 'analysis' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-semibold text-slate-900">AI Skill Gap Analysis</h2>
            </div>
            <p className="text-slate-500 mb-4">
              Enter your target role to get AI-powered insights on skill gaps, recommended projects, and career paths.
            </p>
            
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="e.g., Full Stack Developer, Data Scientist, Product Manager..."
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 text-slate-900 placeholder:text-slate-400"
              />
              <button
                onClick={handleAnalyzeSkills}
                disabled={analyzing || skills.length === 0}
                className="px-6 py-3 bg-purple-500 rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                Analyze
              </button>
            </div>
            
            {skills.length === 0 && (
              <p className="text-amber-400 text-sm mt-2">⚠️ Add some skills first to enable analysis</p>
            )}
          </div>

          {/* Analysis Results */}
          {skillAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Analysis for {targetRole}
              </h3>
              
              {typeof skillAnalysis === 'string' ? (
                <div className="prose prose-invert max-w-none">
                  <p className="text-dark-300 whitespace-pre-wrap">{skillAnalysis}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {skillAnalysis.missingSkills && (
                    <div>
                      <h4 className="font-medium text-red-400 mb-2">Missing Skills:</h4>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(skillAnalysis.missingSkills) ? skillAnalysis.missingSkills : [skillAnalysis.missingSkills]).map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-red-500/20 text-red-300 rounded-lg text-sm">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {skillAnalysis.priorities && (
                    <div>
                      <h4 className="font-medium text-amber-400 mb-2">Priority Order:</h4>
                      <ol className="list-decimal list-inside text-slate-600 space-y-1">
                        {(Array.isArray(skillAnalysis.priorities) ? skillAnalysis.priorities : [skillAnalysis.priorities]).map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  
                  {skillAnalysis.projects && (
                    <div>
                      <h4 className="font-medium text-blue-400 mb-2">Suggested Projects:</h4>
                      <ul className="space-y-2">
                        {(Array.isArray(skillAnalysis.projects) ? skillAnalysis.projects : [skillAnalysis.projects]).map((proj, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-600">
                            <span className="text-blue-500">→</span> {typeof proj === 'object' ? proj.name || JSON.stringify(proj) : proj}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {skillAnalysis.timeEstimate && (
                    <div className="mt-4 p-3 bg-green-500/10 rounded-xl">
                      <h4 className="font-medium text-green-400">⏱️ Estimated Time:</h4>
                      <p className="text-slate-600">{skillAnalysis.timeEstimate}</p>
                    </div>
                  )}
                  
                  {skillAnalysis.alternativeRoles && (
                    <div>
                      <h4 className="font-medium text-purple-400 mb-2">Alternative Roles:</h4>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(skillAnalysis.alternativeRoles) ? skillAnalysis.alternativeRoles : [skillAnalysis.alternativeRoles]).map((role, i) => (
                          <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm">{role}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Mock Interview Tab */}
      {activeTab === 'interview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Mock Interview Agent</h2>
                <p className="text-slate-500 text-sm">Practice with AI-generated interview questions</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Target role (e.g., Software Engineer)"
                value={interviewRole}
                onChange={(e) => setInterviewRole(e.target.value)}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 placeholder:text-slate-400"
              />
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900"
              >
                <option value="behavioral">Behavioral Questions</option>
                <option value="technical">Technical Questions</option>
                <option value="case">Case Study</option>
              </select>
            </div>
            
            <button
              onClick={handleMockInterview}
              disabled={interviewLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {interviewLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Questions...
                </>
              ) : 'Start Mock Interview'}
            </button>
          </div>

          {interviewQuestions && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {interviewQuestions.questions?.map((q, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 bg-cyan-500/20 text-cyan-600 rounded-lg flex items-center justify-center font-bold text-sm">{i + 1}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-2">{q.question}</h4>
                      <div className="text-sm space-y-2">
                        <div>
                          <span className="font-medium text-green-600">Looking for: </span>
                          <span className="text-slate-600">{Array.isArray(q.lookingFor) ? q.lookingFor.join(', ') : q.lookingFor}</span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-600">Model Answer: </span>
                          <span className="text-slate-600">{q.modelAnswer}</span>
                        </div>
                        {q.avoid && (
                          <div>
                            <span className="font-medium text-red-600">Avoid: </span>
                            <span className="text-slate-600">{Array.isArray(q.avoid) ? q.avoid.join(', ') : q.avoid}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {interviewQuestions.tips && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h4 className="font-semibold text-amber-800 mb-2">💡 Interview Tips</h4>
                  <ul className="text-amber-700 text-sm space-y-1">
                    {interviewQuestions.tips.map((tip, i) => <li key={i}>• {tip}</li>)}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Project Forge Tab */}
      {activeTab === 'projects' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Hammer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Project Forge</h2>
                <p className="text-slate-500 text-sm">Generate 48-hour micro-projects to build skills</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Skill to practice (e.g., React, Python, APIs)"
                value={forgeSkill}
                onChange={(e) => setForgeSkill(e.target.value)}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-900 placeholder:text-slate-400"
              />
              <select
                value={forgeLevel}
                onChange={(e) => setForgeLevel(e.target.value)}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-900"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            <button
              onClick={handleForgeProject}
              disabled={forgeLoading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {forgeLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Forging Project...
                </>
              ) : '🔨 Forge My Project'}
            </button>
          </div>

          {forgeProject && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{forgeProject.projectName}</h3>
              <p className="text-slate-600 mb-4">{forgeProject.description}</p>
              
              {forgeProject.techStack && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {forgeProject.techStack.map((tech, i) => (
                    <span key={i} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm">{tech}</span>
                  ))}
                </div>
              )}
              
              {forgeProject.milestones && (
                <div className="mb-4">
                  <h4 className="font-semibold text-slate-900 mb-2">📅 Milestones</h4>
                  <div className="space-y-2">
                    {forgeProject.milestones.map((m, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                        <span className="w-12 h-6 bg-orange-500 text-white rounded text-xs flex items-center justify-center font-medium">
                          Hr {m.hour}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">{m.task}</p>
                          <p className="text-slate-500 text-sm">{m.deliverable}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {forgeProject.learningOutcomes && (
                <div className="mb-4">
                  <h4 className="font-semibold text-slate-900 mb-2">🎯 Learning Outcomes</h4>
                  <ul className="text-slate-600 space-y-1">
                    {forgeProject.learningOutcomes.map((outcome, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500">✓</span> {outcome}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {forgeProject.stretchGoals && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <h4 className="font-semibold text-purple-800 mb-2">🚀 Stretch Goals</h4>
                  <ul className="text-purple-700 text-sm space-y-1">
                    {forgeProject.stretchGoals.map((goal, i) => <li key={i}>• {goal}</li>)}
                  </ul>
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
            className="glass rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold capitalize">Add {modalType}</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-dark-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalType === 'skill' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Skill Name *"
                  value={skillForm.name}
                  onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                  className="w-full p-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-orange-500"
                />
                <select
                  value={skillForm.level}
                  onChange={(e) => setSkillForm({ ...skillForm, level: e.target.value })}
                  className="w-full p-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-orange-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
                <select
                  value={skillForm.category}
                  onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
                  className="w-full p-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-orange-500"
                >
                  <option value="technical">Technical</option>
                  <option value="soft-skills">Soft Skills</option>
                  <option value="languages">Languages</option>
                  <option value="tools">Tools & Frameworks</option>
                  <option value="other">Other</option>
                </select>
                <button
                  onClick={handleAddSkill}
                  className="w-full py-3 bg-orange-500 rounded-xl font-semibold hover:bg-orange-600"
                >
                  Add Skill
                </button>
              </div>
            )}

            {modalType === 'goal' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Goal Title *"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="w-full p-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-blue-500"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  className="w-full p-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                />
                <input
                  type="date"
                  placeholder="Deadline"
                  value={goalForm.deadline}
                  onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                  className="w-full p-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-blue-500"
                />
                <select
                  value={goalForm.status}
                  onChange={(e) => setGoalForm({ ...goalForm, status: e.target.value })}
                  className="w-full p-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <button
                  onClick={handleAddGoal}
                  className="w-full py-3 bg-blue-500 rounded-xl font-semibold hover:bg-blue-600"
                >
                  Add Goal
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
