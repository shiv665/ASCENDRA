import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Plus, GraduationCap, DollarSign, X, Search, ExternalLink, Sparkles, Globe, Filter, ChevronDown, Loader2, Check, TrendingUp, Receipt, Calendar, Award, Clock, Bookmark, Calculator, Briefcase, CreditCard, FileText, Trash2, PiggyBank } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store'
import api from '../api'
import { StatFlipCard } from '../components/FlipCard'
import ScholarshipCard from '../components/ScholarshipCard'

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000'

export default function Finance() {
  const { user, token } = useAuthStore()
  const [activeTab, setActiveTab] = useState('finder')
  const [scholarships, setScholarships] = useState([])
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState({
    totalScholarshipReceived: 0,
    totalExpenses: 0,
    currentMonthExpenses: 0
  })
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalType, setModalType] = useState('')

  // Scholarship Finder States
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchFilters, setSearchFilters] = useState({
    country: 'India',
    educationLevel: 'undergraduate',
    field: '',
    category: '',
    keywords: ''
  })
  const [tips, setTips] = useState([])
  const [additionalResources, setAdditionalResources] = useState([])

  // Action modal for scholarship workflow
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedScholarship, setSelectedScholarship] = useState(null)
  const [selectedAction, setSelectedAction] = useState('')
  const [awardAmount, setAwardAmount] = useState('')

  // Form states
  const [scholarshipForm, setScholarshipForm] = useState({ name: '', amount: '', deadline: '', status: 'eligible' })
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'other' })

  // Debt Calculator States
  const [loans, setLoans] = useState([])
  const [loanForm, setLoanForm] = useState({ name: '', amount: '', interestRate: '', minPayment: '' })
  const [debtBudget, setDebtBudget] = useState('')
  const [debtStrategy, setDebtStrategy] = useState('avalanche')
  const [debtPlan, setDebtPlan] = useState(null)
  const [debtLoading, setDebtLoading] = useState(false)

  // Micro-Gig States
  const [gigSkills, setGigSkills] = useState('')
  const [gigAvailability, setGigAvailability] = useState('10-15 hours/week')
  const [gigType, setGigType] = useState('online')
  const [gigResults, setGigResults] = useState(null)
  const [gigLoading, setGigLoading] = useState(false)

  // Subscription Audit States
  const [subscriptions, setSubscriptions] = useState([])
  const [subForm, setSubForm] = useState({ name: '', cost: '', frequency: 'monthly', usage: 'medium' })
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [auditResult, setAuditResult] = useState(null)
  const [auditLoading, setAuditLoading] = useState(false)

  // Grant Writer States
  const [grantForm, setGrantForm] = useState({ projectTitle: '', projectDescription: '', grantType: 'research', requestedAmount: '' })
  const [grantResult, setGrantResult] = useState(null)
  const [grantLoading, setGrantLoading] = useState(false)

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [scholarshipsRes, expensesRes, summaryRes] = await Promise.all([
        api.get('/finance/scholarships', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/finance/expenses', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/finance/summary', { headers: { Authorization: `Bearer ${token}` } })
      ])
      setScholarships(scholarshipsRes.data.scholarships || [])
      setExpenses(expensesRes.data.expenses || [])
      setSummary(summaryRes.data.summary || {})
    } catch (error) {
      console.error('Failed to fetch finance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddScholarship = async () => {
    if (!scholarshipForm.name || !scholarshipForm.amount) {
      toast.error('Please fill in required fields')
      return
    }
    try {
      await api.post('/finance/scholarships', {
        scholarship: {
          name: scholarshipForm.name,
          amount: parseFloat(scholarshipForm.amount) || 0,
          deadline: scholarshipForm.deadline ? new Date(scholarshipForm.deadline) : null,
          status: 'eligible'
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Scholarship added!')
      setShowAddModal(false)
      setScholarshipForm({ name: '', amount: '', deadline: '', status: 'eligible' })
      fetchData()
    } catch (error) {
      console.error('Add scholarship error:', error)
      toast.error('Failed to add scholarship')
    }
  }

  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) {
      toast.error('Please fill in required fields')
      return
    }
    try {
      await api.post('/finance/expenses', {
        expense: {
          description: expenseForm.description,
          amount: parseFloat(expenseForm.amount) || 0,
          category: expenseForm.category
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Expense added!')
      setShowAddModal(false)
      setExpenseForm({ description: '', amount: '', category: 'other' })
      fetchData()
    } catch (error) {
      console.error('Add expense error:', error)
      toast.error('Failed to add expense')
    }
  }

  // Update scholarship status (applied/awarded)
  const handleScholarshipAction = async () => {
    if (!selectedScholarship || selectedAction === '') return

    try {
      const payload = { status: selectedAction }
      
      if (selectedAction === 'awarded') {
        payload.amountReceived = parseFloat(awardAmount) || selectedScholarship.amount || 0
      }

      await api.put(`/finance/scholarships/${selectedScholarship.index}/status`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (selectedAction === 'applied') {
        toast.success('Marked as applied! Good luck! 🍀')
      } else if (selectedAction === 'awarded') {
        toast.success(`Congratulations! ₹${payload.amountReceived.toLocaleString()} added to your total! 🎉`)
      }

      setShowActionModal(false)
      setSelectedScholarship(null)
      setSelectedAction('')
      setAwardAmount('')
      fetchData()
    } catch (error) {
      console.error('Update scholarship error:', error)
      toast.error('Failed to update scholarship')
    }
  }

  const openScholarshipAction = (scholarship, index, action) => {
    setSelectedScholarship({ ...scholarship, index })
    setSelectedAction(action)
    setAwardAmount(scholarship.amount?.toString() || '')
    setShowActionModal(true)
  }

  // Search Scholarships from AI Service
  const searchScholarships = async () => {
    setSearchLoading(true)
    setSearchResults([])
    setTips([])
    setAdditionalResources([])
    
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/search-scholarships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: searchFilters.country,
          educationLevel: searchFilters.educationLevel,
          field: searchFilters.field || null,
          category: searchFilters.category || null,
          keywords: searchFilters.keywords || null
        })
      })
      
      const result = await response.json()
      
      if (result.success && result.data) {
        setSearchResults(result.data.scholarships || [])
        setTips(result.data.tips || [])
        setAdditionalResources(result.data.additionalResources || [])
        toast.success(`Found ${result.data.scholarships?.length || 0} scholarships!`)
      } else if (result.rawData) {
        toast.error('Could not parse results. Please try again.')
      } else {
        toast.error('No scholarships found. Try different filters.')
      }
    } catch (error) {
      console.error('Search failed:', error)
      toast.error('Failed to search scholarships. Check if AI service is running.')
    } finally {
      setSearchLoading(false)
    }
  }

  // Save scholarship to user's list
  const saveScholarship = async (scholarship) => {
    if (!token) {
      toast.error('Please login to save scholarships')
      return
    }
    
    try {
      let parsedAmount = 0
      if (scholarship.amount) {
        const numMatch = scholarship.amount.toString().replace(/[₹$,]/g, '').match(/\d+/)
        if (numMatch) parsedAmount = parseInt(numMatch[0])
      }

      const payload = {
        scholarship: {
          name: scholarship.name || 'Unknown Scholarship',
          amount: parsedAmount,
          deadline: null,
          status: 'eligible',
          provider: scholarship.provider || '',
          applicationUrl: scholarship.applicationUrl || '',
          eligibilityCriteria: scholarship.eligibility || []
        }
      }
      
      await api.post('/finance/scholarships', payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Scholarship saved to your list!')
      fetchData()
    } catch (error) {
      console.error('Save scholarship error:', error)
      toast.error('Failed to save scholarship')
    }
  }

  const openModal = (type) => {
    setModalType(type)
    setShowAddModal(true)
  }

  // Debt Calculator Handlers
  const addLoan = () => {
    if (!loanForm.name || !loanForm.amount) {
      toast.error('Please fill in loan name and amount')
      return
    }
    setLoans([...loans, {
      name: loanForm.name,
      amount: parseFloat(loanForm.amount),
      interestRate: parseFloat(loanForm.interestRate) || 12,
      minPayment: parseFloat(loanForm.minPayment) || 0
    }])
    setLoanForm({ name: '', amount: '', interestRate: '', minPayment: '' })
  }

  const removeLoan = (index) => {
    setLoans(loans.filter((_, i) => i !== index))
  }

  const calculateDebtPlan = async () => {
    if (loans.length === 0 || !debtBudget) {
      toast.error('Add loans and enter monthly budget')
      return
    }
    setDebtLoading(true)
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/debt-calculator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loans,
          monthlyBudget: parseFloat(debtBudget),
          strategy: debtStrategy
        })
      })
      const result = await response.json()
      if (result.success) {
        setDebtPlan(result.plan)
        toast.success('Debt repayment plan generated!')
      } else {
        toast.error('Failed to generate plan')
      }
    } catch (error) {
      console.error('Debt calc error:', error)
      toast.error('Failed to connect to AI service')
    } finally {
      setDebtLoading(false)
    }
  }

  // Micro-Gig Handler
  const findMicroGigs = async () => {
    if (!gigSkills) {
      toast.error('Enter your skills')
      return
    }
    setGigLoading(true)
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/micro-gigs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: gigSkills.split(',').map(s => s.trim()),
          availability: gigAvailability,
          preferredType: gigType
        })
      })
      const result = await response.json()
      if (result.success) {
        setGigResults(result.gigs)
        toast.success('Found gig opportunities!')
      } else {
        toast.error('Failed to find gigs')
      }
    } catch (error) {
      console.error('Gig search error:', error)
      toast.error('Failed to connect to AI service')
    } finally {
      setGigLoading(false)
    }
  }

  // Subscription Audit Handlers
  const addSubscription = () => {
    if (!subForm.name || !subForm.cost) {
      toast.error('Enter subscription name and cost')
      return
    }
    setSubscriptions([...subscriptions, {
      name: subForm.name,
      cost: parseFloat(subForm.cost),
      frequency: subForm.frequency,
      usage: subForm.usage
    }])
    setSubForm({ name: '', cost: '', frequency: 'monthly', usage: 'medium' })
  }

  const removeSubscription = (index) => {
    setSubscriptions(subscriptions.filter((_, i) => i !== index))
  }

  const auditSubscriptions = async () => {
    if (subscriptions.length === 0 || !monthlyIncome) {
      toast.error('Add subscriptions and enter monthly income')
      return
    }
    setAuditLoading(true)
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/subscription-audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptions,
          monthlyIncome: parseFloat(monthlyIncome)
        })
      })
      const result = await response.json()
      if (result.success) {
        setAuditResult(result.audit)
        toast.success('Subscription audit complete!')
      } else {
        toast.error('Failed to audit subscriptions')
      }
    } catch (error) {
      console.error('Audit error:', error)
      toast.error('Failed to connect to AI service')
    } finally {
      setAuditLoading(false)
    }
  }

  // Grant Writer Handler
  const generateGrant = async () => {
    if (!grantForm.projectTitle || !grantForm.projectDescription) {
      toast.error('Enter project title and description')
      return
    }
    setGrantLoading(true)
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/grant-writer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: grantForm.projectTitle,
          projectDescription: grantForm.projectDescription,
          grantType: grantForm.grantType,
          requestedAmount: parseFloat(grantForm.requestedAmount) || 0
        })
      })
      const result = await response.json()
      if (result.success) {
        setGrantResult(result.grant)
        toast.success('Grant application generated!')
      } else {
        toast.error('Failed to generate grant')
      }
    } catch (error) {
      console.error('Grant error:', error)
      toast.error('Failed to connect to AI service')
    } finally {
      setGrantLoading(false)
    }
  }

  const tabs = [
    { id: 'finder', label: 'Scholarship Finder', icon: Search },
    { id: 'scholarships', label: 'My Scholarships', icon: GraduationCap },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'debt', label: 'Debt Calculator', icon: Calculator },
    { id: 'gigs', label: 'Micro-Gigs', icon: Briefcase },
    { id: 'subscriptions', label: 'Subscription Audit', icon: CreditCard },
    { id: 'grants', label: 'Grant Writer', icon: FileText },
  ]

  const getStatusColor = (status) => {
    switch(status) {
      case 'awarded': return 'bg-green-500/20 text-green-400'
      case 'applied': return 'bg-blue-500/20 text-blue-400'
      case 'eligible': return 'bg-yellow-500/20 text-yellow-400'
      case 'rejected': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const expenseCategories = [
    { value: 'tuition', label: 'Tuition', emoji: '🎓' },
    { value: 'books', label: 'Books', emoji: '📚' },
    { value: 'housing', label: 'Housing', emoji: '🏠' },
    { value: 'food', label: 'Food', emoji: '🍔' },
    { value: 'transport', label: 'Transport', emoji: '🚌' },
    { value: 'utilities', label: 'Utilities', emoji: '💡' },
    { value: 'entertainment', label: 'Entertainment', emoji: '🎬' },
    { value: 'other', label: 'Other', emoji: '📦' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-green-500" />
            OptiWealth
          </h1>
          <p className="text-slate-600 mt-1">Track scholarships and manage expenses</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatFlipCard
          icon={GraduationCap}
          value={`₹${(summary.totalScholarshipReceived || 0).toLocaleString()}`}
          label="Total Scholarship Received"
          hoverInfo={`${scholarships.filter(s => s.status === 'awarded').length} scholarships awarded`}
          color="bg-green-500/30"
          iconColor="text-green-400"
        />
        <StatFlipCard
          icon={TrendingUp}
          value={scholarships.length}
          label="Scholarships Tracked"
          hoverInfo={`${scholarships.filter(s => s.status === 'applied').length} applied`}
          color="bg-blue-500/30"
          iconColor="text-blue-400"
        />
        <StatFlipCard
          icon={DollarSign}
          value={`₹${(summary.currentMonthExpenses || 0).toLocaleString()}`}
          label="This Month's Expenses"
          hoverInfo={`Total: ₹${(summary.totalExpenses || 0).toLocaleString()}`}
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
                ? 'bg-green-500 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'finder' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Search Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">AI Scholarship Finder</h2>
                <p className="text-slate-500 text-sm">Find scholarships from Buddy4Study, NSP & more</p>
              </div>
            </div>

            {/* Quick Search */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search keywords (e.g., 'engineering merit scholarship')"
                  value={searchFilters.keywords}
                  onChange={(e) => setSearchFilters({ ...searchFilters, keywords: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && searchScholarships()}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all ${
                  showFilters ? 'bg-purple-500/20 text-purple-600 border border-purple-500/30' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Filter className="w-5 h-5" />
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={searchScholarships}
                disabled={searchLoading}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {searchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                Search
              </button>
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid md:grid-cols-4 gap-4 overflow-hidden"
                >
                  <div>
                    <label className="text-slate-500 text-sm mb-1 block">Country</label>
                    <select
                      value={searchFilters.country}
                      onChange={(e) => setSearchFilters({ ...searchFilters, country: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 text-slate-900"
                    >
                      <option value="India">India</option>
                      <option value="USA">USA</option>
                      <option value="UK">UK</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 text-sm mb-1 block">Education Level</label>
                    <select
                      value={searchFilters.educationLevel}
                      onChange={(e) => setSearchFilters({ ...searchFilters, educationLevel: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 text-slate-900"
                    >
                      <option value="high-school">High School</option>
                      <option value="undergraduate">Undergraduate</option>
                      <option value="postgraduate">Postgraduate</option>
                      <option value="phd">PhD/Doctorate</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 text-sm mb-1 block">Field of Study</label>
                    <select
                      value={searchFilters.field}
                      onChange={(e) => setSearchFilters({ ...searchFilters, field: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 text-slate-900"
                    >
                      <option value="">All Fields</option>
                      <option value="engineering">Engineering</option>
                      <option value="medical">Medical/Healthcare</option>
                      <option value="science">Science</option>
                      <option value="arts">Arts & Humanities</option>
                      <option value="commerce">Commerce/Business</option>
                      <option value="law">Law</option>
                      <option value="agriculture">Agriculture</option>
                      <option value="computer-science">Computer Science</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 text-sm mb-1 block">Category</label>
                    <select
                      value={searchFilters.category}
                      onChange={(e) => setSearchFilters({ ...searchFilters, category: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 text-slate-900"
                    >
                      <option value="">All Categories</option>
                      <option value="merit">Merit-based</option>
                      <option value="need-based">Need-based</option>
                      <option value="minority">Minority</option>
                      <option value="women">Women</option>
                      <option value="sports">Sports</option>
                      <option value="research">Research</option>
                      <option value="government">Government</option>
                      <option value="corporate">Corporate</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Results */}
          {searchLoading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Searching Scholarships...</h3>
              <p className="text-slate-500">AI is finding the best scholarships for you</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-500" />
                  Found {searchResults.length} Scholarships
                </h3>
                <span className="text-slate-500 text-sm">AI-Powered Search</span>
              </div>
              <div className="grid md:grid-cols-2 gap-6 auto-rows-fr">
                {searchResults.map((scholarship, i) => (
                  <ScholarshipCard
                    key={i}
                    scholarship={scholarship}
                    index={i}
                    onSave={() => saveScholarship(scholarship)}
                  />
                ))}
              </div>

              {/* Tips Section */}
              {tips.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mt-6">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Application Tips
                  </h4>
                  <ul className="space-y-2">
                    {tips.map((tip, i) => (
                      <li key={i} className="text-slate-600 text-sm flex items-start gap-2">
                        <span className="text-amber-500">💡</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Additional Resources */}
              {additionalResources.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-500" />
                    Additional Resources
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {additionalResources.map((resource, i) => (
                      <a
                        key={i}
                        href={resource.startsWith('http') ? resource : `https://${resource}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {resource}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Find Your Perfect Scholarship</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                Search from thousands of scholarships across Buddy4Study, National Scholarship Portal, and more.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => { setSearchFilters({ ...searchFilters, country: 'India', category: 'government' }); searchScholarships(); }}
                  className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-200"
                >
                  🇮🇳 Indian Government
                </button>
                <button
                  onClick={() => { setSearchFilters({ ...searchFilters, category: 'merit' }); searchScholarships(); }}
                  className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-200"
                >
                  🏆 Merit-based
                </button>
                <button
                  onClick={() => { setSearchFilters({ ...searchFilters, field: 'engineering' }); searchScholarships(); }}
                  className="px-4 py-2 bg-dark-700 rounded-lg text-sm hover:bg-dark-600"
                >
                  ⚙️ Engineering
                </button>
                <button
                  onClick={() => { setSearchFilters({ ...searchFilters, category: 'women' }); searchScholarships(); }}
                  className="px-4 py-2 bg-dark-700 rounded-lg text-sm hover:bg-dark-600"
                >
                  👩 Women Scholarships
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'scholarships' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Scholarships</h2>
            <button
              onClick={() => openModal('scholarship')}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 rounded-xl hover:bg-green-600"
            >
              <Plus className="w-4 h-4" />
              Add Scholarship
            </button>
          </div>

          {scholarships.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {scholarships.map((s, i) => (
                <div key={i} className="glass rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{s.name}</h3>
                      {s.provider && <p className="text-dark-400 text-sm">{s.provider}</p>}
                      <p className="text-green-400 font-bold mt-1">
                        {typeof s.amount === 'number' ? `₹${s.amount.toLocaleString()}` : s.amount}
                      </p>
                      {s.amountReceived > 0 && s.status === 'awarded' && (
                        <p className="text-emerald-400 text-sm">
                          Received: ₹{s.amountReceived.toLocaleString()}
                        </p>
                      )}
                      {s.deadline && (
                        <p className="text-dark-400 text-sm">Deadline: {new Date(s.deadline).toLocaleDateString()}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusColor(s.status)}`}>
                      {s.status}
                    </span>
                  </div>

                  {/* Action Buttons based on status */}
                  <div className="flex gap-2 mt-4">
                    {s.applicationUrl && (
                      <a
                        href={s.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 flex-1 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 text-sm font-medium transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View
                      </a>
                    )}
                    
                    {s.status === 'eligible' && (
                      <button
                        onClick={() => openScholarshipAction(s, i, 'applied')}
                        className="flex items-center justify-center gap-2 flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Mark Applied
                      </button>
                    )}
                    
                    {s.status === 'applied' && (
                      <button
                        onClick={() => openScholarshipAction(s, i, 'awarded')}
                        className="flex items-center justify-center gap-2 flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium transition-colors"
                      >
                        <GraduationCap className="w-4 h-4" />
                        Got Scholarship!
                      </button>
                    )}
                    
                    {s.status === 'applied' && (
                      <button
                        onClick={() => openScholarshipAction(s, i, 'rejected')}
                        className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm font-medium transition-colors"
                      >
                        Rejected
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center">
              <GraduationCap className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No scholarships tracked</h3>
              <p className="text-dark-400 mb-4">Add scholarships you're applying for or search for new ones.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => openModal('scholarship')}
                  className="px-6 py-2 bg-green-500 rounded-xl hover:bg-green-600"
                >
                  Add Manually
                </button>
                <button
                  onClick={() => setActiveTab('finder')}
                  className="px-6 py-2 bg-purple-500 rounded-xl hover:bg-purple-600"
                >
                  Find Scholarships
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'expenses' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Monthly Expenses</h2>
            <button
              onClick={() => openModal('expense')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 rounded-xl hover:bg-purple-600"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>

          {/* Expense Summary */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/30 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-dark-400 text-sm">Balance (Scholarships - Expenses)</p>
                  <p className={`text-2xl font-bold ${(summary.totalScholarshipReceived - summary.totalExpenses) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ₹{((summary.totalScholarshipReceived || 0) - (summary.totalExpenses || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-dark-400 text-sm">Total Expenses</p>
                <p className="text-xl font-semibold text-purple-400">₹{(summary.totalExpenses || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.slice().reverse().map((exp, i) => {
                const category = expenseCategories.find(c => c.value === exp.category) || expenseCategories[7]
                return (
                  <div key={i} className="glass rounded-xl p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.emoji}</span>
                      <div>
                        <h3 className="font-semibold">{exp.description}</h3>
                        <p className="text-dark-400 text-sm capitalize">{category.label} • {new Date(exp.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-purple-400 font-bold">-₹{exp.amount?.toLocaleString()}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center">
              <Receipt className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No expenses tracked</h3>
              <p className="text-dark-400 mb-4">Track your monthly expenses to manage your scholarship funds better.</p>
              <button
                onClick={() => openModal('expense')}
                className="px-6 py-2 bg-purple-500 rounded-xl hover:bg-purple-600"
              >
                Add Your First Expense
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Debt Calculator Tab */}
      {activeTab === 'debt' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Debt-Burn Rate Calculator</h2>
                <p className="text-slate-500 text-sm">Plan your optimal debt repayment strategy</p>
              </div>
            </div>

            {/* Add Loan Form */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <input
                type="text"
                placeholder="Loan name"
                value={loanForm.name}
                onChange={(e) => setLoanForm({ ...loanForm, name: e.target.value })}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-900 placeholder:text-slate-400"
              />
              <input
                type="number"
                placeholder="Amount (₹)"
                value={loanForm.amount}
                onChange={(e) => setLoanForm({ ...loanForm, amount: e.target.value })}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-900 placeholder:text-slate-400"
              />
              <input
                type="number"
                placeholder="Interest %"
                value={loanForm.interestRate}
                onChange={(e) => setLoanForm({ ...loanForm, interestRate: e.target.value })}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-900 placeholder:text-slate-400"
              />
              <button
                onClick={addLoan}
                className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {/* Loans List */}
            {loans.length > 0 && (
              <div className="space-y-2 mb-4">
                {loans.map((loan, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <span className="font-medium text-slate-900">{loan.name}</span>
                      <span className="text-slate-500 ml-2">₹{loan.amount.toLocaleString()} @ {loan.interestRate}%</span>
                    </div>
                    <button onClick={() => removeLoan(i)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Strategy & Budget */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-slate-500 text-sm mb-1 block">Monthly Budget</label>
                <input
                  type="number"
                  placeholder="₹5000"
                  value={debtBudget}
                  onChange={(e) => setDebtBudget(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-500 text-sm mb-1 block">Strategy</label>
                <select
                  value={debtStrategy}
                  onChange={(e) => setDebtStrategy(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-900"
                >
                  <option value="avalanche">Avalanche (Highest Interest First)</option>
                  <option value="snowball">Snowball (Smallest Balance First)</option>
                </select>
              </div>
            </div>

            <button
              onClick={calculateDebtPlan}
              disabled={debtLoading}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {debtLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Calculating...</> : '📊 Calculate Payoff Plan'}
            </button>
          </div>

          {/* Debt Plan Results */}
          {debtPlan && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Your Debt Freedom Plan</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-green-600">{debtPlan.estimatedPayoffMonths || 0}</p>
                  <p className="text-green-700 text-sm">Months to Freedom</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-blue-600">₹{(debtPlan.totalInterestSaved || 0).toLocaleString()}</p>
                  <p className="text-blue-700 text-sm">Interest Saved</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl text-center">
                  <p className="text-xl font-bold text-purple-600">{debtPlan.debtFreeDate || 'N/A'}</p>
                  <p className="text-purple-700 text-sm">Debt-Free Date</p>
                </div>
              </div>

              {debtPlan.paymentOrder && (
                <div className="mb-4">
                  <h4 className="font-semibold text-slate-900 mb-2">Payment Priority Order:</h4>
                  <div className="flex flex-wrap gap-2">
                    {debtPlan.paymentOrder.map((loan, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm">
                        {i + 1}. {loan}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {debtPlan.tips && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <h4 className="font-semibold text-amber-800 mb-2">💡 Money-Saving Tips</h4>
                  <ul className="text-amber-700 text-sm space-y-1">
                    {debtPlan.tips.map((tip, i) => <li key={i}>• {tip}</li>)}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Micro-Gigs Tab */}
      {activeTab === 'gigs' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Micro-Gig Aggregator</h2>
                <p className="text-slate-500 text-sm">Find side hustles that match your skills</p>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your skills (comma-separated, e.g., Python, Writing, Design)"
                value={gigSkills}
                onChange={(e) => setGigSkills(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={gigAvailability}
                  onChange={(e) => setGigAvailability(e.target.value)}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900"
                >
                  <option value="5-10 hours/week">5-10 hours/week</option>
                  <option value="10-15 hours/week">10-15 hours/week</option>
                  <option value="15-20 hours/week">15-20 hours/week</option>
                  <option value="20+ hours/week">20+ hours/week</option>
                </select>
                <select
                  value={gigType}
                  onChange={(e) => setGigType(e.target.value)}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900"
                >
                  <option value="online">Online Only</option>
                  <option value="offline">Offline Only</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <button
                onClick={findMicroGigs}
                disabled={gigLoading}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {gigLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Finding Gigs...</> : '💼 Find Gig Opportunities'}
              </button>
            </div>
          </div>

          {/* Gig Results */}
          {gigResults && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {gigResults.weeklyEarningEstimate && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-green-700 text-sm">Estimated Weekly Earnings</p>
                  <p className="text-2xl font-bold text-green-600">{gigResults.weeklyEarningEstimate}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {gigResults.gigs?.map((gig, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{gig.title}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded ${gig.type === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {gig.type}
                      </span>
                    </div>
                    <p className="text-teal-600 font-medium text-sm mb-2">{gig.platform} • {gig.earningPotential}</p>
                    <p className="text-slate-600 text-sm mb-2">{gig.howToStart}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Match:</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full">
                        <div className="h-2 bg-teal-500 rounded-full" style={{ width: `${gig.skillMatch || 70}%` }}></div>
                      </div>
                      <span className="text-xs font-medium text-teal-600">{gig.skillMatch || 70}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {gigResults.tips && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <h4 className="font-semibold text-amber-800 mb-2">💡 Pro Tips</h4>
                  <ul className="text-amber-700 text-sm space-y-1">
                    {gigResults.tips.map((tip, i) => <li key={i}>• {tip}</li>)}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Subscription Audit Tab */}
      {activeTab === 'subscriptions' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Subscription Audit</h2>
                <p className="text-slate-500 text-sm">Find and eliminate wasteful subscriptions</p>
              </div>
            </div>

            {/* Add Subscription Form */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <input
                type="text"
                placeholder="Service name"
                value={subForm.name}
                onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-pink-500 text-slate-900 placeholder:text-slate-400"
              />
              <input
                type="number"
                placeholder="Cost (₹)"
                value={subForm.cost}
                onChange={(e) => setSubForm({ ...subForm, cost: e.target.value })}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-pink-500 text-slate-900 placeholder:text-slate-400"
              />
              <select
                value={subForm.usage}
                onChange={(e) => setSubForm({ ...subForm, usage: e.target.value })}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-pink-500 text-slate-900"
              >
                <option value="high">High Usage</option>
                <option value="medium">Medium Usage</option>
                <option value="low">Low Usage</option>
                <option value="rarely">Rarely Used</option>
              </select>
              <button
                onClick={addSubscription}
                className="px-4 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {/* Subscriptions List */}
            {subscriptions.length > 0 && (
              <div className="space-y-2 mb-4">
                {subscriptions.map((sub, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <span className="font-medium text-slate-900">{sub.name}</span>
                      <span className="text-slate-500 ml-2">₹{sub.cost}/{sub.frequency}</span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded ${sub.usage === 'high' ? 'bg-green-100 text-green-700' : sub.usage === 'low' ? 'bg-yellow-100 text-yellow-700' : sub.usage === 'rarely' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                        {sub.usage}
                      </span>
                    </div>
                    <button onClick={() => removeSubscription(i)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Monthly Income */}
            <div className="mb-4">
              <label className="text-slate-500 text-sm mb-1 block">Monthly Income / Allowance</label>
              <input
                type="number"
                placeholder="₹15000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-pink-500 text-slate-900"
              />
            </div>

            <button
              onClick={auditSubscriptions}
              disabled={auditLoading}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {auditLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Auditing...</> : '🔍 Audit My Subscriptions'}
            </button>
          </div>

          {/* Audit Results */}
          {auditResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className={`p-4 rounded-xl border ${auditResult.verdict === 'healthy' ? 'bg-green-50 border-green-200' : auditResult.verdict === 'concerning' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Monthly Subscription Spend</p>
                    <p className="text-2xl font-bold text-slate-900">₹{auditResult.totalMonthly?.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Potential Yearly Savings</p>
                    <p className="text-2xl font-bold text-green-600">₹{(auditResult.yearlyImpact || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {auditResult.subscriptions?.map((sub, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900">{sub.name}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${sub.recommendation === 'keep' ? 'bg-green-100 text-green-700' : sub.recommendation === 'cancel' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {sub.recommendation?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-1">{sub.reason}</p>
                    {sub.alternative && <p className="text-blue-600 text-sm">💡 Alternative: {sub.alternative}</p>}
                    {sub.potentialSaving > 0 && <p className="text-green-600 text-sm font-medium">Save ₹{sub.potentialSaving}/month</p>}
                  </div>
                ))}
              </div>

              {auditResult.studentDiscounts && auditResult.studentDiscounts.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="font-semibold text-blue-800 mb-2">🎓 Student Discounts Available</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    {auditResult.studentDiscounts.map((disc, i) => <li key={i}>• {disc}</li>)}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Grant Writer Tab */}
      {activeTab === 'grants' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Grant Writing Assistant</h2>
                <p className="text-slate-500 text-sm">AI-powered grant application generator</p>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Project Title"
                value={grantForm.projectTitle}
                onChange={(e) => setGrantForm({ ...grantForm, projectTitle: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
              />
              
              <textarea
                placeholder="Project Description (what you want to do and why)"
                value={grantForm.projectDescription}
                onChange={(e) => setGrantForm({ ...grantForm, projectDescription: e.target.value })}
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 placeholder:text-slate-400 resize-none"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-500 text-sm mb-1 block">Grant Type</label>
                  <select
                    value={grantForm.grantType}
                    onChange={(e) => setGrantForm({ ...grantForm, grantType: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900"
                  >
                    <option value="research">Research Grant</option>
                    <option value="project">Project Funding</option>
                    <option value="startup">Startup/Innovation</option>
                    <option value="community">Community Service</option>
                    <option value="education">Educational</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 text-sm mb-1 block">Requested Amount</label>
                  <input
                    type="number"
                    placeholder="₹50000"
                    value={grantForm.requestedAmount}
                    onChange={(e) => setGrantForm({ ...grantForm, requestedAmount: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900"
                  />
                </div>
              </div>

              <button
                onClick={generateGrant}
                disabled={grantLoading}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {grantLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : '✨ Generate Grant Application'}
              </button>
            </div>
          </div>

          {/* Grant Result */}
          {grantResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{grantResult.title}</h3>
                <div className="p-4 bg-indigo-50 rounded-xl">
                  <h4 className="font-semibold text-indigo-800 mb-1">Executive Summary</h4>
                  <p className="text-indigo-700 text-sm">{grantResult.executiveSummary}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Problem Statement</h4>
                <p className="text-slate-600">{grantResult.problemStatement}</p>
              </div>

              {grantResult.objectives && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Objectives</h4>
                  <ul className="space-y-1">
                    {grantResult.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-600">
                        <span className="text-indigo-500 mt-1">✓</span> {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {grantResult.timeline && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Timeline</h4>
                  <div className="space-y-2">
                    {grantResult.timeline.map((phase, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <span className="px-3 py-1 bg-indigo-500 text-white rounded text-sm font-medium">{phase.phase}</span>
                        <span className="text-slate-500">{phase.duration}</span>
                        <span className="text-slate-700">{phase.activities}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {grantResult.budgetBreakdown && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Budget Breakdown</h4>
                  <div className="space-y-2">
                    {grantResult.budgetBreakdown.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div>
                          <span className="font-medium text-slate-900">{item.category}</span>
                          <p className="text-slate-500 text-sm">{item.justification}</p>
                        </div>
                        <span className="font-bold text-indigo-600">₹{item.amount?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {grantResult.tips && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <h4 className="font-semibold text-amber-800 mb-2">💡 Grant Writing Tips</h4>
                  <ul className="text-amber-700 text-sm space-y-1">
                    {grantResult.tips.map((tip, i) => <li key={i}>• {tip}</li>)}
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

            {modalType === 'scholarship' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Scholarship Name *"
                  value={scholarshipForm.name}
                  onChange={(e) => setScholarshipForm({ ...scholarshipForm, name: e.target.value })}
                  className="w-full p-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-green-500"
                />
                <input
                  type="number"
                  placeholder="Amount (₹) *"
                  value={scholarshipForm.amount}
                  onChange={(e) => setScholarshipForm({ ...scholarshipForm, amount: e.target.value })}
                  className="w-full p-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-green-500"
                />
                <input
                  type="date"
                  placeholder="Deadline"
                  value={scholarshipForm.deadline}
                  onChange={(e) => setScholarshipForm({ ...scholarshipForm, deadline: e.target.value })}
                  className="w-full p-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-green-500"
                />
                <button
                  onClick={handleAddScholarship}
                  className="w-full py-3 bg-green-500 rounded-xl font-semibold hover:bg-green-600"
                >
                  Add Scholarship
                </button>
              </div>
            )}

            {modalType === 'expense' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Description *"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full p-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500"
                />
                <input
                  type="number"
                  placeholder="Amount (₹) *"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full p-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500"
                />
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full p-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500"
                >
                  {expenseCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddExpense}
                  className="w-full py-3 bg-purple-500 rounded-xl font-semibold hover:bg-purple-600"
                >
                  Add Expense
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Scholarship Action Modal */}
      {showActionModal && selectedScholarship && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedAction === 'applied' && 'Mark as Applied'}
                {selectedAction === 'awarded' && '🎉 Congratulations!'}
                {selectedAction === 'rejected' && 'Mark as Rejected'}
              </h2>
              <button onClick={() => setShowActionModal(false)} className="p-2 hover:bg-dark-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-dark-800 rounded-xl">
                <h3 className="font-semibold">{selectedScholarship.name}</h3>
                <p className="text-green-400 text-lg font-bold mt-1">
                  ₹{selectedScholarship.amount?.toLocaleString() || 0}
                </p>
              </div>

              {selectedAction === 'applied' && (
                <p className="text-dark-400 text-sm">
                  Mark this scholarship as applied. You'll be able to update the status once you receive a response.
                </p>
              )}

              {selectedAction === 'awarded' && (
                <div className="space-y-3">
                  <p className="text-dark-400 text-sm">
                    Great news! Enter the amount you received (we've pre-filled the expected amount):
                  </p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">₹</span>
                    <input
                      type="number"
                      value={awardAmount}
                      onChange={(e) => setAwardAmount(e.target.value)}
                      className="w-full p-3 pl-8 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-green-500 text-lg font-semibold"
                    />
                  </div>
                </div>
              )}

              {selectedAction === 'rejected' && (
                <p className="text-dark-400 text-sm">
                  We're sorry to hear that. Don't give up - there are many more opportunities out there!
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 py-3 bg-dark-700 rounded-xl font-semibold hover:bg-dark-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScholarshipAction}
                  className={`flex-1 py-3 rounded-xl font-semibold ${
                    selectedAction === 'awarded' ? 'bg-green-500 hover:bg-green-600' :
                    selectedAction === 'rejected' ? 'bg-red-500 hover:bg-red-600' :
                    'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
