const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const courseStudentController = require('../controllers/courseStudentController');
const { authenticateToken, requireSuperAdmin, canManageStudents } = require('../middleware/auth');

// Validation middleware
const paymentValidation = [
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('courseId').notEmpty().withMessage('Course ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('paymentMode').isIn(['Full', 'Partial']).withMessage('Payment mode must be Full or Partial')
];

// Routes

// Get all students with selected courses
router.get('/', authenticateToken, canManageStudents, courseStudentController.getCourseStudents);

// Update payment for a student's course (static route - must come before dynamic routes)
router.post('/update-payment', authenticateToken, canManageStudents, paymentValidation, courseStudentController.updatePayment);

// Mark partial payment as paid (static route - must come before dynamic routes)
router.post('/mark-partial-paid', authenticateToken, requireSuperAdmin, [
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('courseId').notEmpty().withMessage('Course ID is required'),
  body('partialIndex').isInt({ min: 0 }).withMessage('Partial payment index must be a valid integer')
], courseStudentController.markPartialPaid);

// Get payment summary for a specific student
router.get('/:studentId/payment-summary', authenticateToken, canManageStudents, courseStudentController.getStudentPaymentSummary);

// Get transaction history for a student's course
router.get('/:studentId/:courseId/transactions', authenticateToken, canManageStudents, courseStudentController.getTransactionHistory);
 
 module.exports = router;
