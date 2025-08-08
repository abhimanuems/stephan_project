const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  markAttendance,
  getAttendanceRecords,
  getAttendanceStats,
  getTodayAttendance,
  clockIn,
  clockOut
} = require('../controllers/employeeAttendanceController');

// Mark attendance
router.post('/mark', authenticateToken, markAttendance);

// Clock in/out functionality
router.post('/clock-in', authenticateToken, clockIn);
router.post('/clock-out', authenticateToken, clockOut);

// Get attendance records
router.get('/records', authenticateToken, getAttendanceRecords);

// Get attendance statistics
router.get('/stats', authenticateToken, getAttendanceStats);

// Get today's attendance
router.get('/today', authenticateToken, getTodayAttendance);

module.exports = router;
