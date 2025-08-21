import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentForm from './pages/StudentForm';
import StudentList from './pages/StudentList';
import StudentView from './pages/StudentView';
import EmployeeList from './pages/EmployeeList';
import EmployeeForm from './pages/EmployeeForm';
import Attendance from './pages/Attendance';
import AttendanceRecords from './pages/AttendanceRecords';
import EmployeeAttendance from './pages/EmployeeAttendance';
import LeaveRequest from './pages/LeaveRequest';
import LeaveManagement from './pages/LeaveManagement';
import LocationManagement from './pages/LocationManagement';
import CourseManagement from './pages/CourseManagement';
import CourseStudents from './pages/CourseStudents';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="students" element={<StudentList />} />
              <Route path="students/new" element={<StudentForm />} />
              <Route path="students/:id/edit" element={<StudentForm />} />
              <Route path="students/:id" element={<StudentView />} />
                                   <Route path="attendance" element={<Attendance />} />
                     <Route path="attendance-records" element={<AttendanceRecords />} />
                     <Route path="my-attendance" element={<EmployeeAttendance />} />
                     <Route path="leave-request" element={<LeaveRequest />} />
                     <Route path="leave-management" element={<ProtectedRoute requireSuperAdmin><LeaveManagement /></ProtectedRoute>} />
                     <Route path="employees" element={<ProtectedRoute requireSuperAdmin><EmployeeList /></ProtectedRoute>} />
              <Route path="employees/new" element={<ProtectedRoute requireSuperAdmin><EmployeeForm /></ProtectedRoute>} />
              <Route path="employees/:id/edit" element={<ProtectedRoute requireSuperAdmin><EmployeeForm /></ProtectedRoute>} />
              <Route path="locations" element={<ProtectedRoute requireSuperAdmin><LocationManagement /></ProtectedRoute>} />
              <Route path="courses" element={<ProtectedRoute requireSuperAdmin><CourseManagement /></ProtectedRoute>} />
              <Route path="course-students" element={<ProtectedRoute requireSuperAdmin><CourseStudents /></ProtectedRoute>} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
