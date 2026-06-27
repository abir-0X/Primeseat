const mongoose = require('mongoose');

/**
 * One-Time Password (OTP) Mongoose Schema
 * 
 * Stores temporary verification codes generated for 2FA actions.
 * Features a MongoDB Time-To-Live (TTL) index of 120 seconds (2 minutes)
 * to automatically invalidate and delete expired tokens.
 */
const otpSchema = new mongoose.Schema({
    // Target user email address
    email: { type: String, required: true },
    
    // 6-digit verification code string
    otp: { type: String, required: true },
    
    // The action context validating the OTP (account registration vs booking purchase authorization)
    action: { type: String, enum: ['account_verification', 'event_booking'], required: true },
    
    // MongoDB TTL Index: documents automatically self-destruct 120 seconds after creation
    createdAt: { type: Date, default: Date.now, expires: 120 }
});

module.exports = mongoose.model('OTP', otpSchema);
