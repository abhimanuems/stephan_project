const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

// Validation middleware
const courseValidation = [
  body('name').trim().notEmpty().withMessage('Course name is required'),
  body('description').optional().trim(),
  body('duration').optional().trim().isIn([
    '1 Month', '2 Months', '3 Months', '4 Months', '5 Months', '6 Months',
    '7 Months', '8 Months', '9 Months', '10 Months', '11 Months',
    '1 Year', '1.5 Years', '2 Years', '2.5 Years', '3 Years',
    '3.5 Years', '4 Years', '4.5 Years', '5 Years'
  ]).withMessage('Please select a valid duration from the list'),
  body('courseFee').optional().isFloat({ min: 0 }).withMessage('Course fee must be a positive number')
];

// Routes
// Get all courses (all authenticated users can see courses)
router.get('/', authenticateToken, courseController.getCourses);

// Get single course
router.get('/:id', authenticateToken, courseController.getCourse);

// Create new course (superadmin only)
router.post('/', authenticateToken, requireSuperAdmin, courseValidation, courseController.createCourse);

// Update course (superadmin only)
router.put('/:id', authenticateToken, requireSuperAdmin, courseValidation, courseController.updateCourse);

// Delete course (superadmin only)
router.delete('/:id', authenticateToken, requireSuperAdmin, courseController.deleteCourse);

// Toggle course status (superadmin only)
router.patch('/:id/toggle-status', authenticateToken, requireSuperAdmin, courseController.toggleCourseStatus);

// Get active courses for student form
router.get('/active/list', authenticateToken, courseController.getActiveCourses);

module.exports = router;
