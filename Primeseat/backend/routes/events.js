const express = require('express');
const router = express.Router();
const { getEvents, getEventById, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect, admin } = require('../middleware/auth');

/**
 * Event Catalog Routes
 * Base route: /api/events
 */

// Route to query all events (supports filtering by category, search text, upcoming status, and sorting filters)
router.get('/', getEvents);

// Route to fetch a single event record's complete metadata details by ID
router.get('/:id', getEventById);

// Route to create a new event (restricted to Admin users)
router.post('/', protect, admin, createEvent);

// Route to update event metadata details/seating capacities (restricted to Admin users)
router.put('/:id', protect, admin, updateEvent);

// Route to delete an event and clean up its associated bookings (restricted to Admin users)
router.delete('/:id', protect, admin, deleteEvent);

module.exports = router;
