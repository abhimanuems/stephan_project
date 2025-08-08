const mongoose = require('mongoose');

const employeeAttendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day'],
    default: 'present'
  },
  checkIn: {
    type: Date
  },
  checkOut: {
    type: Date
  },
  workHours: {
    type: Number,
    default: 0
  },
  remarks: {
    type: String,
    trim: true
  },
  // Location-based attendance fields
  checkInLocation: {
    latitude: Number,
    longitude: Number,
    locationName: String,
    address: String
  },
  checkOutLocation: {
    latitude: Number,
    longitude: Number,
    locationName: String,
    address: String
  },
  attendanceType: {
    type: String,
    enum: ['manual', 'location-based'],
    default: 'location-based'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate attendance records for same employee on same date
employeeAttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('EmployeeAttendance', employeeAttendanceSchema);
