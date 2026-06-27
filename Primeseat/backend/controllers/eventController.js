const Event = require('../models/Event');
const Booking = require('../models/Booking');

/**
 * Event Controller
 * 
 * Manages the CRUD catalog logic of event objects including filtering parameters,
 * capacity adjustments, and cascades for dependent bookings.
 */

/**
 * Query All Events
 * 
 * Queries event documents. Supports options such as category filters, case-insensitive title search regex matching,
 * future date filters (`upcoming=true`), and multiple sorting orders (latest, soonest, etc.).
 */
exports.getEvents = async (req, res) => {
    try {
        const filters = {};
        
        // Apply category filter if specified
        if (req.query.category) filters.category = req.query.category;
        
        // Apply case-insensitive query text matching on title
        if (req.query.search) filters.title = { $regex: req.query.search, $options: 'i' };

        // Exclude past events if filtering for upcoming events
        if (req.query.upcoming === 'true') {
            filters.date = { $gte: new Date() };
        }

        let query = Event.find(filters).populate('createdBy', 'name email');

        // Apply sorting rules
        if (req.query.sort === 'latest') {
            query = query.sort({ createdAt: -1 });
        } else if (req.query.sort === 'date_asc') {
            query = query.sort({ date: 1 });
        } else if (req.query.sort === 'date_desc') {
            query = query.sort({ date: -1 });
        }

        const events = await query;
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * Fetch Single Event details by ID
 */
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * Create New Event Record (Admin only)
 * 
 * Initializes a new event entry, setting active capacities and available seats 
 * based on input parameters.
 */
exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, location, category, totalSeats, ticketPrice, image } = req.body;
        const event = await Event.create({
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            availableSeats: totalSeats, // Initially, all seats are available
            ticketPrice: ticketPrice || 0,
            image: image || '',
            createdBy: req.user.id
        });
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * Update Event Details (Admin only)
 * 
 * Updates event parameters. Dynamically re-evaluates and guards capacity updates 
 * to ensure totalSeats can never be reduced below the count of active booked seats.
 */
exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Safe Capacity Recalculation Check
        if (req.body.totalSeats !== undefined) {
            const newTotalSeats = parseInt(req.body.totalSeats, 10);
            const bookedSeats = event.totalSeats - event.availableSeats;

            // Restrict reducing capacity limit below the current occupied total
            if (newTotalSeats < bookedSeats) {
                return res.status(400).json({ 
                    message: `Cannot reduce total seats to ${newTotalSeats} because ${bookedSeats} seats are already booked.` 
                });
            }

            // Adjust remaining available seats based on new capacity
            req.body.availableSeats = newTotalSeats - bookedSeats;
        }

        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedEvent);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * Delete Event (Admin only)
 * 
 * Removes the target event record and cascades deletion to remove all booking 
 * records linked to this event.
 */
exports.deleteEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findByIdAndDelete(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Cascade delete: Purge booking records associated with the deleted event
        await Booking.deleteMany({ eventId: eventId });

        res.json({ message: 'Event and associated bookings deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
