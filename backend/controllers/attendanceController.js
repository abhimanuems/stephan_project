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
        // Create date range for the day (without mutating original date)
        const startDate = new Date(attendanceDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(attendanceDate);
        endDate.setHours(23, 59, 59, 999);
        
        // Check if attendance already exists for this student on this date
        const existingAttendance = await Attendance.findOne({
          student: studentId,
          date: {
            $gte: startDate,
            $lt: endDate
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

// Manually mark attendance for a specific student
const markManualAttendance = async (req, res) => {
  try {
    const { date, campVenue, studentId, status, remarks } = req.body;
    const markedBy = req.user.id;

    // Validate input
    if (!date || !campVenue || !studentId || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const attendanceDate = new Date(date);
    
    // Create date range for the day (without mutating original date)
    const startDate = new Date(attendanceDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(attendanceDate);
    endDate.setHours(23, 59, 59, 999);
    
    // Check if attendance already exists for this student on this date
    const existingAttendance = await Attendance.findOne({
      student: studentId,
      date: {
        $gte: startDate,
        $lt: endDate
      }
    });

    let result;
    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.remarks = remarks || '';
      existingAttendance.markedBy = markedBy;
      await existingAttendance.save();
      result = { studentId, status: 'updated', attendance: existingAttendance };
    } else {
      // Create new attendance
      const attendance = new Attendance({
        student: studentId,
        date: attendanceDate,
        campVenue,
        status,
        markedBy,
        remarks: remarks || ''
      });
      await attendance.save();
      result = { studentId, status: 'created', attendance };
    }

    res.json({
      message: 'Attendance marked successfully',
      result
    });
  } catch (error) {
    console.error('Manual mark attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search students for manual attendance marking
const searchStudentsForAttendance = async (req, res) => {
  try {
    const { campVenue, search = '', limit = 20 } = req.query;

    if (!campVenue) {
      return res.status(400).json({ message: 'Camp venue is required' });
    }

    const query = { campVenue };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .select('name registrationNumber campVenue')
      .limit(parseInt(limit))
      .sort({ name: 1 });

    res.json({
      students
    });
  } catch (error) {
    console.error('Search students for attendance error:', error);
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
      const startDate = new Date(attendanceDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(attendanceDate);
      endDate.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: startDate,
        $lt: endDate
      };
    }

    if (status) {
      query.status = status;
    }

    let attendance;
    
    if (date) {
      // If date is provided, get attendance for that specific date only
      // This will only return students who have attendance records for that date
      attendance = await Attendance.find(query)
        .populate('student', 'name registrationNumber')
        .populate('markedBy', 'name')
        .sort({ 'student.name': 1 });
    } else {
      // If no date is provided, get the most recent attendance for each student
      const allAttendance = await Attendance.find({ campVenue })
        .populate('student', 'name registrationNumber')
        .populate('markedBy', 'name')
        .sort({ date: -1 });

      // Group by student and get most recent attendance
      const studentLatestAttendance = new Map();
      allAttendance.forEach(record => {
        if (record.student) {
          const studentId = record.student._id.toString();
          if (!studentLatestAttendance.has(studentId)) {
            studentLatestAttendance.set(studentId, record);
          }
        }
      });

      attendance = Array.from(studentLatestAttendance.values())
        .sort((a, b) => a.student?.name?.localeCompare(b.student?.name));
    }

    // Apply pagination
    const total = attendance.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAttendance = attendance.slice(startIndex, endIndex);

    res.json({
      attendance: paginatedAttendance,
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
      const startDate = new Date(attendanceDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(attendanceDate);
      endDate.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: startDate,
        $lt: endDate
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

// Download attendance records as PDF
const downloadAttendancePDF = async (req, res) => {
  try {
    const { campVenue } = req.params;
    const { date, status, studentName } = req.query;

    const query = { campVenue };
    
    if (date) {
      const attendanceDate = new Date(date);
      const startDate = new Date(attendanceDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(attendanceDate);
      endDate.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: startDate,
        $lt: endDate
      };
    }

    if (status) {
      query.status = status;
    }

    // Get all students for this venue to show complete list
    const allStudents = await Student.find({ campVenue })
      .select('name registrationNumber')
      .sort({ name: 1 });

    let attendance;
    let allStudentRecords;
    
    if (date) {
      // If date is provided, only get students with attendance for that specific date
      attendance = await Attendance.find(query)
        .populate('student', 'name registrationNumber')
        .populate('markedBy', 'name')
        .sort({ 'student.name': 1 });

      // Filter by student name if provided
      if (studentName) {
        attendance = attendance.filter(record => 
          record.student?.name?.toLowerCase().includes(studentName.toLowerCase())
        );
      }

      // Only include students who have attendance records for this date
      allStudentRecords = attendance.map(record => ({
        studentName: record.student.name,
        registrationNumber: record.student.registrationNumber,
        status: record.status,
        date: new Date(record.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        markedBy: record.markedBy?.name || 'Unknown',
        remarks: record.remarks || '-'
      }));
    } else {
      // If no date is provided, get the most recent attendance for each student
      const allAttendance = await Attendance.find({ campVenue })
        .populate('student', 'name registrationNumber')
        .populate('markedBy', 'name')
        .sort({ date: -1 });

      // Group by student and get most recent attendance
      const studentLatestAttendance = new Map();
      allAttendance.forEach(record => {
        if (record.student) {
          const studentId = record.student._id.toString();
          if (!studentLatestAttendance.has(studentId)) {
            studentLatestAttendance.set(studentId, record);
          }
        }
      });

      // Create a map of student attendance
      const studentAttendanceMap = new Map();
      
      // Initialize all students with 'Not Marked' status
      allStudents.forEach(student => {
        studentAttendanceMap.set(student._id.toString(), {
          studentName: student.name,
          registrationNumber: student.registrationNumber,
          status: 'Not Marked',
          date: 'No Recent Attendance',
          markedBy: 'N/A',
          remarks: 'No attendance marked'
        });
      });

      // Update with actual attendance records
      studentLatestAttendance.forEach((record, studentId) => {
        if (studentAttendanceMap.has(studentId)) {
          studentAttendanceMap.set(studentId, {
            studentName: record.student.name,
            registrationNumber: record.student.registrationNumber,
            status: record.status,
            date: new Date(record.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }),
            markedBy: record.markedBy?.name || 'Unknown',
            remarks: record.remarks || '-'
          });
        }
      });

      // Filter by student name if provided
      if (studentName) {
        const filteredMap = new Map();
        studentAttendanceMap.forEach((record, studentId) => {
          if (record.studentName.toLowerCase().includes(studentName.toLowerCase())) {
            filteredMap.set(studentId, record);
          }
        });
        studentAttendanceMap = filteredMap;
      }

      // Convert map to array and sort by student name
      allStudentRecords = Array.from(studentAttendanceMap.values())
        .sort((a, b) => a.studentName.localeCompare(b.studentName));
    }

    // Calculate statistics
    const present = allStudentRecords.filter(record => record.status === 'present').length;
    const absent = allStudentRecords.filter(record => record.status === 'absent').length;
    const late = allStudentRecords.filter(record => record.status === 'late').length;
    const notMarked = allStudentRecords.filter(record => record.status === 'Not Marked').length;
    const totalStudents = allStudentRecords.length;
    const marked = present + absent + late;
    const attendancePercentage = totalStudents > 0 ? (marked / totalStudents) * 100 : 0;

    // Create PDF data
    const pdfData = {
      campVenue,
      date: date || 'Most Recent Attendance',
      status: status || 'All Status',
      studentName: studentName || 'All Students',
      totalStudents,
      present,
      absent,
      late,
      notMarked,
      marked,
      attendancePercentage: attendancePercentage.toFixed(1),
      records: allStudentRecords
    };

    res.json({
      success: true,
      data: pdfData
    });
  } catch (error) {
    console.error('Download attendance PDF error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getStudentsByCampVenue,
  markAttendance,
  markManualAttendance,
  searchStudentsForAttendance,
  getAttendanceRecords,
  getAttendanceStats,
  downloadAttendancePDF
};
