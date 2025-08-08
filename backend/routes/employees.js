const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

// Validation middleware
const employeeValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'employee']).withMessage('Invalid role'),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
  body('designation').optional().trim().notEmpty().withMessage('Designation cannot be empty'),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
  body('address').optional().trim().notEmpty().withMessage('Address cannot be empty')
];

const updateEmployeeValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('role').isIn(['admin', 'employee']).withMessage('Invalid role'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
  body('designation').optional().trim().notEmpty().withMessage('Designation cannot be empty'),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
  body('address').optional().trim().notEmpty().withMessage('Address cannot be empty')
];

// Routes (all require superadmin access)
router.get('/', authenticateToken, requireSuperAdmin, employeeController.getAllEmployees);
router.get('/:id', authenticateToken, requireSuperAdmin, employeeController.getEmployeeById);
router.post('/', authenticateToken, requireSuperAdmin, employeeValidation, employeeController.createEmployee);
router.put('/:id', authenticateToken, requireSuperAdmin, updateEmployeeValidation, employeeController.updateEmployee);
router.delete('/:id', authenticateToken, requireSuperAdmin, employeeController.deleteEmployee);
router.patch('/:id/toggle-status', authenticateToken, requireSuperAdmin, employeeController.toggleEmployeeStatus);

module.exports = router;
