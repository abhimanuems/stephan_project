const express = require('express');
const router = express.Router();
const { authenticateToken, canManageStudents } = require('../middleware/auth');
const {
  getStudentsByCampVenue,
  markAttendance,
  getAttendanceRecords,
  getAttendanceStats
} = require('../controllers/attendanceController');

// Get students by camp venue (for attendance marking)
router.get('/students/:campVenue', authenticateToken, canManageStudents, getStudentsByCampVenue);

// Mark attendance for multiple students
router.post('/mark', authenticateToken, canManageStudents, markAttendance);

// Get attendance records for a camp venue
router.get('/records/:campVenue', authenticateToken, canManageStudents, getAttendanceRecords);

// Get attendance statistics for a camp venue
router.get('/stats/:campVenue', authenticateToken, canManageStudents, getAttendanceStats);

module.exports = router;
