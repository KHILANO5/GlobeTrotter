const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser, requireRole } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes (available to both USER and ADMIN)
router.get('/user/profile', authenticateUser, authController.getProfile);

// Admin-only route
router.get('/admin/dashboard', authenticateUser, requireRole('ADMIN'), authController.getAdminDashboard);

module.exports = router;
