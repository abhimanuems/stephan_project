const User = require('../models/User');
const { validationResult } = require('express-validator');

// Get all employees (superadmin only)
const getAllEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    let query = { role: { $ne: 'superadmin' } };
    
    // Search functionality
    if (search) {
      query = {
        ...query,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const employees = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      employees,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalEmployees: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ employee });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new employee (superadmin only)
const createEmployee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, 
      email, 
      password, 
      role, 
      salary, 
      department, 
      designation, 
      phone, 
      address 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    // Create new employee
    const employee = new User({
      name,
      email,
      password,
      role: role || 'employee',
      salary: salary || 0,
      department,
      designation,
      phone,
      address
    });

    await employee.save();

    res.status(201).json({
      message: 'Employee created successfully',
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        isActive: employee.isActive,
        salary: employee.salary,
        department: employee.department,
        designation: employee.designation
      }
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update employee (superadmin only)
const updateEmployee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Prevent updating superadmin
    if (employee.role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot update superadmin account' });
    }

    const { 
      name, 
      email, 
      role, 
      isActive, 
      salary, 
      department, 
      designation, 
      phone, 
      address 
    } = req.body;
    
    const updateData = { 
      name, 
      email, 
      role, 
      isActive, 
      salary, 
      department, 
      designation, 
      phone, 
      address 
    };

    // Only update password if provided
    if (req.body.password) {
      updateData.password = req.body.password;
    }

    const updatedEmployee = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Employee updated successfully',
      employee: updatedEmployee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete employee (superadmin only)
const deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Prevent deleting superadmin
    if (employee.role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot delete superadmin account' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle employee active status (superadmin only)
const toggleEmployeeStatus = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Prevent deactivating superadmin
    if (employee.role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot deactivate superadmin account' });
    }

    employee.isActive = !employee.isActive;
    await employee.save();

    res.json({
      message: `Employee ${employee.isActive ? 'activated' : 'deactivated'} successfully`,
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        isActive: employee.isActive
      }
    });
  } catch (error) {
    console.error('Toggle employee status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus
};
