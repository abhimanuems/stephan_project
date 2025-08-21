const express = require('express');
const router = express.Router();
const { authenticateToken, canManageStudents } = require('../middleware/auth');
const {
  getStudentsByCampVenue,
  markAttendance,
  markManualAttendance,
  searchStudentsForAttendance,
  getAttendanceRecords,
  getAttendanceStats,
  downloadAttendancePDF
} = require('../controllers/attendanceController');

// Get students by camp venue (for attendance marking)
router.get('/students/:campVenue', authenticateToken, canManageStudents, getStudentsByCampVenue);

// Mark attendance for multiple students
router.post('/mark', authenticateToken, canManageStudents, markAttendance);

// Manually mark attendance for a specific student
router.post('/mark-manual', authenticateToken, canManageStudents, markManualAttendance);

// Search students for manual attendance marking
router.get('/search-students', authenticateToken, canManageStudents, searchStudentsForAttendance);

// Get attendance records for a camp venue
router.get('/records/:campVenue', authenticateToken, canManageStudents, getAttendanceRecords);

// Get attendance statistics for a camp venue
router.get('/stats/:campVenue', authenticateToken, canManageStudents, getAttendanceStats);

// Download attendance records as PDF
router.get('/download-pdf/:campVenue', authenticateToken, canManageStudents, downloadAttendancePDF);

module.exports = router;
