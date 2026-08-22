const express = require('express');
const router = express.Router();
const ShareController = require('../controllers/ShareController');
const { authenticateUser } = require('../middleware/authMiddleware');

// Public shared trip retrieval
router.get('/:shareToken', ShareController.getSharedTrip);

// Authenticated copy
router.post('/:shareToken/copy', authenticateUser, ShareController.copySharedTrip);

module.exports = router;
