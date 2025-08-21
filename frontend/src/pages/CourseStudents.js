import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Eye, DollarSign, Calendar, Search, Filter, Plus, X } from 'lucide-react';

const CourseStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [courses, setCourses] = useState([]);
   const [showPaymentModal, setShowPaymentModal] = useState(false);
 const [showTransactionModal, setShowTransactionModal] = useState(false);
 const [selectedStudent, setSelectedStudent] = useState(null);
 const [selectedCourse, setSelectedCourse] = useState(null);
 const [transactionHistory, setTransactionHistory] = useState(null);
   const [paymentData, setPaymentData] = useState({
   amount: '',
   paymentMode: 'Full',
   transactionMode: 'Cash',
   reference: '',
   notes: ''
 });

  useEffect(() => {
    fetchCourseStudents();
    fetchCourses();
  }, [currentPage, filterPaymentStatus, filterCourse]);

  const fetchCourseStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      
      if (filterPaymentStatus !== 'all') {
        params.append('paymentStatus', filterPaymentStatus);
      }
      
      if (filterCourse !== 'all') {
        params.append('courseId', filterCourse);
      }

      console.log('Fetching course students with params:', params.toString());
      const response = await axios.get(`/api/course-students?${params}`);
      console.log('Course students response:', response.data);
      
      // Debug: Log the structure of the first student's selectedCourses
      if (response.data.students && response.data.students.length > 0) {
        console.log('First student selectedCourses structure:', response.data.students[0].selectedCourses.map(c => ({
          courseId: c.courseId,
          originalCourseId: c.originalCourseId,
          courseName: c.courseName,
          totalAmount: c.totalAmount
        })));
      }
      
      setStudents(response.data.students);
      setTotalPages(response.data.totalPages);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch course students:', error);
      toast.error('Failed to fetch course students');
    } finally {
      setLoading(false);
    }
  };

   const fetchCourses = async () => {
   try {
     const response = await axios.get('/api/courses');
     setCourses(response.data.courses);
   } catch (error) {
     console.error('Failed to fetch courses');
   }
 };

 const fetchTransactionHistory = async (studentId, courseId) => {
   try {
     console.log('Fetching transaction history for:', { studentId, courseId });
     const response = await axios.get(`/api/course-students/${studentId}/${courseId}/transactions`);
     console.log('Transaction history response:', response.data);
     setTransactionHistory(response.data);
     setShowTransactionModal(true);
   } catch (error) {
     console.error('Failed to fetch transaction history:', error);
     toast.error('Failed to fetch transaction history');
   }
 };

  const handlePaymentUpdate = async (e) => {
    e.preventDefault();
    
    if (!paymentData.amount || paymentData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }



    // Debug: Log the selected course object to see its structure
    console.log('Selected course object:', selectedCourse);
    console.log('Selected course courseId:', selectedCourse.courseId);
    console.log('Selected course _id:', selectedCourse._id);
    
    // Determine the correct courseId to send
    let courseIdToSend;
    if (selectedCourse.originalCourseId) {
      courseIdToSend = selectedCourse.originalCourseId;
    } else if (selectedCourse.courseId && selectedCourse.courseId._id) {
      courseIdToSend = selectedCourse.courseId._id;
    } else {
      courseIdToSend = selectedCourse.courseId;
    }
    
    console.log('Course ID to send:', courseIdToSend);
    console.log('Selected course full object:', selectedCourse);
    
    const paymentPayload = {
         studentId: selectedStudent._id,
      courseId: courseIdToSend,
         amount: parseFloat(paymentData.amount),
         paymentMode: paymentData.paymentMode,
         transactionMode: paymentData.transactionMode,
         reference: paymentData.reference,
         notes: paymentData.notes
    };

    console.log('Sending payment update:', paymentPayload);
    console.log('API endpoint:', '/api/course-students/update-payment');

         try {
       const response = await axios.post('/api/course-students/update-payment', paymentPayload);
       console.log('Payment update response:', response.data);

      toast.success('Payment updated successfully');
      setShowPaymentModal(false);
      setSelectedStudent(null);
      setSelectedCourse(null);
      setPaymentData({ amount: '', paymentMode: 'Full' });
      fetchCourseStudents();
    } catch (error) {
      console.error('Payment update error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      const message = error.response?.data?.message || 'Failed to update payment';
      toast.error(message);
    }
  };

  const openPaymentModal = (student, course) => {
    console.log('Opening payment modal for course:', course);
    console.log('Course object structure:', {
      courseId: course.courseId,
      originalCourseId: course.originalCourseId,
      courseName: course.courseName,
      totalAmount: course.totalAmount
    });
    setSelectedStudent(student);
    setSelectedCourse(course);
    setShowPaymentModal(true);
  };

   const closePaymentModal = () => {
   setShowPaymentModal(false);
   setSelectedStudent(null);
   setSelectedCourse(null);
   setPaymentData({ 
     amount: '', 
     paymentMode: 'Full', 
     transactionMode: 'Cash', 
     reference: '', 
     notes: '' 
   });
 };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.contactNumber.includes(searchTerm) ||
    student.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Course Students</h1>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Payment Status</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
              <option value="Completed">Completed</option>
            </select>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading students...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Selected Courses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Remaining Balance
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Actions
                     </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-gray-500">{student.contactNumber}</div>
                          {student.registrationNumber && (
                            <div className="text-gray-500 text-xs">Reg: {student.registrationNumber}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {student.selectedCourses.map((course, index) => (
                            <div key={index} className="text-sm">
                              <div className="font-medium text-gray-900">{course.courseName}</div>
                              <div className="text-gray-500 text-xs">
                                ₹{course.totalAmount} - {course.paymentMode}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {student.selectedCourses.map((course, index) => (
                            <span
                              key={index}
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(course.paymentStatus)}`}
                            >
                              {course.paymentStatus}
                            </span>
                          ))}
                        </div>
                      </td>
                                             <td className="px-6 py-4">
                         <div className="space-y-2">
                           {student.selectedCourses.map((course, index) => (
                             <div key={index} className="text-sm">
                               <div className="text-gray-900">₹{course.totalAmount - course.amountPaid}</div>
                               <div className="text-gray-500 text-xs">
                                 {course.paymentMode === 'Partial' && course.nextDueDate ? (
                                   `Next due: ${new Date(course.nextDueDate).toLocaleDateString()}`
                                 ) : (
                                   'Full payment pending'
                                 )}
                               </div>
                             </div>
                           ))}
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         <div className="flex gap-2">
                           {student.selectedCourses.map((course, index) => (
                             <div key={index} className="flex gap-1">
                               <button
                                 onClick={() => openPaymentModal(student, course)}
                                 className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                                 title="Update Payment"
                               >
                                 <DollarSign size={16} />
                               </button>
                               <button
                                  onClick={() => {
                                    let courseIdToSend;
                                    if (course.originalCourseId) {
                                      courseIdToSend = course.originalCourseId;
                                    } else if (course.courseId && course.courseId._id) {
                                      courseIdToSend = course.courseId._id;
                                    } else {
                                      courseIdToSend = course.courseId;
                                    }
                                    fetchTransactionHistory(student._id, courseIdToSend);
                                  }}
                                 className="text-green-600 hover:text-green-900 transition-colors p-1"
                                 title="View Transactions"
                               >
                                 <Eye size={16} />
                               </button>
                             </div>
                           ))}
                         </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No students found</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Update Payment</h2>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <div><strong>Student:</strong> {selectedStudent?.name}</div>
                <div><strong>Course:</strong> {selectedCourse?.courseName}</div>
                <div><strong>Total Amount:</strong> ₹{selectedCourse?.totalAmount}</div>
                <div><strong>Amount Paid:</strong> ₹{selectedCourse?.amountPaid}</div>
                <div><strong>Pending:</strong> ₹{selectedCourse?.totalAmount - selectedCourse?.amountPaid}</div>
              </div>
            </div>
            
            <form onSubmit={handlePaymentUpdate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedCourse?.totalAmount - selectedCourse?.amountPaid}
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Mode
                </label>
                <select
                  value={paymentData.paymentMode}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Full">Full Payment</option>
                  <option value="Partial">Partial Payment</option>
                </select>
              </div>
              


               <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Transaction Mode
                 </label>
                 <select
                   value={paymentData.transactionMode}
                   onChange={(e) => setPaymentData({ ...paymentData, transactionMode: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 >
                   <option value="Cash">Cash</option>
                   <option value="Card">Card</option>
                   <option value="UPI">UPI</option>
                   <option value="Bank Transfer">Bank Transfer</option>
                 </select>
               </div>

               <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Reference Number
                 </label>
                 <input
                   type="text"
                   value={paymentData.reference}
                   onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   placeholder="Transaction reference (optional)"
                 />
               </div>

               <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Notes
                 </label>
                 <textarea
                   value={paymentData.notes}
                   onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   placeholder="Additional notes (optional)"
                   rows="2"
                 />
               </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Update Payment
                </button>
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
                 </div>
       )}

       {/* Transaction History Modal */}
       {showTransactionModal && transactionHistory && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold">Transaction History</h2>
               <button
                 onClick={() => setShowTransactionModal(false)}
                 className="text-gray-500 hover:text-gray-700"
               >
                 <X size={24} />
               </button>
             </div>

             {/* Course Summary */}
             <div className="mb-6 p-4 bg-gray-50 rounded-lg">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                 <div>
                   <span className="font-medium">Student:</span> {transactionHistory.studentName}
                 </div>
                 <div>
                   <span className="font-medium">Course:</span> {transactionHistory.courseName}
                 </div>
                 <div>
                   <span className="font-medium">Total Amount:</span> ₹{transactionHistory.totalAmount}
                 </div>
                 <div>
                   <span className="font-medium">Payment Status:</span> 
                   <span className={`ml-1 px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(transactionHistory.paymentStatus)}`}>
                     {transactionHistory.paymentStatus}
                   </span>
                 </div>
               </div>
               <div className="mt-2 text-sm">
                 <span className="font-medium">Amount Paid:</span> ₹{transactionHistory.amountPaid} | 
                 <span className="font-medium ml-2">Remaining:</span> ₹{transactionHistory.pendingAmount}
               </div>
             </div>

             {/* Payment Transactions */}
             <div className="mb-6">
               <h3 className="text-lg font-medium mb-3">Payment Transactions</h3>
               {transactionHistory.transactions && transactionHistory.transactions.length > 0 ? (
                 <div className="overflow-x-auto">
                   <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                       <tr>
                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Recorded By</th>
                       </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                       {transactionHistory.transactions.map((transaction, index) => (
                         <tr key={index} className="hover:bg-gray-50">
                           <td className="px-4 py-2 text-sm">
                             {new Date(transaction.date).toLocaleDateString()}
                           </td>
                           <td className="px-4 py-2 text-sm font-medium">₹{transaction.amount}</td>
                           <td className="px-4 py-2 text-sm">{transaction.paymentMode}</td>
                           <td className="px-4 py-2 text-sm">{transaction.reference || '-'}</td>
                           <td className="px-4 py-2 text-sm">{transaction.notes || '-'}</td>
                           <td className="px-4 py-2 text-sm">{transaction.recordedBy?.name || 'Unknown'}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               ) : (
                 <p className="text-gray-500 text-center py-4">No transactions recorded yet</p>
               )}
             </div>

             {/* Partial Payment Details (if applicable) */}
             {transactionHistory.paymentMode === 'Partial' && transactionHistory.partialPaymentDetails && transactionHistory.partialPaymentDetails.length > 0 && (
               <div>
                 <h3 className="text-lg font-medium mb-3">Partial Payment Schedule</h3>
                 <div className="overflow-x-auto">
                   <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                       <tr>
                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Paid Date</th>
                       </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                       {transactionHistory.partialPaymentDetails.map((partial, index) => (
                         <tr key={index} className="hover:bg-gray-50">
                           <td className="px-4 py-2 text-sm">
                             {new Date(partial.dueDate).toLocaleDateString()}
                           </td>
                           <td className="px-4 py-2 text-sm font-medium">₹{partial.amount}</td>
                           <td className="px-4 py-2 text-sm">
                             <span className={`px-2 py-1 text-xs rounded-full ${
                               partial.status === 'Paid' ? 'bg-green-100 text-green-800' :
                               partial.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                               'bg-yellow-100 text-yellow-800'
                             }`}>
                               {partial.status}
                             </span>
                           </td>
                           <td className="px-4 py-2 text-sm">
                             {partial.paidDate ? new Date(partial.paidDate).toLocaleDateString() : '-'}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
             )}
           </div>
         </div>
       )}
     </div>
   );
 };
 
 export default CourseStudents;
