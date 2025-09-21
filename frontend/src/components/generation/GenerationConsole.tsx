import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { api, endpoints } from '../../lib/api'
import type { GenerationRequest, GenerationResponse } from '../../types/api'
import { useWebSocket } from '../../hooks/useWebSocket'

interface GenerationConsoleProps {
  onJobCreated?: (jobId: string) => void
  updateImage: (image: any) => void
  images: any[];
  onConnectionStatusChange?: (isConnected: boolean) => void
  clearImages: () => void
  onGenerateClick: (timestamp: number) => void
}

export const GenerationConsole = ({ onJobCreated, updateImage, images, onConnectionStatusChange, clearImages, onGenerateClick }: GenerationConsoleProps) => {
  const [formData, setFormData] = useState<GenerationRequest>({
    prompt: '',
    num_images: 5,
    model: 'black-forest-labs/flux-schnell'
  })
  const [errors, setErrors] = useState<{[K in keyof GenerationRequest]?: string}>({})
  const [expectedImageCount, setExpectedImageCount] = useState<number>(0)
  
  const { connect, disconnect } = useWebSocket({
    onMessage: (message) => {
      console.log('25')
      if (message.type === 'prediction_update') {
        updateImage(message.data)
      }
    },
    onError: (error) => {
      console.error('WebSocket error in ImageGallery:', error)
    },
    onConnect: () => {
      console.log('WebSocket connected in GenerationConsole')
      onConnectionStatusChange?.(true)
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected in GenerationConsole')
      onConnectionStatusChange?.(false)
    }
  });
  const generateMutation = useMutation({
    mutationFn: async (data: GenerationRequest): Promise<GenerationResponse> => {
      const response = await api.post(endpoints.generation.create, data)
      return response.data
    },
    onSuccess: (data) => {
      onJobCreated?.(data.job_id)
      console.log('Job created:', data.job_id)
      
      // Store expected image count and connect to WebSocket
      setExpectedImageCount(formData.num_images)
      connect(data.job_id)
      
      // Clear previous images and reset form on success
      clearImages()
      setFormData(prev => ({ ...prev, prompt: '' }))
    },
    onError: (error: any) => {
      console.error('Generation failed:', error)
    }
  })

  const validateForm = (): boolean => {
    const newErrors: {[K in keyof GenerationRequest]?: string} = {}
    
    if (!formData.prompt.trim()) {
      newErrors.prompt = 'Please enter a prompt'
    } else if (formData.prompt.trim().length < 3) {
      newErrors.prompt = 'Prompt must be at least 3 characters'
    }
    
    if (formData.num_images < 5 || formData.num_images > 20) {
      newErrors.num_images = 'Batch size must be between 5 and 20'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const succeededCount = images.filter(img => img.status === 'succeeded').length

  // Disconnect WebSocket when all expected images have succeeded
  useEffect(() => {
    if (expectedImageCount > 0 && succeededCount >= expectedImageCount) {
      console.log(`All ${expectedImageCount} images completed successfully. Disconnecting WebSocket.`)
      disconnect()
      setExpectedImageCount(0) // Reset to prevent multiple disconnections
    }
  }, [succeededCount, expectedImageCount, disconnect])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onGenerateClick(Date.now()) // Record the generation click timestamp

    try {
      await generateMutation.mutateAsync(formData)
    } catch (error) {
      // Error handling is done in onError
    }
  }

  const handleInputChange = (field: keyof GenerationRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value: any = field === 'num_images' ? (parseInt(e.target.value) || 5) : e.target.value
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
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
      className="bg-gray-900 rounded-lg p-6 border border-gray-700"
    >
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Generation Console</h2>
            <p className="text-gray-400 text-sm">Create AI-generated images with Flux</p>
          </div>
        </div>
      </div>

      {/* Generation Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Prompt Input */}
        <div>
          <Input
            label="Prompt"
            type="text"
            value={formData.prompt}
            onChange={handleInputChange('prompt')}
            error={errors.prompt}
            placeholder="Describe the image you want to generate..."
            required
            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
            isLoading={generateMutation.isPending}
          />
        </div>

        {/* Batch Size and Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Batch Size
              <span className="text-red-400 ml-1">*</span>
            </label>
            <div className="relative">
              <input
                type="range"
                min="5"
                max="20"
                value={formData.num_images}
                onChange={handleInputChange('num_images')}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={generateMutation.isPending}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5</span>
                <span className="font-medium text-purple-400">{formData.num_images} images</span>
                <span>20</span>
              </div>
            </div>
            {errors.num_images && (
              <p className="text-sm text-red-400 mt-1">{errors.num_images}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Model
            </label>
            <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-white text-sm font-medium">black-forest-labs/flux-schnell</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Fast, high-quality image generation</p>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex items-center space-x-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={generateMutation.isPending}
            loadingText="Generating..."
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 flex-1 md:flex-none md:px-8"
          >
            {generateMutation.isPending ? 'Generating...' : `Generate ${formData.num_images} Images`}
          </Button>
          
          {generateMutation.isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2 text-green-400"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Job started!</span>
            </motion.div>
          )}
        </div>

        {/* Error Display */}
        {generateMutation.error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-900/20 border border-red-700 rounded-lg"
            role="alert"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-400 text-sm">
                {(generateMutation.error as any)?.response?.data?.detail || 'Failed to start generation. Please try again.'}
              </p>
            </div>
          </motion.div>
        )}
      </form>

      {/* Custom slider styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: linear-gradient(135deg, #8b5cf6, #ec4899);
            cursor: pointer;
            border: 2px solid #374151;
          }
          
          .slider::-moz-range-thumb {
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: linear-gradient(135deg, #8b5cf6, #ec4899);
            cursor: pointer;
            border: 2px solid #374151;
          }
        `
      }} />
    </motion.div>
  )
}
