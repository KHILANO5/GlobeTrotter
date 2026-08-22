const express = require('express');
const router = express.Router({ mergeParams: true });
const ItineraryController = require('../controllers/ItineraryController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.get('/stops', authenticateUser, ItineraryController.getStops);
router.post('/stops', authenticateUser, ItineraryController.createStop);
router.put('/stops/:stopId', authenticateUser, ItineraryController.updateStop);
router.delete('/stops/:stopId', authenticateUser, ItineraryController.deleteStop);
router.patch('/stops/reorder', authenticateUser, ItineraryController.reorderStops);
router.get('/itinerary', authenticateUser, ItineraryController.getItinerary);

module.exports = router;
