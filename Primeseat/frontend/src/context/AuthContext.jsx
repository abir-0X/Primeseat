import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/axios';

// Export AuthContext for use in components via useContext(AuthContext)
export const AuthContext = createContext();

/**
 * Global Authentication Context Provider
 * 
 * Manages states for current user logins, session loading flags,
 * and exposes API wrappers for logins, registrations, OTP validations, and logouts.
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial effect hook to re-hydrate login session from local storage if existing
    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }
        setLoading(false);
    }, []);

    /**
     * Authenticate User Session
     * 
     * @param {string} email User email address
     * @param {string} password Raw user password
     */
    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            return data;
        } catch (error) {
            // Forward needsVerification indicator if user requires 2FA activation
            if (error.response?.data?.needsVerification) throw error.response.data;
            throw error.response?.data?.message || 'Login failed';
        }
    };

    /**
     * Submit Register Application
     * 
     * @param {string} name Display name
     * @param {string} email Target email
     * @param {string} password Raw password
     */
    const register = async (name, email, password) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            return data; // Returns { message, email }
        } catch (error) {
            throw error.response?.data?.message || 'Registration failed';
        }
    };

    /**
     * Complete OTP Registration Activation
     * 
     * @param {string} email Registration target email
     * @param {string} otp 6-digit validation code
     */
    const verifyOTP = async (email, otp) => {
        try {
            const { data } = await api.post('/auth/verify-otp', { email, otp });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            localStorage.setItem('token', data.token);
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'OTP verification failed';
        }
    };

    /**
     * Terminate Session and Purge Storage
     */
    const logout = () => {
        setUser(null);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, verifyOTP, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
