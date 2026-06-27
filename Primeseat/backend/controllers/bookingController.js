const Booking = require('../models/Booking');
const Event = require('../models/Event');
const OTP = require('../models/OTP');
const { sendBookingEmail, sendOTPEmail } = require('../utils/email');

/**
 * Helper: Generate a secure 6-digit verification code
 * @returns {string} 6-digit numeric string
 */
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Generate and Send OTP for Event Booking Authorization (2FA)
 * 
 * Generates a temporary 6-digit OTP code, stores it in the database with an 
 * active "event_booking" action type, and sends it to the user's email.
 * This ensures that only users with verified email access can place bookings.
 */
exports.sendBookingOTP = async (req, res) => {
    try {
        const otp = generateOTP();
        
        // Remove any prior pending booking OTP requests from this email to prevent spam/collisions
        await OTP.findOneAndDelete({ email: req.user.email, action: 'event_booking' });
        
        // Create the new OTP record (has a 2-minute time-to-live TTL via mongoose schema index)
        await OTP.create({ email: req.user.email, otp, action: 'event_booking' });
        
        // Email the OTP code to the client
        await sendOTPEmail(req.user.email, otp, 'event_booking');
        
        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

/**
 * Place a New Event Booking Request
 * 
 * Validates the user's 2FA OTP, checks seat availability, detects duplicate 
 * pending/confirmed registrations, and records the booking request as "pending".
 */
exports.bookEvent = async (req, res) => {
    try {
        const { eventId, otp } = req.body;

        // 1. Validate that the OTP provided matches the user's current session and is not expired
        const validOTP = await OTP.findOne({ email: req.user.email, otp, action: 'event_booking' });
        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP for booking' });
        }

        // 2. Retrieve the event and confirm active capacity
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.availableSeats <= 0) return res.status(400).json({ message: 'No seats available' });

        // 3. Prevent duplicate active booking entries
        const existingBooking = await Booking.findOne({ userId: req.user.id, eventId });
        if (existingBooking && existingBooking.status !== 'cancelled' && existingBooking.status !== 'rejected') {
            return res.status(400).json({ message: 'Already booked or pending request exists' });
        }

        // 4. Create the booking entry in a pending, unpaid state
        const booking = await Booking.create({
            userId: req.user.id,
            eventId,
            status: 'pending',
            paymentStatus: 'not_paid',
            amount: event.ticketPrice
        });

        // 5. Clean up the consumed OTP from database
        await OTP.deleteOne({ _id: validOTP._id });

        res.status(201).json({ message: 'Booking request submitted successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * Admin: Update Booking Reservation Status (Confirm / Reject / Pending)
 * 
 * Modifies the event ticket reservation state independently of the payment state.
 * Decrements the event's availableSeats when confirming a ticket, and restores 
 * the seat back to the catalog if a confirmed booking is set to a non-confirmed state.
 */
exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body; // Allowed values: 'confirmed', 'rejected', 'pending'
        if (!['confirmed', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status type' });
        }

        // Retrieve the target booking, fetching nested event and user details
        const booking = await Booking.findById(req.params.id).populate('userId').populate('eventId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Short-circuit if no actual status transition is occurring
        if (booking.status === status) {
            return res.json({ message: `Booking status is already ${status}`, booking });
        }

        const oldStatus = booking.status;
        const event = await Event.findById(booking.eventId._id);
        if (!event) return res.status(404).json({ message: 'Associated event not found' });

        // Manage inventory capacity updates
        if (status === 'confirmed') {
            // Guarantee seat availability prior to confirmation
            if (event.availableSeats <= 0) {
                return res.status(400).json({ message: 'No seats available to confirm this booking' });
            }
            event.availableSeats -= 1;
            await event.save();

            // Dispatch confirmation receipt email to the attendee
            await sendBookingEmail(booking.userId.email, booking.userId.name, booking.eventId.title);
        } else if (oldStatus === 'confirmed' && status !== 'confirmed') {
            // Relinquish seats if transitioning away from confirmed status
            event.availableSeats = Math.min(event.availableSeats + 1, event.totalSeats);
            await event.save();
        }

        booking.status = status;
        await booking.save();

        res.json({ message: `Booking status updated to ${status} successfully`, booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * Admin: Update Booking Payment Status (Paid / Not Paid)
 * 
 * Modifies payment states independently of the reservation status. 
 * Allows administrative accounting tracking for manual or gate-based checkouts.
 */
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body; // Allowed values: 'paid', 'not_paid'
        if (!['paid', 'not_paid'].includes(paymentStatus)) {
            return res.status(400).json({ message: 'Invalid payment status type' });
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.paymentStatus = paymentStatus;
        await booking.save();

        res.json({ message: `Payment status updated to ${paymentStatus} successfully`, booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * Fetch Bookings List
 * 
 * Returns all system bookings sorted by date (newest first) if the requester 
 * is an Admin. Standard users receive only booking requests initiated by themselves.
 */
exports.getMyBookings = async (req, res) => {
    try {
        const bookings = req.user.role === 'admin'
            ? await Booking.find().populate('eventId').populate('userId', 'name email').sort({ createdAt: -1 })
            : await Booking.find({ userId: req.user.id }).populate('eventId').sort({ createdAt: -1 });
        
        // Filter out bookings whose referenced event or user details have been deleted
        const validBookings = bookings.filter(booking => booking.eventId && booking.userId);
        
        res.json(validBookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * Cancel a Booking
 * 
 * Cancels a ticket request. If the booking was previously confirmed, it restores 
 * the held ticket/seat capacity back to the associated event.
 */
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        
        // Ensure standard users can only cancel their own bookings, while Admins bypass
        if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to cancel this booking' });
        }
        if (booking.status === 'cancelled') return res.status(400).json({ message: 'Booking is already cancelled' });

        const wasConfirmed = booking.status === 'confirmed';

        booking.status = 'cancelled';
        await booking.save();

        // Release holds on confirmed ticket seats to keep inventory accurate
        if (wasConfirmed) {
            const event = await Event.findById(booking.eventId);
            if (event) {
                event.availableSeats = Math.min(event.availableSeats + 1, event.totalSeats);
                await event.save();
            }
        }

        res.json({ message: 'Booking cancelled successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
