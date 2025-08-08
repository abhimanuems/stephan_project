# IIT Student Management System

A full-stack web application for managing student registrations, employee accounts, and comprehensive reporting for IIT institutions.

## 🚀 Features

### Authentication & Authorization
- **Role-based Access Control**: Super Admin, Admin, and Employee roles
- **JWT Authentication**: Secure token-based authentication
- **Protected Routes**: Role-specific access to features

### Student Management
- **Comprehensive Registration**: Complete student information capture
- **Educational Details**: Multiple education entries per student
- **Physical & Medical Details**: Height, weight, vision, blood group, etc.
- **Parent Information**: Complete parent/guardian details
- **Office Use Fields**: Fee management, admission details, transaction modes
- **Search & Filter**: Advanced search and pagination
- **CRUD Operations**: Create, read, update, delete students

### Employee Management (Superadmin Only)
- **Employee Accounts**: Create and manage employee accounts
- **Role Assignment**: Assign admin or employee roles
- **Status Management**: Activate/deactivate employee accounts
- **Performance Tracking**: Track employee registration counts

### Dashboard & Analytics
- **Statistics Overview**: Total students, employees, fee collection
- **Recent Activity**: Recent registrations and trends
- **Fee Analytics**: Course fees, admission fees, payment status
- **Employee Performance**: Top performing employees
- **Monthly Reports**: Registration and fee collection trends

### Technical Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Notifications**: Toast notifications for user feedback
- **Form Validation**: Client and server-side validation
- **Error Handling**: Comprehensive error management
- **Search & Pagination**: Efficient data handling

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **CORS**: Cross-origin resource sharing

### Frontend
- **Framework**: React.js 18
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📁 Project Structure

```
IIT/
├── backend/
│   ├── controllers/          # Request handlers
│   ├── middleware/           # Authentication & validation
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── scripts/             # Utility scripts
│   ├── server.js            # Main server file
│   ├── package.json         # Backend dependencies
│   └── README.md           # Backend documentation
├── frontend/
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context
│   │   ├── pages/          # Page components
│   │   ├── App.js          # Main app component
│   │   ├── index.js        # Entry point
│   │   └── index.css       # Global styles
│   ├── package.json        # Frontend dependencies
│   └── README.md          # Frontend documentation
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   Create a `.env` file in the backend directory:
   ```
   MONGODB_URI=mongodb://localhost:27017/iit_student_management
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
   PORT=5000
   NODE_ENV=development
   ```

4. **Create superadmin account**
   ```bash
   npm run create-superadmin
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🔐 Default Credentials

After running the superadmin creation script, you can login with:
- **Email**: `superadmin@iit.com`
- **Password**: `superadmin123`

**⚠️ Important**: Change the password after first login!

## 📊 Database Models

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

## 🔑 API Endpoints

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

## 👥 Role-based Access Control

### Super Admin
- ✅ Full access to all features
- ✅ Can manage employee accounts
- ✅ Can view all students and statistics
- ✅ Can delete students and employees
- ✅ Can toggle employee status

### Admin
- ✅ Can view all students
- ✅ Can register and update students
- ❌ Cannot manage employee accounts
- ❌ Cannot delete students

### Employee
- ✅ Can only view students they registered
- ✅ Can register new students
- ✅ Can update students they registered
- ❌ Cannot access employee management

## 🎨 UI/UX Features

### Responsive Design
- Mobile-first approach
- Collapsible sidebar for mobile
- Touch-friendly interface
- Responsive tables and forms

### Modern Interface
- Clean, professional design
- Consistent color scheme
- Intuitive navigation
- Loading states and animations

### User Experience
- Toast notifications
- Form validation feedback
- Search and filtering
- Pagination for large datasets

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcryptjs
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Environment variable management

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB (local or Atlas)
2. Configure environment variables
3. Install dependencies: `npm install`
4. Start server: `npm start`
5. Use PM2 for production: `pm2 start server.js`

### Frontend Deployment
1. Build the project: `npm run build`
2. Deploy `build/` folder to web server
3. Configure API URL in environment
4. Set up proper CORS headers

### Environment Variables

#### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/iit_student_management
JWT_SECRET=your_jwt_secret_key_here_change_in_production
PORT=5000
NODE_ENV=development
```

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in .env
   - Verify network connectivity

2. **CORS Errors**
   - Ensure backend CORS is configured
   - Check frontend proxy settings
   - Verify API URL configuration

3. **Authentication Issues**
   - Check JWT secret configuration
   - Verify token storage
   - Clear browser localStorage if needed

4. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

### Development Tips

1. **Backend Development**
   - Use `npm run dev` for auto-restart
   - Check server logs for errors
   - Use Postman for API testing

2. **Frontend Development**
   - Use React Developer Tools
   - Check browser console for errors
   - Test on different screen sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add proper error handling
5. Test thoroughly
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Check the documentation in `/backend/README.md` and `/frontend/README.md`
- Review the troubleshooting section
- Create an issue for bugs or feature requests

## 🎯 Roadmap

- [ ] Email notifications
- [ ] PDF report generation
- [ ] Bulk import/export
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Audit logging
- [ ] Backup and restore

---

**Built with ❤️ for IIT institutions**
