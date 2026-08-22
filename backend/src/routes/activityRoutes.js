const express = require('express');
const router = express.Router({ mergeParams: true });
const ActivityController = require('../controllers/ActivityController');
const { authenticateUser } = require('../middleware/authMiddleware');

// Public catalog search
router.get('/', ActivityController.getActivities);

// Trip stop activity assignments
router.get('/trips/:tripId/stops/:stopId/activities', authenticateUser, ActivityController.getStopActivities);
router.post('/trips/:tripId/stops/:stopId/activities', authenticateUser, ActivityController.addStopActivity);
router.delete('/trips/:tripId/stops/:stopId/activities/:activityId', authenticateUser, ActivityController.removeStopActivity);

module.exports = router;
