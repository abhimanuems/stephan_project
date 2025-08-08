const express = require('express');
const router = express.Router();
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveRequestStatus,
  getLeaveBalance,
  getLeaveStats
} = require('../controllers/leaveRequestController');

// Employee routes
router.post('/', authenticateToken, createLeaveRequest);
router.get('/my', authenticateToken, getMyLeaveRequests);
router.get('/balance', authenticateToken, getLeaveBalance);

// Super admin routes
router.get('/', authenticateToken, requireSuperAdmin, getAllLeaveRequests);
router.put('/:requestId/status', authenticateToken, requireSuperAdmin, updateLeaveRequestStatus);
router.get('/stats', authenticateToken, requireSuperAdmin, getLeaveStats);

module.exports = router;
