import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Filter } from 'lucide-react';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    courseFee: ''
  });

  useEffect(() => {
    fetchCourses();
  }, [currentPage, filterActive]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      
      if (filterActive !== 'all') {
        params.append('active', filterActive);
      }

      const response = await axios.get(`/api/courses?${params}`);
      setCourses(response.data.courses);
      setTotalPages(response.data.totalPages);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Course name is required');
      return;
    }

    try {
      if (editingCourse) {
        await axios.put(`/api/courses/${editingCourse._id}`, formData);
        toast.success('Course updated successfully');
      } else {
        await axios.post('/api/courses', formData);
        toast.success('Course created successfully');
      }
      
      setShowModal(false);
      setEditingCourse(null);
      resetForm();
      fetchCourses();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save course';
      toast.error(message);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      description: course.description || '',
      duration: course.duration || '',
      courseFee: course.courseFee || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await axios.delete(`/api/courses/${courseId}`);
        toast.success('Course deleted successfully');
        fetchCourses();
      } catch (error) {
        toast.error('Failed to delete course');
      }
    }
  };

  const handleToggleStatus = async (courseId) => {
    try {
      await axios.patch(`/api/courses/${courseId}/toggle-status`);
      toast.success('Course status updated');
      fetchCourses();
    } catch (error) {
      toast.error('Failed to update course status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: '',
      courseFee: ''
    });
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCourse(null);
    resetForm();
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Course
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Courses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Duration
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Course Fee
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Status
                     </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCourses.map((course) => (
                    <tr key={course._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{course.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {course.description || 'No description'}
                        </div>
                      </td>
                                             <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm text-gray-900">{course.duration || 'Not specified'}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm text-gray-900">₹{course.courseFee || 0}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                           course.isActive
                             ? 'bg-green-100 text-green-800'
                             : 'bg-red-100 text-red-800'
                         }`}>
                           {course.isActive ? 'Active' : 'Inactive'}
                         </span>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {course.createdBy?.name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(course)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(course._id)}
                            className="text-yellow-600 hover:text-yellow-900 transition-colors"
                            title={course.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {course.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => handleDelete(course._id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCourses.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No courses found</p>
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

      {/* Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingCourse ? 'Edit Course' : 'Add New Course'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter course name"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter course description"
                  rows="3"
                />
              </div>
              
                             <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Duration
                 </label>
                 <select
                   value={formData.duration}
                   onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 >
                   <option value="">Select Duration</option>
                   <option value="1 Month">1 Month</option>
                   <option value="2 Months">2 Months</option>
                   <option value="3 Months">3 Months</option>
                   <option value="4 Months">4 Months</option>
                   <option value="5 Months">5 Months</option>
                   <option value="6 Months">6 Months</option>
                   <option value="7 Months">7 Months</option>
                   <option value="8 Months">8 Months</option>
                   <option value="9 Months">9 Months</option>
                   <option value="10 Months">10 Months</option>
                   <option value="11 Months">11 Months</option>
                   <option value="1 Year">1 Year</option>
                   <option value="1.5 Years">1.5 Years</option>
                   <option value="2 Years">2 Years</option>
                   <option value="2.5 Years">2.5 Years</option>
                   <option value="3 Years">3 Years</option>
                   <option value="3.5 Years">3.5 Years</option>
                   <option value="4 Years">4 Years</option>
                   <option value="4.5 Years">4.5 Years</option>
                   <option value="5 Years">5 Years</option>
                 </select>
               </div>
               
               <div className="mb-6">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Course Fee (₹)
                 </label>
                 <input
                   type="number"
                   step="0.01"
                   min="0"
                   value={formData.courseFee}
                   onChange={(e) => setFormData({ ...formData, courseFee: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   placeholder="Enter course fee"
                 />
               </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {editingCourse ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
