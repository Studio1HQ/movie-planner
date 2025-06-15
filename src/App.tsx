import React, { useState } from 'react'
import logo from './logo.svg'
import './App.css'
import MovieNightPlanner from './MovieNightPlanner'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <MovieNightPlanner />
    </div>
  )
}

export default App
