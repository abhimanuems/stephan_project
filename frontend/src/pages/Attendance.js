import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Calendar, Users, CheckCircle, XCircle, Clock, Search, Save, Plus, X } from 'lucide-react';
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
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSearchTerm, setManualSearchTerm] = useState('');
  const [manualSearchResults, setManualSearchResults] = useState([]);
  const [manualSearching, setManualSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [manualAttendanceData, setManualAttendanceData] = useState({ status: 'present', remarks: '' });

  // Debounce search term to avoid API calls on every keystroke
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedManualSearch = useDebounce(manualSearchTerm, 500);

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

  // Fetch attendance when date changes or when venue is selected with default date
  useEffect(() => {
    if (selectedVenue && selectedDate) {
      fetchExistingAttendance();
    } else {
      setAttendanceData({});
    }
  }, [selectedDate, selectedVenue]);

  // Search students for manual attendance
  useEffect(() => {
    if (debouncedManualSearch && selectedVenue) {
      searchStudents();
    } else {
      setManualSearchResults([]);
    }
  }, [debouncedManualSearch, selectedVenue]);

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
      
      // Automatically fetch existing attendance data for the selected date
      if (selectedDate) {
        await fetchExistingAttendance();
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const response = await axios.get(`/api/attendance/records/${encodeURIComponent(selectedVenue)}`, {
        params: {
          date: selectedDate,
          limit: 1000 // Get all records for the date
        }
      });
      
      // Create a map of existing attendance data
      const existingAttendance = {};
      response.data.attendance.forEach(record => {
        existingAttendance[record.student._id] = {
          status: record.status,
          remarks: record.remarks || ''
        };
      });
      
      // Merge with any local changes that haven't been saved yet
      setAttendanceData(prev => {
        const merged = { ...existingAttendance };
        // Keep any unsaved local changes
        Object.keys(prev).forEach(studentId => {
          if (!existingAttendance[studentId]) {
            merged[studentId] = prev[studentId];
          }
        });
        return merged;
      });
    } catch (error) {
      console.error('Error fetching existing attendance:', error);
      // If error, keep existing data but show error
      toast.error('Failed to refresh attendance data');
    }
  };

  const searchStudents = async () => {
    if (!manualSearchTerm.trim()) {
      setManualSearchResults([]);
      return;
    }

    setManualSearching(true);
    try {
      const response = await axios.get('/api/attendance/search-students', {
        params: {
          campVenue: selectedVenue,
          search: manualSearchTerm,
          limit: 20
        }
      });
      setManualSearchResults(response.data.students);
    } catch (error) {
      console.error('Error searching students:', error);
      toast.error('Failed to search students');
    } finally {
      setManualSearching(false);
    }
  };

  // Refresh attendance data for the current date and venue
  const refreshAttendanceData = async () => {
    if (!selectedVenue || !selectedDate) return;
    
    try {
      await fetchExistingAttendance();
    } catch (error) {
      console.error('Error refreshing attendance data:', error);
    }
  };

  // Handle attendance change for individual fields
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
    if (!selectedDate || !selectedVenue) {
      toast.error('Please select date and venue');
      return;
    }

    const attendanceRecords = students.map(student => ({
      studentId: student._id,
      status: attendanceData[student._id]?.status || 'present',
      remarks: attendanceData[student._id]?.remarks || ''
    }));

    setSaving(true);
    try {
      const response = await axios.post('/api/attendance/mark', {
        date: selectedDate,
        campVenue: selectedVenue,
        attendanceData: attendanceRecords
      });

      toast.success('Attendance saved successfully');
      
      // Update local attendance data immediately with the saved data
      const updatedAttendanceData = {};
      attendanceRecords.forEach(record => {
        updatedAttendanceData[record.studentId] = {
          status: record.status,
          remarks: record.remarks
        };
      });
      
      setAttendanceData(updatedAttendanceData);
      
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleManualAttendance = async () => {
    if (!selectedStudent || !selectedVenue || !selectedDate) {
      toast.error('Please select student, venue and date');
      return;
    }

    try {
      const requestData = {
        date: selectedDate,
        campVenue: selectedVenue,
        studentId: selectedStudent._id,
        status: manualAttendanceData.status,
        remarks: manualAttendanceData.remarks
      };
      
      const response = await axios.post('/api/attendance/mark-manual', requestData);
      
      toast.success('Manual attendance marked successfully');
      
      // Update local attendance data immediately
      setAttendanceData(prev => ({
        ...prev,
        [selectedStudent._id]: {
          status: manualAttendanceData.status,
          remarks: manualAttendanceData.remarks
        }
      }));
      
      setShowManualModal(false);
      setSelectedStudent(null);
      setManualAttendanceData({ status: 'present', remarks: '' });
      setManualSearchTerm('');
      setManualSearchResults([]);
    } catch (error) {
      console.error('Error marking manual attendance:', error);
      if (error.response) {
        toast.error(`Failed to mark manual attendance: ${error.response.data.message || 'Unknown error'}`);
      } else {
        toast.error('Failed to mark manual attendance');
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      case 'late': return <Clock className="w-4 h-4" />;
      case 'not marked': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'not marked': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    return Object.keys(attendanceData).length > 0;
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
            <p className="text-xs text-gray-500 mt-1">
              Today's date is automatically selected
            </p>
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
              <div className="flex items-center gap-3">
                {!selectedDate && (
                  <div className="text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-md">
                    Please select a date to mark attendance
                  </div>
                )}
                <button
                  onClick={refreshAttendanceData}
                  disabled={!selectedDate}
                  className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                <button
                  onClick={() => {
                    const allPresentData = {};
                    students.forEach(student => {
                      allPresentData[student._id] = {
                        status: 'present',
                        remarks: ''
                      };
                    });
                    setAttendanceData(allPresentData);
                    toast.success('All students marked as present');
                  }}
                  disabled={!selectedDate || students.length === 0}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mark All Present
                </button>
                <button
                  onClick={() => {
                    const allAbsentData = {};
                    students.forEach(student => {
                      allAbsentData[student._id] = {
                        status: 'absent',
                        remarks: ''
                      };
                    });
                    setAttendanceData(allAbsentData);
                    toast.success('All students marked as absent');
                  }}
                  disabled={!selectedDate || students.length === 0}
                  className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Mark All Absent
                </button>
                <button
                  onClick={() => {
                    const allLateData = {};
                    students.forEach(student => {
                      allLateData[student._id] = {
                        status: 'late',
                        remarks: ''
                      };
                    });
                    setAttendanceData(allLateData);
                    toast.success('All students marked as late');
                  }}
                  disabled={!selectedDate || students.length === 0}
                  className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mark All Late
                </button>
                <button
                  onClick={() => {
                    setAttendanceData({});
                    toast.success('All attendance data cleared');
                  }}
                  disabled={!selectedDate || students.length === 0}
                  className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All
                </button>
                <button
                  onClick={handleSaveAttendance}
                  disabled={saving || !selectedDate || !hasUnsavedChanges()}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                    hasUnsavedChanges() 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : hasUnsavedChanges() ? 'Save Changes' : 'No Changes'}
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading students...</p>
            </div>
          ) : !selectedDate ? (
            <div className="p-6 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Please select a date to view and mark attendance</p>
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
                      Current Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manual Attendance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => {
                    const attendanceStatus = attendanceData[student._id]?.status || 'Not Marked';
                    const currentStatus = attendanceData[student._id]?.status || 'Not Marked';
                    return (
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(currentStatus)}`}>
                            {getStatusIcon(currentStatus.toLowerCase())}
                            <span className="ml-1">{currentStatus === 'Not Marked' ? 'Not Marked' : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}</span>
                          </span>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setManualAttendanceData({ 
                                status: attendanceData[student._id]?.status || 'present', 
                                remarks: attendanceData[student._id]?.remarks || '' 
                              });
                              setShowManualModal(true);
                            }}
                            className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs font-medium"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Manual
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Manual Attendance Marking</h2>
              <button
                onClick={() => {
                  setShowManualModal(false);
                  setSelectedStudent(null);
                  setManualAttendanceData({ status: 'present', remarks: '' });
                  setManualSearchTerm('');
                  setManualSearchResults([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue
                </label>
                <input
                  type="text"
                  value={selectedVenue}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>

            {/* If student is pre-selected from table, show their info directly */}
            {selectedStudent && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-medium text-blue-700 mb-2">Selected Student</h3>
                <div className="text-sm text-blue-800">
                  <div><strong>Name:</strong> {selectedStudent.name}</div>
                  <div><strong>Registration No:</strong> {selectedStudent.registrationNumber}</div>
                </div>
              </div>
            )}

            {/* If no student pre-selected, show search */}
            {!selectedStudent && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Student
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by name or registration number..."
                      value={manualSearchTerm}
                      onChange={(e) => setManualSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Search Results */}
                {manualSearchResults.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Search Results</h3>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                      {manualSearchResults.map((student) => (
                        <div
                          key={student._id}
                          onClick={() => setSelectedStudent(student)}
                          className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                        >
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.registrationNumber}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Attendance Form - Show only when student is selected */}
            {selectedStudent && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attendance Status
                  </label>
                  <select
                    value={manualAttendanceData.status}
                    onChange={(e) => setManualAttendanceData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="Optional remarks..."
                    value={manualAttendanceData.remarks}
                    onChange={(e) => setManualAttendanceData(prev => ({ ...prev, remarks: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleManualAttendance}
                disabled={!selectedStudent}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark Attendance
              </button>
              <button
                onClick={() => {
                  setShowManualModal(false);
                  setSelectedStudent(null);
                  setManualAttendanceData({ status: 'present', remarks: '' });
                  setManualSearchTerm('');
                  setManualSearchResults([]);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
