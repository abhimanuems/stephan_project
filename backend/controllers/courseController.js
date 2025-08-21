const Course = require('../models/Course');

// Create new course (Superadmin only)
const createCourse = async (req, res) => {
  try {
    const { name, description, duration, courseFee } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ message: 'Course name is required' });
    }

    // Validate duration if provided
    const validDurations = [
      '1 Month', '2 Months', '3 Months', '4 Months', '5 Months', '6 Months',
      '7 Months', '8 Months', '9 Months', '10 Months', '11 Months',
      '1 Year', '1.5 Years', '2 Years', '2.5 Years', '3 Years',
      '3.5 Years', '4 Years', '4.5 Years', '5 Years'
    ];
    
    if (duration && !validDurations.includes(duration)) {
      return res.status(400).json({ message: 'Invalid duration value' });
    }

    // Check if course already exists
    const existingCourse = await Course.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCourse) {
      return res.status(400).json({ message: 'Course with this name already exists' });
    }

    const course = new Course({
      name,
      description,
      duration,
      courseFee: courseFee || 0,
      createdBy: req.user._id
    });

    await course.save();

    res.status(201).json({
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all courses
const getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, active } = req.query;
    
    const query = {};
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const courses = await Course.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Course.countDocuments(query);

    res.json({
      courses,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single course
const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const { name, description, duration, courseFee, isActive } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Validate duration if provided
    if (duration) {
      const validDurations = [
        '1 Month', '2 Months', '3 Months', '4 Months', '5 Months', '6 Months',
        '7 Months', '8 Months', '9 Months', '10 Months', '11 Months',
        '1 Year', '1.5 Years', '2 Years', '2.5 Years', '3 Years',
        '3.5 Years', '4 Years', '4.5 Years', '5 Years'
      ];
      
      if (!validDurations.includes(duration)) {
        return res.status(400).json({ message: 'Invalid duration value' });
      }
    }

    // Check if name is being changed and if it conflicts with existing course
    if (name && name !== course.name) {
      const existingCourse = await Course.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existingCourse) {
        return res.status(400).json({ message: 'Course with this name already exists' });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (duration !== undefined) updateData.duration = duration;
    if (courseFee !== undefined) updateData.courseFee = courseFee;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('createdBy', 'name email');

    res.json({
      message: 'Course updated successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle course status
const toggleCourseStatus = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.isActive = !course.isActive;
    await course.save();

    res.json({
      message: `Course ${course.isActive ? 'activated' : 'deactivated'} successfully`,
      course
    });
  } catch (error) {
    console.error('Toggle course status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get active courses for student form
const getActiveCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .select('name description duration courseFee')
      .sort({ name: 1 });

    res.json(courses);
  } catch (error) {
    console.error('Get active courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  toggleCourseStatus,
  getActiveCourses
};
