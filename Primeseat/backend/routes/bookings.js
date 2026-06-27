const express = require('express');
const router = express.Router();
const { 
    bookEvent, 
    updateBookingStatus, 
    updatePaymentStatus, 
    getMyBookings, 
    cancelBooking, 
    sendBookingOTP 
} = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/auth');

/**
 * Booking Routes
 * Base route: /api/bookings
 */

// Route to trigger a 2FA verification OTP sent to the user's email for authorizing a booking request
router.post('/send-otp', protect, sendBookingOTP);

// Route to submit a new pending booking request using the verification OTP
router.post('/', protect, bookEvent);

// Route for Admins to dynamically update a booking's reservation status (e.g. pending -> confirmed/rejected)
router.put('/:id/status', protect, admin, updateBookingStatus);

// Route for Admins to update a booking's payment status (e.g. not_paid -> paid) independently of reservation status
router.put('/:id/payment', protect, admin, updatePaymentStatus);

// Route to fetch bookings (retrieves all for Admins, retrieves only self bookings for standard Users)
router.get('/my', protect, getMyBookings);

// Route for a User or Admin to cancel a booking request (releases hold on seat if previously confirmed)
router.delete('/:id', protect, cancelBooking);

module.exports = router;
