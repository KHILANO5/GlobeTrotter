const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const UserController = require('../controllers/UserController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.get('/me', authenticateUser, UserController.getMe);
router.get('/me/saved-destinations', authenticateUser, UserController.getSavedDestinations);
router.put('/me', authenticateUser, upload.single('photo'), UserController.updateProfile);

module.exports = router;
