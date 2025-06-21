import React, { useState, useEffect } from 'react'
import logo from './logo.svg'
import './App.css'
import MovieNightPlanner from './MovieNightPlanner'
import { VeltProvider, useVeltClient } from '@veltdev/react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <VeltProvider apiKey={import.meta.env.VITE_VELT_API_KEY || "YOUR_VELT_API_KEY"}>
      <AuthenticatedApp />
    </VeltProvider>
  )
}

function AuthenticatedApp() {
  const { client } = useVeltClient()

  useEffect(() => {
    const initVelt = async () => {
      if (client) {
        // Basic authentication - in production, you would get this from your auth system
        await client.identify({
          userId: 'user-1',
          name: 'Demo User',
          email: 'demo@example.com',
          photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
          organizationId: 'movie-night-org'
        })
      }
    }
    initVelt()
  }, [client])

  return (
    <div className="App">
      <MovieNightPlanner />
    </div>
  )
}

export default App
