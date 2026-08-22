const express = require('express');
const router = express.Router();
const TripController = require('../controllers/TripController');
const ShareController = require('../controllers/ShareController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.get('/', authenticateUser, TripController.getTrips);
router.post('/', authenticateUser, TripController.createTrip);
router.get('/:tripId', authenticateUser, TripController.getTripById);
router.put('/:tripId', authenticateUser, TripController.updateTrip);
router.delete('/:tripId', authenticateUser, TripController.deleteTrip);

// Share endpoint
router.post('/:tripId/share', authenticateUser, ShareController.createShare);

module.exports = router;
