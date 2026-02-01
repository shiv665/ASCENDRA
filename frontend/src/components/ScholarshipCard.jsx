import { GraduationCap, ExternalLink, Calendar, MapPin, Award, CheckCircle, Clock, Bookmark } from 'lucide-react'

// Beautiful Scholarship Card for AI Search Results - UNIFORM SIZE, NO HOVER
export default function ScholarshipCard({ scholarship, index, onSave, onApply }) {
  const getCategoryColor = (category) => {
    const colors = {
      'merit': 'from-yellow-500 to-orange-500',
      'need-based': 'from-green-500 to-emerald-500',
      'minority': 'from-purple-500 to-indigo-500',
      'women': 'from-pink-500 to-rose-500',
      'sports': 'from-blue-500 to-cyan-500',
      'research': 'from-indigo-500 to-violet-500',
      'government': 'from-emerald-500 to-teal-500',
      'corporate': 'from-gray-500 to-slate-500',
      'stem': 'from-cyan-500 to-blue-500',
    }
    return colors[category?.toLowerCase()] || 'from-purple-500 to-pink-500'
  }

  const getCategoryIcon = (category) => {
    switch(category?.toLowerCase()) {
      case 'merit': return '🏆'
      case 'need-based': return '💰'
      case 'minority': return '🌍'
      case 'women': return '👩‍🎓'
      case 'sports': return '⚽'
      case 'research': return '🔬'
      case 'government': return '🏛️'
      case 'corporate': return '🏢'
      case 'stem': return '💻'
      default: return '🎓'
    }
  }

  return (
    <div className="h-[420px] w-full flex flex-col rounded-2xl overflow-hidden">
      {/* Top accent bar - Fixed height */}
      <div className={`h-1.5 flex-shrink-0 bg-gradient-to-r ${getCategoryColor(scholarship.category)}`} />
      
      <div className="flex-1 bg-dark-800/90 backdrop-blur-xl border border-dark-600 border-t-0 rounded-b-2xl flex flex-col">
        <div className="p-5 flex-1 flex flex-col">
          {/* Header - Fixed height 72px */}
          <div className="flex gap-4 mb-4 h-[72px] flex-shrink-0">
            {/* Icon */}
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getCategoryColor(scholarship.category)} flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}>
              {getCategoryIcon(scholarship.category)}
            </div>
            
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h3 className="font-bold text-white text-lg leading-tight line-clamp-2">
                {scholarship.name}
              </h3>
              <p className="text-dark-400 text-sm mt-1 flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{scholarship.provider || 'Various Providers'}</span>
              </p>
            </div>
          </div>

          {/* Amount Badge - Fixed height 40px */}
          <div className="flex items-center gap-2 mb-4 h-[40px] flex-shrink-0">
            <div className="flex-1">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${getCategoryColor(scholarship.category)} bg-opacity-20 border border-current/20`}>
                <Award className="w-4 h-4 text-green-400" />
                <span className="font-bold text-lg text-green-400">{scholarship.amount || 'Variable'}</span>
              </div>
            </div>
            {scholarship.deadline && scholarship.deadline !== 'Varies' && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex-shrink-0">
                <Clock className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-yellow-400">{scholarship.deadline}</span>
              </div>
            )}
          </div>

          {/* Description - Fixed height 48px */}
          <div className="h-[48px] mb-4 flex-shrink-0">
            {scholarship.description ? (
              <p className="text-dark-300 text-sm line-clamp-2 leading-relaxed">
                {scholarship.description}
              </p>
            ) : (
              <p className="text-dark-500 text-sm italic">No description available</p>
            )}
          </div>

          {/* Tags - Fixed height 28px */}
          <div className="flex flex-wrap gap-2 mb-4 h-[28px] overflow-hidden flex-shrink-0">
            <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getCategoryColor(scholarship.category)} text-white`}>
              {scholarship.category || 'General'}
            </span>
            {scholarship.field && (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs border border-blue-500/30">
                {scholarship.field}
              </span>
            )}
            {scholarship.source && (
              <span className="px-3 py-1 bg-dark-700 text-dark-300 rounded-full text-xs">
                via {scholarship.source}
              </span>
            )}
          </div>

          {/* Eligibility - Fixed height 100px */}
          <div className="h-[100px] mb-4 flex-shrink-0">
            {scholarship.eligibility && scholarship.eligibility.length > 0 ? (
              <div className="h-full p-3 bg-dark-900/50 rounded-xl border border-dark-600 overflow-hidden">
                <p className="text-dark-400 text-xs font-medium mb-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Eligibility Criteria
                </p>
                <ul className="space-y-1.5">
                  {scholarship.eligibility.slice(0, 3).map((criteria, idx) => (
                    <li key={idx} className="text-dark-200 text-xs flex items-start gap-2">
                      <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                      <span className="line-clamp-1">{criteria}</span>
                    </li>
                  ))}
                  {scholarship.eligibility.length > 3 && (
                    <li className="text-dark-400 text-xs">+{scholarship.eligibility.length - 3} more</li>
                  )}
                </ul>
              </div>
            ) : (
              <div className="h-full p-3 bg-dark-900/50 rounded-xl border border-dark-600 flex items-center justify-center">
                <p className="text-dark-500 text-xs italic">Check website for eligibility details</p>
              </div>
            )}
          </div>

          {/* Spacer - takes remaining space */}
          <div className="flex-1" />

          {/* Action Buttons - Always at bottom, fixed height */}
          <div className="flex gap-2 h-[44px] flex-shrink-0">
            {scholarship.applicationUrl ? (
              <a
                href={scholarship.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${getCategoryColor(scholarship.category)} text-white font-semibold text-sm`}
              >
                <ExternalLink className="w-4 h-4" />
                Apply Now
              </a>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-dark-700 text-dark-400 font-semibold text-sm cursor-not-allowed">
                <ExternalLink className="w-4 h-4" />
                No Link Available
              </div>
            )}
            <button
              onClick={() => onSave && onSave(scholarship)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-dark-700 rounded-xl text-sm font-medium border border-dark-600"
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Compact version for saved scholarships list - NO HOVER EFFECTS
export function SavedScholarshipCard({ scholarship, index, status, onAction, onView }) {
  const getStatusStyle = (status) => {
    switch(status) {
      case 'awarded': return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', icon: '🎉' }
      case 'applied': return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', icon: '📨' }
      case 'eligible': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: '⭐' }
      case 'rejected': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', icon: '❌' }
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', icon: '📋' }
    }
  }

  const statusStyle = getStatusStyle(status)

  return (
    <div className={`relative p-4 rounded-xl bg-dark-800/80 border ${statusStyle.border}`}>
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <div className={`w-12 h-12 rounded-xl ${statusStyle.bg} flex items-center justify-center text-xl flex-shrink-0`}>
          {statusStyle.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white line-clamp-1">{scholarship.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${statusStyle.bg} ${statusStyle.text} flex-shrink-0`}>
              {status}
            </span>
          </div>
          
          {scholarship.provider && (
            <p className="text-dark-400 text-sm mt-0.5 truncate">{scholarship.provider}</p>
          )}
          
          <div className="flex items-center gap-3 mt-2">
            <span className="text-green-400 font-bold">
              {typeof scholarship.amount === 'number' ? `₹${scholarship.amount.toLocaleString()}` : scholarship.amount || 'Variable'}
            </span>
            {scholarship.deadline && (
              <span className="text-dark-400 text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(scholarship.deadline).toLocaleDateString()}
              </span>
            )}
          </div>

          {scholarship.amountReceived > 0 && status === 'awarded' && (
            <p className="text-emerald-400 text-sm mt-1 flex items-center gap-1">
              <Award className="w-3 h-3" />
              Received: ₹{scholarship.amountReceived.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
