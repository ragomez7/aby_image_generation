import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { type GeneratedImage } from '../../hooks/useWebSocket'
import { Skeleton } from '../ui/Skeleton'

interface ImageGalleryProps {
  jobIds: string[]
  title?: string
  images: any[]
  isConnected: boolean
  firstImageArrivalTime: number | null
  generateClickTimestamp: number | null
}

export const ImageGallery = ({ jobIds, title = "Generated Images", images, isConnected, firstImageArrivalTime, generateClickTimestamp }: ImageGalleryProps) => {
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  console.log({images})

  // Calculate counts from the passed images
  const succeededCount = images.filter(img => img.status === 'succeeded').length
  const processingCount = images.filter(img => img.status === 'processing' || img.status === 'starting').length
  const wsError = null

  const succeededImages = images.filter(img => img.status === 'succeeded')
  console.log({succeededImages})

  return (
    <div className="mb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-6 px-4 md:px-8"
      >
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {jobIds.length > 0 && (
              <span className="text-gray-500 font-mono text-xs">
                Job: {jobIds[0].slice(0, 8)}...
              </span>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="flex items-center space-x-6 text-sm">
          {succeededCount > 0 && (
            <div className="text-center">
              <div className="text-blue-400 font-bold">
                {(images.reduce((sum: number, img: GeneratedImage) => sum + (img.metrics?.predict_time || 0), 0) / succeededCount).toFixed(2)}s
              </div>
              <div className="text-gray-400">Avg. Predict</div>
            </div>
          )}
          
          {firstImageArrivalTime && generateClickTimestamp && (
            <div className="text-center">
              <div className="text-purple-400 font-bold">
                {((firstImageArrivalTime - generateClickTimestamp) / 1000).toFixed(2)}s
              </div>
              <div className="text-gray-400">First Image</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* WebSocket Error */}
      {wsError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 md:mx-8 mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-400 text-sm">WebSocket connection error</span>
          </div>
        </motion.div>
      )}

      {/* No active job message */}
      {jobIds.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 px-4"
        >
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Images Yet</h3>
            <p className="text-gray-400">
              Start generating images to see them appear here in real-time
            </p>
          </div>
        </motion.div>
      )}

      {/* Image Grid */}
      {succeededImages.length > 0 && (
        <div className="px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <AnimatePresence>
              {succeededImages.map((image, index) => (
                <ImageCard
                  key={image.prediction_id}
                  image={image}
                  index={index}
                  onExpand={() => setExpandedImage(image.prediction_id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Processing Images */}
      {processingCount > 0 && (
        <div className="px-4 md:px-8 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Processing...</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {images
              .filter(img => img.status === 'processing' || img.status === 'starting')
              .map((image, index) => (
                <ProcessingCard key={image.prediction_id} image={image} index={index} />
              ))}
          </div>
        </div>
      )}

      {/* Expanded Image Modal */}
      <AnimatePresence>
        {expandedImage && (
          <ImageModal
            image={succeededImages.find(img => img.prediction_id === expandedImage)}
            onClose={() => setExpandedImage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Individual image card component
interface ImageCardProps {
  image: GeneratedImage
  index: number
  onExpand: () => void
}

const ImageCard = ({ image, index, onExpand }: ImageCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  console.log({image})
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      className="aspect-square rounded-lg overflow-hidden bg-gray-800 cursor-pointer group relative"
      onClick={onExpand}
    >
      {!imageLoaded && !imageError && (
        <Skeleton variant="rectangular" className="w-full h-full" />
      )}
      
      {image?.output?.[0] && !imageError && (
        <img
          src={image?.output?.[0]}
          alt={`Generated image ${image.prediction_id}`}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      )}

      {imageError && (
        <div className="w-full h-full flex items-center justify-center text-gray-500">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300" />
      
      {/* Expand icon */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </motion.div>
  )
}

// Processing image placeholder
interface ProcessingCardProps {
  image: GeneratedImage
  index: number
}

const ProcessingCard = ({ image, index }: ProcessingCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="aspect-square rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center relative"
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"
        />
        <div className="text-xs text-gray-400 capitalize">{image.status}</div>
      </div>
      
      {/* Status indicator */}
      <div className="absolute top-2 left-2">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
      </div>
    </motion.div>
  )
}

// Image modal for expanded view
interface ImageModalProps {
  image?: GeneratedImage
  onClose: () => void
}

const ImageModal = ({ image, onClose }: ImageModalProps) => {
  if (!image) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative max-w-4xl max-h-[90vh] bg-gray-900 rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        <img
          src={image.urls[0]}
          alt={`Generated image ${image.prediction_id}`}
          className="w-full h-auto max-h-[80vh] object-contain"
        />

        {/* Info */}
        <div className="p-4 bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-mono text-sm">ID: {image.prediction_id}</div>
              <div className="text-gray-400 text-sm">Status: {image.status}</div>
            </div>
            <div className="flex space-x-2">
              <a
                href={image.urls[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
              >
                Open Original
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
