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

  useEffect(() => {
    if (isEditing) {
      fetchStudent();
    }
  }, [id]);

  const fetchStudent = async () => {
    try {
      const response = await axios.get(`/api/students/${id}`);
      const studentData = response.data.student;
      setStudent(studentData);
      
      // Set form values
      Object.keys(studentData).forEach(key => {
        if (key !== 'educationalDetails' && key !== '_id' && key !== '__v') {
          setValue(key, studentData[key]);
        }
      });

      // Set educational details
      if (studentData.educationalDetails && studentData.educationalDetails.length > 0) {
        setEducationalDetails(studentData.educationalDetails);
      }
    } catch (error) {
      toast.error('Failed to load student data');
      navigate('/students');
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

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const formData = {
        ...data,
        educationalDetails,
        dateOfBirth: new Date(data.dateOfBirth).toISOString(),
        registrationDate: new Date().toISOString()
      };

      if (isEditing) {
        await axios.put(`/api/students/${id}`, formData);
        toast.success('Student updated successfully');
      } else {
        await axios.post('/api/students', formData);
        toast.success('Student registered successfully');
      }
      
      navigate('/students');
    } catch (error) {
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
        {/* Basic Registration Details */}
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Registration Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Camp Venue *</label>
                <input
                  type="text"
                  className={`input ${errors.campVenue ? 'border-red-500' : ''}`}
                  {...register('campVenue', { required: 'Camp venue is required' })}
                />
                {errors.campVenue && <p className="form-error">{errors.campVenue.message}</p>}
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
                <label className="form-label">Religion *</label>
                <input
                  type="text"
                  className={`input ${errors.religion ? 'border-red-500' : ''}`}
                  {...register('religion', { required: 'Religion is required' })}
                />
                {errors.religion && <p className="form-error">{errors.religion.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Caste *</label>
                <input
                  type="text"
                  className={`input ${errors.caste ? 'border-red-500' : ''}`}
                  {...register('caste', { required: 'Caste is required' })}
                />
                {errors.caste && <p className="form-error">{errors.caste.message}</p>}
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
                <label className="form-label">Parent Relation *</label>
                <input
                  type="text"
                  className={`input ${errors.parentRelation ? 'border-red-500' : ''}`}
                  {...register('parentRelation', { required: 'Parent relation is required' })}
                />
                {errors.parentRelation && <p className="form-error">{errors.parentRelation.message}</p>}
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

              <div className="form-group">
                <label className="form-label">Parent Address *</label>
                <textarea
                  className={`input ${errors.parentAddress ? 'border-red-500' : ''}`}
                  rows="3"
                  {...register('parentAddress', { required: 'Parent address is required' })}
                />
                {errors.parentAddress && <p className="form-error">{errors.parentAddress.message}</p>}
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
                <label className="form-label">Height (cm) *</label>
                <input
                  type="number"
                  step="0.1"
                  className={`input ${errors.height ? 'border-red-500' : ''}`}
                  {...register('height', { 
                    required: 'Height is required',
                    min: { value: 0, message: 'Height must be positive' }
                  })}
                />
                {errors.height && <p className="form-error">{errors.height.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  className={`input ${errors.weight ? 'border-red-500' : ''}`}
                  {...register('weight', { 
                    required: 'Weight is required',
                    min: { value: 0, message: 'Weight must be positive' }
                  })}
                />
                {errors.weight && <p className="form-error">{errors.weight.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Chest Unexpanded (cm) *</label>
                <input
                  type="number"
                  step="0.1"
                  className={`input ${errors.chestUnexpanded ? 'border-red-500' : ''}`}
                  {...register('chestUnexpanded', { 
                    required: 'Chest unexpanded is required',
                    min: { value: 0, message: 'Chest unexpanded must be positive' }
                  })}
                />
                {errors.chestUnexpanded && <p className="form-error">{errors.chestUnexpanded.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Chest Expanded (cm) *</label>
                <input
                  type="number"
                  step="0.1"
                  className={`input ${errors.chestExpanded ? 'border-red-500' : ''}`}
                  {...register('chestExpanded', { 
                    required: 'Chest expanded is required',
                    min: { value: 0, message: 'Chest expanded must be positive' }
                  })}
                />
                {errors.chestExpanded && <p className="form-error">{errors.chestExpanded.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Vision *</label>
                <input
                  type="text"
                  className={`input ${errors.vision ? 'border-red-500' : ''}`}
                  {...register('vision', { required: 'Vision is required' })}
                />
                {errors.vision && <p className="form-error">{errors.vision.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Blood Group *</label>
                <select
                  className={`input ${errors.bloodGroup ? 'border-red-500' : ''}`}
                  {...register('bloodGroup', { required: 'Blood group is required' })}
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
                {errors.bloodGroup && <p className="form-error">{errors.bloodGroup.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Office Use Only */}
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Office Use Only</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="input"
                  {...register('title')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Admission Number</label>
                <input
                  type="text"
                  className="input"
                  {...register('admissionNo')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Course Mode</label>
                <input
                  type="text"
                  className="input"
                  {...register('courseMode')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Course Fee (₹)</label>
                <input
                  type="number"
                  className="input"
                  {...register('courseFee', { min: 0 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Admission Fee (₹)</label>
                <input
                  type="number"
                  className="input"
                  {...register('admissionFee', { min: 0 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Physical Center</label>
                <input
                  type="text"
                  className="input"
                  {...register('physicalCenter')}
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
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    {...register('feePaid')}
                  />
                  <span className="ml-2 text-sm text-gray-700">Fee Paid</span>
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
