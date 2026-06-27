const mongoose = require('mongoose');

/**
 * Booking Mongoose Schema
 * 
 * Maps registration/ticket bookings for events. Supports independent booking statuses 
 * and independent payment tracking for accounting convenience.
 */
const bookingSchema = new mongoose.Schema({
    // Reference to the registered user who requested the booking
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Reference to the booked event
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    
    // State of ticket reservation
    status: { type: String, enum: ['confirmed', 'cancelled', 'pending', 'rejected'], default: 'pending' },
    
    // Payment status tracking
    paymentStatus: { type: String, enum: ['paid', 'not_paid'], default: 'not_paid' },
    
    // Amount charged for the ticket
    amount: { type: Number, required: true },
    
    // Date/time when the ticket booking request was completed
    bookedAt: { type: Date, default: Date.now }
}, { 
    // Auto-populate createdAt and updatedAt timestamps for auditing
    timestamps: true 
});

module.exports = mongoose.model('Booking', bookingSchema);
