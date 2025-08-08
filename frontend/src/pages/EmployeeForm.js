import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const isEditing = !!id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm();

  useEffect(() => {
    if (isEditing) {
      fetchEmployee();
    }
  }, [id]);

  const fetchEmployee = async () => {
    try {
      const response = await axios.get(`/api/employees/${id}`);
      const employeeData = response.data.employee;
      setEmployee(employeeData);
      
      // Set form values
      Object.keys(employeeData).forEach(key => {
        if (key !== '_id' && key !== '__v' && key !== 'password') {
          setValue(key, employeeData[key]);
        }
      });
    } catch (error) {
      toast.error('Failed to load employee data');
      navigate('/employees');
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      if (isEditing) {
        await axios.put(`/api/employees/${id}`, data);
        toast.success('Employee updated successfully');
      } else {
        await axios.post('/api/employees', data);
        toast.success('Employee created successfully');
      }
      
      navigate('/employees');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save employee';
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
            onClick={() => navigate('/employees')}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Employee' : 'Add New Employee'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing ? 'Update employee information' : 'Create a new employee account'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Employee Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className={`input ${errors.name ? 'border-red-500' : ''}`}
                  {...register('name', { 
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                />
                {errors.name && <p className="form-error">{errors.name.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className={`input ${errors.email ? 'border-red-500' : ''}`}
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address'
                    }
                  })}
                />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Role *</label>
                <select
                  className={`input ${errors.role ? 'border-red-500' : ''}`}
                  {...register('role', { required: 'Role is required' })}
                >
                  <option value="">Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="employee">Employee</option>
                </select>
                {errors.role && <p className="form-error">{errors.role.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Salary</label>
                <input
                  type="number"
                  className={`input ${errors.salary ? 'border-red-500' : ''}`}
                  {...register('salary', { 
                    min: { value: 0, message: 'Salary must be positive' }
                  })}
                  placeholder="Enter salary amount"
                />
                {errors.salary && <p className="form-error">{errors.salary.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  className="input"
                  {...register('department')}
                  placeholder="Enter department"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Designation</label>
                <input
                  type="text"
                  className="input"
                  {...register('designation')}
                  placeholder="Enter designation"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  className="input"
                  {...register('phone')}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea
                  className="input"
                  rows={3}
                  {...register('address')}
                  placeholder="Enter address"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {isEditing ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    {...register('password', { 
                      required: isEditing ? false : 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="form-error">{errors.password.message}</p>}
              </div>

              {isEditing && (
                <div className="form-group">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      {...register('isActive')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Active Account</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/employees')}
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
            {isEditing ? 'Update Employee' : 'Create Employee'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;
