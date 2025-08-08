# IIT Student Management System - Backend

A Node.js backend API for the IIT Student Management System with role-based authentication and comprehensive student management features.

## Features

- **Role-based Authentication**: Super Admin, Admin, and Employee roles
- **Student Management**: Complete CRUD operations with detailed student information
- **Employee Management**: Super admin can manage employee accounts
- **Dashboard Analytics**: Comprehensive statistics and reporting
- **JWT Authentication**: Secure token-based authentication
- **MongoDB Integration**: Mongoose ODM for data persistence
- **Input Validation**: Express-validator for request validation
- **Error Handling**: Comprehensive error handling middleware

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **CORS**: Cross-origin resource sharing enabled

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory:
   ```
   MONGODB_URI=mongodb://localhost:27017/iit_student_management
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
   PORT=5000
   NODE_ENV=development
   ```

3. **Database Setup**
   - Install MongoDB locally or use MongoDB Atlas
   - Update the `MONGODB_URI` in your `.env` file

4. **Run the Server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (superadmin only)
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/change-password` - Change password

### Students
- `GET /api/students` - Get all students (with pagination and search)
- `GET /api/students/:id` - Get single student
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student (superadmin only)

### Employees
- `GET /api/employees` - Get all employees (superadmin only)
- `GET /api/employees/:id` - Get single employee
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `PATCH /api/employees/:id/toggle-status` - Toggle employee status

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Role-based Access Control

### Super Admin
- Full access to all features
- Can manage employee accounts
- Can view all students and statistics
- Can delete students and employees

### Admin
- Can view all students
- Can register and update students
- Cannot manage employee accounts
- Cannot delete students

### Employee
- Can only view students they registered
- Can register new students
- Can update students they registered
- Cannot access employee management

## Data Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (superadmin/admin/employee),
  isActive: Boolean,
  timestamps
}
```

### Student Model
```javascript
{
  // Basic Registration
  campVenue: String,
  registrationDate: Date,
  registrationNumber: String (auto-generated),
  
  // Personal Details
  name: String,
  age: Number,
  dateOfBirth: Date,
  religion: String,
  caste: String,
  
  // Contact Details
  address: String,
  contactNumber: String,
  
  // Parent Details
  parentName: String,
  parentRelation: String,
  parentMobileNumber: String,
  parentAddress: String,
  
  // Educational Details
  educationalDetails: [{
    course: String,
    university: String,
    percentage: String (optional)
  }],
  
  // Physical & Medical Details
  height: Number,
  weight: Number,
  chestUnexpanded: Number,
  chestExpanded: Number,
  vision: String,
  bloodGroup: String,
  
  // Office Use Only
  title: String,
  admissionNo: String,
  courseMode: String,
  courseFee: Number,
  admissionFee: Number,
  feePaid: Boolean,
  physicalCenter: String,
  modeOfTransaction: String,
  
  // Employee who registered
  registeredBy: ObjectId (ref: User),
  timestamps
}
```

## Error Handling

The API includes comprehensive error handling:
- Validation errors with detailed messages
- Authentication and authorization errors
- Database connection errors
- General server errors

## Security Features

- JWT token-based authentication
- Password hashing with bcryptjs
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Environment variable configuration

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### File Structure
```
backend/
├── controllers/     # Request handlers
├── middleware/      # Authentication and validation
├── models/         # Database models
├── routes/         # API routes
├── server.js       # Main server file
├── package.json    # Dependencies
└── README.md       # Documentation
```

## Production Deployment

1. Set `NODE_ENV=production` in environment variables
2. Use a strong JWT secret
3. Configure MongoDB Atlas or production MongoDB instance
4. Set up proper CORS configuration for your frontend domain
5. Use a process manager like PM2 for production deployment

## Contributing

1. Follow the existing code structure
2. Add proper validation for new endpoints
3. Include error handling
4. Update documentation for new features
5. Test thoroughly before submitting
