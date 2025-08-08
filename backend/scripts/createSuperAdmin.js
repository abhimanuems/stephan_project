const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iit_student_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('Superadmin already exists:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Create superadmin
    const superAdmin = new User({
      name: 'Super Admin',
      email: 'superadmin@iit.com',
      password: 'superadmin123',
      role: 'superadmin',
      isActive: true
    });

    await superAdmin.save();

    console.log('Superadmin created successfully!');
    console.log('Email: superadmin@iit.com');
    console.log('Password: superadmin123');
    console.log('Please change the password after first login.');

    process.exit(0);
  } catch (error) {
    console.error('Error creating superadmin:', error);
    process.exit(1);
  }
};

createSuperAdmin();
