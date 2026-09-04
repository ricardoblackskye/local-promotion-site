import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface AnimatedSectionHeaderProps {
  readonly children: ReactNode
  readonly className: string
  readonly inView: boolean
}

export default function AnimatedSectionHeader({
  children,
  className,
  inView,
}: Readonly<AnimatedSectionHeaderProps>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
