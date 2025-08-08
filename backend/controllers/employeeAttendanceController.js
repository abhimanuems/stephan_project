const EmployeeAttendance = require('../models/EmployeeAttendance');
const User = require('../models/User');
const Location = require('../models/Location');

// Helper function to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Mark employee attendance with location verification
const markAttendance = async (req, res) => {
  try {
    const { 
      date, 
      status, 
      checkIn, 
      checkOut, 
      remarks, 
      latitude, 
      longitude,
      attendanceType = 'location-based'
    } = req.body;
    const employeeId = req.user._id;

    // Validate input
    if (!date || !status) {
      return res.status(400).json({ message: 'Date and status are required' });
    }

    // For location-based attendance, validate coordinates
    if (attendanceType === 'location-based') {
      if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Location coordinates are required for location-based attendance' });
      }

      // Get active locations
      const activeLocations = await Location.find({ isActive: true });
      
      if (activeLocations.length === 0) {
        return res.status(400).json({ message: 'No active attendance locations found. Please contact administrator.' });
      }

      // Check if employee is within any active location
      let isWithinLocation = false;
      let nearestLocation = null;
      let minDistance = Infinity;

      for (const location of activeLocations) {
        const distance = calculateDistance(
          latitude, longitude,
          location.latitude, location.longitude
        );

        if (distance <= location.radius) {
          isWithinLocation = true;
          nearestLocation = location;
          break;
        }

        if (distance < minDistance) {
          minDistance = distance;
          nearestLocation = location;
        }
      }

      if (!isWithinLocation) {
        return res.status(400).json({ 
          message: `You are not within any attendance location. Nearest location: ${nearestLocation.name} (${Math.round(minDistance)}m away)` 
        });
      }
    }

    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));

    // Check if attendance already exists for this date
    const existingAttendance = await EmployeeAttendance.findOne({
      employee: employeeId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    let attendance;
    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.attendanceType = attendanceType;
      
      if (checkIn) {
        existingAttendance.checkIn = new Date(checkIn);
        if (attendanceType === 'location-based' && latitude && longitude) {
          existingAttendance.checkInLocation = {
            latitude,
            longitude,
            locationName: nearestLocation?.name,
            address: nearestLocation?.address
          };
        }
      }
      
      if (checkOut) {
        existingAttendance.checkOut = new Date(checkOut);
        if (attendanceType === 'location-based' && latitude && longitude) {
          existingAttendance.checkOutLocation = {
            latitude,
            longitude,
            locationName: nearestLocation?.name,
            address: nearestLocation?.address
          };
        }
      }
      
      existingAttendance.remarks = remarks;
      
      // Calculate work hours if both check-in and check-out are provided
      if (existingAttendance.checkIn && existingAttendance.checkOut) {
        const workHours = (existingAttendance.checkOut - existingAttendance.checkIn) / (1000 * 60 * 60);
        existingAttendance.workHours = Math.round(workHours * 100) / 100;
      }
      
      attendance = await existingAttendance.save();
    } else {
      // Create new attendance
      const attendanceData = {
        employee: employeeId,
        date: attendanceDate,
        status,
        attendanceType,
        remarks
      };

      if (checkIn) {
        attendanceData.checkIn = new Date(checkIn);
        if (attendanceType === 'location-based' && latitude && longitude) {
          attendanceData.checkInLocation = {
            latitude,
            longitude,
            locationName: nearestLocation?.name,
            address: nearestLocation?.address
          };
        }
      }
      
      if (checkOut) {
        attendanceData.checkOut = new Date(checkOut);
        if (attendanceType === 'location-based' && latitude && longitude) {
          attendanceData.checkOutLocation = {
            latitude,
            longitude,
            locationName: nearestLocation?.name,
            address: nearestLocation?.address
          };
        }
      }

      // Calculate work hours if both check-in and check-out are provided
      if (checkIn && checkOut) {
        const workHours = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60);
        attendanceData.workHours = Math.round(workHours * 100) / 100;
      }

      attendance = new EmployeeAttendance(attendanceData);
      await attendance.save();
    }

    res.json({
      message: 'Attendance marked successfully',
      attendance
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get employee attendance records
const getAttendanceRecords = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, status } = req.query;
    const employeeId = req.user._id;

    const query = { employee: employeeId };

    // Add date filter if provided
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const attendanceRecords = await EmployeeAttendance.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await EmployeeAttendance.countDocuments(query);

    res.json({
      attendanceRecords,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get attendance records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get attendance statistics
const getAttendanceStats = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { startDate, endDate } = req.query;

    const query = { employee: employeeId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await EmployeeAttendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalDays: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          halfDay: { $sum: { $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0] } },
          totalWorkHours: { $sum: '$workHours' }
        }
      }
    ]);

    const result = stats[0] || {
      totalDays: 0,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      totalWorkHours: 0
    };

    result.attendanceRate = result.totalDays > 0 
      ? Math.round((result.present / result.totalDays) * 100) 
      : 0;

    res.json(result);
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get today's attendance
const getTodayAttendance = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const attendance = await EmployeeAttendance.findOne({
      employee: employeeId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    res.json({ attendance });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Clock in functionality
const clockIn = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const employeeId = req.user._id;

    // Validate location coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Location coordinates are required' });
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Check if already clocked in today
    const existingAttendance = await EmployeeAttendance.findOne({
      employee: employeeId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({ message: 'Already clocked in today' });
    }

    // Get active locations and verify location
    const activeLocations = await Location.find({ isActive: true });
    
    if (activeLocations.length === 0) {
      return res.status(400).json({ message: 'No active attendance locations found' });
    }

    // Check if employee is within any active location
    let isWithinLocation = false;
    let nearestLocation = null;
    let minDistance = Infinity;

    for (const location of activeLocations) {
      const distance = calculateDistance(
        latitude, longitude,
        location.latitude, location.longitude
      );

      if (distance <= location.radius) {
        isWithinLocation = true;
        nearestLocation = location;
        break;
      }

      if (distance < minDistance) {
        minDistance = distance;
        nearestLocation = location;
      }
    }

    if (!isWithinLocation) {
      return res.status(400).json({ 
        message: `You are not within any attendance location. Nearest location: ${nearestLocation.name} (${Math.round(minDistance)}m away)` 
      });
    }

    // Create or update attendance record
    let attendance;
    if (existingAttendance) {
      existingAttendance.checkIn = new Date();
      existingAttendance.checkInLocation = {
        latitude,
        longitude,
        locationName: nearestLocation.name,
        address: nearestLocation.address
      };
      existingAttendance.attendanceType = 'location-based';
      attendance = await existingAttendance.save();
    } else {
      attendance = new EmployeeAttendance({
        employee: employeeId,
        date: today,
        status: 'present',
        checkIn: new Date(),
        checkInLocation: {
          latitude,
          longitude,
          locationName: nearestLocation.name,
          address: nearestLocation.address
        },
        attendanceType: 'location-based'
      });
      await attendance.save();
    }

    res.json({
      message: 'Clocked in successfully',
      attendance
    });
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Clock out functionality
const clockOut = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const employeeId = req.user._id;

    // Validate location coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Location coordinates are required' });
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Check if attendance exists and clocked in
    const attendance = await EmployeeAttendance.findOne({
      employee: employeeId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'You must clock in before clocking out' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already clocked out today' });
    }

    // Get active locations and verify location
    const activeLocations = await Location.find({ isActive: true });
    
    if (activeLocations.length === 0) {
      return res.status(400).json({ message: 'No active attendance locations found' });
    }

    // Check if employee is within any active location
    let isWithinLocation = false;
    let nearestLocation = null;
    let minDistance = Infinity;

    for (const location of activeLocations) {
      const distance = calculateDistance(
        latitude, longitude,
        location.latitude, location.longitude
      );

      if (distance <= location.radius) {
        isWithinLocation = true;
        nearestLocation = location;
        break;
      }

      if (distance < minDistance) {
        minDistance = distance;
        nearestLocation = location;
      }
    }

    if (!isWithinLocation) {
      return res.status(400).json({ 
        message: `You are not within any attendance location. Nearest location: ${nearestLocation.name} (${Math.round(minDistance)}m away)` 
      });
    }

    // Update attendance with clock out
    attendance.checkOut = new Date();
    attendance.checkOutLocation = {
      latitude,
      longitude,
      locationName: nearestLocation.name,
      address: nearestLocation.address
    };

    // Calculate work hours
    const workHours = (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60);
    attendance.workHours = Math.round(workHours * 100) / 100;

    await attendance.save();

    res.json({
      message: 'Clocked out successfully',
      attendance
    });
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  markAttendance,
  getAttendanceRecords,
  getAttendanceStats,
  getTodayAttendance,
  clockIn,
  clockOut
};
