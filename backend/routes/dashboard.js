const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

// Routes
// Get dashboard stats (role-based)
router.get('/stats', authenticateToken, (req, res, next) => {
  if (req.user.role === 'employee') {
    return dashboardController.getEmployeeDashboardStats(req, res, next);
  }
  return dashboardController.getDashboardStats(req, res, next);
});

module.exports = router;
