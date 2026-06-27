/**
 * Primeseat Backend Server Entry Point
 * 
 * Sets up the Express application middleware, database connections (MongoDB),
 * route controllers, and registers dns nameservers to avoid resolve lookup errors.
 */

// 1. DNS Lookup Setup: explicitly override nameservers to prevent network timeout issues inside strict environments
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables (.env file parameters)
dotenv.config();

// Import Route Handlers
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');

const app = express();

/**
 * Express Middleware Registration
 */
// Enable Cross-Origin Resource Sharing (CORS) for API requests from the frontend origin
app.use(cors());

// Configure JSON body parser with increased limit (up to 50MB) to handle base64 image uploads comfortably
app.use(express.json({ limit: '50mb' }));

// Configure URL-encoded form parser with increased limit
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/**
 * REST Endpoint Registrations
 */
app.use('/api/auth', authRoutes);         // User authorization, registration & OTP validation
app.use('/api/events', eventRoutes);       // Event creation, updates, and catalog queries
app.use('/api/bookings', bookingRoutes);   // Ticket reservations & independent status updates
app.use('/api/admin', adminRoutes);       // Admin analytics KPIs and event occupancy statistics

/**
 * MongoDB Mongoose Database Connection
 * Fallback to local MongoDB URI if MONGO_URI env variable is undefined
 */
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/primeseat')
  .then(() => console.log('MongoDB Connected successfully.'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Start Listening for HTTP Requests
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
