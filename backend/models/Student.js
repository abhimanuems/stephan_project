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
     trim: true
   },
   caste: {
     type: String,
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
   parentMobileNumber: {
     type: String,
     required: true,
     trim: true
   },
  
  // Educational Details
  educationalDetails: [educationalDetailsSchema],
  
     // Physical & Medical Details
   height: {
     type: Number
   },
   weight: {
     type: Number
   },
   chestUnexpanded: {
     type: Number
   },
   chestExpanded: {
     type: Number
   },
   vision: {
     type: String,
     trim: true
   },
   bloodGroup: {
     type: String,
     trim: true
   },
  
       // Office Use Only
   admissionNo: {
     type: String,
     unique: true,
     trim: true
   },
  selectedCourses: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    courseName: {
      type: String,
      required: true
    },
    courseFee: {
      type: Number,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Partial', 'Completed'],
      default: 'Pending'
    },
    totalAmount: {
      type: Number,
      required: true
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    paymentMode: {
      type: String,
      enum: ['Full', 'Partial'],
      default: 'Full'
    },
    partialPaymentAmount: {
      type: Number,
      default: 0
    },
    partialDueDate: {
      type: Date
    },
    partialPaymentDetails: [{
      dueDate: {
        type: Date,
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      status: {
        type: String,
        enum: ['Pending', 'Paid', 'Overdue'],
        default: 'Pending'
      },
      paidDate: {
        type: Date
      }
    }],
     paymentTransactions: [{
       date: {
         type: Date,
         required: true,
         default: Date.now
       },
       amount: {
         type: Number,
         required: true
       },
       paymentMode: {
         type: String,
         enum: ['Cash', 'Card', 'UPI', 'Bank Transfer'],
         required: true
       },
       reference: {
         type: String,
         trim: true
       },
       notes: {
         type: String,
         trim: true
       },
       recordedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: true
       }
     }],
    nextDueDate: {
      type: Date
    },
    nextDueAmount: {
      type: Number
    }
  }],
     courseMode: {
     type: String,
     trim: true
   },
   admissionFee: {
     type: Number,
     default: 0
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
