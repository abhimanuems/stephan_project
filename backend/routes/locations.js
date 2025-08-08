const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const locationController = require('../controllers/locationController');

// Superadmin only routes
router.post('/', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Superadmin only.' });
  }
  next();
}, locationController.createLocation);

router.get('/', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Superadmin only.' });
  }
  next();
}, locationController.getLocations);

router.get('/:id', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Superadmin only.' });
  }
  next();
}, locationController.getLocation);

router.put('/:id', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Superadmin only.' });
  }
  next();
}, locationController.updateLocation);

router.delete('/:id', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Superadmin only.' });
  }
  next();
}, locationController.deleteLocation);

router.patch('/:id/toggle-status', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Superadmin only.' });
  }
  next();
}, locationController.toggleLocationStatus);

// Public route for getting active locations (for attendance marking)
router.get('/active/locations', locationController.getActiveLocations);

module.exports = router;
