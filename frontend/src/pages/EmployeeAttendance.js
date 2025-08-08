import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Save, BarChart3, MapPin, LogIn, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeAttendance = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [stats, setStats] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);

  useEffect(() => {
    fetchTodayAttendance();
    fetchStats();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationError('');
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError('Unable to get your location. Please enable location services.');
      }
    );
  };

  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get('/api/employee-attendance/today');
      setTodayAttendance(response.data.attendance);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/employee-attendance/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleClockIn = async () => {
    if (!currentLocation) {
      toast.error('Please enable location services to clock in');
      getCurrentLocation();
      return;
    }

    setClockingIn(true);
    try {
      const response = await axios.post('/api/employee-attendance/clock-in', {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      });
      
      toast.success('Clocked in successfully!');
      fetchTodayAttendance();
      fetchStats();
    } catch (error) {
      console.error('Error clocking in:', error);
      toast.error(error.response?.data?.message || 'Failed to clock in');
    } finally {
      setClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentLocation) {
      toast.error('Please enable location services to clock out');
      getCurrentLocation();
      return;
    }

    setClockingOut(true);
    try {
      const response = await axios.post('/api/employee-attendance/clock-out', {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      });
      
      toast.success('Clocked out successfully!');
      fetchTodayAttendance();
      fetchStats();
    } catch (error) {
      console.error('Error clocking out:', error);
      toast.error(error.response?.data?.message || 'Failed to clock out');
    } finally {
      setClockingOut(false);
    }
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100';
      case 'absent': return 'text-red-600 bg-red-100';
      case 'late': return 'text-yellow-600 bg-yellow-100';
      case 'half-day': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      case 'late': return <AlertCircle className="w-4 h-4" />;
      case 'half-day': return <Clock className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Attendance</h1>
        <p className="text-gray-600">Mark your daily attendance and track your work hours</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Location-based Attendance Card */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location-based Attendance
              </h3>
              
              {/* Location Status */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Current Location</h4>
                    {currentLocation ? (
                      <p className="text-sm text-gray-600">
                        {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                      </p>
                    ) : (
                      <p className="text-sm text-red-600">Location not available</p>
                    )}
                  </div>
                  <button
                    onClick={getCurrentLocation}
                    className="btn btn-secondary btn-sm"
                  >
                    Refresh Location
                  </button>
                </div>
                {locationError && (
                  <p className="text-sm text-red-600 mt-2">{locationError}</p>
                )}
              </div>

              {/* Clock In/Out Buttons */}
              <div className="space-y-4">
                {!todayAttendance?.checkIn ? (
                  <button
                    onClick={handleClockIn}
                    disabled={clockingIn || !currentLocation}
                    className="btn btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
                  >
                    <LogIn className="h-5 w-5" />
                    {clockingIn ? 'Clocking In...' : 'Clock In'}
                  </button>
                ) : !todayAttendance?.checkOut ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Clocked In</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Time: {todayAttendance.checkIn ? new Date(todayAttendance.checkIn).toLocaleTimeString() : 'N/A'}
                      </p>
                      {todayAttendance.checkInLocation && (
                        <p className="text-sm text-green-600">
                          Location: {todayAttendance.checkInLocation.locationName}
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={handleClockOut}
                      disabled={clockingOut || !currentLocation}
                      className="btn btn-secondary w-full flex items-center justify-center gap-2 py-4 text-lg"
                    >
                      <LogOut className="h-5 w-5" />
                      {clockingOut ? 'Clocking Out...' : 'Clock Out'}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Completed for Today</span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-blue-600">
                      <p>Clock In: {todayAttendance.checkIn ? new Date(todayAttendance.checkIn).toLocaleTimeString() : 'N/A'}</p>
                      <p>Clock Out: {todayAttendance.checkOut ? new Date(todayAttendance.checkOut).toLocaleTimeString() : 'N/A'}</p>
                      <p>Work Hours: {todayAttendance.workHours || 0} hours</p>
                    </div>
                  </div>
                )}
              </div>


            </div>
          </div>
        </div>

        {/* Today's Attendance & Stats */}
        <div className="space-y-6">
          {/* Today's Attendance */}
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Attendance</h3>
              
              {todayAttendance ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(todayAttendance.status)}`}>
                      {getStatusIcon(todayAttendance.status)}
                      {todayAttendance.status.charAt(0).toUpperCase() + todayAttendance.status.slice(1)}
                    </span>
                  </div>
                  
                  {todayAttendance.checkIn && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Check In:</span>
                      <span className="text-sm font-medium">
                        {new Date(todayAttendance.checkIn).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  
                  {todayAttendance.checkInLocation && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Check In Location:</span>
                      <span className="text-sm font-medium">
                        {todayAttendance.checkInLocation.locationName}
                      </span>
                    </div>
                  )}
                  
                  {todayAttendance.checkOut && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Check Out:</span>
                      <span className="text-sm font-medium">
                        {new Date(todayAttendance.checkOut).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  
                  {todayAttendance.checkOutLocation && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Check Out Location:</span>
                      <span className="text-sm font-medium">
                        {todayAttendance.checkOutLocation.locationName}
                      </span>
                    </div>
                  )}
                  
                  {todayAttendance.workHours > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Work Hours:</span>
                      <span className="text-sm font-medium">{todayAttendance.workHours} hrs</span>
                    </div>
                  )}
                  
                  {todayAttendance.remarks && (
                    <div className="pt-2 border-t">
                      <span className="text-sm text-gray-600">Remarks:</span>
                      <p className="text-sm mt-1">{todayAttendance.remarks}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No attendance marked for today</p>
              )}
            </div>
          </div>

          {/* Attendance Stats */}
          {stats && (
            <div className="card">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Attendance Stats
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Days:</span>
                    <span className="font-medium">{stats.totalDays}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Present:</span>
                    <span className="font-medium text-green-600">{stats.present}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Absent:</span>
                    <span className="font-medium text-red-600">{stats.absent}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Late:</span>
                    <span className="font-medium text-yellow-600">{stats.late}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Half Day:</span>
                    <span className="font-medium text-orange-600">{stats.halfDay}</span>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Attendance Rate:</span>
                      <span className="font-medium text-blue-600">{stats.attendanceRate}%</span>
                    </div>
                  </div>
                  
                  {stats.totalWorkHours > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Work Hours:</span>
                      <span className="font-medium">{stats.totalWorkHours} hrs</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendance;
