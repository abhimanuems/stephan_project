const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, requireSuperAdmin, canManageStudents } = require('../middleware/auth');

// Validation middleware
const studentValidation = [
  body('campVenue').trim().notEmpty().withMessage('Physical center is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('age').isInt({ min: 1, max: 120 }).withMessage('Age must be between 1 and 120'),
  body('dateOfBirth').isISO8601().withMessage('Date of birth is required'),
  body('religion').optional().trim(),
  body('caste').optional().trim(),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('contactNumber').trim().notEmpty().withMessage('Contact number is required'),
  body('parentName').trim().notEmpty().withMessage('Parent name is required'),
  body('parentMobileNumber').trim().notEmpty().withMessage('Parent mobile number is required'),
  body('height').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    return !isNaN(value) && parseFloat(value) >= 0;
  }).withMessage('Height must be a positive number'),
  body('weight').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    return !isNaN(value) && parseFloat(value) >= 0;
  }).withMessage('Weight must be a positive number'),
  body('chestUnexpanded').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    return !isNaN(value) && parseFloat(value) >= 0;
  }).withMessage('Chest unexpanded must be a positive number'),
  body('chestExpanded').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    return !isNaN(value) && parseFloat(value) >= 0;
  }).withMessage('Chest expanded must be a positive number'),
  body('vision').optional().trim(),
  body('bloodGroup').optional().trim(),
  body('courseMode').optional().isIn(['Online', 'Offline']).withMessage('Course mode must be Online or Offline'),
  body('educationalDetails').isArray().withMessage('Educational details must be an array'),
  body('educationalDetails.*.course').trim().notEmpty().withMessage('Course is required'),
  body('educationalDetails.*.university').trim().notEmpty().withMessage('University is required'),
  body('selectedCourses').isArray().withMessage('Selected courses must be an array'),
  body('selectedCourses.*.courseId').notEmpty().withMessage('Course ID is required'),
  body('selectedCourses.*.courseName').trim().notEmpty().withMessage('Course name is required'),
  body('selectedCourses.*.courseFee').isFloat({ min: 0 }).withMessage('Course fee must be a positive number'),
  body('selectedCourses.*.duration').trim().notEmpty().withMessage('Course duration is required'),
  body('selectedCourses.*.totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
  body('selectedCourses.*.amountPaid').optional().isFloat({ min: 0 }).withMessage('Amount paid must be a positive number'),
  body('selectedCourses.*.paymentStatus').optional().isIn(['Pending', 'Partial', 'Completed']).withMessage('Invalid payment status'),
  body('selectedCourses.*.paymentMode').optional().isIn(['Full', 'Partial']).withMessage('Invalid payment mode')
];

// Routes
// Get all students (all authenticated users can see all students)
router.get('/', authenticateToken, canManageStudents, studentController.getAllStudents);

// Get single student
router.get('/:id', authenticateToken, canManageStudents, studentController.getStudentById);

// Create new student
router.post('/', authenticateToken, canManageStudents, studentValidation, studentController.createStudent);

// Update student
router.put('/:id', authenticateToken, canManageStudents, studentValidation, studentController.updateStudent);

// Delete student (superadmin only)
router.delete('/:id', authenticateToken, requireSuperAdmin, studentController.deleteStudent);

module.exports = router;
