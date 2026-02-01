import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, GraduationCap, ArrowRight, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store'
import { authAPI } from '../api'
import ParticleBackground from '../components/ParticleBackground'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: '',
    course: '',
    year: 1,
    isFirstGen: false,
    isMigrant: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { data } = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        profile: {
          college: formData.college,
          course: formData.course,
          year: formData.year,
          isFirstGen: formData.isFirstGen,
          isMigrant: formData.isMigrant,
        },
      })
      login(data.user, data.token)
      toast.success('Welcome to Ascendra!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <ParticleBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
            <span className="text-2xl">🚀</span>
          </div>
          <span className="font-bold text-2xl text-gradient">Ascendra</span>
        </Link>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">Create Account</h1>
          <p className="text-slate-500 text-center mb-8">
            {step === 1 ? 'Start with your basic info' : 'Tell us about your studies'}
          </p>

          {/* Progress */}
          <div className="flex gap-2 mb-8">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-violet-500' : 'bg-slate-200'}`} />
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-violet-500' : 'bg-slate-200'}`} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <>
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 transition-colors text-slate-900 placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 transition-colors text-slate-900 placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 transition-colors text-slate-900 placeholder:text-slate-400"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 transition-colors text-slate-900 placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-gradient-primary rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  Continue
                  <ArrowRight size={20} />
                </button>
              </>
            ) : (
              <>
                {/* College */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">College/University</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      name="college"
                      value={formData.college}
                      onChange={handleChange}
                      placeholder="Your Institution"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 transition-colors text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Course & Year */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Course</label>
                    <input
                      type="text"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      placeholder="B.Tech CS"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 transition-colors text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 transition-colors text-slate-900"
                    >
                      {[1, 2, 3, 4, 5].map((y) => (
                        <option key={y} value={y}>Year {y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Special Categories */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isFirstGen"
                      checked={formData.isFirstGen}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-slate-300 bg-slate-50 text-violet-500 focus:ring-violet-500"
                    />
                    <span className="text-sm text-slate-700">I'm a first-generation college student</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isMigrant"
                      checked={formData.isMigrant}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-slate-300 bg-slate-50 text-violet-500 focus:ring-violet-500"
                    />
                    <span className="text-sm text-slate-700">I'm studying away from my home city</span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-gradient-primary rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Create Account
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Login Link */}
          <p className="text-center mt-6 text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
