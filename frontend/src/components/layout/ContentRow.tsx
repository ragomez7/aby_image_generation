import { motion } from 'framer-motion'
import { useState } from 'react'

interface ContentItem {
  id: string
  title: string
  image: string
  category: string
  rating?: string
  year?: number
}

interface ContentRowProps {
  title: string
  items: ContentItem[]
}

export const ContentRow = ({ title, items }: ContentRowProps) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <div className="mb-12">
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl font-bold text-white mb-4 px-4 md:px-8"
      >
        {title}
      </motion.h2>

      <div className="relative px-4 md:px-8">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              onHoverStart={() => setHoveredItem(item.id)}
              onHoverEnd={() => setHoveredItem(null)}
              className="flex-shrink-0 cursor-pointer relative group"
            >
              <div className="w-48 md:w-64 h-32 md:h-40 rounded-lg overflow-hidden bg-gray-800 relative">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-300">
                    {item.rating && (
                      <span className="px-1 py-0.5 bg-yellow-600 text-black rounded text-xs font-medium">
                        {item.rating}
                      </span>
                    )}
                    {item.year && <span>{item.year}</span>}
                    <span className="text-gray-400">{item.category}</span>
                  </div>
                </div>

                {/* Play button */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 5v10l8-5-8-5z" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Hover card (Netflix-style) */}
              {hoveredItem === item.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 w-80 bg-gray-900 rounded-lg shadow-2xl border border-gray-700 p-4 z-20 mt-2"
                  style={{ transform: 'translateX(-50%)' }}
                >
                  <h4 className="text-white font-bold mb-2">{item.title}</h4>
                  <div className="flex items-center space-x-2 mb-3">
                    {item.rating && (
                      <span className="px-2 py-1 bg-yellow-600 text-black rounded text-xs font-medium">
                        {item.rating}
                      </span>
                    )}
                    {item.year && <span className="text-gray-300 text-sm">{item.year}</span>}
                  </div>
                  <p className="text-gray-400 text-sm mb-3">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button variant="primary" size="sm">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 5v10l8-5-8-5z" />
                      </svg>
                      Play
                    </Button>
                    <Button variant="ghost" size="sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Button component for the hover card
interface ButtonProps {
  variant: 'primary' | 'ghost'
  size: 'sm'
  children: React.ReactNode
}

const Button = ({ variant, size, children }: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none'
  const variants = {
    primary: 'bg-white text-black hover:bg-gray-200',
    ghost: 'text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400'
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm'
  }

  return (
    <button className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}>
      {children}
    </button>
  )
}

// Generate dummy content data
export const generateDummyContent = () => {
  const categories = ['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Romance', 'Thriller']
  const titles = [
    'AI Revolution', 'Neural Networks', 'Digital Dreams', 'Code Warriors', 'Virtual Reality', 'Cyber City',
    'Data Storm', 'Algorithm', 'Machine Learning', 'Deep Learning', 'Quantum Computing', 'Blockchain',
    'Cloud Atlas', 'Binary Code', 'Digital Frontier', 'Tech Noir', 'Future Protocol', 'System Override'
  ]

  return titles.map((title, index) => ({
    id: `content-${index}`,
    title,
    image: `https://picsum.photos/400/300?random=${index}`,
    category: categories[index % categories.length],
    rating: Math.random() > 0.5 ? (8 + Math.random() * 2).toFixed(1) : undefined,
    year: 2020 + Math.floor(Math.random() * 4)
  }))
}
