import { useEffect, useRef } from 'react'

export default function ParticleBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let particles = []
    let mouse = { x: null, y: null, radius: 150 }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Track mouse position
    const handleMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    window.addEventListener('mousemove', handleMouseMove)

    const handleMouseLeave = () => {
      mouse.x = null
      mouse.y = null
    }
    window.addEventListener('mouseleave', handleMouseLeave)

    // Particle class
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 1
        this.baseX = this.x
        this.baseY = this.y
        this.density = Math.random() * 30 + 1
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        
        // Random color from theme
        const colors = [
          'rgba(168, 85, 247, 0.8)',  // Purple
          'rgba(236, 72, 153, 0.8)',   // Pink
          'rgba(59, 130, 246, 0.8)',   // Blue
          'rgba(34, 197, 94, 0.8)',    // Green
          'rgba(249, 115, 22, 0.8)',   // Orange
        ]
        this.color = colors[Math.floor(Math.random() * colors.length)]
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()
      }

      update() {
        // Mouse interaction
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x
          const dy = mouse.y - this.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < mouse.radius) {
            const forceDirectionX = dx / distance
            const forceDirectionY = dy / distance
            const maxDistance = mouse.radius
            const force = (maxDistance - distance) / maxDistance
            const directionX = forceDirectionX * force * this.density
            const directionY = forceDirectionY * force * this.density

            this.x -= directionX
            this.y -= directionY
          }
        }

        // Drift movement
        this.x += this.speedX
        this.y += this.speedY

        // Wrap around screen
        if (this.x < 0) this.x = canvas.width
        if (this.x > canvas.width) this.x = 0
        if (this.y < 0) this.y = canvas.height
        if (this.y > canvas.height) this.y = 0
      }
    }

    // Initialize particles
    const initParticles = () => {
      particles = []
      const numberOfParticles = Math.min((canvas.width * canvas.height) / 8000, 150)
      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle())
      }
    }

    initParticles()

    // Draw connections between particles
    const connectParticles = () => {
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x
          const dy = particles[a].y - particles[b].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 120) {
            const opacity = 1 - distance / 120
            ctx.strokeStyle = `rgba(168, 85, 247, ${opacity * 0.3})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(particles[a].x, particles[a].y)
            ctx.lineTo(particles[b].x, particles[b].y)
            ctx.stroke()
          }
        }
      }
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        particle.update()
        particle.draw()
      })

      connectParticles()

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
