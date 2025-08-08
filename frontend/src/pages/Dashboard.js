import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  GraduationCap, 
  DollarSign, 
  TrendingUp,
  UserPlus,
  Eye,
  Plus,
  Calendar,
  BarChart3,
  Clock,
  FileText
} from 'lucide-react';

const Dashboard = () => {
  const { user, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const cards = isSuperAdmin ? [
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: GraduationCap,
      color: 'bg-blue-500',
      href: '/students'
    },
    {
      title: 'Total Employees',
      value: stats?.totalEmployees || 0,
      icon: Users,
      color: 'bg-green-500',
      href: '/employees'
    },
    {
      title: 'Total Course Fee',
      value: `₹${(stats?.feeStats?.totalCourseFee || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      href: '/students'
    },
    {
      title: 'Recent Registrations',
      value: stats?.recentRegistrations || 0,
      icon: TrendingUp,
      color: 'bg-purple-500',
      href: '/students'
    }
  ] : [
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: GraduationCap,
      color: 'bg-blue-500',
      href: '/students'
    },
    {
      title: 'Mark Attendance',
      value: 'Quick Access',
      icon: Calendar,
      color: 'bg-green-500',
      href: '/attendance'
    },
    {
      title: 'Attendance Records',
      value: 'View History',
      icon: BarChart3,
      color: 'bg-yellow-500',
      href: '/attendance-records'
    },
    {
      title: 'Recent Registrations',
      value: stats?.recentRegistrations || 0,
      icon: TrendingUp,
      color: 'bg-purple-500',
      href: '/students'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to the IIT Student Management System
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/students/new"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Student
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.href}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-md ${card.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.title}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {card.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Fee Statistics - Only for Super Admin */}
      {isSuperAdmin && stats?.feeStats && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Fee Collection Overview
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Course Fee</span>
                  <span className="font-medium">₹{stats.feeStats.totalCourseFee?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Admission Fee</span>
                  <span className="font-medium">₹{stats.feeStats.totalAdmissionFee?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Fee Paid Students</span>
                  <span className="font-medium text-green-600">{stats.feeStats.totalFeePaid || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Fee Pending Students</span>
                  <span className="font-medium text-red-600">{stats.feeStats.totalFeePending || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  to="/students/new"
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-5 w-5 text-primary-600" />
                    <span className="text-sm font-medium">Register New Student</span>
                  </div>
                  <Plus className="h-4 w-4 text-gray-400" />
                </Link>
                <Link
                  to="/students"
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-primary-600" />
                    <span className="text-sm font-medium">View All Students</span>
                  </div>
                  <Plus className="h-4 w-4 text-gray-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Quick Actions */}
      {!isSuperAdmin && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Student Management
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Students</span>
                  <span className="font-medium">{stats?.totalStudents || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Recent Registrations</span>
                  <span className="font-medium text-green-600">{stats?.recentRegistrations || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions for Employees */}
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  to="/students/new"
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-5 w-5 text-primary-600" />
                    <span className="text-sm font-medium">Register New Student</span>
                  </div>
                  <Plus className="h-4 w-4 text-gray-400" />
                </Link>
                <Link
                  to="/attendance"
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary-600" />
                    <span className="text-sm font-medium">Mark Attendance</span>
                  </div>
                  <Plus className="h-4 w-4 text-gray-400" />
                </Link>
                           <Link
             to="/attendance-records"
             className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
           >
             <div className="flex items-center gap-3">
               <BarChart3 className="h-5 w-5 text-primary-600" />
               <span className="text-sm font-medium">View Attendance Records</span>
             </div>
             <Plus className="h-4 w-4 text-gray-400" />
           </Link>
           <Link
             to="/my-attendance"
             className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
           >
             <div className="flex items-center gap-3">
               <Clock className="h-5 w-5 text-primary-600" />
               <span className="text-sm font-medium">My Attendance</span>
             </div>
             <Plus className="h-4 w-4 text-gray-400" />
           </Link>
           <Link
             to="/leave-request"
             className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
           >
             <div className="flex items-center gap-3">
               <FileText className="h-5 w-5 text-primary-600" />
               <span className="text-sm font-medium">Leave Request</span>
             </div>
             <Plus className="h-4 w-4 text-gray-400" />
           </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Employees - Only for Super Admin */}
      {isSuperAdmin && stats?.topEmployees && stats.topEmployees.length > 0 && (
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Top Performing Employees
            </h3>
            <div className="space-y-3">
              {stats.topEmployees.map((employee, index) => (
                <div key={employee._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                      <p className="text-xs text-gray-500">{employee.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{employee.registrationCount}</p>
                    <p className="text-xs text-gray-500">registrations</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
