import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
}

export default function Card({ children, className = '', onClick, hoverable = false }: CardProps) {
  return (
    <motion.div
      whileHover={hoverable ? { y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.08)' } : undefined}
      whileTap={hoverable ? { scale: 0.98 } : undefined}
      className={`bg-surface rounded-2xl border border-border p-5 ${hoverable ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
