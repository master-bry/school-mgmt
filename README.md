# School Management System (SMS)

A comprehensive software application designed to digitize and automate administrative and academic tasks for educational institutions.

## 🎯 Core Objectives

- **Eliminate Manual Errors**: Replace manual record-keeping with a secure, centralized database
- **Improve Communication**: Provide direct channels between the school, parents, and students
- **Save Time**: Automate routine tasks like report card generation, attendance tracking, and fee reminders

## 👤 User Modules & Roles

### Admin
- Manages master settings
- Staff appointments
- Class creation
- Generates comprehensive reports

### Teacher
- Takes daily attendance
- Enters grades/marks
- Updates parents on student progress

### Student
- Views academic timetables
- Exam schedules
- Grades
- Submits assignments

### Parent
- Tracks child's attendance
- Academic performance
- School fees online

## 🛠️ Key Features

- **Student Information System (SIS)**: Manages admissions, profiles, and transfers
- **Attendance Tracking**: Real-time logging of students and staff
- **Fee Management**: Tracks paid/unpaid tuition, generates receipts, and calculates dues
- **Examination & Grading**: Calculates averages, generates report cards, and tracks GPA
- **Time-Table Management**: Schedules classes and avoids teacher conflicts
- **Library Management**: Catalogs books and tracks issue/return logs

## 💻 Technology Stack

- **Frontend**: React.js with TailwindCSS and shadcn/ui
- **Backend**: Laravel (PHP Framework)
- **Database**: PostgreSQL

## 📁 Project Structure

```
school-mgmt/
├── backend/          # Laravel API
├── frontend/         # React.js Application
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- PHP >= 8.1
- Composer
- Node.js >= 18
- PostgreSQL >= 13
- npm or yarn

### Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 🎨 Design Philosophy

Modern, clean interface with:
- Professional color scheme (blues, whites, grays)
- Intuitive navigation
- Responsive design
- Accessible components
