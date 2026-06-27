import axios from 'axios';

/**
 * Configure Global Axios REST Client Instance
 * 
 * Sets the default backend server base API URL endpoint.
 */
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

/**
 * Axios Request Interceptor
 * 
 * Intercepts every outgoing client request, checks localStorage for an 
 * active session JWT, and automatically appends it to the Authorization 
 * headers formatted as 'Bearer <token>'.
 */
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
