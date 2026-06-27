const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT Authentication Protector Middleware
 * 
 * Verifies the incoming Bearer token supplied in the Authorization headers.
 * Resolves the token payload, fetches user information (excluding password details),
 * and assigns it to req.user for use in down-stream route controllers.
 */
const protect = async (req, res, next) => {
    let token = req.headers.authorization;
    
    // Check if authorization header exists and follows standard 'Bearer <token>' formatting
    if (token && token.startsWith('Bearer')) {
        try {
            // Split the token string out
            token = token.split(' ')[1];
            
            // Verify JWT token signature against local secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Fetch database user metadata (omitting the password field for security)
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            
            // Allow processing to flow to next handler
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

/**
 * Admin Role Verification Middleware
 * 
 * Verifies that the authenticated user contains the "admin" role.
 * Requires protect middleware to be chained first in the router middleware pipeline.
 */
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };
