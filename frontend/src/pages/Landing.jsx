import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Brain,
  Briefcase,
  Wallet,
  Users,
  GraduationCap,
  ArrowRight,
  Sparkles,
  Heart,
  Target,
  Shield,
} from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'Neural Guardian',
    subtitle: 'Mental Health',
    description: 'Proactive check-ins, mood tracking, and crisis support when you need it most.',
    gradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-500/20',
    iconColor: '#8b5cf6',
  },
  {
    icon: Briefcase,
    title: 'Skill Syncer',
    subtitle: 'Career Growth',
    description: 'Real-time skill gap analysis and personalized career roadmaps.',
    gradient: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-500/20',
    iconColor: '#3b82f6',
  },
  {
    icon: Wallet,
    title: 'Scholarship Hunter',
    subtitle: 'Financial Aid',
    description: 'Auto-matching scholarships and smart financial planning.',
    gradient: 'from-emerald-500 to-green-500',
    iconBg: 'bg-emerald-500/20',
    iconColor: '#10b981',
  },
  {
    icon: Users,
    title: 'Peer Mesh',
    subtitle: 'Community',
    description: 'Connect with study groups and skill-swap with peers.',
    gradient: 'from-pink-500 to-rose-500',
    iconBg: 'bg-pink-500/20',
    iconColor: '#ec4899',
  },
  {
    icon: GraduationCap,
    title: 'Academic Catalyst',
    subtitle: 'Study Smart',
    description: 'AI flashcards, deadline management, and learning optimization.',
    gradient: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-500/20',
    iconColor: '#f59e0b',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800">Ascendra</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Badge */}
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-4 leading-tight">
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Ascendra
              </span>
            </h1>
            <p className="text-lg text-slate-500 italic mb-8">
              "To Rise, To Climb, To Transcend"
            </p>

            {/* Vision Statement */}
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Ascendra addresses the interconnected "Polycrisis" of modern education — 
              breaking the cycle of stress, anxiety, and academic failure.
            </p>

            {/* Crisis Flow Visual */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="inline-flex flex-wrap items-center justify-center gap-2 px-6 py-3 bg-slate-100 rounded-2xl text-slate-600 text-sm font-mono mb-10"
            >
              <span className="text-red-500">Financial Stress</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="text-amber-500">Anxiety</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="text-orange-500">Academic Failure</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="text-rose-500">Career Crisis</span>
            </motion.div>

            {/* Tagline */}
            <p className="text-lg text-slate-700 font-medium mb-10">
              We ensure <span className="text-violet-600">no student falls through the cracks</span>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-xl shadow-violet-500/25 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-semibold text-lg hover:border-violet-300 hover:text-violet-600 transition-all flex items-center justify-center gap-2"
              >
                <Shield className="w-5 h-5" />
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Five Pillars of Support
            </h2>
            <p className="text-slate-600 text-lg max-w-xl mx-auto">
              A holistic approach to student success, powered by intelligent AI agents.
            </p>
          </motion.div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="h-full bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6" style={{ color: feature.iconColor }} />
                  </div>
                  
                  {/* Subtitle */}
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                    {feature.subtitle}
                  </p>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Special Card - AI Chat */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="md:col-span-2 lg:col-span-1"
            >
              <Link to="/register" className="block h-full">
                <div className="h-full bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-6 text-white hover:shadow-xl hover:shadow-violet-500/25 hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                    <Target className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-violet-200">
                    Get Started
                  </p>
                  <h3 className="text-xl font-bold mb-2">
                    Try Ascendra Free
                  </h3>
                  <p className="text-violet-100 text-sm leading-relaxed mb-4">
                    Join thousands of students transforming their academic journey.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    Start Now <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-800">Ascendra</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2026 Ascendra. Your beacon in the storm. ❤️
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
