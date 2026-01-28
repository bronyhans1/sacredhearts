import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Start with PWA splash screen background color (matches manifest)
// This runs before React renders, ensuring correct splash screen color
document.documentElement.classList.remove('dark')
document.documentElement.style.setProperty('background-color', '#111827', 'important')
document.body.style.setProperty('background-color', '#111827', 'important')
document.body.style.setProperty('background-image', 'none', 'important')

// Detect standalone mode and add class for conditional styling
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator.standalone === true);
if (isStandalone) {
  document.documentElement.classList.add('pwa-standalone');
} else {
  document.documentElement.classList.add('pwa-browser');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
