import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useLogin } from '../../hooks/useAuth'
import type { LoginRequest } from '../../types/api'

interface LoginFormProps {
  onSuccess?: () => void
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: ''
  })
  const [formErrors, setFormErrors] = useState<Partial<LoginRequest>>({})

  const loginMutation = useLogin()

  const validateForm = (): boolean => {
    const errors: Partial<LoginRequest> = {}
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required'
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await loginMutation.mutateAsync(formData)
      onSuccess?.()
    } catch (error: any) {
      // Handle specific error cases
      if (error?.response?.status === 422 || error?.response?.status === 401) {
        setFormErrors({
          username: 'Invalid username or password',
          password: 'Invalid username or password'
        })
      } else {
        setFormErrors({
          username: 'An error occurred. Please try again.'
        })
      }
    }
  }

  const handleInputChange = (field: keyof LoginRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            className="text-3xl font-bold text-gray-900 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Welcome Back
          </motion.h1>
          <motion.p 
            className="text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Sign in to access the ABY Challenge
          </motion.p>
        </div>

        {/* Demo Credentials Info */}
        <motion.div 
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-start">
            <svg 
              className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                clipRule="evenodd" 
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-1">
                Demo Credentials
              </h3>
              <p className="text-sm text-blue-700">
                <strong>Username:</strong> admin<br />
                <strong>Password:</strong> admin
              </p>
            </div>
          </div>
        </motion.div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Input
              label="Username"
              type="text"
              value={formData.username}
              onChange={handleInputChange('username')}
              error={formErrors.username}
              placeholder="Enter your username"
              required
              autoComplete="username"
              isLoading={loginMutation.isPending}
              aria-describedby="username-help"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              error={formErrors.password}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              isLoading={loginMutation.isPending}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={loginMutation.isPending}
              loadingText="Signing in..."
            >
              Sign In
            </Button>
          </motion.div>
        </form>

        {/* Error Display */}
        {loginMutation.error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-center">
              <svg 
                className="w-5 h-5 text-red-600 mr-3" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
              <p className="text-sm text-red-700">
                {(loginMutation.error as any)?.response?.data?.detail || 'Login failed. Please try again.'}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
