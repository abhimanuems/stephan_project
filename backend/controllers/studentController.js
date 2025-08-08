const Student = require('../models/Student');
const { validationResult } = require('express-validator');

// Get all students (with pagination and filtering)
const getAllStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    let query = {};
    
    // Search functionality
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { registrationNumber: { $regex: search, $options: 'i' } },
          { admissionNo: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const students = await Student.find(query)
      .populate('registeredBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Student.countDocuments(query);

    res.json({
      students,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalStudents: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single student by ID
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('registeredBy', 'name email');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ student });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new student
const createStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const studentData = {
      ...req.body,
      registeredBy: req.user._id
    };

    const student = new Student(studentData);
    await student.save();

    const populatedStudent = await Student.findById(student._id)
      .populate('registeredBy', 'name email');

    res.status(201).json({
      message: 'Student registered successfully',
      student: populatedStudent
    });
  } catch (error) {
    console.error('Create student error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Registration number or admission number already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Only superadmin can update any student, employees can update any student
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin' && req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('registeredBy', 'name email');

    res.json({
      message: 'Student updated successfully',
      student: updatedStudent
    });
  } catch (error) {
    console.error('Update student error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Registration number or admission number already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete student (superadmin only)
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await Student.findByIdAndDelete(req.params.id);

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get students by employee (for employees to see their registered students)
const getStudentsByEmployee = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const students = await Student.find({ registeredBy: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Student.countDocuments({ registeredBy: req.user._id });

    res.json({
      students,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalStudents: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get students by employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsByEmployee
};
