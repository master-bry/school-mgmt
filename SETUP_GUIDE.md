# School Management System - Setup Guide

## Prerequisites

- PHP >= 8.1
- Composer
- Node.js >= 18
- PostgreSQL >= 13
- npm or yarn

## Backend Setup (Laravel)

### 1. Install Dependencies

```bash
cd backend
composer install
```

### 2. Configure Environment

```bash
cp .env.example .env
php artisan key:generate
```

### 3. Configure Database

Edit `.env` file and set your PostgreSQL credentials:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=school_management
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

### 4. Create Database

```bash
createdb school_management
```

### 5. Run Migrations

```bash
php artisan migrate
```

### 6. Start Development Server

```bash
php artisan serve
```

The API will be available at `http://localhost:8000`

## Frontend Setup (React)

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Default User Accounts

After running migrations, you can create users via the registration page or seed the database:

### Admin Account
- Email: admin@school.com
- Password: password
- Role: admin

### Teacher Account
- Email: teacher@school.com
- Password: password
- Role: teacher

### Student Account
- Email: student@school.com
- Password: password
- Role: student

### Parent Account
- Email: parent@school.com
- Password: password
- Role: parent

## API Endpoints

### Authentication
- POST `/api/register` - Register new user
- POST `/api/login` - Login user
- POST `/api/logout` - Logout user
- GET `/api/user` - Get current user

### Admin Routes
- GET `/api/admin/dashboard` - Admin dashboard stats
- GET `/api/admin/users` - List all users
- POST `/api/admin/users` - Create new user
- PUT `/api/admin/users/{id}` - Update user
- DELETE `/api/admin/users/{id}` - Delete user

### Teacher Routes
- GET `/api/teacher/dashboard` - Teacher dashboard stats
- POST `/api/teacher/attendance` - Mark attendance
- GET `/api/teacher/attendance/{class_id}` - Get attendance
- POST `/api/teacher/grades` - Submit grades

### Student Routes
- GET `/api/student/dashboard` - Student dashboard
- GET `/api/student/timetable` - Get timetable
- GET `/api/student/grades` - Get grades
- GET `/api/student/attendance` - Get attendance history

### Parent Routes
- GET `/api/parent/dashboard` - Parent dashboard
- GET `/api/parent/child/{id}/attendance` - Child's attendance
- GET `/api/parent/child/{id}/grades` - Child's grades
- GET `/api/parent/child/{id}/fees` - Child's fees

### Fee Management
- GET `/api/fees` - List all fees
- POST `/api/fees` - Create fee record
- PUT `/api/fees/{id}` - Update fee
- DELETE `/api/fees/{id}` - Delete fee

### Library Management
- GET `/api/books` - List all books
- POST `/api/books` - Add new book
- PUT `/api/books/{id}` - Update book
- DELETE `/api/books/{id}` - Delete book
- POST `/api/books/{id}/issue` - Issue book
- POST `/api/books/{id}/return` - Return book

## Features Implemented

### ✅ Core Features
- [x] User Authentication & Authorization
- [x] Role-Based Access Control (RBAC)
- [x] Student Information System (SIS)
- [x] Attendance Tracking
- [x] Fee Management
- [x] Examination & Grading System
- [x] Timetable Management
- [x] Library Management

### ✅ User Dashboards
- [x] Admin Dashboard
- [x] Teacher Dashboard
- [x] Student Dashboard
- [x] Parent Dashboard

### ✅ UI/UX
- [x] Modern, clean interface
- [x] Responsive design
- [x] Professional color scheme (blues, whites, grays)
- [x] Intuitive navigation
- [x] Accessible components

## Technology Stack

### Backend
- **Framework**: Laravel 10
- **Database**: PostgreSQL
- **Authentication**: Laravel Sanctum
- **API**: RESTful API

### Frontend
- **Framework**: React 18
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Routing**: React Router DOM

## Project Structure

```
school-mgmt/
├── backend/
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   └── Middleware/
│   │   └── Models/
│   ├── config/
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeders/
│   │   └── factories/
│   ├── routes/
│   └── public/
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── contexts/
    │   ├── lib/
    │   └── pages/
    │       ├── admin/
    │       ├── teacher/
    │       ├── student/
    │       └── parent/
    └── public/
```

## Troubleshooting

### Backend Issues

**Migration Error**: Ensure PostgreSQL is running and credentials are correct in `.env`

**Composer Install Error**: Run `composer update` instead of `composer install`

**Key Generation Error**: Run `php artisan key:generate` after copying `.env.example`

### Frontend Issues

**Module Not Found**: Run `npm install` to install dependencies

**Port Already in Use**: Change port in `vite.config.js` or stop the process using port 3000

**API Connection Error**: Ensure backend is running on `http://localhost:8000`

## Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload during development
2. **API Testing**: Use Postman or cURL to test API endpoints
3. **Database Seeding**: Create seeders for test data
4. **Error Logs**: Check Laravel logs in `storage/logs/laravel.log`
5. **Frontend Debugging**: Use React DevTools for debugging

## Production Deployment

### Backend
1. Set `APP_ENV=production` in `.env`
2. Run `php artisan config:cache`
3. Run `php artisan route:cache`
4. Use a production web server (Nginx/Apache)
5. Enable HTTPS

### Frontend
1. Run `npm run build`
2. Deploy the `dist` folder to a web server
3. Configure API URL for production

## Support

For issues or questions, please refer to the official documentation:
- Laravel: https://laravel.com/docs
- React: https://react.dev
- TailwindCSS: https://tailwindcss.com/docs
