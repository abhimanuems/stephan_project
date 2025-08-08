# IIT Student Management System - Frontend

A modern React.js frontend for the IIT Student Management System with role-based authentication, responsive design, and comprehensive student and employee management features.

## Features

- **Role-based Authentication**: Super Admin, Admin, and Employee roles with different access levels
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Student Management**: Complete CRUD operations with detailed forms
- **Employee Management**: Super admin can manage employee accounts
- **Dashboard Analytics**: Comprehensive statistics and reporting
- **Modern UI/UX**: Beautiful, intuitive interface with toast notifications
- **Form Validation**: Client-side validation with react-hook-form
- **Search & Pagination**: Advanced filtering and pagination for large datasets

## Tech Stack

- **Framework**: React.js 18
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Build Tool**: Create React App

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Layout.js          # Main layout with sidebar
│   │   └── ProtectedRoute.js  # Route protection component
│   ├── context/
│   │   └── AuthContext.js     # Authentication context
│   ├── pages/
│   │   ├── Login.js           # Login page
│   │   ├── Dashboard.js       # Dashboard with stats
│   │   ├── StudentList.js     # Student listing page
│   │   ├── StudentForm.js     # Student registration form
│   │   ├── EmployeeList.js    # Employee listing page
│   │   └── EmployeeForm.js    # Employee form
│   ├── App.js                 # Main app component
│   ├── index.js               # Entry point
│   └── index.css              # Global styles with Tailwind
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## Pages & Features

### Authentication
- **Login Page**: Secure login with email/password
- **Protected Routes**: Role-based access control
- **JWT Token Management**: Automatic token handling

### Dashboard
- **Statistics Cards**: Total students, employees, fees, recent registrations
- **Fee Collection Overview**: Course fees, admission fees, payment status
- **Quick Actions**: Direct links to common tasks
- **Top Performing Employees**: Employee performance metrics

### Student Management
- **Student List**: Searchable table with pagination
- **Student Registration**: Comprehensive form with all required fields:
  - Basic registration details
  - Personal information
  - Contact details
  - Parent information
  - Educational details (multiple entries)
  - Physical & medical details
  - Office use only fields
- **Student Edit**: Update existing student information
- **Student Delete**: Remove students (superadmin only)

### Employee Management (Superadmin Only)
- **Employee List**: View all employees with status
- **Employee Creation**: Add new employees with roles
- **Employee Edit**: Update employee information
- **Status Toggle**: Activate/deactivate employee accounts
- **Employee Delete**: Remove employees (except superadmin)

## Role-based Access Control

### Super Admin
- Full access to all features
- Can manage employee accounts
- Can view all students and statistics
- Can delete students and employees
- Can toggle employee status

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

## Components

### Layout Component
- Responsive sidebar navigation
- Mobile-friendly hamburger menu
- User profile display
- Logout functionality

### Protected Route Component
- Authentication check
- Loading states
- Automatic redirect to login

### Form Components
- Comprehensive validation
- Error handling
- Loading states
- Responsive design

## Styling

### Tailwind CSS Classes
- Custom component classes defined in `index.css`
- Responsive design utilities
- Consistent color scheme
- Modern UI components

### Custom Components
- `.btn`: Button styles with variants
- `.input`: Form input styles
- `.card`: Card container styles
- `.form-group`: Form field grouping
- `.form-label`: Label styles
- `.form-error`: Error message styles

## API Integration

### Axios Configuration
- Base URL configuration
- Automatic token handling
- Error interceptors
- Request/response logging

### Endpoints Used
- Authentication: `/api/auth/*`
- Students: `/api/students/*`
- Employees: `/api/employees/*`
- Dashboard: `/api/dashboard/*`

## Development

### Scripts
- `npm start`: Start development server
- `npm run build`: Build for production
- `npm test`: Run tests
- `npm run eject`: Eject from Create React App

### Environment Variables
- `REACT_APP_API_URL`: Backend API URL (optional, defaults to proxy)

### Proxy Configuration
- Development proxy to `http://localhost:5000`
- Handles CORS issues in development

## Responsive Design

### Breakpoints
- Mobile: `< 640px`
- Tablet: `640px - 1024px`
- Desktop: `> 1024px`

### Mobile Features
- Collapsible sidebar
- Touch-friendly buttons
- Responsive tables
- Mobile-optimized forms

## Performance

### Optimizations
- Code splitting with React Router
- Lazy loading of components
- Optimized bundle size
- Efficient re-renders with React hooks

### Best Practices
- Proper error boundaries
- Loading states
- Optimistic updates
- Debounced search

## Security

### Features
- JWT token authentication
- Protected routes
- Role-based access control
- Secure password handling
- Input validation

### Best Practices
- No sensitive data in localStorage
- Automatic token refresh
- Secure API communication
- XSS protection

## Deployment

### Build Process
1. Run `npm run build`
2. Deploy `build/` folder to web server
3. Configure environment variables
4. Set up proper CORS headers

### Production Considerations
- Environment variables
- API URL configuration
- Error monitoring
- Performance monitoring

## Contributing

1. Follow the existing code structure
2. Use consistent naming conventions
3. Add proper error handling
4. Include loading states
5. Test on multiple devices
6. Update documentation

## Troubleshooting

### Common Issues
- **CORS Errors**: Ensure backend is running and CORS is configured
- **Authentication Issues**: Check token storage and API endpoints
- **Build Errors**: Clear node_modules and reinstall dependencies
- **Styling Issues**: Ensure Tailwind CSS is properly configured

### Development Tips
- Use React Developer Tools for debugging
- Check browser console for errors
- Verify API responses in Network tab
- Test on different screen sizes
