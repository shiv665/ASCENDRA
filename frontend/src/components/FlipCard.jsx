import { motion } from 'framer-motion'

/**
 * FlipCard Component - A beautiful 3D flip card with animated background
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon component to show on back
 * @param {string} props.title - Title text
 * @param {string} props.description - Description text
 * @param {string} props.badge - Optional badge text
 * @param {string} props.stats - Optional stats text
 * @param {string} props.gradientFrom - Gradient start color (tailwind class)
 * @param {string} props.gradientTo - Gradient end color (tailwind class)
 * @param {string} props.height - Card height (default: 280px)
 * @param {function} props.onClick - Optional click handler
 * @param {React.ReactNode} props.children - Optional children for custom front content
 * @param {React.ReactNode} props.backContent - Optional custom back content
 */
export default function FlipCard({
  icon: Icon,
  title,
  description,
  badge,
  stats,
  gradientFrom = 'from-purple-500',
  gradientTo = 'to-pink-500',
  height = '280px',
  onClick,
  children,
  backContent,
  className = '',
}) {
  return (
    <motion.div
      className={`flip-card cursor-pointer ${className}`}
      style={{ height }}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flip-card-inner">
        {/* Back Side (shows first, flips to reveal front) */}
        <div className="flip-card-back flip-card-glow">
          <div className="flip-card-back-content">
            {backContent ? backContent : (
              <>
                {Icon && (
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} flex items-center justify-center`}>
                    <Icon size={32} className="text-white" />
                  </div>
                )}
                <strong className="text-xl font-bold text-white">{title}</strong>
                <p className="text-white/70 text-sm">Hover to explore</p>
              </>
            )}
          </div>
        </div>

        {/* Front Side (revealed on hover) */}
        <div className="flip-card-front">
          {/* Animated circles background */}
          <div className="flip-card-circles">
            <div className={`flip-card-circle ${getCircleColor(gradientFrom)}`} style={{ width: 80, height: 80, top: -20, left: -20 }} />
            <div className="flip-card-circle blue" style={{ width: 60, height: 60, top: '40%', right: -15 }} />
            <div className={`flip-card-circle ${getCircleColor(gradientTo)}`} style={{ width: 100, height: 100, bottom: -30, left: '30%' }} />
            <div className="flip-card-circle orange" style={{ width: 40, height: 40, top: '20%', left: '50%' }} />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col p-4">
            {badge && (
              <span className="flip-card-badge w-fit">{badge}</span>
            )}
            
            {children ? children : (
              <div className="flip-card-description mt-auto">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
                  {Icon && <Icon size={18} className="text-primary-400 flex-shrink-0 ml-2" />}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
                {stats && (
                  <p className="text-primary-400 text-xs mt-2 font-medium">{stats}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Helper to map gradient colors to circle colors
function getCircleColor(gradient) {
  if (gradient.includes('purple') || gradient.includes('pink')) return 'purple'
  if (gradient.includes('blue') || gradient.includes('cyan')) return 'blue'
  if (gradient.includes('green') || gradient.includes('emerald')) return 'green'
  if (gradient.includes('orange') || gradient.includes('amber')) return 'orange'
  return 'purple'
}

/**
 * SimpleFlipCard - A simpler version for smaller cards
 */
export function SimpleFlipCard({
  icon: Icon,
  label,
  color = 'bg-primary-500',
  onClick,
  height = '140px',
  className = '',
}) {
  return (
    <motion.div
      className={`flip-card cursor-pointer ${className}`}
      style={{ height }}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flip-card-inner">
        {/* Back */}
        <div className="flip-card-back flip-card-glow">
          <div className="flip-card-back-content">
            {Icon && (
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                <Icon size={24} className="text-white" />
              </div>
            )}
            <span className="text-sm font-medium text-white">{label}</span>
          </div>
        </div>

        {/* Front */}
        <div className="flip-card-front">
          <div className="flip-card-circles">
            <div className="flip-card-circle purple" style={{ width: 50, height: 50, top: -10, left: -10 }} />
            <div className="flip-card-circle blue" style={{ width: 40, height: 40, bottom: -10, right: -10 }} />
          </div>
          <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 text-center">
            {Icon && (
              <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon size={28} className="text-white" />
              </div>
            )}
            <span className="font-semibold text-white">{label}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * InfoFlipCard - Card with front info and back with CTA
 */
export function InfoFlipCard({
  icon: Icon,
  title,
  description,
  ctaText = 'Learn More',
  ctaIcon: CtaIcon,
  color = 'bg-accent-purple',
  height = '200px',
  onClick,
  className = '',
}) {
  return (
    <motion.div
      className={`flip-card cursor-pointer ${className}`}
      style={{ height }}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flip-card-inner">
        {/* Back - Shows description */}
        <div className="flip-card-back flip-card-glow">
          <div className="flip-card-back-content text-center">
            <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
            <button className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto">
              {ctaText}
              {CtaIcon && <CtaIcon size={16} />}
            </button>
          </div>
        </div>

        {/* Front - Shows title and icon */}
        <div className="flip-card-front">
          <div className="flip-card-circles">
            <div className="flip-card-circle purple" style={{ width: 60, height: 60, top: -15, right: -15 }} />
            <div className="flip-card-circle blue" style={{ width: 80, height: 80, bottom: -20, left: -20 }} />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-center items-center p-4 text-center">
            {Icon && (
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon size={24} className="text-white" />
              </div>
            )}
            <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * StatFlipCard - Stat card with flip effect for dashboard stats
 */
export function StatFlipCard({
  icon: Icon,
  value,
  label,
  color = 'bg-purple-500/30',
  iconColor = 'text-purple-400',
  hoverInfo,
  height = '100px',
  className = '',
}) {
  return (
    <motion.div
      className={`flip-card ${className}`}
      style={{ height }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flip-card-inner">
        {/* Back - Shows on initial load */}
        <div className="flip-card-back flip-card-glow">
          <div className="flip-card-back-content p-4">
            <div className="flex items-center gap-3 w-full">
              {Icon && (
                <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
              )}
              <div className="text-left">
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-slate-500 text-sm">{label}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Front - Revealed on hover */}
        <div className="flip-card-front">
          <div className="flip-card-circles">
            <div className="flip-card-circle purple" style={{ width: 40, height: 40, top: -10, left: -10, opacity: 0.5 }} />
            <div className="flip-card-circle blue" style={{ width: 30, height: 30, bottom: -8, right: -8, opacity: 0.5 }} />
          </div>
          <div className="relative z-10 h-full flex items-center justify-center p-4 text-center">
            <div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
              <p className="text-primary-400 text-sm font-medium">{hoverInfo || label}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
