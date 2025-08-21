import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, Plus, X, ArrowLeft } from 'lucide-react';

const StudentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const isEditing = !!id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm();

  const [educationalDetails, setEducationalDetails] = useState([
    { course: '', university: '', percentage: '' }
  ]);
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);

  useEffect(() => {
    if (isEditing) {
      fetchStudent();
    }
    fetchCourses();
  }, [id]);

  useEffect(() => {
    console.log('Selected courses changed:', selectedCourses);
  }, [selectedCourses]);

  // When courses are loaded and we have selected courses, ensure course details are populated
  useEffect(() => {
    if (courses.length > 0 && selectedCourses.length > 0) {
      const updatedCourses = selectedCourses.map(course => {
        if (course.courseId && (!course.courseName || !course.duration)) {
          const foundCourse = courses.find(c => c._id === course.courseId);
          if (foundCourse) {
            return {
              ...course,
              courseName: foundCourse.name,
              courseFee: foundCourse.courseFee,
              duration: foundCourse.duration,
              totalAmount: foundCourse.courseFee
            };
          }
        }
        return course;
      });
      
      if (JSON.stringify(updatedCourses) !== JSON.stringify(selectedCourses)) {
        console.log('Updating selected courses with course details:', updatedCourses);
        setSelectedCourses(updatedCourses);
      }
    }
  }, [courses, selectedCourses]);

  const fetchStudent = async () => {
    try {
      const response = await axios.get(`/api/students/${id}`);
      const studentData = response.data.student;
      console.log('Fetched student data:', studentData);
      setStudent(studentData);
      
      // Set form values
      Object.keys(studentData).forEach(key => {
        if (key !== 'educationalDetails' && key !== 'selectedCourses' && key !== '_id' && key !== '__v') {
          setValue(key, studentData[key]);
        }
      });

      // Set educational details
      if (studentData.educationalDetails && studentData.educationalDetails.length > 0) {
        console.log('Setting educational details:', studentData.educationalDetails);
        setEducationalDetails(studentData.educationalDetails);
      }

      // Set selected courses
      if (studentData.selectedCourses && studentData.selectedCourses.length > 0) {
        console.log('Setting selected courses:', studentData.selectedCourses);
        setSelectedCourses(studentData.selectedCourses);
      } else {
        // If no courses exist, add one empty course form
        console.log('No selected courses found, adding empty course form');
        setSelectedCourses([{
          courseId: '',
          courseName: '',
          courseFee: 0,
          duration: '',
          paymentMode: 'Full',
          totalAmount: 0,
          amountPaid: 0
        }]);
      }
    } catch (error) {
      console.error('Fetch student error:', error);
      toast.error('Failed to load student data');
      navigate('/students');
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/courses/active/list');
      console.log('Fetched courses:', response.data);
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const addEducationalDetail = () => {
    setEducationalDetails([...educationalDetails, { course: '', university: '', percentage: '' }]);
  };

  const removeEducationalDetail = (index) => {
    if (educationalDetails.length > 1) {
      setEducationalDetails(educationalDetails.filter((_, i) => i !== index));
    }
  };

  const updateEducationalDetail = (index, field, value) => {
    const updated = [...educationalDetails];
    updated[index][field] = value;
    setEducationalDetails(updated);
  };

  const addSelectedCourse = () => {
    const newCourse = {
      courseId: '',
      courseName: '',
      courseFee: 0,
      duration: '',
      paymentMode: 'Full',
      totalAmount: 0,
      amountPaid: 0,
      paymentStatus: 'Pending',
      partialPaymentAmount: 0
    };
    console.log('Adding new course:', newCourse);
    setSelectedCourses([...selectedCourses, newCourse]);
  };

  const removeSelectedCourse = (index) => {
    const updated = selectedCourses.filter((_, i) => i !== index);
    console.log('Removing course at index', index, 'Updated courses:', updated);
    setSelectedCourses(updated);
  };

  const updateSelectedCourse = (index, field, value) => {
    const updated = [...selectedCourses];
    updated[index][field] = value;
    
    // If course is selected, update course details
    if (field === 'courseId' && value) {
      const selectedCourse = courses.find(course => course._id === value);
      if (selectedCourse) {
        updated[index].courseName = selectedCourse.name;
        updated[index].courseFee = selectedCourse.courseFee;
        updated[index].duration = selectedCourse.duration;
        updated[index].totalAmount = selectedCourse.courseFee;
        console.log('Updated course details for course', index, ':', updated[index]);
      }
    }
    
    // If payment mode changes to Full, automatically set amount paid to total amount
    if (field === 'paymentMode' && value === 'Full') {
      updated[index].amountPaid = updated[index].totalAmount || 0;
      updated[index].partialPaymentAmount = 0;
    }
    
    // If payment mode changes to Partial, set amount paid to partial payment amount
    if (field === 'paymentMode' && value === 'Partial') {
      updated[index].amountPaid = updated[index].partialPaymentAmount || 0;
    }
    
    // If partial payment amount changes, update amount paid accordingly
    if (field === 'partialPaymentAmount' && updated[index].paymentMode === 'Partial') {
      updated[index].amountPaid = value || 0;
    }
    
    // Ensure all required fields exist for the course
    if (!updated[index].paymentMode) {
      updated[index].paymentMode = 'Full';
    }
    if (!updated[index].totalAmount) {
      updated[index].totalAmount = updated[index].courseFee || 0;
    }
    if (!updated[index].amountPaid) {
      updated[index].amountPaid = 0;
    }
    if (!updated[index].paymentStatus) {
      updated[index].paymentStatus = 'Pending';
    }
    
    // Log the updated course for debugging
    console.log('Course updated at index', index, ':', updated[index]);
    
    console.log('Updated course at index', index, 'field', field, 'to', value, 'Updated course:', updated[index]);
    setSelectedCourses(updated);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Validate that at least one course is selected
      if (selectedCourses.length === 0) {
        toast.error('Please select at least one course');
        return;
      }

   

             // Clean up empty optional fields
       const cleanData = { ...data };
       ['height', 'weight', 'chestUnexpanded', 'chestExpanded', 'religion', 'caste'].forEach(field => {
         if (cleanData[field] === '') {
           cleanData[field] = undefined;
         }
       });

       const formData = {
         ...cleanData,
         educationalDetails,
         selectedCourses: selectedCourses.map(course => {
           // For full payment mode, automatically set amount paid to total amount
           // For partial payment mode, amount paid equals partial payment amount
           const amountPaid = course.paymentMode === 'Full' 
             ? course.totalAmount 
             : (course.partialPaymentAmount || 0);
           
           return {
             courseId: course.courseId,
             courseName: course.courseName,
             courseFee: course.courseFee,
             duration: course.duration,
             paymentMode: course.paymentMode,
             totalAmount: course.totalAmount,
             amountPaid: amountPaid,
             paymentStatus: isEditing ? (course.paymentStatus || 'Pending') : 'Pending',
             partialPaymentAmount: course.partialPaymentAmount || 0
           };
         }),
         dateOfBirth: new Date(data.dateOfBirth).toISOString(),
         registrationDate: isEditing ? student.registrationDate : new Date().toISOString()
       };

      // Validate payment requirements for new registrations
      if (!isEditing) {
        const invalidPayments = selectedCourses.filter(course => {
          if (course.paymentMode === 'Partial') {
            // For partial payment, check if partial amount and due date are provided
            return !course.partialPaymentAmount || course.partialPaymentAmount <= 0
          } else if (course.paymentMode === 'Full') {
            // For full payment, check if full amount is paid
            return course.amountPaid < course.totalAmount;
          }
          return false;
        });

        if (invalidPayments.length > 0) {
          const courseNames = invalidPayments.map(c => c.courseName || 'Unknown Course').join(', ');
          toast.error(`Please complete payment details for: ${courseNames}`);
          return;
        }
      }

      // When editing, preserve any existing fields that might not be in the form
      if (isEditing && student) {
        // Preserve fields that are not part of the form but exist in the database
        const fieldsToPreserve = ['_id', '__v', 'createdAt', 'updatedAt', 'registeredBy'];
        fieldsToPreserve.forEach(field => {
          if (student[field] !== undefined) {
            formData[field] = student[field];
          }
        });
      }

      console.log('Submitting form data:', formData);

      if (isEditing) {
        const response = await axios.put(`/api/students/${id}`, formData);
        console.log('Update response:', response.data);
        toast.success('Student updated successfully');
      } else {
        const response = await axios.post('/api/students', formData);
        console.log('Create response:', response.data);
        toast.success('Student registered successfully');
      }
      
      navigate('/students');
    } catch (error) {
      console.error('Form submission error:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.message || 'Failed to save student';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/students')}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Student' : 'Register New Student'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing ? 'Update student information' : 'Add a new student to the system'}
            </p>
          </div>
        </div>
      </div>

             <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
         {/* Office Use Only - Moved to top */}
         <div className="card">
           <div className="p-6">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Office Use Only</h3>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="form-group">
                 <label className="form-label">Physical Center *</label>
                 <input
                   type="text"
                   className={`input ${errors.campVenue ? 'border-red-500' : ''}`}
                   {...register('campVenue', { required: 'Physical center is required' })}
                 />
                 {errors.campVenue && <p className="form-error">{errors.campVenue.message}</p>}
               </div>

               <div className="form-group">
                 <label className="form-label">Admission Number</label>
                 <input
                   type="text"
                   className="input"
                   {...register('admissionNo')}
                   placeholder="Enter admission number"
                 />
               </div>

               <div className="form-group">
                 <label className="form-label">Course Mode</label>
                 <select
                   className="input"
                   {...register('courseMode')}
                   defaultValue="Offline"
                 >
                   <option value="Offline">Offline</option>
                   <option value="Online">Online</option>
                 </select>
               </div>

               <div className="form-group">
                 <label className="form-label">Registration Date</label>
                 <input
                   type="date"
                   className="input"
                   defaultValue={new Date().toISOString().split('T')[0]}
                   disabled
                 />
               </div>
             </div>
           </div>
         </div>

         {/* Personal Details */}
         <div className="card">
           <div className="p-6">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="form-group">
                 <label className="form-label">Full Name *</label>
                 <input
                   type="text"
                   className={`input ${errors.name ? 'border-red-500' : ''}`}
                   {...register('name', { required: 'Name is required' })}
                 />
                 {errors.name && <p className="form-error">{errors.name.message}</p>}
               </div>

               <div className="form-group">
                 <label className="form-label">Age *</label>
                 <input
                   type="number"
                   className={`input ${errors.age ? 'border-red-500' : ''}`}
                   {...register('age', { 
                     required: 'Age is required',
                     min: { value: 1, message: 'Age must be at least 1' },
                     max: { value: 120, message: 'Age must be less than 120' }
                   })}
                 />
                 {errors.age && <p className="form-error">{errors.age.message}</p>}
               </div>

               <div className="form-group">
                 <label className="form-label">Date of Birth *</label>
                 <input
                   type="date"
                   className={`input ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                   {...register('dateOfBirth', { required: 'Date of birth is required' })}
                 />
                 {errors.dateOfBirth && <p className="form-error">{errors.dateOfBirth.message}</p>}
               </div>

               <div className="form-group">
                 <label className="form-label">Religion</label>
                 <input
                   type="text"
                   className="input"
                   {...register('religion')}
                 />
               </div>

               <div className="form-group">
                 <label className="form-label">Caste</label>
                 <input
                   type="text"
                   className="input"
                   {...register('caste')}
                 />
               </div>
             </div>
           </div>
         </div>

        {/* Contact Details */}
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Address *</label>
                <textarea
                  className={`input ${errors.address ? 'border-red-500' : ''}`}
                  rows="3"
                  {...register('address', { required: 'Address is required' })}
                />
                {errors.address && <p className="form-error">{errors.address.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Contact Number *</label>
                <input
                  type="tel"
                  className={`input ${errors.contactNumber ? 'border-red-500' : ''}`}
                  {...register('contactNumber', { required: 'Contact number is required' })}
                />
                {errors.contactNumber && <p className="form-error">{errors.contactNumber.message}</p>}
              </div>
            </div>
          </div>
        </div>

                 {/* Parent Details */}
         <div className="card">
           <div className="p-6">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Parent Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="form-group">
                 <label className="form-label">Parent Name *</label>
                 <input
                   type="text"
                   className={`input ${errors.parentName ? 'border-red-500' : ''}`}
                   {...register('parentName', { required: 'Parent name is required' })}
                 />
                 {errors.parentName && <p className="form-error">{errors.parentName.message}</p>}
               </div>

               <div className="form-group">
                 <label className="form-label">Parent Mobile Number *</label>
                 <input
                   type="tel"
                   className={`input ${errors.parentMobileNumber ? 'border-red-500' : ''}`}
                   {...register('parentMobileNumber', { required: 'Parent mobile number is required' })}
                 />
                 {errors.parentMobileNumber && <p className="form-error">{errors.parentMobileNumber.message}</p>}
               </div>
             </div>
           </div>
         </div>

        {/* Educational Details */}
        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Educational Details</h3>
              <button
                type="button"
                onClick={addEducationalDetail}
                className="btn btn-secondary inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Education
              </button>
            </div>
            
            {educationalDetails.map((detail, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Education #{index + 1}</h4>
                  {educationalDetails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEducationalDetail(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                     <div className="form-group">
                     <label className="form-label">Course *</label>
                     <input
                       type="text"
                       className="input"
                       value={detail.course}
                       onChange={(e) => updateEducationalDetail(index, 'course', e.target.value)}
                       placeholder="Enter course name"
                       required
                     />
                   </div>
                  
                  <div className="form-group">
                    <label className="form-label">University/School *</label>
                    <input
                      type="text"
                      className="input"
                      value={detail.university}
                      onChange={(e) => updateEducationalDetail(index, 'university', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Percentage/Grade</label>
                    <input
                      type="text"
                      className="input"
                      value={detail.percentage}
                      onChange={(e) => updateEducationalDetail(index, 'percentage', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

                 {/* Physical & Medical Details */}
         <div className="card">
           <div className="p-6">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Physical & Medical Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="form-group">
                 <label className="form-label">Height (cm)</label>
                 <input
                   type="number"
                   step="0.1"
                   className="input"
                   {...register('height', { 
                     min: { value: 0, message: 'Height must be positive' }
                   })}
                 />
               </div>

               <div className="form-group">
                 <label className="form-label">Weight (kg)</label>
                 <input
                   type="number"
                   step="0.1"
                   className="input"
                   {...register('weight', { 
                     min: { value: 0, message: 'Weight must be positive' }
                   })}
                 />
               </div>

               <div className="form-group">
                 <label className="form-label">Chest Unexpanded (cm)</label>
                 <input
                   type="number"
                   step="0.1"
                   className="input"
                   {...register('chestUnexpanded', { 
                     min: { value: 0, message: 'Chest unexpanded must be positive' }
                   })}
                 />
               </div>

               <div className="form-group">
                 <label className="form-label">Chest Expanded (cm)</label>
                 <input
                   type="number"
                   step="0.1"
                   className="input"
                   {...register('chestExpanded', { 
                     min: { value: 0, message: 'Chest expanded must be positive' }
                   })}
                 />
               </div>

               <div className="form-group">
                 <label className="form-label">Vision</label>
                 <input
                   type="text"
                   className="input"
                   {...register('vision')}
                 />
               </div>

               <div className="form-group">
                 <label className="form-label">Blood Group</label>
                 <select
                   className="input"
                   {...register('bloodGroup')}
                 >
                   <option value="">Select Blood Group</option>
                   <option value="A+">A+</option>
                   <option value="A-">A-</option>
                   <option value="B+">B+</option>
                   <option value="B-">B-</option>
                   <option value="AB+">AB+</option>
                   <option value="AB-">AB-</option>
                   <option value="O+">O+</option>
                   <option value="O-">O-</option>
                 </select>
               </div>
             </div>
           </div>
         </div>

                 {/* Course Selection Section */}
         <div className="card">
           <div className="p-6">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Course Selection</h3>
             
             {/* Selected Courses Display */}
             <div className="space-y-3 mb-4">
               {selectedCourses.length === 0 ? (
                 <div className="text-center py-4 text-gray-500">
                   No courses selected yet
                 </div>
               ) : (
                 selectedCourses.map((course, index) => (
                   <div key={index} className="border border-gray-200 rounded-lg p-3">
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-sm font-medium text-gray-700">
                         {course.courseName || 'No course selected'} - ₹{course.courseFee || 0}
                       </span>
                       <button
                         type="button"
                         onClick={() => removeSelectedCourse(index)}
                         className="text-red-600 hover:text-red-800"
                       >
                         <X className="h-4 w-4" />
                       </button>
                     </div>
                     {course.courseName && (
                       <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                         <span>Duration: {course.duration}</span>
                         <span>Payment Mode: {course.paymentMode}</span>
                       </div>
                     )}
                   </div>
                 ))
               )}
               
               <button
                 type="button"
                 onClick={addSelectedCourse}
                 className="btn btn-secondary inline-flex items-center gap-2 w-full"
               >
                 <Plus className="h-4 w-4" />
                 Add Course
               </button>
             </div>

             {/* Course Selection Forms */}
             {selectedCourses.map((course, index) => (
               <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                 <h5 className="text-md font-medium mb-3">Course {index + 1}</h5>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="form-group">
                     <label className="form-label">Select Course *</label>
                     <select
                       className="input"
                       value={course.courseId || ''}
                       onChange={(e) => updateSelectedCourse(index, 'courseId', e.target.value)}
                       required
                     >
                       <option value="">Choose a course</option>
                       {courses.map((c) => (
                         <option key={c._id} value={c._id}>
                           {c.name} - ₹{c.courseFee} ({c.duration})
                         </option>
                       ))}
                     </select>
                   </div>
                   
                   <div className="form-group">
                     <label className="form-label">Payment Mode</label>
                     <select
                       className="input"
                       value={course.paymentMode || 'Full'}
                       onChange={(e) => updateSelectedCourse(index, 'paymentMode', e.target.value)}
                     >
                       <option value="Full">Full Payment</option>
                       <option value="Partial">Partial Payment</option>
                     </select>
                   </div>
                 </div>
                 
                 {course.courseId && (
                   <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div>
                         <span className="font-medium">Course:</span> {course.courseName}
                       </div>
                       <div>
                         <span className="font-medium">Duration:</span> {course.duration}
                       </div>
                       <div>
                         <span className="font-medium">Total Fee:</span> ₹{course.totalAmount}
                       </div>
                       <div>
                         <span className="font-medium">Payment Mode:</span> {course.paymentMode}
                       </div>
                     </div>
                     
                     <div className="mt-3 pt-3 border-t border-gray-200">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {course.paymentMode === 'Partial' && (
                           <div className="form-group">
                             <label className="form-label text-sm">Partial Payment Amount (₹)</label>
                             <input
                               type="number"
                               className="input text-sm"
                               value={course.partialPaymentAmount || ''}
                               onChange={(e) => updateSelectedCourse(index, 'partialPaymentAmount', parseFloat(e.target.value) || 0)}
                               placeholder="Enter partial payment amount"
                               min="0"
                               max={course.totalAmount || 0}
                             />
                           </div>
                         )}
                       </div>
                       
                       {course.paymentMode === 'Full' && (
                         <div className="mt-2 text-xs text-gray-600 bg-green-50 p-2 rounded">
                           <span className="font-medium text-green-800">Full Payment Mode:</span> Amount paid automatically set to ₹{course.totalAmount}
                         </div>
                       )}
                       
                       {course.paymentMode === 'Partial' && course.partialPaymentAmount > 0 && (
                         <div className="mt-2 text-xs text-gray-600">
                           <span className="font-medium">Remaining Amount:</span> ₹{course.totalAmount - course.partialPaymentAmount}
                         </div>
                       )}
                     </div>
                   </div>
                 )}
               </div>
             ))}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
               <div className="form-group">
                 <label className="form-label">Admission Fee (₹)</label>
                 <input
                   type="number"
                   className="input"
                   {...register('admissionFee', { min: 0 })}
                 />
               </div>

               <div className="form-group">
                 <label className="form-label">Mode of Transaction</label>
                 <select className="input" {...register('modeOfTransaction')}>
                   <option value="">Select Mode</option>
                   <option value="Cash">Cash</option>
                   <option value="Card">Card</option>
                   <option value="UPI">UPI</option>
                   <option value="Bank Transfer">Bank Transfer</option>
                 </select>
               </div>

               <div className="form-group">
                 <label className="text-sm text-gray-600">
                   Note: Course fees are managed separately in the course selection above
                 </label>
               </div>
             </div>
           </div>
         </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/students')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEditing ? 'Update Student' : 'Register Student'}
          </button>
        </div>
      </form>
    </div>
  );
};


export default StudentForm;
