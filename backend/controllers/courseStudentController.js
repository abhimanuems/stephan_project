const Student = require('../models/Student');
const Course = require('../models/Course');

// Get all students with selected courses and payment details
const getCourseStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, paymentStatus, courseId } = req.query;
    
    console.log('Get course students query:', { page, limit, paymentStatus, courseId });
    
    const query = {
      'selectedCourses.0': { $exists: true } // Students who have at least one course
    };

    if (paymentStatus) {
      query['selectedCourses.paymentStatus'] = paymentStatus;
    }

    if (courseId) {
      query['selectedCourses.courseId'] = courseId;
    }

    console.log('MongoDB query:', query);

    const students = await Student.find(query)
      .populate('selectedCourses.courseId', 'name description duration')
      .select('name contactNumber selectedCourses registrationNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Add the original courseId back to each selectedCourse for frontend compatibility
    students.forEach(student => {
      student.selectedCourses.forEach(course => {
        if (course.courseId && course.courseId._id) {
          course.originalCourseId = course.courseId._id;
        }
      });
    });

    console.log('Found students:', students.length);
    
    // Debug: Log first student's selectedCourses
    if (students.length > 0) {
      console.log('First student selectedCourses:', students[0].selectedCourses);
    }

    const total = await Student.countDocuments(query);

    res.json({
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get course students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get payment summary for a student
const getStudentPaymentSummary = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .populate('selectedCourses.courseId', 'name description duration')
      .select('name contactNumber selectedCourses registrationNumber');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Add the original courseId back to each selectedCourse for frontend compatibility
    student.selectedCourses.forEach(course => {
      if (course.courseId && course.courseId._id) {
        course.originalCourseId = course.courseId._id;
      }
    });

    const paymentSummary = {
      student: {
        name: student.name,
        contactNumber: student.contactNumber,
        registrationNumber: student.registrationNumber
      },
      courses: student.selectedCourses.map(course => ({
        courseName: course.courseName,
        totalAmount: course.totalAmount,
        amountPaid: course.amountPaid,
        pendingAmount: course.totalAmount - course.amountPaid,
        paymentStatus: course.paymentStatus,
        paymentMode: course.paymentMode,
        nextDueDate: course.nextDueDate,
        nextDueAmount: course.nextDueAmount,
        partialPaymentDetails: course.partialPaymentDetails
      })),
      totalPending: student.selectedCourses.reduce((sum, course) => 
        sum + (course.totalAmount - course.amountPaid), 0
      )
    };

    res.json(paymentSummary);
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update payment for a student's course
const updatePayment = async (req, res) => {
  try {
    const { studentId, courseId, amount, paymentMode } = req.body;
    
    console.log('Update payment request:', { studentId, courseId, amount, paymentMode, body: req.body });
    console.log('Type of courseId:', typeof courseId);
    console.log('courseId value:', courseId);

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    console.log('Student selectedCourses:', student.selectedCourses.map(c => ({
      courseId: c.courseId,
      originalCourseId: c.originalCourseId,
      courseIdType: typeof c.courseId,
      courseIdString: c.courseId.toString(),
      courseName: c.courseName
    })));
    
    const courseIndex = student.selectedCourses.findIndex(
      course => (course.originalCourseId || course.courseId).toString() === courseId.toString()
    );

    if (courseIndex === -1) {
      console.log('Course not found. courseId from request:', courseId);
      console.log('Available courseIds:', student.selectedCourses.map(c => (c.originalCourseId || c.courseId).toString()));
      return res.status(404).json({ message: 'Course not found for this student' });
    }

    const course = student.selectedCourses[courseIndex];
    const newAmountPaid = course.amountPaid + amount;
    const pendingAmount = course.totalAmount - newAmountPaid;

    // Update payment status
    let paymentStatus = 'Pending';
    if (newAmountPaid >= course.totalAmount) {
      paymentStatus = 'Completed';
    } else if (newAmountPaid > 0) {
      paymentStatus = 'Partial';
    }

         // Update course payment details
     student.selectedCourses[courseIndex].amountPaid = newAmountPaid;
     student.selectedCourses[courseIndex].paymentStatus = paymentStatus;

     // Add payment transaction record
     const transaction = {
       date: new Date(),
       amount: amount,
       paymentMode: req.body.transactionMode || 'Cash',
       reference: req.body.reference || '',
       notes: req.body.notes || '',
       recordedBy: req.user._id
     };

     console.log('Adding transaction:', transaction);

     if (!student.selectedCourses[courseIndex].paymentTransactions) {
       student.selectedCourses[courseIndex].paymentTransactions = [];
     }
     student.selectedCourses[courseIndex].paymentTransactions.push(transaction);

     // If Partial payment mode, update payment mode
     if (paymentMode === 'Partial') {
       student.selectedCourses[courseIndex].paymentMode = 'Partial';
     }

    await student.save();

    res.json({
      message: 'Payment updated successfully',
      paymentSummary: {
        amountPaid: newAmountPaid,
        pendingAmount,
        paymentStatus
      }
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark partial payment as paid
const markPartialPaid = async (req, res) => {
  try {
    const { studentId, courseId, partialIndex } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const courseIndex = student.selectedCourses.findIndex(
      course => (course.originalCourseId || course.courseId).toString() === courseId.toString()
    );

    if (courseIndex === -1) {
      return res.status(404).json({ message: 'Course not found for this student' });
    }

    const course = student.selectedCourses[courseIndex];
    if (!course.partialPaymentDetails || !course.partialPaymentDetails[partialIndex]) {
      return res.status(404).json({ message: 'Partial payment not found' });
    }

    // Mark partial payment as paid
    course.partialPaymentDetails[partialIndex].status = 'Paid';
    course.partialPaymentDetails[partialIndex].paidDate = new Date();

    // Update amount paid
    course.amountPaid += course.partialPaymentDetails[partialIndex].amount;

    // Update payment status
    if (course.amountPaid >= course.totalAmount) {
      course.paymentStatus = 'Completed';
    } else {
      course.paymentStatus = 'Partial';
    }

    // Find next due partial payment
    const nextPartial = course.partialPaymentDetails.find(partial => partial.status === 'Pending');
    if (nextPartial) {
      course.nextDueDate = nextPartial.dueDate;
      course.nextDueAmount = nextPartial.amount;
    } else {
      course.nextDueDate = null;
      course.nextDueAmount = null;
    }

    await student.save();

    res.json({
      message: 'Partial payment marked as paid successfully',
      nextDueDate: course.nextDueDate,
      nextDueAmount: course.nextDueAmount
    });
  } catch (error) {
    console.error('Mark partial payment paid error:', error);
    res.status(500).json({ message: 'Server error' });
     }
 };
 
 // Get transaction history for a student's course
 const getTransactionHistory = async (req, res) => {
   try {
     const { studentId, courseId } = req.params;
     
     console.log('Getting transaction history for:', { studentId, courseId });
 
         const student = await Student.findById(studentId)
      .populate('selectedCourses.courseId', 'name description duration')
      .populate('selectedCourses.paymentTransactions.recordedBy', 'name')
      .select('name selectedCourses');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Add the original courseId back to each selectedCourse for frontend compatibility
    student.selectedCourses.forEach(course => {
      if (course.courseId && course.courseId._id) {
        course.originalCourseId = course.courseId._id;
      }
    });
 
         const course = student.selectedCourses.find(
      course => (course.originalCourseId || course.courseId).toString() === courseId.toString()
    );
 
     if (!course) {
       return res.status(404).json({ message: 'Course not found for this student' });
     }
 
          const transactionHistory = {
       studentName: student.name,
       courseName: course.courseName,
       totalAmount: course.totalAmount,
       amountPaid: course.amountPaid,
       pendingAmount: course.totalAmount - course.amountPaid,
       paymentStatus: course.paymentStatus,
       paymentMode: course.paymentMode,
       transactions: course.paymentTransactions || [],
       partialPaymentDetails: course.partialPaymentDetails || []
     };

     console.log('Transaction history:', transactionHistory);

     res.json(transactionHistory);
   } catch (error) {
     console.error('Get transaction history error:', error);
     res.status(500).json({ message: 'Server error' });
   }
 };
 
 module.exports = {
   getCourseStudents,
   getStudentPaymentSummary,
   updatePayment,
   markPartialPaid,
   getTransactionHistory
 };
