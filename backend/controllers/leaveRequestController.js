const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');

// Create leave request
const createLeaveRequest = async (req, res) => {
  try {
    const {
      leaveType,
      startDate,
      endDate,
      reason
    } = req.body;

    const employeeId = req.user._id;

    // Validate input
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (totalDays <= 0) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Check leave balance
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const currentBalance = employee.leaveBalance[leaveType] || 0;
    if (currentBalance < totalDays) {
      return res.status(400).json({ 
        message: `Insufficient ${leaveType} leave balance. Available: ${currentBalance} days` 
      });
    }

    const leaveRequest = new LeaveRequest({
      employee: employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason
    });

    await leaveRequest.save();

    const populatedRequest = await LeaveRequest.findById(leaveRequest._id)
      .populate('employee', 'name email');

    res.status(201).json({
      message: 'Leave request created successfully',
      leaveRequest: populatedRequest
    });
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get employee's leave requests
const getMyLeaveRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const employeeId = req.user._id;

    const query = { employee: employeeId };

    if (status) {
      query.status = status;
    }

    const leaveRequests = await LeaveRequest.find(query)
      .populate('employee', 'name email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LeaveRequest.countDocuments(query);

    res.json({
      leaveRequests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all leave requests (for super admin)
const getAllLeaveRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, employeeId } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (employeeId) {
      query.employee = employeeId;
    }

    const leaveRequests = await LeaveRequest.find(query)
      .populate('employee', 'name email department')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LeaveRequest.countDocuments(query);

    res.json({
      leaveRequests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all leave requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve/reject leave request (super admin only)
const updateLeaveRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, rejectionReason } = req.body;
    const adminId = req.user._id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const leaveRequest = await LeaveRequest.findById(requestId)
      .populate('employee', 'name email leaveBalance');

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Leave request has already been processed' });
    }

    // Update leave request
    leaveRequest.status = status;
    leaveRequest.approvedBy = adminId;
    leaveRequest.approvedAt = new Date();

    if (status === 'rejected' && rejectionReason) {
      leaveRequest.rejectionReason = rejectionReason;
    }

    // If approved, deduct from leave balance
    if (status === 'approved') {
      const employee = leaveRequest.employee;
      const currentBalance = employee.leaveBalance[leaveRequest.leaveType] || 0;
      
      if (currentBalance < leaveRequest.totalDays) {
        return res.status(400).json({ 
          message: `Insufficient leave balance. Available: ${currentBalance} days` 
        });
      }

      employee.leaveBalance[leaveRequest.leaveType] = currentBalance - leaveRequest.totalDays;
      await employee.save();
    }

    await leaveRequest.save();

    res.json({
      message: `Leave request ${status} successfully`,
      leaveRequest
    });
  } catch (error) {
    console.error('Update leave request status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get leave balance
const getLeaveBalance = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const employee = await User.findById(employeeId).select('leaveBalance');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ leaveBalance: employee.leaveBalance });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get leave statistics
const getLeaveStats = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const query = {};

    if (employeeId) {
      query.employee = employeeId;
    }

    const stats = await LeaveRequest.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          totalDays: { $sum: '$totalDays' },
          approvedDays: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'approved'] }, '$totalDays', 0] 
            } 
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      totalDays: 0,
      approvedDays: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Get leave stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveRequestStatus,
  getLeaveBalance,
  getLeaveStats
};
