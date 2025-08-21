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
      .populate('selectedCourses.courseId', 'name courseFee duration')
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
      .populate('registeredBy', 'name email')
      .populate('selectedCourses.courseId', 'name courseFee duration');

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
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const studentData = {
      ...req.body,
      registeredBy: req.user._id
    };

    // Validate payment requirements for new registrations
    if (studentData.selectedCourses && studentData.selectedCourses.length > 0) {
      const invalidPayments = studentData.selectedCourses.filter(course => {
        if (course.paymentMode === 'Partial') {
          // For partial payment, check if partial amount is provided
          return !course.partialPaymentAmount || course.partialPaymentAmount <= 0;
        } else if (course.paymentMode === 'Full') {
          // For full payment, no validation needed - assume full amount is paid
          return false;
        }
        return false;
      });

      if (invalidPayments.length > 0) {
        const courseNames = invalidPayments.map(c => c.courseName || 'Unknown Course').join(', ');
        return res.status(400).json({ 
          message: `Payment validation failed for: ${courseNames}`,
          details: 'Please ensure partial payment amount is provided for partial payment mode'
        });
      }
    }

    console.log('Creating student with data:', studentData);

    const student = new Student(studentData);
    await student.save();

    const populatedStudent = await Student.findById(student._id)
      .populate('registeredBy', 'name email')
      .populate('selectedCourses.courseId', 'name courseFee duration');

    console.log('Student created successfully:', populatedStudent);

    res.status(201).json({
      message: 'Student registered successfully',
      student: populatedStudent
    });
  } catch (error) {
    console.error('Create student error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Registration number or admission number already exists' });
    }
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Only superadmin can update any student, employees can update any student
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin' && req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate payment requirements if courses are being updated
    if (req.body.selectedCourses && req.body.selectedCourses.length > 0) {
      const invalidPayments = req.body.selectedCourses.filter(course => {
        if (course.paymentMode === 'Partial') {
          // For partial payment, check if partial amount is provided
          return !course.partialPaymentAmount || course.partialPaymentAmount <= 0;
        } else if (course.paymentMode === 'Full') {
          // For full payment, no validation needed - assume full amount is paid
          return false;
        }
        return false;
      });

      if (invalidPayments.length > 0) {
        const courseNames = invalidPayments.map(c => c.courseName || 'Unknown Course').join(', ');
        return res.status(400).json({ 
          message: `Payment validation failed for: ${courseNames}`,
          details: 'Please ensure partial payment amount is provided for partial payment mode'
        });
      }
    }

    console.log('Updating student with data:', req.body);

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('registeredBy', 'name email')
     .populate('selectedCourses.courseId', 'name courseFee duration');

    console.log('Student updated successfully:', updatedStudent);

    res.json({
      message: 'Student updated successfully',
      student: updatedStudent
    });
  } catch (error) {
    console.error('Update student error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Registration number or admission number already exists' });
    }
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
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
