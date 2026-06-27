const mongoose = require('mongoose');

/**
 * User Mongoose Schema
 * 
 * Maps login credentials, role authorizations (user vs admin), and registration verification states.
 */
const userSchema = new mongoose.Schema({
    // Display name of the user
    name: { type: String, required: true },
    
    // Unique user email address
    email: { type: String, required: true, unique: true },
    
    // Hashed password storage
    password: { type: String, required: true },
    
    // Security role level for dashboard router authorization
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    
    // Verify status (required for login for standard user accounts)
    isVerified: { type: Boolean, default: false }
}, { 
    // Auto-populate timestamps
    timestamps: true 
});

module.exports = mongoose.model('User', userSchema);
