const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

router.get('/analytics', protect, admin, getAnalytics);

module.exports = router;
