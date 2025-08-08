const Location = require('../models/Location');

// Create new location (Superadmin only)
const createLocation = async (req, res) => {
  try {
    const { name, address, latitude, longitude, radius } = req.body;

    // Validate input
    if (!name || !address || !latitude || !longitude) {
      return res.status(400).json({ message: 'Name, address, latitude, and longitude are required' });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ message: 'Invalid latitude value' });
    }
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: 'Invalid longitude value' });
    }

    const location = new Location({
      name,
      address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius: radius || 100,
      createdBy: req.user._id
    });

    await location.save();

    res.status(201).json({
      message: 'Location created successfully',
      location
    });
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all locations
const getLocations = async (req, res) => {
  try {
    const { page = 1, limit = 10, active } = req.query;
    
    const query = {};
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const locations = await Location.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Location.countDocuments(query);

    res.json({
      locations,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single location
const getLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json(location);
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update location
const updateLocation = async (req, res) => {
  try {
    const { name, address, latitude, longitude, radius, isActive } = req.body;

    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Validate coordinates if provided
    if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
      return res.status(400).json({ message: 'Invalid latitude value' });
    }
    if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
      return res.status(400).json({ message: 'Invalid longitude value' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (radius !== undefined) updateData.radius = radius;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedLocation = await Location.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('createdBy', 'name email');

    res.json({
      message: 'Location updated successfully',
      location: updatedLocation
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete location
const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    await Location.findByIdAndDelete(req.params.id);

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle location status
const toggleLocationStatus = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    location.isActive = !location.isActive;
    await location.save();

    res.json({
      message: `Location ${location.isActive ? 'activated' : 'deactivated'} successfully`,
      location
    });
  } catch (error) {
    console.error('Toggle location status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get active locations for attendance
const getActiveLocations = async (req, res) => {
  try {
    const locations = await Location.find({ isActive: true })
      .select('name address latitude longitude radius');

    res.json(locations);
  } catch (error) {
    console.error('Get active locations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createLocation,
  getLocations,
  getLocation,
  updateLocation,
  deleteLocation,
  toggleLocationStatus,
  getActiveLocations
};
