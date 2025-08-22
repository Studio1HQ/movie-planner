import React, { useState, useEffect } from 'react'
import logo from './logo.svg'
import './App.css'
import MovieNightPlanner from './MovieNightPlanner'
import { VeltProvider, useVeltClient } from '@veltdev/react'

// Hardcoded users for the application
const HARDCODED_USERS = [
  {
    userId: 'user-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    organizationId: 'movie-night-org'
  },
  {
    userId: 'user-2', 
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    organizationId: 'movie-night-org'
  }
];

// Get or set default user
function getDefaultUser() {
  const savedUserId = localStorage.getItem('selected-user-id')
  const user = HARDCODED_USERS.find(u => u.userId === savedUserId) || HARDCODED_USERS[0]
  return user
}

function App() {
  const [userKey, setUserKey] = useState(0)
  
  // Listen for user switches to force VeltProvider re-render
  useEffect(() => {
    const handleUserSwitch = () => {
      setUserKey(prev => prev + 1)
    }
    
    window.addEventListener('velt-user-switched', handleUserSwitch)
    
    return () => {
      window.removeEventListener('velt-user-switched', handleUserSwitch)
    }
  }, [])
  
  return (
    <VeltProvider 
      key={userKey} 
      apiKey={import.meta.env.VITE_VELT_API_KEY || "YOUR_VELT_API_KEY"}
    >
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
        // Use hardcoded users
        const user = getDefaultUser()
        
        setCurrentUser(user)
        
        // Sign in the user to Velt with proper cleanup
        await client.identify(user)
        
        console.log('Velt user signed in:', user.name, user.userId)
      }
    }
    initVelt()
  }, [client, isSignedOut])

  // Listen for user changes across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selected-user-id' && e.newValue !== e.oldValue) {
        console.log('User changed in another tab, reloading...')
        // Reload to ensure clean state across tabs
        window.location.reload()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Improved cleanup handling
  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      if (client && currentUser && !isSignedOut) {
        // Ensure proper cleanup before page unload
        try {
          await client.signOutUser()
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

  // Handle user switching
  const handleSwitchUser = async (newUser: any) => {
    if (client && newUser.userId !== currentUser?.userId) {
      try {
        // Sign out current user completely
        if (currentUser) {
          await client.signOutUser()
          console.log('Signed out user:', currentUser.name)
        }
        
        // Clear the current user state first
        setCurrentUser(null)
        
        // Small delay to ensure cleanup
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Save selected user ID
        localStorage.setItem('selected-user-id', newUser.userId)
        
        // Sign in new user
        setCurrentUser(newUser)
        await client.identify(newUser)
        
        // Reinitialize the document with the new user
        await client.setDocument('movie-night-planner')
        
        console.log('Switched to user:', newUser.name, newUser.userId)
        
        // Force a re-render to ensure Velt components pick up the new user
        setTimeout(() => {
          window.dispatchEvent(new Event('velt-user-switched'))
        }, 200)
        
      } catch (error) {
        console.error('Error switching user:', error)
        // If switching fails, reload the page to ensure clean state
        window.location.reload()
      }
    }
  }

  // Handle manual sign out
  const handleSignOut = async () => {
    if (client && currentUser) {
      try {
        setIsSignedOut(true)
        await client.signOutUser()
        localStorage.removeItem('selected-user-id')
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
        key={currentUser?.userId || 'no-user'}
        currentUser={currentUser} 
        onSignOut={handleSignOut}
        onSwitchUser={handleSwitchUser}
      />
    </div>
  )
}

export default App
