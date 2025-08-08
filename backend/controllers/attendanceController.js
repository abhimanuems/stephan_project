const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Get students by camp venue
const getStudentsByCampVenue = async (req, res) => {
  try {
    const { campVenue } = req.params;
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = { campVenue };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .select('name registrationNumber campVenue')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const total = await Student.countDocuments(query);

    res.json({
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get students by camp venue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark attendance for multiple students
const markAttendance = async (req, res) => {
  try {
    const { date, campVenue, attendanceData } = req.body;
    const markedBy = req.user.id;

    // Validate input
    if (!date || !campVenue || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({ message: 'Invalid input data' });
    }

    const attendanceDate = new Date(date);
    const results = [];

    for (const record of attendanceData) {
      const { studentId, status, remarks } = record;

      try {
        // Check if attendance already exists for this student on this date
        const existingAttendance = await Attendance.findOne({
          student: studentId,
          date: {
            $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
            $lt: new Date(attendanceDate.setHours(23, 59, 59, 999))
          }
        });

        if (existingAttendance) {
          // Update existing attendance
          existingAttendance.status = status;
          existingAttendance.remarks = remarks;
          existingAttendance.markedBy = markedBy;
          await existingAttendance.save();
          results.push({ studentId, status: 'updated', attendance: existingAttendance });
        } else {
          // Create new attendance
          const attendance = new Attendance({
            student: studentId,
            date: attendanceDate,
            campVenue,
            status,
            markedBy,
            remarks
          });
          await attendance.save();
          results.push({ studentId, status: 'created', attendance });
        }
      } catch (error) {
        results.push({ studentId, status: 'error', error: error.message });
      }
    }

    res.json({
      message: 'Attendance marked successfully',
      results
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get attendance records for a camp venue
const getAttendanceRecords = async (req, res) => {
  try {
    const { campVenue } = req.params;
    const { page = 1, limit = 10, date, status } = req.query;

    const query = { campVenue };
    
    if (date) {
      const attendanceDate = new Date(date);
      query.date = {
        $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
        $lt: new Date(attendanceDate.setHours(23, 59, 59, 999))
      };
    }

    if (status) {
      query.status = status;
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name registrationNumber')
      .populate('markedBy', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1 });

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get attendance records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get attendance statistics for a camp venue
const getAttendanceStats = async (req, res) => {
  try {
    const { campVenue } = req.params;
    const { date } = req.query;

    const query = { campVenue };
    
    if (date) {
      const attendanceDate = new Date(date);
      query.date = {
        $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
        $lt: new Date(attendanceDate.setHours(23, 59, 59, 999))
      };
    }

    const stats = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalStudents = await Student.countDocuments({ campVenue });
    
    const present = stats.find(s => s._id === 'present')?.count || 0;
    const absent = stats.find(s => s._id === 'absent')?.count || 0;
    const late = stats.find(s => s._id === 'late')?.count || 0;
    const marked = present + absent + late;
    const unmarked = totalStudents - marked;

    res.json({
      totalStudents,
      present,
      absent,
      late,
      marked,
      unmarked,
      attendancePercentage: totalStudents > 0 ? (marked / totalStudents) * 100 : 0
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getStudentsByCampVenue,
  markAttendance,
  getAttendanceRecords,
  getAttendanceStats
};
