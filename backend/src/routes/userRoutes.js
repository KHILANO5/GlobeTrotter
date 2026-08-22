const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.get('/me', authenticateUser, UserController.getMe);
router.get('/me/saved-destinations', authenticateUser, UserController.getSavedDestinations);

module.exports = router;
