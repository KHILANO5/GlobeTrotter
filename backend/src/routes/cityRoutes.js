const express = require('express');
const router = express.Router();
const CityController = require('../controllers/CityController');

router.get('/', CityController.getCities);
router.get('/:cityId', CityController.getCityById);

module.exports = router;
