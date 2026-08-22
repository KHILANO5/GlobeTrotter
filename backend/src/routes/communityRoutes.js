const express = require('express');
const router = express.Router();
const TripController = require('../controllers/TripController');

router.get('/trips', TripController.getCommunityTrips);

module.exports = router;
