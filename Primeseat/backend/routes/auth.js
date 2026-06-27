const express = require('express');
const router = express.Router();
const { register, login, verifyOTP } = require('../controllers/authController');

/**
 * User Authentication Routes
 * Base route: /api/auth
 */

// Route to register a new user account (submits credentials, hashes password, triggers email verification OTP)
router.post('/register', register);

// Route to authenticate login credentials (validates email/password, enforces account verification status)
router.post('/login', login);

// Route to process OTP code validation for registration verification
router.post('/verify-otp', verifyOTP);

module.exports = router;
