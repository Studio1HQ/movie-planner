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

  useEffect(() => {
    const initVelt = async () => {
      if (client) {
        // Generate unique user for this session
        const user = generateUniqueUser()
        setCurrentUser(user)
        
        // Sign in the user to Velt
        await client.identify(user)
        
        console.log('Velt user signed in:', user.name, user.userId)
      }
    }
    initVelt()
  }, [client])

  // Handle cleanup when the window is closed
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (client && currentUser) {
        // Sign out the user when the window is closed
        await client.signOutUser()
        console.log('Velt user signed out:', currentUser.name)
      }
    }

    const handleVisibilityChange = async () => {
      if (document.hidden && client && currentUser) {
        // Optional: Sign out when tab becomes hidden (you can remove this if you want users to stay online when switching tabs)
        // await client.signOutUser()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [client, currentUser])

  return (
    <div className="App">
      <MovieNightPlanner currentUser={currentUser} />
    </div>
  )
}

export default App
