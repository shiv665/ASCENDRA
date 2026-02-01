import axios from 'axios'
import { useAuthStore } from '../store'

// Determine API base URL for production vs development
const getBaseURL = () => {
  // In production, use the environment variable
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api`
  }
  // In development, use Vite proxy
  return '/api'
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
}

// Chat APIs
export const chatAPI = {
  sendMessage: (message, conversationId) =>
    api.post('/chat/message', { message, conversationId }),
  getConversations: () => api.get('/chat/conversations'),
  getConversation: (id) => api.get(`/chat/conversations/${id}`),
  createConversation: (title) => api.post('/chat/conversations', { title }),
  deleteConversation: (id) => api.delete(`/chat/conversations/${id}`),
}

// Mental Health APIs
export const mentalHealthAPI = {
  getData: () => api.get('/mental-health'),
  logMood: (data) => api.post('/mental-health/mood', data),
  logIntervention: (data) => api.post('/mental-health/intervention', data),
  addJournal: (content) => api.post('/mental-health/journal', { content }),
  getInsights: () => api.get('/mental-health/insights'),
}

// Career APIs
export const careerAPI = {
  getData: () => api.get('/career'),
  updateSkills: (skills) => api.post('/career/skills', { skills }),
  getOpportunities: () => api.get('/career/opportunities'),
  addOpportunity: (opportunity) => api.post('/career/opportunities', { opportunity }),
  getGapAnalysis: () => api.get('/career/gap-analysis'),
  addProject: (project) => api.post('/career/projects', { project }),
  updateProject: (index, data) => api.put(`/career/projects/${index}`, data),
}

// Finance APIs
export const financeAPI = {
  getData: () => api.get('/finance'),
  getScholarships: () => api.get('/finance/scholarships'),
  addScholarship: (scholarship) => api.post('/finance/scholarships', { scholarship }),
  updateScholarshipStatus: (index, status) =>
    api.put(`/finance/scholarships/${index}/status`, { status }),
  getGigs: () => api.get('/finance/gigs'),
  addGig: (gig) => api.post('/finance/gigs', { gig }),
  updateDebt: (data) => api.put('/finance/debt', data),
  getSubscriptions: () => api.get('/finance/subscriptions'),
  addSubscription: (subscription) => api.post('/finance/subscriptions', { subscription }),
  getSummary: () => api.get('/finance/summary'),
}

// Social APIs
export const socialAPI = {
  getData: () => api.get('/social'),
  getClusters: () => api.get('/social/clusters'),
  createCluster: (cluster) => api.post('/social/clusters', { cluster }),
  getSkillSwaps: () => api.get('/social/skill-swaps'),
  createSkillSwap: (offerSkill, wantSkill) =>
    api.post('/social/skill-swaps', { offerSkill, wantSkill }),
  getGoalRooms: () => api.get('/social/goal-rooms'),
  createGoalRoom: (data) => api.post('/social/goal-rooms', data),
  getLocalResources: () => api.get('/social/local-resources'),
}

// Academic APIs
export const academicAPI = {
  getData: () => api.get('/academic'),
  getTasks: () => api.get('/academic/tasks'),
  addTask: (task) => api.post('/academic/tasks', { task }),
  updateTask: (index, data) => api.put(`/academic/tasks/${index}`, data),
  addSubTask: (taskIndex, subTask) =>
    api.post(`/academic/tasks/${taskIndex}/subtasks`, { subTask }),
  addStudyMaterial: (material) => api.post('/academic/study-materials', { material }),
  getStudySessions: () => api.get('/academic/study-sessions'),
  createStudySession: (session) => api.post('/academic/study-sessions', { session }),
  ethicsCheck: (text) => api.post('/academic/ethics-check', { content: text }),
  getStats: () => api.get('/academic/stats'),
}

// AI Service APIs (direct to Python service)
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000'

export const aiAPI = {
  chat: (message, userId, conversationHistory, userProfile) =>
    axios.post(`${AI_SERVICE_URL}/api/chat`, { message, userId, conversationHistory, userProfile }),
  analyzeMood: (journalEntry, recentMoods) =>
    axios.post(`${AI_SERVICE_URL}/api/analyze-mood`, { journalEntry, recentMoods }),
  analyzeSkills: (currentSkills, targetRole) =>
    axios.post(`${AI_SERVICE_URL}/api/analyze-skills`, { currentSkills, targetRole }),
  matchScholarships: (profile, financialNeed) =>
    axios.post(`${AI_SERVICE_URL}/api/match-scholarships`, { profile, financialNeed }),
  distillContent: (content, contentType, learningStyle) =>
    axios.post(`${AI_SERVICE_URL}/api/distill-content`, { content, contentType, learningStyle }),
  ethicsCheck: (text) => axios.post(`${AI_SERVICE_URL}/api/ethics-check`, { text }),
}

export default api
