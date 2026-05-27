import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import axios from 'axios'
import App from './App'
import './index.css'

// En producción, apuntar al backend de Railway
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
    <Toaster position="top-right" toastOptions={{
      style: { background: '#1e1b4b', color: '#fff', borderRadius: '12px' },
      duration: 4000,
    }} />
  </BrowserRouter>
)
