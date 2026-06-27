const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');

/**
 * Admin Controller
 * 
 * Handles back-office reporting and analytics. Computes and gathers KPI indicators
 * (revenue, confirmed paid clients, pending request queues, event seat bookings, and occupancy rates).
 */

/**
 * Retrieve System-Wide Analytics & KPI Metrics
 * 
 * Compiles a comprehensive business report:
 * 1. Counts of pending and confirmed bookings.
 * 2. Total active revenue based on confirmed & paid ticket totals.
 * 3. General counts of total published events and unique standard clients.
 * 4. Booking occupancy metrics (total capacity, seats sold, and bookings count) calculated per event.
 */
exports.getAnalytics = async (req, res) => {
    try {
        // 1. Fetch total count of pending registration requests
        const pendingRequestsCount = await Booking.countDocuments({ status: 'pending' });

        // 2. Fetch total count of confirmed seats
        const confirmedBookingsCount = await Booking.countDocuments({ status: 'confirmed' });

        // 3. Fetch count of active attendees (confirmed status and marked paid)
        const confirmedPaidClientsCount = await Booking.countDocuments({ 
            status: 'confirmed', 
            paymentStatus: 'paid' 
        });

        // 4. Calculate total platform revenue using mongo aggregation pipeline
        const revenueResult = await Booking.aggregate([
            { 
                $match: { 
                    status: 'confirmed', 
                    paymentStatus: 'paid' 
                } 
            },
            { 
                $group: { 
                    _id: null, 
                    totalRevenue: { $sum: '$amount' } 
                } 
            }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        // 5. General entity stats counts
        const totalEventsCount = await Event.countDocuments();
        const totalUsersCount = await User.countDocuments({ role: 'user' });

        // 6. Gather occupancy details for each published event
        const eventsList = await Event.find({}, 'title totalSeats availableSeats category ticketPrice');
        const eventStats = await Promise.all(eventsList.map(async (event) => {
            const bookingsCount = await Booking.countDocuments({ eventId: event._id, status: 'confirmed' });
            return {
                _id: event._id,
                title: event.title,
                category: event.category,
                ticketPrice: event.ticketPrice,
                totalSeats: event.totalSeats,
                availableSeats: event.availableSeats,
                bookedSeats: event.totalSeats - event.availableSeats, // tickets checked out
                confirmedBookingsCount: bookingsCount
            };
        }));

        res.json({
            pendingRequestsCount,
            confirmedBookingsCount,
            confirmedPaidClientsCount,
            totalRevenue,
            totalEventsCount,
            totalUsersCount,
            eventStats
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
