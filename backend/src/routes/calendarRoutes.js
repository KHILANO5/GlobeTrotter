const express = require('express');
const router = express.Router({ mergeParams: true });
const CalendarController = require('../controllers/CalendarController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.get('/calendar', authenticateUser, CalendarController.getCalendar);

module.exports = router;
