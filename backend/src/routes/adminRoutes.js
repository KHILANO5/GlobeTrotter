const express = require('express');
const router = express.Router();
const adminController = require('../controllers/AdminController');
const { authenticateUser, requireRole } = require('../middleware/authMiddleware');

// All admin routes strictly require valid JWT and ADMIN role
router.use(authenticateUser);
router.use(requireRole('admin'));

// ─── User Management ────────────────────────────────────────────────────────
router.get('/users', adminController.getUsers);
router.get('/users/:userId/trips', adminController.getUserTrips);
router.patch('/users/:userId/role', adminController.updateUserRole);
router.delete('/users/:userId', adminController.deleteUser);

// ─── Analytics ─────────────────────────────────────────────────────────────
router.get('/analytics/popular-cities', adminController.getPopularCities);
router.get('/analytics/popular-activities', adminController.getPopularActivities);
router.get('/analytics/engagement', adminController.getEngagementAnalytics);

// Legacy dashboard alias
router.get('/dashboard', adminController.getEngagementAnalytics);

module.exports = router;
