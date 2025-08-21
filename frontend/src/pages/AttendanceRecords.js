import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Calendar, Users, CheckCircle, XCircle, Clock, Search, BarChart3, Download, X } from 'lucide-react';
import toast from 'react-hot-toast';

const AttendanceRecords = () => {
  const { user } = useAuth();
  const [campVenues, setCampVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadDate, setDownloadDate] = useState('');
  const [downloadStatus, setDownloadStatus] = useState('');
  const [downloadStudentName, setDownloadStudentName] = useState('');

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

  // Fetch attendance records when venue is selected
  useEffect(() => {
    if (selectedVenue) {
      fetchAttendanceRecords();
      fetchStats();
    }
  }, [selectedVenue, currentPage, selectedDate, selectedStatus, selectedStudentName]);

  const fetchAttendanceRecords = async () => {
    if (!selectedVenue) {
      setAttendanceRecords([]);
      setTotalPages(0);
      return;
    }

    setLoading(true);
    try {
      // First get all students for the venue
      const studentsResponse = await axios.get('/api/students', {
        params: {
          campVenue: selectedVenue,
          limit: 1000 // Get all students
        }
      });
      
      const allStudents = studentsResponse.data.students;
      
      if (selectedDate) {
        // If a specific date is selected, only show students with attendance for that date
        try {
          const attendanceResponse = await axios.get(`/api/attendance/records/${encodeURIComponent(selectedVenue)}`, {
        params: {
          date: selectedDate,
              limit: 1000
            }
          });
          
          // Only show students who have attendance records for the selected date
          const attendanceRecords = attendanceResponse.data.attendance;
          const studentsWithAttendance = attendanceRecords.map(record => ({
            _id: record._id,
            student: record.student,
            status: record.status,
            date: record.date,
            markedBy: record.markedBy,
            remarks: record.remarks
          }));
          
          // Apply additional filters
          let filteredRecords = studentsWithAttendance;
          
          if (selectedStatus) {
            filteredRecords = filteredRecords.filter(record => record.status === selectedStatus);
          }
          
          if (selectedStudentName) {
            filteredRecords = filteredRecords.filter(record =>
              record.student?.name?.toLowerCase().includes(selectedStudentName.toLowerCase())
            );
          }
          
          // Sort by student name
          filteredRecords.sort((a, b) => a.student?.name?.localeCompare(b.student?.name));
          
          setAttendanceRecords(filteredRecords);
          setTotalPages(Math.ceil(filteredRecords.length / 10));
        } catch (error) {
          console.error('Error fetching attendance for specific date:', error);
          setAttendanceRecords([]);
          setTotalPages(0);
        }
      } else {
        // If no date is selected, show the most recent attendance for each student
        try {
          const attendanceResponse = await axios.get(`/api/attendance/records/${encodeURIComponent(selectedVenue)}`, {
            params: {
              limit: 1000
            }
          });
          
          // Group attendance records by student and get the most recent one for each
          const studentLatestAttendance = new Map();
          attendanceResponse.data.attendance.forEach(record => {
            if (record.student) {
              const studentId = record.student._id;
              const existingRecord = studentLatestAttendance.get(studentId);
              
              if (!existingRecord || new Date(record.date) > new Date(existingRecord.date)) {
                studentLatestAttendance.set(studentId, record);
              }
            }
          });
          
          // Create a map of student attendance
          const studentAttendanceMap = new Map();
          
          // Initialize all students with 'Not Marked' status
          allStudents.forEach(student => {
            studentAttendanceMap.set(student._id, {
              _id: student._id,
              student: {
                name: student.name,
                registrationNumber: student.registrationNumber
              },
              status: 'Not Marked',
              date: 'No Recent Attendance',
              markedBy: { name: 'N/A' },
              remarks: 'No attendance marked'
            });
          });
          
          // Update with actual attendance records
          studentLatestAttendance.forEach((record, studentId) => {
            if (studentAttendanceMap.has(studentId)) {
              studentAttendanceMap.set(studentId, record);
            }
          });
          
          // Convert to array and apply filters
          let filteredRecords = Array.from(studentAttendanceMap.values());
          
          // Filter by student name on frontend
          if (selectedStudentName) {
            filteredRecords = filteredRecords.filter(record =>
              record.student?.name?.toLowerCase().includes(selectedStudentName.toLowerCase())
            );
          }
          
          // Filter by status if selected
          if (selectedStatus) {
            filteredRecords = filteredRecords.filter(record => record.status === selectedStatus);
          }
          
          // Sort by student name
          filteredRecords.sort((a, b) => a.student?.name?.localeCompare(b.student?.name));
          
          setAttendanceRecords(filteredRecords);
          setTotalPages(Math.ceil(filteredRecords.length / 10));
        } catch (error) {
          console.error('Error fetching latest attendance records:', error);
          setAttendanceRecords([]);
          setTotalPages(0);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      toast.error('Failed to fetch attendance records');
      setAttendanceRecords([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!selectedVenue) {
      setStats(null);
      return;
    }

    try {
      // Get all students for the venue
      const studentsResponse = await axios.get('/api/students', {
        params: {
          campVenue: selectedVenue,
          limit: 1000
        }
      });
      
      const totalStudents = studentsResponse.data.students.length;
      
      let present = 0, absent = 0, late = 0, marked = 0, notMarked = 0;
      
      if (selectedDate) {
        // If a specific date is selected, only count students with attendance for that date
        try {
          const attendanceResponse = await axios.get(`/api/attendance/records/${encodeURIComponent(selectedVenue)}`, {
            params: {
              date: selectedDate,
              limit: 1000
            }
          });
          
          const attendance = attendanceResponse.data.attendance;
          
          // Calculate statistics for the specific date
          present = attendance.filter(a => a.status === 'present').length;
          absent = attendance.filter(a => a.status === 'absent').length;
          late = attendance.filter(a => a.status === 'late').length;
          marked = present + absent + late;
          notMarked = 0; // No "Not Marked" when filtering by specific date
          
          // Update total students to only those with attendance for this date
          const studentsWithAttendance = totalStudents;
        } catch (error) {
          console.error('Error fetching attendance stats for specific date:', error);
          // If error, no students have attendance for this date
          present = 0;
          absent = 0;
          late = 0;
          marked = 0;
          notMarked = 0;
        }
      } else {
        // If no date is selected, get the most recent attendance for each student
        try {
          const attendanceResponse = await axios.get(`/api/attendance/records/${encodeURIComponent(selectedVenue)}`, {
        params: {
              limit: 1000
            }
          });
          
          const attendance = attendanceResponse.data.attendance;
          
          // Group by student and get most recent attendance
          const studentLatestAttendance = new Map();
          attendance.forEach(record => {
            if (record.student) {
              const studentId = record.student._id;
              const existingRecord = studentLatestAttendance.get(studentId);
              
              if (!existingRecord || new Date(record.date) > new Date(existingRecord.date)) {
                studentLatestAttendance.set(studentId, record);
              }
            }
          });
          
          // Calculate statistics from most recent attendance
          present = Array.from(studentLatestAttendance.values()).filter(a => a.status === 'present').length;
          absent = Array.from(studentLatestAttendance.values()).filter(a => a.status === 'absent').length;
          late = Array.from(studentLatestAttendance.values()).filter(a => a.status === 'late').length;
          marked = present + absent + late;
          notMarked = totalStudents - marked;
        } catch (error) {
          console.error('Error fetching latest attendance stats:', error);
          notMarked = totalStudents;
        }
      }
      
      const attendancePercentage = totalStudents > 0 ? (marked / totalStudents) * 100 : 0;
      
      setStats({
        totalStudents: selectedDate ? marked : totalStudents, // Show relevant total based on filter
        present,
        absent,
        late,
        notMarked,
        marked,
        attendancePercentage
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const downloadAttendancePDF = async () => {
    try {
      const response = await axios.get(`/api/attendance/download-pdf/${encodeURIComponent(selectedVenue)}`, {
        params: {
          date: downloadDate || undefined,
          status: downloadStatus || undefined,
          studentName: downloadStudentName || undefined
        }
      });

      if (response.data.success) {
        const data = response.data.data;
        
        // Create PDF using jsPDF
        const { jsPDF } = await import('jspdf');
        const { autoTable } = await import('jspdf-autotable');
        
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.text('Attendance Report', 105, 20, { align: 'center' });
        
        // Add venue and date info
        doc.setFontSize(12);
        doc.text(`Venue: ${data.campVenue}`, 20, 35);
        doc.text(`Date: ${data.date}`, 20, 45);
        doc.text(`Status Filter: ${data.status}`, 20, 55);
        doc.text(`Student Filter: ${data.studentName}`, 20, 65);
        
        // Add note about date selection
        if (!downloadDate) {
          doc.setFontSize(10);
          doc.setTextColor(128, 128, 128);
          doc.text('Note: Showing most recent attendance records (no specific date selected)', 20, 75);
          doc.setTextColor(0, 0, 0);
        }
        
        // Add statistics
        doc.setFontSize(14);
        doc.text('Summary', 20, downloadDate ? 85 : 95);
        doc.setFontSize(10);
        doc.text(`Total Students: ${data.totalStudents}`, 20, downloadDate ? 95 : 105);
        doc.text(`Present: ${data.present}`, 20, downloadDate ? 105 : 115);
        doc.text(`Absent: ${data.absent}`, 20, downloadDate ? 115 : 125);
        doc.text(`Late: ${data.late}`, 20, downloadDate ? 125 : 135);
        doc.text(`Not Marked: ${data.notMarked}`, 20, downloadDate ? 135 : 145);
        doc.text(`Attendance Rate: ${data.attendancePercentage}%`, 20, downloadDate ? 145 : 155);
        
        // Add attendance table with all students
        if (data.records.length > 0) {
          const tableData = data.records.map(record => [
            record.studentName,
            record.registrationNumber,
            record.date,
            record.status.charAt(0).toUpperCase() + record.status.slice(1),
            record.markedBy,
            record.remarks
          ]);
          
          autoTable(doc, {
            startY: downloadDate ? 160 : 170,
            head: [['Student Name', 'Reg. No.', 'Date', 'Status', 'Marked By', 'Remarks']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [66, 139, 202] },
            styles: { fontSize: 8 },
            columnStyles: {
              0: { cellWidth: 40 },
              1: { cellWidth: 25 },
              2: { cellWidth: 25 },
              3: { cellWidth: 20 },
              4: { cellWidth: 30 },
              5: { cellWidth: 30 }
            },
            didParseCell: function(data) {
              // Highlight "Not Marked" status in red
              if (data.column.index === 3 && data.cell.text[0] === 'Not Marked') {
                data.cell.styles.textColor = [255, 0, 0];
                data.cell.styles.fontStyle = 'bold';
              }
              // Highlight "Present" status in green
              if (data.column.index === 3 && data.cell.text[0] === 'Present') {
                data.cell.styles.textColor = [0, 128, 0];
              }
              // Highlight "Absent" status in red
              if (data.column.index === 3 && data.cell.text[0] === 'Absent') {
                data.cell.styles.textColor = [255, 0, 0];
              }
              // Highlight "Late" status in orange
              if (data.column.index === 3 && data.cell.text[0] === 'Late') {
                data.cell.styles.textColor = [255, 165, 0];
              }
            }
          });
        }
        
        // Generate filename based on filters
        let filename = `attendance_${data.campVenue.replace(/\s+/g, '_')}`;
        if (downloadDate) {
          filename += `_${data.date.replace(/\s+/g, '_')}`;
        } else {
          filename += '_most_recent';
        }
        if (data.status !== 'All Status') {
          filename += `_${data.status}`;
        }
        if (data.studentName !== 'All Students') {
          filename += `_${data.studentName.replace(/\s+/g, '_')}`;
        }
        filename += '.pdf';
        
        // Save PDF
        doc.save(filename);
        
        toast.success('PDF downloaded successfully');
        setShowDownloadModal(false);
        setDownloadDate('');
        setDownloadStatus('');
        setDownloadStudentName('');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100';
      case 'absent': return 'text-red-600 bg-red-100';
      case 'late': return 'text-yellow-600 bg-yellow-100';
      case 'Not Marked': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      case 'late': return <Clock className="w-4 h-4" />;
      case 'Not Marked': return <Calendar className="w-4 h-4" />;
      default: return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Attendance Records</h1>
        <p className="text-gray-600">View attendance history and statistics</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student Name
            </label>
            <input
              type="text"
              placeholder="Search student name..."
              value={selectedStudentName}
              onChange={(e) => setSelectedStudentName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedDate('');
                setSelectedStatus('');
                setSelectedStudentName('');
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      {selectedVenue ? (
        <>
      {/* Statistics */}
          {stats && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
              <div className="text-sm text-gray-600">Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
              <div className="text-sm text-gray-600">Absent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
              <div className="text-sm text-gray-600">Late</div>
            </div>
            <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{stats.notMarked}</div>
                  <div className="text-sm text-gray-600">Not Marked</div>
            </div>
            <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.attendancePercentage.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Attendance Rate</div>
            </div>
          </div>
        </div>
      )}

          {/* Records Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Attendance Records for {selectedVenue}
            </h2>
                <button
                  onClick={() => setShowDownloadModal(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </button>
              </div>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading records...</p>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No attendance records found</p>
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
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marked By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceRecords.map((record) => (
                    <tr key={record._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.student?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {record.student?.registrationNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {record.date === 'No Recent Attendance' ? record.date : formatDate(record.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          <span className="ml-1">{record.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {record.markedBy?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {record.remarks || '-'}
                        </div>
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
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>Please select a camp venue to view attendance records</p>
        </div>
      )}

      {/* Download PDF Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Download Attendance PDF</h2>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4">
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

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date (Optional)
              </label>
              <input
                type="date"
                value={downloadDate}
                onChange={(e) => setDownloadDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to show most recent attendance records for each student
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Filter (Optional)
              </label>
              <select
                value={downloadStatus}
                onChange={(e) => setDownloadStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Name Filter (Optional)
              </label>
              <input
                type="text"
                value={downloadStudentName}
                onChange={(e) => setDownloadStudentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter student name to filter"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to include all students, or type part of a student's name
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={downloadAttendancePDF}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Download PDF
              </button>
              <button
                onClick={() => setShowDownloadModal(false)}
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

export default AttendanceRecords;
