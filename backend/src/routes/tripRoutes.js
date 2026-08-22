const express = require('express');
const router = express.Router();
const TripController = require('../controllers/TripController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.get('/', authenticateUser, TripController.getTrips);
router.post('/', authenticateUser, TripController.createTrip);
router.get('/:tripId', authenticateUser, TripController.getTripById);

module.exports = router;
