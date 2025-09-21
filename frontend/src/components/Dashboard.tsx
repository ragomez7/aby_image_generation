import { useState } from 'react'
import { motion } from 'framer-motion'
import { Navbar } from './layout/Navbar'
import { Hero } from './layout/Hero'
import { ContentRow, generateDummyContent } from './layout/ContentRow'
import { GenerationConsole } from './generation/GenerationConsole'
import { ImageGallery } from './generation/ImageGallery'
import { useGeneratedImages } from '../hooks/useWebSocket'

export const Dashboard = () => {
  const [generatedJobs, setGeneratedJobs] = useState<string[]>([])
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false)
  const [generateClickTimestamp, setGenerateClickTimestamp] = useState<number | null>(null)

  // Shared images state for both GenerationConsole and ImageGallery
  const { images, updateImage, clearImages, firstImageArrivalTime } = useGeneratedImages()

  const handleJobCreated = (jobId: string) => {
    setGeneratedJobs(prev => [jobId, ...prev])
  }

  const handleConnectionStatusChange = (isConnected: boolean) => {
    setIsWebSocketConnected(isConnected)
  }

  const handleGenerateClick = (timestamp: number) => {
    setGenerateClickTimestamp(timestamp)
  }

  // Generate dummy content for different categories
  const trendingContent = generateDummyContent().slice(0, 8)
  const popularContent = generateDummyContent().slice(8, 16)

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Content Sections */}
      <div className="relative z-10 -mt-32 pb-20">
        {/* Trending Now */}
        <ContentRow 
          title="Trending Now" 
          items={trendingContent} 
        />

        {/* Popular on ABY */}
        <ContentRow 
          title="Popular on ABY" 
          items={popularContent} 
        />

        {/* Generation Console Section */}
        <motion.section
          id="generation"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="px-4 md:px-8 mb-12"
        >
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <h2 className="text-3xl font-bold text-white mb-2">
                AI Image Generation
              </h2>
              <p className="text-gray-400 text-lg">
                Create stunning images with our advanced AI models
              </p>
            </motion.div>

            <GenerationConsole 
              onJobCreated={handleJobCreated} 
              updateImage={updateImage} 
              images={images}
              onConnectionStatusChange={handleConnectionStatusChange}
              clearImages={clearImages}
              onGenerateClick={handleGenerateClick}
            />

            {/* Recent Jobs */}
            {generatedJobs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 bg-gray-800 rounded-lg p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">Recent Jobs</h3>
                <div className="space-y-3">
                  {generatedJobs.slice(0, 5).map((jobId, index) => (
                    <motion.div
                      key={jobId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        <span className="text-white font-mono text-sm">{jobId}</span>
                      </div>
                      <span className="text-gray-400 text-sm">Processing...</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* Real-time Generated Images */}
        <ImageGallery 
          jobIds={generatedJobs}
          title="Generated Images"
          images={images}
          isConnected={isWebSocketConnected}
          firstImageArrivalTime={firstImageArrivalTime}
          generateClickTimestamp={generateClickTimestamp}
        />
      </div>

      {/* Custom scrollbar styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `
      }} />
    </div>
  )
}
