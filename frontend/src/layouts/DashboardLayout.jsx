import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
  LayoutDashboard,
  MessageSquare,
  Brain,
  Briefcase,
  Wallet,
  Users,
  GraduationCap,
  LogOut,
  Plus,
} from 'lucide-react'
import { useAuthStore } from '../store'
import clsx from 'clsx'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'from-blue-500 to-cyan-500', exact: true },
  { path: '/dashboard/chat', icon: MessageSquare, label: 'AI Chat', color: 'from-purple-500 to-pink-500' },
  { path: '/dashboard/mental-health', icon: Brain, label: 'Neural Guardian', color: 'from-violet-500 to-purple-500' },
  { path: '/dashboard/career', icon: Briefcase, label: 'Career Syncer', color: 'from-blue-500 to-indigo-500' },
  { path: '/dashboard/finance', icon: Wallet, label: 'Scholarship Hunter', color: 'from-green-500 to-emerald-500' },
  { path: '/dashboard/social', icon: Users, label: 'Peer-Mesh', color: 'from-pink-500 to-rose-500' },
  { path: '/dashboard/academic', icon: GraduationCap, label: 'Academic Catalyst', color: 'from-orange-500 to-amber-500' },
]

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const [fabOpen, setFabOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#fefcf3] via-[#f5f0e8] to-[#fff9ed]">
      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Top Bar */}
        <header className="glass h-16 flex items-center justify-between px-6 border-b border-amber-200/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="text-xl">🔆</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-gradient">Ascendra</h1>
              <p className="text-xs text-amber-700">Welcome, {user?.name?.split(' ')[0] || 'Student'} 👋</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all">
              <span className="text-lg">{user?.name?.[0] || '👤'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-amber-700 hover:text-red-500"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[80%] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Floating Action Button - Mobile & Desktop */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* FAB Menu Items */}
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-16 right-0 mb-2"
            >
              <div className="flex flex-col gap-3 items-end">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: 20, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: 20, y: 10 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative flex items-center gap-3"
                  >
                    {/* Label */}
                    <motion.span
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white backdrop-blur-sm rounded-lg border border-slate-200 shadow-lg whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                    
                    {/* Icon Button with Isometric Effect */}
                    <NavLink
                      to={item.path}
                      end={item.exact}
                      onClick={() => setFabOpen(false)}
                      className="relative group/btn"
                    >
                      {/* Shadow layers for isometric effect */}
                      <span className="absolute inset-0 w-12 h-12 rounded-full bg-white/5 opacity-0 group-hover/btn:opacity-20 transition-all duration-300" />
                      <span className="absolute inset-0 w-12 h-12 rounded-full bg-white/5 opacity-0 group-hover/btn:opacity-40 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-all duration-300" />
                      <span className="absolute inset-0 w-12 h-12 rounded-full bg-white/5 opacity-0 group-hover/btn:opacity-60 group-hover/btn:translate-x-2 group-hover/btn:-translate-y-2 transition-all duration-300" />
                      
                      {/* Main icon */}
                      <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg transition-all duration-300 group-hover/btn:translate-x-3 group-hover/btn:-translate-y-3 group-hover/btn:shadow-xl`}
                        style={{
                          boxShadow: 'inset 0 0 20px rgba(255,255,255,0.3), inset 0 0 5px rgba(255,255,255,0.5), 0 5px 15px rgba(0,0,0,0.3)'
                        }}
                      >
                        <item.icon size={20} className="text-white" />
                      </div>
                    </NavLink>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          onClick={() => setFabOpen(!fabOpen)}
          whileTap={{ scale: 0.9 }}
          className="relative group w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-2xl transition-all duration-300"
          style={{
            boxShadow: fabOpen 
              ? 'inset 0 0 20px rgba(255,255,255,0.3), 0 0 30px rgba(168,85,247,0.5), 0 10px 40px rgba(0,0,0,0.4)'
              : 'inset 0 0 20px rgba(255,255,255,0.3), 0 5px 20px rgba(0,0,0,0.3)'
          }}
        >
          <motion.div
            animate={{ rotate: fabOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus size={24} className="text-white" />
          </motion.div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300" />
        </motion.button>
      </div>
    </div>
  )
}
