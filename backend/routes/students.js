const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, requireSuperAdmin, canManageStudents } = require('../middleware/auth');

// Validation middleware
const studentValidation = [
  body('campVenue').trim().notEmpty().withMessage('Camp venue is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('age').isInt({ min: 1, max: 120 }).withMessage('Age must be between 1 and 120'),
  body('dateOfBirth').isISO8601().withMessage('Date of birth is required'),
  body('religion').trim().notEmpty().withMessage('Religion is required'),
  body('caste').trim().notEmpty().withMessage('Caste is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('contactNumber').trim().notEmpty().withMessage('Contact number is required'),
  body('parentName').trim().notEmpty().withMessage('Parent name is required'),
  body('parentRelation').trim().notEmpty().withMessage('Parent relation is required'),
  body('parentMobileNumber').trim().notEmpty().withMessage('Parent mobile number is required'),
  body('parentAddress').trim().notEmpty().withMessage('Parent address is required'),
  body('height').isFloat({ min: 0 }).withMessage('Height must be a positive number'),
  body('weight').isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  body('chestUnexpanded').isFloat({ min: 0 }).withMessage('Chest unexpanded must be a positive number'),
  body('chestExpanded').isFloat({ min: 0 }).withMessage('Chest expanded must be a positive number'),
  body('vision').trim().notEmpty().withMessage('Vision is required'),
  body('bloodGroup').trim().notEmpty().withMessage('Blood group is required'),
  body('educationalDetails').isArray().withMessage('Educational details must be an array'),
  body('educationalDetails.*.course').trim().notEmpty().withMessage('Course is required'),
  body('educationalDetails.*.university').trim().notEmpty().withMessage('University is required')
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
