import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Calendar, MapPin, Phone, Mail, User, GraduationCap, CreditCard, FileText } from 'lucide-react';

const StudentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/students/${id}`);
      setStudent(response.data.student);
    } catch (error) {
      console.error('Error fetching student:', error);
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Student not found</h3>
        <p className="text-gray-500 mt-2">The student you're looking for doesn't exist.</p>
        <Link to="/students" className="btn btn-primary mt-4">
          Back to Students
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/students')}
            className="btn btn-secondary inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Students
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-sm text-gray-500">Student Details</p>
          </div>
        </div>
        <Link
          to={`/students/${student._id}/edit`}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Student
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Registration Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Registration Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Registration Number</label>
                <p className="text-sm text-gray-900 mt-1">{student.registrationNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Admission Number</label>
                <p className="text-sm text-gray-900 mt-1">{student.admissionNo || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Registration Date</label>
                <p className="text-sm text-gray-900 mt-1">{formatDate(student.registrationDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2">Camp Venue</label>
                <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {student.campVenue}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2">Course Mode</label>
                <p className="text-sm text-gray-900 mt-1">
                  {student.courseMode || 'Offline'}
                </p>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-sm text-gray-900 mt-1">{student.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Age</label>
                <p className="text-sm text-gray-900 mt-1">{student.age} years</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                <p className="text-sm text-gray-900 mt-1">{formatDate(student.dateOfBirth)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Religion</label>
                <p className="text-sm text-gray-900 mt-1">{student.religion || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Caste</label>
                <p className="text-sm text-gray-900 mt-1">{student.caste || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Number</label>
                <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {student.contactNumber}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-sm text-gray-900 mt-1">{student.address}</p>
              </div>
            </div>
          </div>

          {/* Parent Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Parent Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Parent Name</label>
                <p className="text-sm text-gray-900 mt-1">{student.parentName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Parent Mobile Number</label>
                <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {student.parentMobileNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Educational Details */}
          {student.educationalDetails && student.educationalDetails.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Educational Details
              </h2>
              <div className="space-y-3">
                {student.educationalDetails.map((detail, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Course:</span>
                        <p className="text-gray-900">{detail.course}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">University:</span>
                        <p className="text-gray-900">{detail.university}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Percentage:</span>
                        <p className="text-gray-900">{detail.percentage || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Physical & Medical Details */}
          {(student.height || student.weight || student.chestUnexpanded || student.chestExpanded || student.vision || student.bloodGroup) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Physical & Medical Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {student.height && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Height (cm)</label>
                    <p className="text-sm text-gray-900 mt-1">{student.height}</p>
                  </div>
                )}
                {student.weight && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Weight (kg)</label>
                    <p className="text-sm text-gray-900 mt-1">{student.weight}</p>
                  </div>
                )}
                {student.chestUnexpanded && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Chest Unexpanded (cm)</label>
                    <p className="text-sm text-gray-900 mt-1">{student.chestUnexpanded}</p>
                  </div>
                )}
                {student.chestExpanded && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Chest Expanded (cm)</label>
                    <p className="text-sm text-gray-900 mt-1">{student.chestExpanded}</p>
                  </div>
                )}
                {student.vision && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vision</label>
                    <p className="text-sm text-gray-900 mt-1">{student.vision}</p>
                  </div>
                )}
                {student.bloodGroup && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Blood Group</label>
                    <p className="text-sm text-gray-900 mt-1">{student.bloodGroup}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Course & Payment Info */}
        <div className="space-y-6">
          {/* Course Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Selected Courses
            </h2>
            {student.selectedCourses && student.selectedCourses.length > 0 ? (
              <div className="space-y-3">
                {student.selectedCourses.map((course, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="space-y-2">
                      <div className="font-medium text-gray-900">{course.courseId?.name || course.courseName || 'Unknown Course'}</div>
                      <div className="text-sm text-gray-600">
                        <div>Duration: {course.duration}</div>
                        <div>Total Fee: {formatCurrency(course.totalAmount)}</div>
                        <div>Payment Mode: {course.paymentMode}</div>
                        {course.paymentMode === 'Partial' && course.partialPaymentAmount > 0 && (
                          <>
                            <div>Partial Payment: {formatCurrency(course.partialPaymentAmount)}</div>
                            <div>Remaining: {formatCurrency(course.totalAmount - course.partialPaymentAmount)}</div>
                          </>
                        )}
                        <div>Payment Status: {course.paymentStatus}</div>
                        <div>Amount Paid: {formatCurrency(course.amountPaid)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No courses selected</p>
            )}
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Admission Fee</label>
                <p className="text-sm text-gray-900 mt-1">
                  {student.admissionFee ? formatCurrency(student.admissionFee) : 'Not specified'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Mode of Transaction</label>
                <p className="text-sm text-gray-900 mt-1">
                  {student.modeOfTransaction || 'Not specified'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Fee Status</label>
                <p className="text-sm text-gray-900 mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    student.feePaid 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {student.feePaid ? 'Paid' : 'Pending'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Registration Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Registration Info
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Registered By</label>
                <p className="text-sm text-gray-900 mt-1">
                  {student.registeredBy?.name || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Registration Date</label>
                <p className="text-sm text-gray-900 mt-1">{formatDate(student.registrationDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm text-gray-900 mt-1">{formatDate(student.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentView;
