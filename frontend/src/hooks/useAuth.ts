import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, endpoints } from '../lib/api'
import type { LoginRequest, LoginResponse, User } from '../types/api'

// Auth token management
export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token')
}

export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token)
}

export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token')
}

export const isAuthenticated = (): boolean => {
  return !!getAuthToken()
}

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
      const response = await api.post(endpoints.auth.login, credentials)
      return response.data
    },
    onSuccess: (data) => {
      // Store the token
      setAuthToken(data.access_token)
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
    onError: () => {
      // Clear any existing token on login failure
      removeAuthToken()
    }
  })
}

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (): Promise<void> => {
      removeAuthToken()
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear()
    }
  })
}

// Get current user
export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: async (): Promise<User> => {
      const response = await api.get(endpoints.auth.me)
      return response.data
    },
    enabled: isAuthenticated(),
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.response?.status === 401) {
        return false
      }
      return failureCount < 3
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Verify token
export const useVerifyToken = () => {
  return useQuery({
    queryKey: ['auth', 'verify'],
    queryFn: async (): Promise<boolean> => {
      try {
        await api.post(endpoints.auth.verifyToken)
        return true
      } catch {
        removeAuthToken()
        return false
      }
    },
    enabled: isAuthenticated(),
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Auth status hook that combines user and verification
export const useAuthStatus = () => {
  const { data: user, isLoading: userLoading, error: userError } = useUser()
  const { data: isValidToken, isLoading: verifyLoading } = useVerifyToken()
  
  const isLoggedIn = isAuthenticated() && !!user && isValidToken !== false
  const isLoading = userLoading || verifyLoading
  
  return {
    user,
    isLoggedIn,
    isLoading,
    error: userError,
    isAuthenticated: isAuthenticated()
  }
}
