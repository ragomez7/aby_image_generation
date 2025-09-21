import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStatus, useLogout } from '../../hooks/useAuth'

export const Navbar = () => {
  const { user } = useAuthStatus()
  const logoutMutation = useLogout()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black bg-opacity-90 backdrop-blur-sm border-b border-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-white font-bold text-xl">ABY Challenge</span>
            </motion.div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <NavLink href="#" active>Home</NavLink>
              <NavLink href="#">TV Shows</NavLink>
              <NavLink href="#">Movies</NavLink>
              <NavLink href="#">New & Popular</NavLink>
              <NavLink href="#">My List</NavLink>
              <NavLink href="#generation" highlight>Generate</NavLink>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </motion.button>

            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5 5-5m-10 0l5 5-5 5H0l5-5-5-5h5z" />
              </svg>
            </motion.button>

            {/* User Menu */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <svg 
                  className={`w-4 h-4 text-gray-300 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg py-2"
                >
                  <div className="px-4 py-2 border-b border-gray-700">
                    <p className="text-white font-medium">{user?.username}</p>
                    <p className="text-gray-400 text-sm">Premium User</p>
                  </div>
                  
                  <button className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                    Account
                  </button>
                  <button className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                    Help Center
                  </button>
                  
                  <div className="border-t border-gray-700 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                      Sign out of ABY
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40 md:hidden" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </motion.nav>
  )
}

// Navigation Link Component
interface NavLinkProps {
  href: string
  children: React.ReactNode
  active?: boolean
  highlight?: boolean
}

const NavLink = ({ href, children, active = false, highlight = false }: NavLinkProps) => {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.05 }}
      className={`text-sm font-medium transition-colors ${
        active 
          ? 'text-white' 
          : highlight
          ? 'text-purple-400 hover:text-purple-300'
          : 'text-gray-300 hover:text-white'
      }`}
    >
      {children}
    </motion.a>
  )
}
