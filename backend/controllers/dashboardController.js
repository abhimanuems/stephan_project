const Student = require('../models/Student');
const User = require('../models/User');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    // Total students count
    const totalStudents = await Student.countDocuments();
    
    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentRegistrations = await Student.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // If superadmin, include all stats
    if (userRole === 'superadmin') {
      // Total employees count (excluding superadmin)
      const totalEmployees = await User.countDocuments({ role: { $ne: 'superadmin' } });
      
      // Fee collection statistics
      const feeStats = await Student.aggregate([
        {
          $group: {
            _id: null,
            totalCourseFee: { $sum: '$courseFee' },
            totalAdmissionFee: { $sum: '$admissionFee' },
            totalFeePaid: { $sum: { $cond: ['$feePaid', 1, 0] } },
            totalFeePending: { $sum: { $cond: ['$feePaid', 0, 1] } }
          }
        }
      ]);

      // Monthly registrations for the current year
      const currentYear = new Date().getFullYear();
      const monthlyStats = await Student.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(currentYear, 0, 1),
              $lt: new Date(currentYear + 1, 0, 1)
            }
          }
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);

      // Top performing employees (by number of registrations)
      const topEmployees = await Student.aggregate([
        {
          $group: {
            _id: '$registeredBy',
            registrationCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'employee'
          }
        },
        {
          $unwind: '$employee'
        },
        {
          $project: {
            name: '$employee.name',
            email: '$employee.email',
            registrationCount: 1
          }
        },
        {
          $sort: { registrationCount: -1 }
        },
        {
          $limit: 5
        }
      ]);

      // Fee collection by month for current year
      const monthlyFeeStats = await Student.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(currentYear, 0, 1),
              $lt: new Date(currentYear + 1, 0, 1)
            }
          }
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            totalFee: { $sum: { $add: ['$courseFee', '$admissionFee'] } },
            paidFee: { $sum: { $cond: ['$feePaid', { $add: ['$courseFee', '$admissionFee'] }, 0] } }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);

      const stats = {
        totalStudents,
        totalEmployees,
        feeStats: feeStats[0] || {
          totalCourseFee: 0,
          totalAdmissionFee: 0,
          totalFeePaid: 0,
          totalFeePending: 0
        },
        recentRegistrations,
        monthlyStats,
        topEmployees,
        monthlyFeeStats
      };

      res.json(stats);
    } else {
      // For employees, return simplified stats
      const stats = {
        totalStudents,
        recentRegistrations
      };

      res.json(stats);
    }
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get employee-specific dashboard stats
const getEmployeeDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Total students registered by this employee
    const totalStudents = await Student.countDocuments({ registeredBy: userId });
    
    // Recent registrations by this employee (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentRegistrations = await Student.countDocuments({
      registeredBy: userId,
      createdAt: { $gte: sevenDaysAgo }
    });

    // Fee collection by this employee
    const feeStats = await Student.aggregate([
      {
        $match: { registeredBy: userId }
      },
      {
        $group: {
          _id: null,
          totalCourseFee: { $sum: '$courseFee' },
          totalAdmissionFee: { $sum: '$admissionFee' },
          totalFeePaid: { $sum: { $cond: ['$feePaid', 1, 0] } },
          totalFeePending: { $sum: { $cond: ['$feePaid', 0, 1] } }
        }
      }
    ]);

    // Monthly registrations for current year by this employee
    const currentYear = new Date().getFullYear();
    const monthlyStats = await Student.aggregate([
      {
        $match: {
          registeredBy: userId,
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    const stats = {
      totalStudents,
      recentRegistrations,
      feeStats: feeStats[0] || {
        totalCourseFee: 0,
        totalAdmissionFee: 0,
        totalFeePaid: 0,
        totalFeePending: 0
      },
      monthlyStats
    };

    res.json(stats);
  } catch (error) {
    console.error('Employee dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getEmployeeDashboardStats
};
