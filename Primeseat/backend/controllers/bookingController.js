const Booking = require('../models/Booking');
const Event = require('../models/Event');
const OTP = require('../models/OTP');
const { sendBookingEmail, sendOTPEmail } = require('../utils/email');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// User triggers OTP to authorize their booking
exports.sendBookingOTP = async (req, res) => {
    try {
        const otp = generateOTP();
        await OTP.findOneAndDelete({ email: req.user.email, action: 'event_booking' });
        await OTP.create({ email: req.user.email, otp, action: 'event_booking' });
        await sendOTPEmail(req.user.email, otp, 'event_booking');
        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

// User creates booking using the OTP
exports.bookEvent = async (req, res) => {
    try {
        const { eventId, otp } = req.body;

        // Verify OTP explicitly before proceeding (valid for 2 minutes as configured in model TTL)
        const validOTP = await OTP.findOne({ email: req.user.email, otp, action: 'event_booking' });
        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP for booking' });
        }

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.availableSeats <= 0) return res.status(400).json({ message: 'No seats available' });

        const existingBooking = await Booking.findOne({ userId: req.user.id, eventId });
        if (existingBooking && existingBooking.status !== 'cancelled' && existingBooking.status !== 'rejected') {
            return res.status(400).json({ message: 'Already booked or pending request exists' });
        }

        const booking = await Booking.create({
            userId: req.user.id,
            eventId,
            status: 'pending',
            paymentStatus: 'not_paid',
            amount: event.ticketPrice
        });

        await OTP.deleteOne({ _id: validOTP._id }); // cleanup

        res.status(201).json({ message: 'Booking request submitted successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Admin updates booking status (Confirm/Reject/Pending) - independent of payment status
exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'confirmed', 'rejected', 'pending'
        if (!['confirmed', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status type' });
        }

        const booking = await Booking.findById(req.params.id).populate('userId').populate('eventId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status === status) {
            return res.json({ message: `Booking status is already ${status}`, booking });
        }

        const oldStatus = booking.status;
        const event = await Event.findById(booking.eventId._id);
        if (!event) return res.status(404).json({ message: 'Associated event not found' });

        // Seat management logic
        if (status === 'confirmed') {
            // Check capacity only if we are confirming a previously non-confirmed booking
            if (event.availableSeats <= 0) {
                return res.status(400).json({ message: 'No seats available to confirm this booking' });
            }
            event.availableSeats -= 1;
            await event.save();

            // Send confirmation email
            await sendBookingEmail(booking.userId.email, booking.userId.name, booking.eventId.title);
        } else if (oldStatus === 'confirmed' && status !== 'confirmed') {
            // Releasing the seat if changing from confirmed to rejected/pending/cancelled
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

// Admin updates payment status ('paid' / 'not_paid') - independent of booking status
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body; // 'paid', 'not_paid'
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

// Legacy method maintained for frontend compatibility, sets status to confirmed and handles payment status if passed
exports.confirmBooking = async (req, res) => {
    try {
        const { paymentStatus } = req.body; // 'paid' or 'not_paid'
        const booking = await Booking.findById(req.params.id).populate('userId').populate('eventId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status === 'confirmed') {
            if (paymentStatus) {
                booking.paymentStatus = paymentStatus;
                await booking.save();
            }
            return res.json({ message: 'Booking is already confirmed', booking });
        }

        const event = await Event.findById(booking.eventId._id);
        if (event.availableSeats <= 0) {
            return res.status(400).json({ message: 'No seats available to confirm this booking' });
        }

        booking.status = 'confirmed';
        if (paymentStatus) {
            booking.paymentStatus = paymentStatus;
        }
        await booking.save();

        event.availableSeats -= 1;
        await event.save();

        // Send email on admin confirmation
        await sendBookingEmail(booking.userId.email, booking.userId.name, booking.eventId.title);

        res.json({ message: 'Booking confirmed successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Retrieve bookings (Admin gets all, User gets only their own)
exports.getMyBookings = async (req, res) => {
    try {
        const bookings = req.user.role === 'admin'
            ? await Booking.find().populate('eventId').populate('userId', 'name email').sort({ createdAt: -1 })
            : await Booking.find({ userId: req.user.id }).populate('eventId').sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Cancel a booking request (restores seat if booking was confirmed)
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        
        // Authorization check
        if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to cancel this booking' });
        }
        if (booking.status === 'cancelled') return res.status(400).json({ message: 'Booking is already cancelled' });

        const wasConfirmed = booking.status === 'confirmed';

        booking.status = 'cancelled';
        await booking.save();

        // Release seats if confirmed
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
