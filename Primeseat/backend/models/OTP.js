const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    action: { type: String, enum: ['account_verification', 'event_booking'], required: true },
    createdAt: { type: Date, default: Date.now, expires: 120 } // OTP expires in 2 minutes
});

module.exports = mongoose.model('OTP', otpSchema);
