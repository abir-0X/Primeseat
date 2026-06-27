const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/email');

/**
 * Helper: Generate a secure 6-digit verification code
 * @returns {string} 6-digit numeric string
 */
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Helper: Generate a JSON Web Token (JWT)
 * @param {string} id User ID
 * @param {string} role User role ('user' | 'admin')
 * @returns {string} Signed JWT token string
 */
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

/**
 * Register New User Account
 * 
 * Verifies email uniqueness, hashes user passwords for cryptographic security,
 * creates an inactive User profile, and sends an account verification OTP to their email.
 */
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // 1. Check for email collision
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        // 2. Hash password with bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Persist the inactive user profile
        user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'user', // Explicitly hardcoded to prevent role spoofing during registration
            isVerified: false
        });

        // 4. Generate and save registration OTP (expires in 2 minutes)
        const otp = generateOTP();
        await OTP.create({ email, otp, action: 'account_verification' });
        
        // 5. Send confirmation OTP mail
        await sendOTPEmail(email, otp, 'account_verification');

        res.status(201).json({
            message: 'OTP sent to email. Please verify.',
            email: user.email
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * Authenticate User Login
 * 
 * Verifies credentials, guarantees that email accounts are verified (excluding admins),
 * and returns user metadata and a signed JWT authorization token on success.
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 1. Resolve user profile
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        // 2. Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // 3. Enforce 2FA verification for non-admin accounts before generating session tokens
        if (!user.isVerified && user.role !== 'admin') {
            const otp = generateOTP();
            
            // Re-generate registration OTP and dispatch it
            await OTP.findOneAndDelete({ email: user.email, action: 'account_verification' });
            await OTP.create({ email: user.email, otp, action: 'account_verification' });
            await sendOTPEmail(user.email, otp, 'account_verification');
            
            return res.status(403).json({ 
                message: 'Account not verified', 
                needsVerification: true, 
                email: user.email 
            });
        }

        // 4. Dispatch metadata session payload
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id, user.role)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * Verify Registration OTP
 * 
 * Compares OTP token parameters against DB records. If valid, updates
 * the user verification status and logs the user in immediately by sending a session token.
 */
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        // Match OTP record based on email, verification code, and action type
        const validOTP = await OTP.findOne({ email, otp, action: 'account_verification' });
        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Activate the User account
        const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
        
        // Delete the consumed OTP from database
        await OTP.deleteOne({ _id: validOTP._id });

        // Complete instant authorization
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id, user.role)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
