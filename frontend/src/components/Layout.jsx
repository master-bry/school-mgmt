import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  GraduationCap, LogOut, Users, BookOpen, Calendar, DollarSign, Library,
  Settings, ChevronDown, Menu, X, LayoutDashboard, UserCheck, FileSpreadsheet,
  Clock, BarChart3, ChevronRight, ClipboardCheck, BookMarked,
  FileText, CreditCard, TrendingUp, Award, ShieldCheck,
  FileSignature, Megaphone, Newspaper, MapPin, FolderOpen,
  PieChart, Wallet, BookCheck, Monitor, Building2
} from 'lucide-react'

const roleLabels = {
  super_admin: 'Super Admin', admin: 'IT Admin', academician: 'Academician', cashier: 'Cashier',
  head_of_school: 'Head of School', assistant_head: 'Asst. Head',
  secretary: 'Secretary', teacher: 'Teacher', student: 'Student', parent: 'Parent',
}

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = {
    super_admin: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Building2, label: 'Schools', path: '/dashboard/super-admin/schools' },
      { icon: CreditCard, label: 'Subscriptions', path: '/dashboard/super-admin/subscriptions' },
      { icon: ShieldCheck, label: 'Feature Flags', path: '/dashboard/super-admin/feature-flags' },
      { icon: TrendingUp, label: 'Analytics', path: '/dashboard/super-admin/analytics' },
    ],
    admin: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Users, label: 'Users', path: '/dashboard/users' },
      { icon: Users, label: 'Parents', path: '/dashboard/admin/parents' },
      { icon: BookOpen, label: 'Classes', path: '/dashboard/classes' },
      { icon: DollarSign, label: 'Fees', path: '/dashboard/fees' },
      { icon: Library, label: 'Library', path: '/dashboard/library' },
    ],
    academician: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Users, label: 'Students', path: '/dashboard/academician/students' },
      { icon: Users, label: 'Parents', path: '/dashboard/academician/parents' },
      { icon: BookOpen, label: 'Classes', path: '/dashboard/academician/classes' },
      { icon: BookMarked, label: 'Books / Materials', path: '/dashboard/academician/books' },
      { icon: Calendar, label: 'Timetables', path: '/dashboard/academician/timetables' },
      { icon: Users, label: 'Assign Teachers', path: '/dashboard/academician/assignments' },
      { icon: ClipboardCheck, label: 'Review Results', path: '/dashboard/academician/submissions' },
      { icon: FileText, label: 'Transcripts', path: '/dashboard/academician/transcripts' },
      { icon: Newspaper, label: 'Blog / Notes', path: '/dashboard/academician/blogs' },
    ],
    cashier: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Users, label: 'Staff', path: '/dashboard/cashier/staff' },
      { icon: Users, label: 'Parents', path: '/dashboard/cashier/parents' },
      { icon: DollarSign, label: 'Fees', path: '/dashboard/cashier/fees' },
      { icon: TrendingUp, label: 'Reports', path: '/dashboard/cashier/reports' },
    ],
    head_of_school: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Users, label: 'Staff', path: '/dashboard/head-of-school/staff' },
      { icon: Users, label: 'Students', path: '/dashboard/head-of-school/students' },
      { icon: Users, label: 'Parents', path: '/dashboard/head-of-school/parents' },
      { icon: DollarSign, label: 'Fees & Fines', path: '/dashboard/head-of-school/fees' },
      { icon: Award, label: 'Approvals', path: '/dashboard/head-of-school/approvals' },
      { icon: FileText, label: 'Transcripts', path: '/dashboard/head-of-school/transcripts' },
      { icon: TrendingUp, label: 'Analytics', path: '/dashboard/head-of-school/analytics' },
    ],
    assistant_head: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: BarChart3, label: 'Performance', path: '/dashboard/assistant-head/performance' },
      { icon: GraduationCap, label: 'Staff', path: '/dashboard/assistant-head/teachers' },
      { icon: Users, label: 'Students', path: '/dashboard/assistant-head/students' },
      { icon: Users, label: 'Parents', path: '/dashboard/assistant-head/parents' },
      { icon: DollarSign, label: 'Fees & Fines', path: '/dashboard/assistant-head/fees' },
      { icon: ClipboardCheck, label: 'Submissions', path: '/dashboard/assistant-head/submissions' },
      { icon: Award, label: 'Approvals', path: '/dashboard/assistant-head/approvals' },
    ],
    secretary: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Megaphone, label: 'Announcements', path: '/dashboard/secretary/announcements' },
      { icon: Users, label: 'Users', path: '/dashboard/secretary/users' },
      { icon: Calendar, label: 'Timetables', path: '/dashboard/secretary/timetables' },
      { icon: FileSignature, label: 'Exams', path: '/dashboard/secretary/exams' },
    ],
    teacher: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Users, label: 'My Classes', path: '/dashboard/classes' },
      { icon: UserCheck, label: 'Attendance', path: '/dashboard/attendance' },
      { icon: FileSpreadsheet, label: 'Grades', path: '/dashboard/grades' },
      { icon: FolderOpen, label: 'Resources', path: '/dashboard/teacher/resources' },
      { icon: BookOpen, label: 'Books', path: '/dashboard/teacher/books' },
    ],
    student: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Clock, label: 'Timetable', path: '/dashboard/timetable' },
      { icon: BarChart3, label: 'Grades', path: '/dashboard/grades' },
      { icon: UserCheck, label: 'Attendance', path: '/dashboard/attendance' },
      { icon: Newspaper, label: 'Blogs & Notes', path: '/dashboard/blogs' },
      { icon: MapPin, label: 'Events', path: '/dashboard/events' },
      { icon: FolderOpen, label: 'Resources', path: '/dashboard/resources' },
      { icon: BookOpen, label: 'Books', path: '/dashboard/books' },
    ],
    parent: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Users, label: 'Children', path: '/dashboard/children' },
      { icon: UserCheck, label: 'Attendance', path: '/dashboard/attendance' },
      { icon: BarChart3, label: 'Grades', path: '/dashboard/grades' },
      { icon: DollarSign, label: 'Fees', path: '/dashboard/fees' },
    ],
  }

  const items = user ? navItems[user.role] || [] : []

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-secondary-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-secondary-200 shadow-sm
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-secondary-200">
            <button onClick={() => navigate('/dashboard')} className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-secondary-900">EduManage</span>
              </div>
            </button>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-secondary-100 transition-colors">
              <X className="w-5 h-5 text-secondary-500" />
            </button>
          </div>

          {/* School name badge */}
          {user?.school && (
            <div className="px-5 py-3 border-b border-secondary-100 bg-primary-50/30">
              <p className="text-xs text-primary-700 font-medium truncate">{user.school.name}</p>
            </div>
          )}

          {/* Navigation items */}
          <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
            {items.map((item) => (
              <button key={item.path} onClick={() => { navigate(item.path); setSidebarOpen(false) }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive(item.path)
                    ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100'
                    : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
                }`}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="border-t border-secondary-200 px-3 py-3">
            <div className="flex items-center space-x-3 px-3.5 py-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-sm font-semibold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 truncate">{user?.name}</p>
                <p className="text-xs text-secondary-500 capitalize truncate">{roleLabels[user?.role] || user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-secondary-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center space-x-3">
              <button onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 transition-colors">
                <Menu className="w-5 h-5 text-secondary-600" />
              </button>
              <span className="text-lg font-bold text-secondary-900 hidden sm:block">EduManage</span>
            </div>

            <div className="flex items-center space-x-3">
              {/* User dropdown */}
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-secondary-100 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-sm font-semibold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-medium text-secondary-900 leading-tight">{user?.name}</p>
                    <p className="text-[11px] text-secondary-500 capitalize leading-tight">{roleLabels[user?.role] || user?.role}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-secondary-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-secondary-200 py-1.5 z-20 animate-fadeIn">
                      <div className="px-4 py-2.5 border-b border-secondary-100">
                        <p className="text-sm font-semibold text-secondary-900">{user?.name}</p>
                        <p className="text-xs text-secondary-500 capitalize">{roleLabels[user?.role] || user?.role}</p>
                      </div>
                      <button onClick={() => { navigate('/dashboard/profile'); setUserMenuOpen(false) }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-secondary-700 hover:bg-primary-50 hover:text-primary-700 transition-colors">
                        <Settings className="w-4 h-4" />
                        <span>Profile Settings</span>
                      </button>
                      <div className="border-t border-secondary-100 my-1" />
                      <button onClick={handleLogout}
                        className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
