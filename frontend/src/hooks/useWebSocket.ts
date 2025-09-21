import { useState, useRef, useCallback } from 'react'

export interface GeneratedImage {
  prediction_id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  urls: string[]
  error?: string
  data_removed?: boolean
  note?: string
  output?: string[];
  metrics?: {
    image_count: number;
    predict_time: number;
  }
}

interface WebSocketMessage {
  type: 'prediction_update' | 'pong' | 'error'
  data: GeneratedImage
}

interface UseWebSocketOptions {
  enabled?: boolean
  onMessage?: (message: WebSocketMessage) => void
  onError?: (error: Event) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

export const useWebSocket = ({
  enabled = true,
  onMessage,
  onError,
  onConnect,
  onDisconnect
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback((jobId: string) => {
    if (!jobId || !enabled) return

    try {
      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close()
      }

      const wsUrl = `ws://localhost:8000/api/v1/generate/${jobId}`
      console.log('Connecting to WebSocket:', wsUrl)
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
        onConnect?.()
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('WebSocket message received:', message)
          onMessage?.(message)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        setIsConnected(false)
        wsRef.current = null
        onDisconnect?.()

        // Attempt to reconnect if not a clean close and we haven't exceeded max attempts
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts && enabled) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect(jobId)
          }, delay)
        }
      }

      ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        setError('Connection error')
        onError?.(event)
      }

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err)
      setError('Failed to connect')
    }
  }, [enabled, onMessage, onError, onConnect, onDisconnect])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current !== undefined) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect')
      wsRef.current = null
    }
    
    setIsConnected(false)
    setError(null)
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

//   useEffect(() => {
//     if (enabled && jobId) {
//       connect()
//     } else {
//       disconnect()
//     }

//     return () => {
//       disconnect()
//     }
//   }, [connect, disconnect, enabled, jobId])

  return {
    isConnected,
    error,
    connect,
    disconnect,
    sendMessage
  }
}

// Hook for managing generated images state
export const useGeneratedImages = () => {
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [firstImageArrivalTime, setFirstImageArrivalTime] = useState<number | null>(null)

  const updateImage = useCallback((newImage: GeneratedImage) => {
    setImages(prevImages => {
      const existingIndex = prevImages.findIndex(img => img.prediction_id === newImage.prediction_id)
      
      // If image exists and new status is succeeded, don't update if already succeeded
      if (existingIndex !== -1) {
        const existing = prevImages[existingIndex]
        if (existing.status === 'succeeded' && newImage.status === 'succeeded') {
          return prevImages // Don't mutate if already rendered successfully
        }
        
        // Update existing image
        const updatedImages = [...prevImages]
        updatedImages[existingIndex] = newImage
        return updatedImages
      }
      
      // Add new image at the beginning (most recent first)
      const newImages = [newImage, ...prevImages]
      
      // Set first image arrival time if not already set and this is the first successful image
      if (newImage.status === 'succeeded' && !firstImageArrivalTime) {
        setFirstImageArrivalTime(Date.now())
      }
      
      return newImages
    })
  }, [firstImageArrivalTime])

  const clearImages = useCallback(() => {
    setImages([])
    setFirstImageArrivalTime(null) // Reset arrival time when images are cleared
  }, [])

  const getImagesByStatus = useCallback((status: GeneratedImage['status']) => {
    return images.filter(img => img.status === status)
  }, [images])

  const getSucceededImages = useCallback(() => {
    return images.filter(img => img.status === 'succeeded' && img.urls.length > 0)
  }, [images])

  return {
    images,
    updateImage,
    clearImages,
    getImagesByStatus,
    getSucceededImages,
    totalImages: images.length,
    succeededCount: images.filter(img => img.status === 'succeeded').length,
    processingCount: images.filter(img => img.status === 'processing' || img.status === 'starting').length,
    failedCount: images.filter(img => img.status === 'failed').length,
    firstImageArrivalTime
  }
}
