import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { MapPin, Plus, Edit, Trash2, Eye, EyeOff, Save, X, Map } from 'lucide-react';
import toast from 'react-hot-toast';
import LocationMap from '../components/LocationMap';

const LocationManagement = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    radius: 100
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/locations');
      setLocations(response.data.locations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.latitude || !formData.longitude) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      if (editingLocation) {
        await axios.put(`/api/locations/${editingLocation._id}`, formData);
        toast.success('Location updated successfully');
      } else {
        await axios.post('/api/locations', formData);
        toast.success('Location created successfully');
      }
      
      setShowForm(false);
      setEditingLocation(null);
      resetForm();
      setShowMap(false);
      fetchLocations();
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error(error.response?.data?.message || 'Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      radius: location.radius
    });
    setSelectedLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address
    });
    setShowForm(true);
  };

  const handleDelete = async (locationId) => {
    if (!window.confirm('Are you sure you want to delete this location?')) {
      return;
    }

    try {
      await axios.delete(`/api/locations/${locationId}`);
      toast.success('Location deleted successfully');
      fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    }
  };

  const handleToggleStatus = async (locationId) => {
    try {
      await axios.patch(`/api/locations/${locationId}/toggle-status`);
      toast.success('Location status updated');
      fetchLocations();
    } catch (error) {
      console.error('Error toggling location status:', error);
      toast.error('Failed to update location status');
    }
  };


  const handleCancel = () => {
    setShowForm(false);
    setEditingLocation(null);
    resetForm();
    setSelectedLocation(null);
    setShowMap(false);
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setFormData({
      ...formData,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      address: location.address
    });
    setGettingLocation(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      radius: 100
    });
    setSelectedLocation(null);
    setGettingLocation(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Location Management</h1>
        <p className="text-gray-600">Manage attendance locations for employees</p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Location
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingLocation ? 'Edit Location' : 'Add New Location'}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., Main Office"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Radius (meters)
                  </label>
                  <input
                    type="number"
                    value={formData.radius}
                    onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) })}
                    className="input w-full"
                    min="10"
                    max="1000"
                  />
                </div>
              </div>

              {/* Map Section */}
              <div className="space-y-4">
                                 <div className="flex items-center justify-between">
                   <label className="block text-sm font-medium text-gray-700">
                     Select Location on Map *
                   </label>
                   <div className="flex gap-2">
                     <button
                       type="button"
                       onClick={() => {
                         setGettingLocation(true);
                         if (navigator.geolocation) {
                           navigator.geolocation.getCurrentPosition(
                             async (position) => {
                               const { latitude, longitude } = position.coords;
                               try {
                                 const response = await fetch(
                                   `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                                 );
                                 const data = await response.json();
                                 const address = data.display_name || `${latitude}, ${longitude}`;
                                 handleLocationSelect({
                                   latitude: latitude,
                                   longitude: longitude,
                                   address: address
                                 });
                               } catch (error) {
                                 console.error('Error getting address:', error);
                                 handleLocationSelect({
                                   latitude: latitude,
                                   longitude: longitude,
                                   address: `${latitude}, ${longitude}`
                                 });
                               }
                             },
                             (error) => {
                               console.log('Error getting location:', error);
                               setGettingLocation(false);
                               toast.error('Failed to get current location');
                             }
                           );
                         }
                       }}
                       disabled={gettingLocation}
                       className="btn btn-secondary flex items-center gap-2"
                     >
                       <MapPin className="h-4 w-4" />
                       {gettingLocation ? 'Getting Location...' : 'Use Current Location'}
                     </button>
                     <button
                       type="button"
                       onClick={() => setShowMap(!showMap)}
                       className="btn btn-secondary flex items-center gap-2"
                     >
                       <Map className="h-4 w-4" />
                       {showMap ? 'Hide Map' : 'Show Map'}
                     </button>
                   </div>
                 </div>

                                 {showMap && (
                   <div className="mb-4">
                     <LocationMap
                       selectedLocation={selectedLocation}
                       onLocationSelect={handleLocationSelect}
                       height="400px"
                     />
                     <div className="mt-2">
                       {gettingLocation ? (
                         <div className="flex items-center gap-2 text-sm text-blue-600">
                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                           Getting your current location...
                         </div>
                       ) : selectedLocation ? (
                         <div className="flex items-center gap-2 text-sm text-green-600">
                           <MapPin className="h-4 w-4" />
                           Location selected: {selectedLocation.address}
                         </div>
                       ) : (
                         <p className="text-sm text-gray-600">
                           Click on the map to select a location. The coordinates and address will be automatically filled.
                         </p>
                       )}
                     </div>
                   </div>
                 )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="input w-full"
                      placeholder="e.g., 123 Main St, City"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="input w-full"
                      placeholder="e.g., 40.7128"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="input w-full"
                      placeholder="e.g., -74.0060"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : (editingLocation ? 'Update Location' : 'Add Location')}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Locations List */}
      <div className="card">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Locations</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : locations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No locations found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coordinates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Radius
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locations.map((location) => (
                    <tr key={location._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{location.name}</div>
                          <div className="text-sm text-gray-500">{location.address}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {location.radius}m
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          location.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {location.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(location)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(location._id)}
                            className={`${
                              location.isActive 
                                ? 'text-orange-600 hover:text-orange-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {location.isActive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(location._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationManagement;
