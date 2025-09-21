import { motion } from 'framer-motion'
import clsx from 'clsx'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  variant?: 'text' | 'circular' | 'rectangular'
  animation?: 'pulse' | 'wave' | 'none'
}

export const Skeleton = ({ 
  className,
  width,
  height,
  variant = 'rectangular',
  animation = 'pulse'
}: SkeletonProps) => {
  const baseClasses = 'bg-gray-200'
  
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  }

  const animations = {
    pulse: 'animate-pulse',
    wave: '',
    none: ''
  }

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  }

  if (animation === 'wave') {
    return (
      <div 
        className={clsx(
          baseClasses,
          variants[variant],
          'relative overflow-hidden',
          className
        )}
        style={style}
        aria-hidden="true"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-60"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </div>
    )
  }

  return (
    <div 
      className={clsx(
        baseClasses,
        variants[variant],
        animations[animation],
        className
      )}
      style={style}
      aria-hidden="true"
    />
  )
}

// Preset skeleton components for common use cases
export const SkeletonText = ({ lines = 1, className }: { lines?: number; className?: string }) => (
  <div className={clsx('space-y-2', className)}>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton 
        key={i}
        variant="text" 
        height={16}
        width={i === lines - 1 ? '75%' : '100%'}
      />
    ))}
  </div>
)

export const SkeletonAvatar = ({ size = 40, className }: { size?: number; className?: string }) => (
  <Skeleton 
    variant="circular"
    width={size}
    height={size}
    className={className}
  />
)

export const SkeletonButton = ({ className }: { className?: string }) => (
  <Skeleton 
    variant="rectangular"
    height={40}
    width={120}
    className={className}
  />
)
