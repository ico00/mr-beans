import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#3C2415',
          color: '#F5F0E8',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '14px',
          fontFamily: 'var(--font-body)',
        },
        success: {
          iconTheme: {
            primary: '#4A7C59',
            secondary: '#F5F0E8',
          },
          style: {
            background: '#4A7C59',
            color: '#F5F0E8',
          },
        },
        error: {
          iconTheme: {
            primary: '#A94442',
            secondary: '#F5F0E8',
          },
          style: {
            background: '#A94442',
            color: '#F5F0E8',
          },
        },
        loading: {
          iconTheme: {
            primary: '#D4A574',
            secondary: '#3C2415',
          },
        },
      }}
    />
  </StrictMode>,
)
