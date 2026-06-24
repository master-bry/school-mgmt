import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Classes from './pages/Classes'
import Fees from './pages/Fees'
import Library from './pages/Library'
import Attendance from './pages/Attendance'
import Grades from './pages/Grades'
import Timetable from './pages/Timetable'
import Children from './pages/Children'
import Profile from './pages/Profile'

import AcademicianParents from './pages/academician/Parents'
import AcademicianBooks from './pages/academician/Books'
import AcademicianTimetables from './pages/academician/Timetables'
import AcademicianAssignments from './pages/academician/Assignments'
import AcademicianSubmissions from './pages/academician/Submissions'
import AcademicianBlogs from './pages/academician/Blogs'
import AcademicianClasses from './pages/academician/Classes'
import AcademicianTranscripts from './pages/academician/Transcripts'
import AcademicianStudents from './pages/academician/Students'

import CashierFees from './pages/cashier/Fees'
import CashierStaff from './pages/cashier/Staff'
import CashierParents from './pages/cashier/Parents'
import CashierReports from './pages/cashier/Reports'

import AdminParents from './pages/admin/Parents'
import HoSApprovals from './pages/headOfSchool/Approvals'
import HoSFees from './pages/headOfSchool/Fees'
import HoSAnalytics from './pages/headOfSchool/Analytics'
import HoSStudents from './pages/headOfSchool/Students'
import HoSStaff from './pages/headOfSchool/Staff'
import HoSParents from './pages/headOfSchool/Parents'
import HoSTeachers from './pages/headOfSchool/Teachers'
import HoSTranscripts from './pages/headOfSchool/Transcripts'
import AHStudents from './pages/assistantHead/Students'
import AHFees from './pages/assistantHead/Fees'
import AHParents from './pages/assistantHead/Parents'
import AHPerformance from './pages/assistantHead/Performance'
import AHTeachers from './pages/assistantHead/Teachers'
import AHSubmissions from './pages/assistantHead/Submissions'
import AHApprovals from './pages/assistantHead/Approvals'

import StudentBlogs from './pages/student/Blogs'
import StudentEvents from './pages/student/Events'
import StudentResources from './pages/student/Resources'
import LibraryResources from './pages/LibraryResources'
import LibraryBooks from './pages/LibraryBooks'
import SuperAdminSchools from './pages/superAdmin/Schools'
import SuperAdminSubscriptions from './pages/superAdmin/Subscriptions'
import SuperAdminFeatureFlags from './pages/superAdmin/FeatureFlags'
import SuperAdminAnalytics from './pages/superAdmin/Analytics'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route path="users" element={<Users />} />
            <Route path="admin/parents" element={<AdminParents />} />
            <Route path="classes" element={<Classes />} />
            <Route path="fees" element={<Fees />} />
            <Route path="library" element={<Library />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="grades" element={<Grades />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path="children" element={<Children />} />
            <Route path="profile" element={<Profile />} />
            <Route path="child/:id/attendance" element={<Attendance />} />
            <Route path="child/:id/grades" element={<Grades />} />
            <Route path="child/:id/fees" element={<Fees />} />

            <Route path="academician/students" element={<AcademicianStudents />} />
            <Route path="academician/parents" element={<AcademicianParents />} />
            <Route path="academician/classes" element={<AcademicianClasses />} />
            <Route path="academician/books" element={<AcademicianBooks />} />
            <Route path="academician/timetables" element={<AcademicianTimetables />} />
            <Route path="academician/assignments" element={<AcademicianAssignments />} />
            <Route path="academician/submissions" element={<AcademicianSubmissions />} />
            <Route path="academician/blogs" element={<AcademicianBlogs />} />
            <Route path="academician/transcripts" element={<AcademicianTranscripts />} />

            <Route path="cashier/fees" element={<CashierFees />} />
            <Route path="cashier/staff" element={<CashierStaff />} />
            <Route path="cashier/parents" element={<CashierParents />} />
            <Route path="cashier/reports" element={<CashierReports />} />

            <Route path="head-of-school/fees" element={<HoSFees />} />
            <Route path="head-of-school/staff" element={<HoSStaff />} />
            <Route path="head-of-school/parents" element={<HoSParents />} />
            <Route path="head-of-school/teachers" element={<HoSTeachers />} />
            <Route path="head-of-school/students" element={<HoSStudents />} />
            <Route path="head-of-school/approvals" element={<HoSApprovals />} />
            <Route path="head-of-school/transcripts" element={<HoSTranscripts />} />
            <Route path="head-of-school/analytics" element={<HoSAnalytics />} />
            <Route path="assistant-head/fees" element={<AHFees />} />
            <Route path="assistant-head/performance" element={<AHPerformance />} />
            <Route path="assistant-head/parents" element={<AHParents />} />
            <Route path="assistant-head/students" element={<AHStudents />} />
            <Route path="assistant-head/teachers" element={<AHTeachers />} />
            <Route path="assistant-head/submissions" element={<AHSubmissions />} />
            <Route path="assistant-head/approvals" element={<AHApprovals />} />

            <Route path="blogs" element={<StudentBlogs />} />
            <Route path="events" element={<StudentEvents />} />
            <Route path="resources" element={<LibraryResources apiPrefix="/api/student" />} />
            <Route path="books" element={<LibraryBooks apiPrefix="/api/student" />} />
            <Route path="teacher/resources" element={<LibraryResources apiPrefix="/api/teacher" />} />
            <Route path="teacher/books" element={<LibraryBooks apiPrefix="/api/teacher" />} />

            <Route path="super-admin/schools" element={<SuperAdminSchools />} />
            <Route path="super-admin/subscriptions" element={<SuperAdminSubscriptions />} />
            <Route path="super-admin/feature-flags" element={<SuperAdminFeatureFlags />} />
            <Route path="super-admin/analytics" element={<SuperAdminAnalytics />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
