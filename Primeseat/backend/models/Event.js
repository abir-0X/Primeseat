const mongoose = require('mongoose');

/**
 * Event Mongoose Schema
 * 
 * Maps event catalog detail details including titles, physical locations, capacities,
 * current live seats available, categories, ticket prices, and ownership.
 */
const eventSchema = new mongoose.Schema({
    // Name/title of the published event
    title: { type: String, required: true },
    
    // Detailed markdown or plain text description of the event schedule/information
    description: { type: String, required: true },
    
    // Scheduled calendar date of the event
    date: { type: Date, required: true },
    
    // Physical location or digital link where the event is hosted
    location: { type: String, required: true },
    
    // The theme/tag category (e.g. Technology, Music, Business, Art)
    category: { type: String, required: true },
    
    // Total venue ticket capacity limit
    totalSeats: { type: Number, required: true },
    
    // Currently available remaining seats (used for live ticketing verification)
    availableSeats: { type: Number, required: true },
    
    // Cover image URL representing the event page header
    image: { type: String },
    
    // Entry price (0 represents Free event)
    ticketPrice: { type: Number, required: true, default: 0 },
    
    // Admin reference of the team member who created/managed this event record
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { 
    // Auto-populate audit timestamps
    timestamps: true 
});

module.exports = mongoose.model('Event', eventSchema);
