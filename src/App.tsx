import React, { useState, useEffect } from 'react'
import logo from './logo.svg'
import './App.css'
import MovieNightPlanner from './MovieNightPlanner'
import { VeltProvider, useVeltClient } from '@veltdev/react'

// Helper function to generate unique user data
function generateUniqueUser() {
  const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const names = [
    'Alex Chen', 'Sarah Johnson', 'Mike Rodriguez', 'Emma Davis', 'Jake Wilson',
    'Lily Wang', 'Ryan Smith', 'Maya Patel', 'Sam Brown', 'Zoe Martinez',
    'Liam Taylor', 'Ava Thompson', 'Noah Anderson', 'Mia Garcia', 'Lucas Lee'
  ]
  const randomName = names[Math.floor(Math.random() * names.length)]
  
  return {
    userId,
    name: randomName,
    email: `${userId}@demo.com`,
    photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomName}`,
    organizationId: 'movie-night-org'
  }
}

function App() {
  return (
    <VeltProvider apiKey={import.meta.env.VITE_VELT_API_KEY || "YOUR_VELT_API_KEY"}>
      <AuthenticatedApp />
    </VeltProvider>
  )
}

function AuthenticatedApp() {
  const { client } = useVeltClient()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isSignedOut, setIsSignedOut] = useState(false)

  useEffect(() => {
    const initVelt = async () => {
      if (client && !isSignedOut) {
        // Check if we have a saved user session
        const savedUser = localStorage.getItem('velt-user-session')
        let user
        
        if (savedUser) {
          user = JSON.parse(savedUser)
        } else {
          // Generate unique user for this session
          user = generateUniqueUser()
          localStorage.setItem('velt-user-session', JSON.stringify(user))
        }
        
        setCurrentUser(user)
        
        // Sign in the user to Velt with proper cleanup
        await client.identify(user)
        
        console.log('Velt user signed in:', user.name, user.userId)
      }
    }
    initVelt()
  }, [client, isSignedOut])

  // Improved cleanup handling
  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      if (client && currentUser && !isSignedOut) {
        // Ensure proper cleanup before page unload
        try {
          await client.signOutUser()
          localStorage.removeItem('velt-user-session')
          console.log('Velt user signed out on page unload:', currentUser.name)
        } catch (error) {
          console.warn('Error during sign out:', error)
        }
      }
    }

    const handleVisibilityChange = () => {
      // Velt automatically handles presence status based on tab visibility
      // No manual presence updates needed - Velt manages this internally
      if (document.hidden && client && currentUser && !isSignedOut) {
        console.log('Tab hidden - Velt will automatically update presence to away')
      } else if (!document.hidden && client && currentUser && !isSignedOut) {
        console.log('Tab visible - Velt will automatically update presence to active')
      }
    }

    const handlePageHide = async () => {
      if (client && currentUser && !isSignedOut) {
        try {
          await client.signOutUser()
          localStorage.removeItem('velt-user-session')
          console.log('Velt user signed out on page hide:', currentUser.name)
        } catch (error) {
          console.warn('Error during sign out:', error)
        }
      }
    }

    // Add multiple event listeners for better cleanup
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [client, currentUser, isSignedOut])

  // Handle manual sign out
  const handleSignOut = async () => {
    if (client && currentUser) {
      try {
        setIsSignedOut(true)
        await client.signOutUser()
        localStorage.removeItem('velt-user-session')
        setCurrentUser(null)
        console.log('Velt user manually signed out:', currentUser.name)
        
        // Reload page to ensure clean state
        setTimeout(() => {
          window.location.reload()
        }, 100)
      } catch (error) {
        console.error('Error during manual sign out:', error)
        // Force reload even if sign out fails
        window.location.reload()
      }
    }
  }

  return (
    <div className="App">
      <MovieNightPlanner 
        currentUser={currentUser} 
        onSignOut={handleSignOut}
      />
    </div>
  )
}

export default App
