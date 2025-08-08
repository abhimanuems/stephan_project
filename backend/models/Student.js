const mongoose = require('mongoose');

const educationalDetailsSchema = new mongoose.Schema({
  course: {
    type: String,
    required: true,
    trim: true
  },
  university: {
    type: String,
    required: true,
    trim: true
  },
  percentage: {
    type: String,
    trim: true
  }
});

const studentSchema = new mongoose.Schema({
  // Basic Registration Details
  campVenue: {
    type: String,
    required: true,
    trim: true
  },
  registrationDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  registrationNumber: {
    type: String,
    unique: true,
    trim: true
  },
  
  // Personal Details
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  religion: {
    type: String,
    required: true,
    trim: true
  },
  caste: {
    type: String,
    required: true,
    trim: true
  },
  
  // Contact Details
  address: {
    type: String,
    required: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  // Parent Details
  parentName: {
    type: String,
    required: true,
    trim: true
  },
  parentRelation: {
    type: String,
    required: true,
    trim: true
  },
  parentMobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  parentAddress: {
    type: String,
    required: true,
    trim: true
  },
  
  // Educational Details
  educationalDetails: [educationalDetailsSchema],
  
  // Physical & Medical Details
  height: {
    type: Number,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  chestUnexpanded: {
    type: Number,
    required: true
  },
  chestExpanded: {
    type: Number,
    required: true
  },
  vision: {
    type: String,
    required: true,
    trim: true
  },
  bloodGroup: {
    type: String,
    required: true,
    trim: true
  },
  
  // Office Use Only
  title: {
    type: String,
    trim: true
  },
  admissionNo: {
    type: String,
    unique: true,
    trim: true
  },
  courseMode: {
    type: String,
    trim: true
  },
  courseFee: {
    type: Number,
    default: 0
  },
  admissionFee: {
    type: Number,
    default: 0
  },
  feePaid: {
    type: Boolean,
    default: false
  },
  physicalCenter: {
    type: String,
    trim: true
  },
  modeOfTransaction: {
    type: String,
    trim: true
  },
  
  // Employee who registered this student
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Generate registration number automatically
studentSchema.pre('save', async function(next) {
  if (this.isNew && !this.registrationNumber) {
    const count = await this.constructor.countDocuments();
    this.registrationNumber = `REG${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);
