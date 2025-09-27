import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import SynthTest from './components/SynthTest'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>SynthStep</h1>

      <SynthTest />
    </>
  )
}

export default App
