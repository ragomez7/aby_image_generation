import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useAuthStatus } from '../../hooks/useAuth'
import { LoginForm } from './LoginForm'
import { Skeleton } from '../ui/Skeleton'

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export const AuthGuard = ({ children, fallback }: AuthGuardProps) => {
  const { isLoggedIn, isLoading } = useAuthStatus()

  // Show loading skeleton while checking authentication
  if (isLoading) {
    return fallback || <AuthLoadingSkeleton />
  }

  // Show login form if not authenticated
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <LoginForm onSuccess={() => window.location.reload()} />
      </div>
    )
  }

  // Show protected content if authenticated
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

// Loading skeleton for auth checking
const AuthLoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div 
        className="w-full max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header skeleton */}
          <div className="text-center mb-8">
            <Skeleton height={36} width="60%" className="mx-auto mb-2" />
            <Skeleton height={20} width="80%" className="mx-auto" />
          </div>

          {/* Info box skeleton */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Skeleton variant="circular" width={20} height={20} className="mt-0.5 mr-3" />
              <div className="flex-1">
                <Skeleton height={16} width="40%" className="mb-2" />
                <Skeleton height={14} width="80%" className="mb-1" />
                <Skeleton height={14} width="70%" />
              </div>
            </div>
          </div>

          {/* Form skeleton */}
          <div className="space-y-6">
            <div>
              <Skeleton height={16} width="30%" className="mb-1" />
              <Skeleton height={40} width="100%" />
            </div>
            <div>
              <Skeleton height={16} width="30%" className="mb-1" />
              <Skeleton height={40} width="100%" />
            </div>
            <Skeleton height={44} width="100%" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AuthGuard
