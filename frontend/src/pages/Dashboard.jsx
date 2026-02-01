import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Brain,
  Briefcase,
  Wallet,
  Users,
  GraduationCap,
  MessageSquare,
  Sparkles,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { useAuthStore } from '../store'
import { SimpleFlipCard, InfoFlipCard } from '../components/FlipCard'

const quickActions = [
  { icon: MessageSquare, label: 'Chat with AI', path: '/dashboard/chat', color: 'bg-primary-500' },
  { icon: Brain, label: 'Mental Health', path: '/dashboard/mental-health', color: 'bg-accent-purple' },
  { icon: GraduationCap, label: 'Academics', path: '/dashboard/academic', color: 'bg-accent-orange' },
  { icon: Wallet, label: 'Finance', path: '/dashboard/finance', color: 'bg-accent-green' },
  { icon: Briefcase, label: 'Career', path: '/dashboard/career', color: 'bg-accent-blue' },
  { icon: Users, label: 'Social', path: '/dashboard/social', color: 'bg-accent-pink' },
]

export default function Dashboard() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Welcome, {user?.name?.split(' ')[0] || 'Student'}! 🌟
            </h1>
            <p className="text-slate-500">
              Start exploring Ascendra's features to enhance your student journey.
            </p>
          </div>
          <Link
            to="/dashboard/chat"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-primary rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <Sparkles size={20} />
            Talk to AI
          </Link>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Explore Features</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={action.path}>
                <SimpleFlipCard
                  icon={action.icon}
                  label={action.label}
                  color={action.color}
                  height="130px"
                />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Getting Started Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
      >
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Getting Started</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Track Your Mood</h3>
            <p className="text-slate-500 text-sm mb-3">
              Log your daily mood and get insights into your mental wellness patterns.
            </p>
            <Link to="/dashboard/mental-health" className="text-purple-600 text-sm hover:underline flex items-center gap-1">
              Start tracking <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Find Scholarships</h3>
            <p className="text-slate-500 text-sm mb-3">
              Discover scholarships that match your profile and apply with AI assistance.
            </p>
            <Link to="/dashboard/finance" className="text-green-600 text-sm hover:underline flex items-center gap-1">
              Browse scholarships <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Build Your Career</h3>
            <p className="text-slate-500 text-sm mb-3">
              Add your skills and find opportunities that match your career goals.
            </p>
            <Link to="/dashboard/career" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
              Add skills <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* AI Chat Prompt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm"
      >
        <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageSquare size={32} />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Need Help Getting Started?</h2>
        <p className="text-slate-500 mb-4 max-w-md mx-auto">
          Chat with Ascendra AI to get personalized guidance on academics, career, finances, or anything else.
        </p>
        <Link
          to="/dashboard/chat"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <MessageSquare size={20} />
          Start Conversation
        </Link>
      </motion.div>
    </div>
  )
}
