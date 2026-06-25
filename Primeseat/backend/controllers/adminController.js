const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');

exports.getAnalytics = async (req, res) => {
    try {
        // 1. Count pending requests
        const pendingRequestsCount = await Booking.countDocuments({ status: 'pending' });

        // 2. Count confirmed bookings
        const confirmedBookingsCount = await Booking.countDocuments({ status: 'confirmed' });

        // 3. Count confirmed & paid clients
        const confirmedPaidClientsCount = await Booking.countDocuments({ 
            status: 'confirmed', 
            paymentStatus: 'paid' 
        });

        // 4. Calculate total revenue (sum of confirmed & paid bookings amount)
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

        // 5. Total events and users count
        const totalEventsCount = await Event.countDocuments();
        const totalUsersCount = await User.countDocuments({ role: 'user' });

        // 6. Occupancy rates & bookings per event
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
                bookedSeats: event.totalSeats - event.availableSeats,
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
