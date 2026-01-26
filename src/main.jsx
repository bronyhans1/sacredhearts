import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Start with PWA splash screen background color (matches manifest)
// This runs before React renders, ensuring correct splash screen color
document.documentElement.classList.remove('dark')
document.documentElement.style.setProperty('background-color', '#fef2f1', 'important')
document.body.style.setProperty('background-color', '#fef2f1', 'important')
document.body.style.setProperty('background-image', 'none', 'important')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
