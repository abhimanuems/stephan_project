import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const LeaveRequest = () => {
  const { user } = useAuth();
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchLeaveBalance();
    fetchLeaveRequests();
  }, [currentPage]);

  const fetchLeaveBalance = async () => {
    try {
      const response = await axios.get('/api/leave-requests/balance');
      setLeaveBalance(response.data.leaveBalance);
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const response = await axios.get(`/api/leave-requests/my?page=${currentPage}&limit=10`);
      setLeaveRequests(response.data.leaveRequests);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !reason) {
      toast.error('Please fill all required fields');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/leave-requests', {
        leaveType,
        startDate,
        endDate,
        reason
      });
      
      toast.success('Leave request submitted successfully');
      
      // Reset form
      setLeaveType('casual');
      setStartDate('');
      setEndDate('');
      setReason('');
      
      // Refresh data
      fetchLeaveRequests();
      fetchLeaveBalance();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Leave Requests</h1>
        <p className="text-gray-600">Submit leave requests and track your leave balance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submit Leave Request */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Leave Request</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Leave Type
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="input w-full"
                    required
                  >
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="annual">Annual Leave</option>
                    <option value="maternity">Maternity Leave</option>
                    <option value="paternity">Paternity Leave</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="input w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    className="input w-full"
                    placeholder="Please provide a detailed reason for your leave request..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {loading ? 'Submitting...' : 'Submit Leave Request'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Leave Balance */}
        <div className="space-y-6">
          {leaveBalance && (
            <div className="card">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Leave Balance
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Casual Leave:</span>
                    <span className="font-medium">{leaveBalance.casual} days</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sick Leave:</span>
                    <span className="font-medium">{leaveBalance.sick} days</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Annual Leave:</span>
                    <span className="font-medium">{leaveBalance.annual} days</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Maternity Leave:</span>
                    <span className="font-medium">{leaveBalance.maternity} days</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Paternity Leave:</span>
                    <span className="font-medium">{leaveBalance.paternity} days</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Leave Requests */}
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Requests</h3>
              
              {leaveRequests.length > 0 ? (
                <div className="space-y-3">
                  {leaveRequests.slice(0, 5).map((request) => (
                    <div key={request._id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)} Leave
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>From: {formatDate(request.startDate)}</div>
                        <div>To: {formatDate(request.endDate)}</div>
                        <div>Days: {request.totalDays}</div>
                      </div>
                      
                      {request.rejectionReason && (
                        <div className="mt-2 text-xs text-red-600">
                          Reason: {request.rejectionReason}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {leaveRequests.length > 5 && (
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="text-sm text-primary-600 hover:text-primary-800"
                    >
                      View more...
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No leave requests yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequest;
