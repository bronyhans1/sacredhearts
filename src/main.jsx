import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Start with light mode (transparent so background images show)
// This runs before React renders, preventing any dark mode flash
document.documentElement.classList.remove('dark')
document.documentElement.style.setProperty('background-color', 'transparent', 'important')
document.body.style.setProperty('background-color', 'transparent', 'important')
document.body.style.setProperty('background-image', 'none', 'important')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
