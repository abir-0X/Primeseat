import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

/**
 * Root Application Component
 * 
 * Defines the main routing table and core layout wrapper for the Primeseat event booking portal.
 * All route paths are mapped to page-level view components.
 */
function App() {
    return (
        <Router>
            <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
                {/* Global navigation menu */}
                <Navbar />
                
                {/* Main Content Area */}
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Routes>
                        {/* Public landing page with event listing */}
                        <Route path="/" element={<Home />} />
                        
                        {/* Event Details page displaying seats, descriptions, and 2FA OTP reservation workflow */}
                        <Route path="/events/:id" element={<EventDetail />} />
                        
                        {/* Auth screens */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        
                        {/* Protected dashboards */}
                        <Route path="/dashboard" element={<UserDashboard />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        
                        {/* Fallback 404 handler */}
                        <Route path="*" element={<h1 className="text-3xl font-bold text-center mt-20">404 - Page Not Found</h1>} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
