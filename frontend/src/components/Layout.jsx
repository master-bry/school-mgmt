import { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../hooks/useTranslation'
import axios from 'axios'
import {
  GraduationCap, LogOut, Users, BookOpen, Calendar, DollarSign, Library,
  Settings, ChevronDown, Menu, X, LayoutDashboard, UserCheck, FileSpreadsheet,
  Clock, BarChart3, ChevronRight, ClipboardCheck, BookMarked,
  FileText, CreditCard, TrendingUp, Award, ShieldCheck,
  FileSignature, Megaphone, Newspaper, MapPin, FolderOpen,
  PieChart, Wallet, BookCheck, Monitor, Building2, Globe, Languages
} from 'lucide-react'

const roleLabels = {
  super_admin: 'role.super_admin', admin: 'role.admin', academician: 'role.academician', cashier: 'role.cashier',
  head_of_school: 'role.head_of_school', assistant_head: 'role.assistant_head',
  secretary: 'role.secretary', teacher: 'role.teacher', student: 'role.student', parent: 'role.parent',
}

const Layout = ({ children }) => {
  const { user, logout, features } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const switchLocale = useCallback(async () => {
    const current = user?.school?.locale || 'en'
    const next = current === 'en' ? 'sw' : 'en'
    try {
      await axios.post('/api/locale', { locale: next })
      window.location.reload()
    } catch {}
  }, [user])

  const switchLocaleTo = useCallback(async (locale) => {
    if (locale === (user?.school?.locale || 'en')) return
    try {
      await axios.post('/api/locale', { locale })
      window.location.reload()
    } catch {}
  }, [user])

  const navItems = {
    super_admin: [
      { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/dashboard' },
      { icon: Building2, labelKey: 'nav.schools', path: '/dashboard/super-admin/schools' },
      { icon: CreditCard, labelKey: 'nav.subscriptions', path: '/dashboard/super-admin/subscriptions' },
      { icon: ShieldCheck, labelKey: 'nav.feature_flags', path: '/dashboard/super-admin/feature-flags' },
      { icon: TrendingUp, labelKey: 'nav.analytics', path: '/dashboard/super-admin/analytics' },
    ],
    admin: [
      { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/dashboard' },
      { icon: Users, labelKey: 'nav.users', path: '/dashboard/users' },
      { icon: Users, labelKey: 'nav.parents', path: '/dashboard/admin/parents' },
      { icon: BookOpen, labelKey: 'nav.classes', path: '/dashboard/classes' },
      { icon: DollarSign, labelKey: 'nav.fees', path: '/dashboard/fees' },
      { icon: Library, labelKey: 'nav.library', path: '/dashboard/library' },
    ],
    academician: [
      { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/dashboard' },
      { icon: Users, labelKey: 'nav.students', path: '/dashboard/academician/students' },
      { icon: Users, labelKey: 'nav.parents', path: '/dashboard/academician/parents' },
      { icon: BookOpen, labelKey: 'nav.classes', path: '/dashboard/academician/classes' },
      { icon: BookMarked, labelKey: 'nav.books_materials', path: '/dashboard/academician/books' },
      { icon: Calendar, labelKey: 'nav.timetables', path: '/dashboard/academician/timetables' },
      { icon: Users, labelKey: 'nav.assign_teachers', path: '/dashboard/academician/assignments' },
      { icon: ClipboardCheck, labelKey: 'nav.review_results', path: '/dashboard/academician/submissions' },
      { icon: FileText, labelKey: 'nav.transcripts', path: '/dashboard/academician/transcripts' },
      { icon: Newspaper, labelKey: 'nav.blog_notes', path: '/dashboard/academician/blogs' },
    ],
    cashier: [
      { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/dashboard' },
      { icon: Users, labelKey: 'nav.staff', path: '/dashboard/cashier/staff' },
      { icon: Users, labelKey: 'nav.parents', path: '/dashboard/cashier/parents' },
      { icon: DollarSign, labelKey: 'nav.fees', path: '/dashboard/cashier/fees' },
      { icon: TrendingUp, labelKey: 'nav.analytics', path: '/dashboard/cashier/reports' },
    ],
    head_of_school: [
      { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/dashboard' },
      { icon: Users, labelKey: 'nav.staff', path: '/dashboard/head-of-school/staff' },
      { icon: Users, labelKey: 'nav.students', path: '/dashboard/head-of-school/students' },
      { icon: Users, labelKey: 'nav.parents', path: '/dashboard/head-of-school/parents' },
      { icon: DollarSign, labelKey: 'nav.fees_fines', path: '/dashboard/head-of-school/fees' },
      { icon: Award, labelKey: 'nav.approvals', path: '/dashboard/head-of-school/approvals' },
      { icon: FileText, labelKey: 'nav.transcripts', path: '/dashboard/head-of-school/transcripts' },
      { icon: TrendingUp, labelKey: 'nav.analytics', path: '/dashboard/head-of-school/analytics' },
    ],
    assistant_head: [
      { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/dashboard' },
      { icon: BarChart3, labelKey: 'nav.performance', path: '/dashboard/assistant-head/performance' },
      { icon: GraduationCap, labelKey: 'nav.staff', path: '/dashboard/assistant-head/teachers' },
      { icon: Users, labelKey: 'nav.students', path: '/dashboard/assistant-head/students' },
      { icon: Users, labelKey: 'nav.parents', path: '/dashboard/assistant-head/parents' },
      { icon: DollarSign, labelKey: 'nav.fees_fines', path: '/dashboard/assistant-head/fees' },
      { icon: ClipboardCheck, labelKey: 'nav.submissions', path: '/dashboard/assistant-head/submissions' },
      { icon: Award, labelKey: 'nav.approvals', path: '/dashboard/assistant-head/approvals' },
    ],
    secretary: [
      { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/dashboard' },
      { icon: Megaphone, labelKey: 'nav.announcements', path: '/dashboard/secretary/announcements' },
      { icon: Users, labelKey: 'nav.users', path: '/dashboard/secretary/users' },
      { icon: Calendar, labelKey: 'nav.timetables', path: '/dashboard/secretary/timetables' },
      { icon: FileSignature, labelKey: 'nav.exams', path: '/dashboard/secretary/exams' },
    ],
    teacher: [
      { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/dashboard' },
      { icon: Users, labelKey: 'nav.my_classes', path: '/dashboard/classes' },
      { icon: UserCheck, labelKey: 'nav.attendance', path: '/dashboard/attendance' },
      { icon: FileSpreadsheet, labelKey: 'nav.grades', path: '/dashboard/grades' },
      { icon: FolderOpen, labelKey: 'nav.resources', path: '/dashboard/teacher/resources' },
      { icon: BookOpen, labelKey: 'nav.books', path: '/dashboard/teacher/books' },
    ],
    student: [
      { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/dashboard' },
      { icon: Clock, labelKey: 'nav.timetable', path: '/dashboard/timetable' },
      { icon: BarChart3, labelKey: 'nav.grades', path: '/dashboard/grades' },
      { icon: UserCheck, labelKey: 'nav.attendance', path: '/dashboard/attendance' },
      { icon: Newspaper, labelKey: 'nav.blogs_notes', path: '/dashboard/blogs' },
      { icon: MapPin, labelKey: 'nav.events', path: '/dashboard/events' },
      { icon: FolderOpen, labelKey: 'nav.resources', path: '/dashboard/resources' },
      { icon: BookOpen, labelKey: 'nav.books', path: '/dashboard/books' },
    ],
    parent: [
      { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/dashboard' },
      { icon: Users, labelKey: 'nav.children', path: '/dashboard/children' },
      { icon: UserCheck, labelKey: 'nav.attendance', path: '/dashboard/attendance' },
      { icon: BarChart3, labelKey: 'nav.grades', path: '/dashboard/grades' },
      { icon: DollarSign, labelKey: 'nav.fees', path: '/dashboard/fees' },
    ],
  }

  const rawItems = user ? navItems[user.role] || [] : []
  const items = rawItems.map(item => ({ ...item, label: t(item.labelKey) }))

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
                <span className="text-lg font-bold text-secondary-900">{t('app.name')}</span>
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
                <p className="text-xs text-secondary-500 capitalize truncate">{t(roleLabels[user?.role]) || user?.role}</p>
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
              <span className="text-lg font-bold text-secondary-900 hidden sm:block">{t('app.name')}</span>
            </div>

            <div className="flex items-center space-x-3">
              {/* Language Toggle (Swahili Portal) */}
              {features?.swahili_portal && (
                <button onClick={switchLocale}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-secondary-100 transition-colors text-sm"
                  title={t('header.switch_language')}>
                  <Languages className="w-4 h-4 text-secondary-500" />
                  <span className="font-medium text-secondary-600">{user?.school?.locale === 'sw' ? t('header.sw') : t('header.en')}</span>
                </button>
              )}

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
                    <p className="text-[11px] text-secondary-500 capitalize leading-tight">{t(roleLabels[user?.role]) || user?.role}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-secondary-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-secondary-200 py-1.5 z-20 animate-fadeIn">
                      <div className="px-4 py-2.5 border-b border-secondary-100">
                        <p className="text-sm font-semibold text-secondary-900">{user?.name}</p>
                        <p className="text-xs text-secondary-500 capitalize">{t(roleLabels[user?.role]) || user?.role}</p>
                      </div>
                      <button onClick={() => { navigate('/dashboard/profile'); setUserMenuOpen(false) }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-secondary-700 hover:bg-primary-50 hover:text-primary-700 transition-colors">
                        <Settings className="w-4 h-4" />
                        <span>{t('profile.settings')}</span>
                      </button>
                      {features?.swahili_portal && (
                        <>
                          <div className="border-t border-secondary-100 my-1" />
                          <div className="px-4 py-2">
                            <p className="text-xs text-secondary-500 font-medium mb-1">{t('header.language')}</p>
                            <div className="flex space-x-2">
                              <button onClick={() => switchLocaleTo('en')}
                                className={`flex-1 text-xs font-medium py-1.5 rounded ${user?.school?.locale === 'en' ? 'bg-primary-100 text-primary-700' : 'text-secondary-600 hover:bg-secondary-100'}`}>{t('header.english')}</button>
                              <button onClick={() => switchLocaleTo('sw')}
                                className={`flex-1 text-xs font-medium py-1.5 rounded ${user?.school?.locale === 'sw' ? 'bg-primary-100 text-primary-700' : 'text-secondary-600 hover:bg-secondary-100'}`}>{t('header.kiswahili')}</button>
                            </div>
                          </div>
                        </>
                      )}
                      <div className="border-t border-secondary-100 my-1" />
                      <button onClick={handleLogout}
                        className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span>{t('profile.sign_out')}</span>
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
