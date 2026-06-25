const express = require('express');
const router = express.Router();
const { 
    bookEvent, 
    confirmBooking, 
    updateBookingStatus, 
    updatePaymentStatus, 
    getMyBookings, 
    cancelBooking, 
    sendBookingOTP 
} = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/auth');

router.post('/send-otp', protect, sendBookingOTP);
router.post('/', protect, bookEvent);
router.put('/:id/confirm', protect, admin, confirmBooking); // Legacy compat
router.put('/:id/status', protect, admin, updateBookingStatus);
router.put('/:id/payment', protect, admin, updatePaymentStatus);
router.get('/my', protect, getMyBookings);
router.delete('/:id', protect, cancelBooking);

module.exports = router;
