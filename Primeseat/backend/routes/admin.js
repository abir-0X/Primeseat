const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

/**
 * Admin Business Intelligence Routes
 * Base route: /api/admin
 */

// Route to retrieve aggregated dashboard metrics, client stats, and event booking percentages (Admin-only restricted)
router.get('/analytics', protect, admin, getAnalytics);

module.exports = router;
