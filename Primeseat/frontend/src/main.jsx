import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'

/**
 * Frontend Application Entry Point
 * 
 * Configures the rendering root of React. Wraps the main App layout 
 * with AuthProvider context to provide global user session authentication.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>,
)
