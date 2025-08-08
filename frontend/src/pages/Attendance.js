import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Calendar, Users, CheckCircle, XCircle, Clock, Search, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import useDebounce from '../hooks/useDebounce';

const Attendance = () => {
  const { user } = useAuth();
  const [campVenues, setCampVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});
  const [saving, setSaving] = useState(false);

  // Debounce search term to avoid API calls on every keystroke
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Get unique camp venues from students
  useEffect(() => {
    const fetchCampVenues = async () => {
      try {
        const response = await axios.get('/api/students');
        const venues = [...new Set(response.data.students.map(student => student.campVenue))];
        setCampVenues(venues);
      } catch (error) {
        console.error('Error fetching camp venues:', error);
      }
    };
    fetchCampVenues();
  }, []);

  // Fetch students when venue is selected
  useEffect(() => {
    if (selectedVenue) {
      fetchStudents();
    }
  }, [selectedVenue, currentPage, debouncedSearchTerm]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/attendance/students/${encodeURIComponent(selectedVenue)}`, {
        params: {
          page: currentPage,
          limit: 10,
          search: debouncedSearchTerm
        }
      });
      setStudents(response.data.students);
      setTotalPages(response.data.totalPages);
      
      // Initialize attendance data for new students
      const newAttendanceData = {};
      response.data.students.forEach(student => {
        if (!attendanceData[student._id]) {
          newAttendanceData[student._id] = { status: 'present', remarks: '' };
        }
      });
      setAttendanceData(prev => ({ ...prev, ...newAttendanceData }));
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId, field, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedVenue || !selectedDate) {
      toast.error('Please select venue and date');
      return;
    }

    const attendanceRecords = Object.entries(attendanceData).map(([studentId, data]) => ({
      studentId,
      status: data.status,
      remarks: data.remarks
    }));

    if (attendanceRecords.length === 0) {
      toast.error('No attendance data to save');
      return;
    }

    setSaving(true);
    try {
      await axios.post('/api/attendance/mark', {
        date: selectedDate,
        campVenue: selectedVenue,
        attendanceData: attendanceRecords
      });
      toast.success('Attendance marked successfully');
      setAttendanceData({});
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100';
      case 'absent': return 'text-red-600 bg-red-100';
      case 'late': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      case 'late': return <Clock className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mark Attendance</h1>
        <p className="text-gray-600">Mark attendance for students based on camp venue</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Camp Venue
            </label>
            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Camp Venue</option>
              {campVenues.map((venue, index) => (
                <option key={index} value={venue}>{venue}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Students
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or registration number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      {selectedVenue && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Students at {selectedVenue}
              </h2>
              <button
                onClick={handleSaveAttendance}
                disabled={saving || Object.keys(attendanceData).length === 0}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No students found for this camp venue</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {student.registrationNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={attendanceData[student._id]?.status || 'present'}
                          onChange={(e) => handleAttendanceChange(student._id, 'status', e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(attendanceData[student._id]?.status || 'present')}`}
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          placeholder="Optional remarks..."
                          value={attendanceData[student._id]?.remarks || ''}
                          onChange={(e) => handleAttendanceChange(student._id, 'remarks', e.target.value)}
                          className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Attendance;
