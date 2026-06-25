import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../hooks/useTranslation'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import {
  Users, BookOpen, GraduationCap, TrendingUp, Calendar, CheckCircle,
  DollarSign, Library, ArrowRight, UserCheck, Clock, BarChart3,
  Settings, School, Award, ShieldCheck, Building2, FileText, CreditCard,
  ClipboardCheck, BookMarked, Megaphone, Server, Key, Database, Activity,
  AlertCircle, Plus, X, UserPlus, Mail, Globe, Lock, BookCheck, PieChart, XCircle,
  Wallet, FileSignature, MapPin, Monitor, Newspaper, FileSpreadsheet,
  Receipt, AlertTriangle, CalendarCheck, UserPlus as UserPlusIcon,
  FolderOpen
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts'
import axios from 'axios'

const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4']
const GRADE_COLORS = { A: 'bg-emerald-500', B: 'bg-blue-500', C: 'bg-amber-500', D: 'bg-orange-500', F: 'bg-red-500' }

const roleTitles = {
  super_admin: 'Super Admin', admin: 'Admin', teacher: 'Teacher', student: 'Student', parent: 'Parent',
  academician: 'Academician', cashier: 'Cashier', head_of_school: 'Head of School',
  assistant_head: 'Asst. Head', secretary: 'Secretary',
}

const roleIcons = {
  super_admin: Server, admin: ShieldCheck, teacher: GraduationCap, student: BookOpen, parent: Users,
  academician: Award, cashier: DollarSign, head_of_school: Building2,
  assistant_head: BookCheck, secretary: FileText,
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [stats, setStats] = useState({})
  const isDash = location.pathname === '/dashboard'
  const [loading, setLoading] = useState(isDash)

  // Secretary-specific state
  const [announcements, setAnnouncements] = useState([])
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', category: 'general', is_public: true })
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }
    if (location.pathname !== '/dashboard') return
    fetchDashboardData()
  }, [user, authLoading])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const endpoints = {
        super_admin: '/api/super-admin/dashboard',
        admin: '/api/admin/dashboard',
        teacher: '/api/teacher/dashboard',
        student: '/api/student/dashboard',
        parent: '/api/parent/dashboard',
        academician: '/api/academician/dashboard',
        cashier: '/api/cashier/dashboard',
        head_of_school: '/api/head-of-school/dashboard',
        assistant_head: '/api/assistant-head/dashboard',
        secretary: '/api/secretary/dashboard',
      }
      const { data } = await axios.get(endpoints[user.role])
      setStats(data)

      if (user.role === 'secretary') {
        const annRes = await axios.get('/api/secretary/announcements').catch(() => ({ data: [] }))
        setAnnouncements(annRes.data || [])
      }
    } catch (error) { console.error(error) }
    finally { setLoading(false) }
  }

  if (authLoading || !user) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>

  const RoleIcon = roleIcons[user.role] || School
  const roleTitle = roleTitles[user.role] || user.role

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {isDash ? (<>
      {/* ───── Super Admin Dashboard ───── */}
      {user.role === 'super_admin' && (
        <div className="space-y-6">
          <StatHeader icon={RoleIcon} title={roleTitle} subtitle={t('dashboard.super_admin_subtitle')} />
          <StatCards items={[
            { label: 'Total Schools', value: stats.total_schools || 0, icon: Building2, gradient: 'from-primary-600 to-primary-700' },
            { label: 'Active Schools', value: stats.active_schools || 0, icon: ShieldCheck, gradient: 'from-emerald-600 to-emerald-700' },
            { label: 'Total Users', value: stats.total_users || 0, icon: Users, gradient: 'from-violet-600 to-violet-700' },
            { label: 'Students', value: stats.total_students || 0, icon: GraduationCap, gradient: 'from-orange-600 to-orange-700' },
            { label: 'Revenue', value: stats.total_revenue ? `$${stats.total_revenue}` : '$0', icon: DollarSign, gradient: 'from-cyan-600 to-cyan-700' },
            { label: 'Pending', value: stats.pending_revenue ? `$${stats.pending_revenue}` : '$0', icon: AlertCircle, gradient: 'from-rose-600 to-rose-700' },
          ]} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-primary-600" /><span>Monthly Registrations</span>
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.monthly_registrations || []}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-emerald-600" /><span>Schools by Plan</span>
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie data={Object.entries(stats.schools_by_plan || {}).map(([name, value]) => ({ name, value }))}
                    dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {Object.keys(stats.schools_by_plan || {}).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {stats.recent_schools?.length > 0 && (
            <Card>
              <h2 className="text-base font-semibold mb-4">Recent Schools</h2>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-secondary-200"><th className="text-left py-2">Name</th><th className="text-left py-2">Code</th><th className="text-left py-2">Plan</th><th className="text-left py-2">Status</th><th className="text-left py-2">Joined</th></tr></thead>
                <tbody>{stats.recent_schools.map((s, i) => (
                  <tr key={i} className="border-b border-secondary-100"><td className="py-2">{s.name}</td><td className="py-2">{s.code}</td><td className="py-2 capitalize">{s.subscription_plan || 'free'}</td><td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td><td className="py-2">{new Date(s.created_at).toLocaleDateString()}</td></tr>
                ))}</tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* ───── Admin Dashboard ───── */}
      {user.role === 'admin' && (
        <div className="space-y-6">
          <StatHeader icon={RoleIcon} title={roleTitle} subtitle={t('dashboard.admin_subtitle')} />
          <StatCards items={[
            { label: 'Total Students', value: stats.total_users || 0, icon: Users, gradient: 'from-primary-600 to-primary-700' },
            { label: 'Teachers', value: stats.user_counts?.teachers || 0, icon: GraduationCap, gradient: 'from-emerald-600 to-emerald-700' },
            { label: 'Classes', value: stats.total_classes || 0, icon: BookOpen, gradient: 'from-violet-600 to-violet-700' },
            { label: 'Subjects', value: stats.total_subjects || 0, icon: TrendingUp, gradient: 'from-orange-600 to-orange-700' },
            { label: 'API Keys', value: stats.api_keys?.length || 0, icon: Key, gradient: 'from-cyan-600 to-cyan-700' },
            { label: 'Uptime', value: stats.system_health?.uptime_percentage + '%' || '99.9%', icon: Activity, gradient: 'from-green-600 to-green-700' },
          ]} />
        </div>
      )}

      {/* ───── Academician Dashboard ───── */}
      {user.role === 'academician' && (
        <div className="space-y-6">
          <StatHeader icon={RoleIcon} title={roleTitle} subtitle={t('dashboard.academician_subtitle')} />

          {/* Primary stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Teachers', value: stats.total_teachers || 0, icon: Users, color: 'from-primary-500 to-primary-600' },
              { label: 'Students', value: stats.total_students || 0, icon: GraduationCap, color: 'from-emerald-500 to-emerald-600' },
              { label: 'Classes', value: stats.total_classes || 0, icon: BookOpen, color: 'from-violet-500 to-violet-600' },
              { label: 'Subjects', value: stats.total_subjects || 0, icon: BookMarked, color: 'from-orange-500 to-orange-600' },
              { label: 'Syllabus', value: (stats.syllabus_coverage?.coverage_percent || 0) + '%', icon: Award, color: 'from-cyan-500 to-cyan-600' },
              { label: 'Pending', value: stats.pending_submissions || 0, icon: ClipboardCheck, color: 'from-rose-500 to-rose-600' },
            ].map((s, i) => (
              <div key={i} className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${s.color} p-4 shadow-sm`}>
                <p className="text-white/70 text-[11px] font-medium uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
                <s.icon className="absolute right-2 bottom-2 w-8 h-8 text-white/20" />
              </div>
            ))}
          </div>

          {/* Row 1: Syllabus + Today's Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <Award className="w-5 h-5 text-cyan-600" />
                <h2 className="font-semibold text-secondary-900">Syllabus Progress</h2>
              </div>
              <div className="flex items-end space-x-4 mb-3">
                <p className="text-5xl font-bold text-cyan-600">{stats.syllabus_coverage?.coverage_percent || 0}%</p>
                <div className="flex-1 h-3 bg-cyan-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full transition-all duration-500"
                    style={{ width: Math.min(stats.syllabus_coverage?.coverage_percent || 0, 100) + '%' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-sm">
                <div className="p-2 bg-cyan-50 rounded-lg"><p className="font-bold text-cyan-700">{stats.syllabus_coverage?.conducted || 0}</p><p className="text-[11px] text-cyan-500">Done</p></div>
                <div className="p-2 bg-secondary-50 rounded-lg"><p className="font-bold text-secondary-700">{stats.syllabus_coverage?.total_sessions || 0}</p><p className="text-[11px] text-secondary-500">Total</p></div>
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-primary-600" />
                <h2 className="font-semibold text-secondary-900">Today's Schedule</h2>
              </div>
              {(stats.today_timetable || []).length > 0 ? (
                <div className="space-y-2">
                  {stats.today_timetable.map((tt, i) => (
                    <div key={i} className="flex items-center p-3 bg-secondary-50 rounded-lg hover:bg-primary-50/50 transition-colors">
                      <div className="w-14 text-center flex-shrink-0">
                        <p className="text-xs font-bold text-primary-600">{tt.start_time?.substring(0,5)}</p>
                        <p className="text-[10px] text-secondary-400">{tt.end_time?.substring(0,5)}</p>
                      </div>
                      <div className="w-0.5 h-8 bg-primary-200 mx-3 flex-shrink-0 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-secondary-900 truncate">{tt.subject_name}</p>
                        <p className="text-xs text-secondary-500 truncate">{tt.class_name} · {tt.teacher_name}</p>
                      </div>
                      {tt.room && <span className="text-xs text-secondary-400 flex-shrink-0 ml-2">{tt.room}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 text-secondary-400 text-sm">
                  <Calendar className="w-5 h-5 mr-2" /> {t('common.no_sessions')}
                </div>
              )}
            </Card>
          </div>

          {/* Row 2: Subject Performance + Grade Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(stats.subject_performance || []).length > 0 && (
              <Card className="lg:col-span-2">
                <div className="flex items-center space-x-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-violet-600" />
                  <h2 className="font-semibold text-secondary-900">Subject Performance</h2>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats.subject_performance}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="average" fill="#4f46e5" name="Average %" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="max" fill="#10b981" name="Max %" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="min" fill="#ef4444" name="Min %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {(stats.grade_distribution || []).length > 0 && (
              <Card className="lg:col-span-1">
                <div className="flex items-center space-x-2 mb-4">
                  <PieChart className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-semibold text-secondary-900">Grade Distribution</h2>
                </div>
                <div className="space-y-3">
                  {stats.grade_distribution.map(g => (
                    <div key={g.grade} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-secondary-700">Grade {g.grade}</span>
                        <span className="text-secondary-500">{g.percent}% ({g.count})</span>
                      </div>
                      <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${GRADE_COLORS[g.grade] || 'bg-secondary-400'}`}
                          style={{ width: Math.min(g.percent, 100) + '%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Row 3: Exam Moderation Pipeline + Assignment Completion */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center space-x-2 mb-4">
                <ClipboardCheck className="w-5 h-5 text-rose-600" />
                <h2 className="font-semibold text-secondary-900">Exam Moderation Pipeline</h2>
              </div>
              <div className="flex items-center justify-between mb-4">
                {[
                  { label: 'Pending', value: stats.exam_moderation?.pending_moderation || 0, color: 'bg-amber-500' },
                  { label: 'Awaiting', value: stats.exam_moderation?.awaiting_publish || 0, color: 'bg-blue-500' },
                  { label: 'Moderated', value: stats.exam_moderation?.moderated || 0, color: 'bg-emerald-500' },
                  { label: 'Published', value: stats.published_results || 0, color: 'bg-violet-500' },
                ].map((s, i, arr) => (
                  <div key={s.label} className="flex flex-col items-center">
                    <div className={`w-12 h-12 ${s.color} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                      {s.value}
                    </div>
                    <p className="text-[10px] text-secondary-500 mt-1 text-center">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="relative h-1.5 bg-secondary-100 rounded-full overflow-hidden">
                {(() => {
                  const total = (stats.exam_moderation?.pending_moderation || 0) + (stats.exam_moderation?.awaiting_publish || 0) + (stats.exam_moderation?.moderated || 0) + (stats.published_results || 0)
                  const p1 = total > 0 ? ((stats.exam_moderation?.pending_moderation || 0) / total) * 100 : 0
                  const p2 = total > 0 ? ((stats.exam_moderation?.awaiting_publish || 0) / total) * 100 : 0
                  const p3 = total > 0 ? ((stats.exam_moderation?.moderated || 0) / total) * 100 : 0
                  return (<>
                    <div className="absolute h-full bg-amber-500 rounded-l-full transition-all" style={{ width: p1 + '%' }} />
                    <div className="absolute h-full bg-blue-500 transition-all" style={{ left: p1 + '%', width: p2 + '%' }} />
                    <div className="absolute h-full bg-emerald-500 transition-all" style={{ left: (p1 + p2) + '%', width: p3 + '%' }} />
                    <div className="absolute h-full bg-violet-500 rounded-r-full transition-all" style={{ left: (p1 + p2 + p3) + '%', width: Math.max(0, 100 - p1 - p2 - p3) + '%' }} />
                  </>)
                })()}
              </div>
            </Card>

            <Card>
              <div className="flex items-center space-x-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-secondary-900">Assignment Completion</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Subjects Staffed', value: stats.assignment_stats?.subjects_with_teacher || 0, total: stats.assignment_stats?.subjects_total || 0, barColor: '#4f46e5' },
                  { label: 'Classes Staffed', value: stats.assignment_stats?.classes_with_teacher || 0, total: stats.assignment_stats?.classes_total || 0, barColor: '#7c3aed' },
                ].map(a => {
                  const pct = a.total > 0 ? Math.round((a.value / a.total) * 100) : 0
                  return (
                    <div key={a.label} className="p-4 bg-secondary-50 rounded-xl">
                      <p className="text-sm text-secondary-500">{a.label}</p>
                      <p className="text-2xl font-bold text-secondary-900 mt-1">{a.value}<span className="text-sm font-normal text-secondary-400">/{a.total}</span></p>
                      <div className="mt-2 h-2 bg-secondary-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: pct + '%', backgroundColor: a.barColor }} />
                      </div>
                      <p className="text-xs text-secondary-400 mt-1">{pct}% complete</p>
                    </div>
                  )
                })}
                {[
                  { label: 'Published Results', value: stats.published_results || 0, icon: FileText, color: 'emerald' },
                  { label: 'Resources', value: stats.resource_stats?.total_resources || 0, icon: FolderOpen, color: 'amber' },
                ].map(a => (
                  <div key={a.label} className="p-4 bg-secondary-50 rounded-xl">
                    <p className="text-sm text-secondary-500">{a.label}</p>
                    <p className="text-2xl font-bold text-secondary-900 mt-1">{a.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Row 4: Recent Submissions + Content Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-primary-600" />
                <h2 className="font-semibold text-secondary-900">Recent Submissions</h2>
              </div>
              {(stats.recent_submissions || []).length > 0 ? (
                <div className="space-y-2">
                  {stats.recent_submissions.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-secondary-900 truncate">{s.exam_name}</p>
                        <p className="text-xs text-secondary-500 truncate">{s.class_name} · {s.teacher_name}</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          s.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                          s.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                          s.status === 'forwarded' ? 'bg-violet-100 text-violet-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{s.status}</span>
                        <span className="text-[10px] text-secondary-400 whitespace-nowrap">{s.created_at}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-secondary-400">
                  <ClipboardCheck className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">{t('common.no_submissions')}</p>
                </div>
              )}
            </Card>

            <Card>
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-cyan-600" />
                <h2 className="font-semibold text-secondary-900">Content Publishing Trend</h2>
              </div>
              {(stats.monthly_content || []).length > 1 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={stats.monthly_content}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="posts" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3, fill: '#06b6d4' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-secondary-400">
                  <div className="text-center">
                    <Newspaper className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">{t('common.no_data_yet')}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                <div className="p-2 bg-cyan-50 rounded-lg">
                  <p className="font-bold text-cyan-700">{stats.cms_stats?.total_blogs || 0}</p>
                  <p className="text-cyan-500">Total Posts</p>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <p className="font-bold text-emerald-700">{stats.cms_stats?.published || 0}</p>
                  <p className="text-emerald-500">Published</p>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <p className="font-bold text-amber-700">{stats.cms_stats?.drafts || 0}</p>
                  <p className="text-amber-500">Drafts</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Row 5: CMS + Resources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center space-x-2 mb-4">
                <Megaphone className="w-5 h-5 text-amber-600" />
                <h2 className="font-semibold text-secondary-900">Content & Events</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-indigo-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-indigo-600">{stats.cms_stats?.total_blogs || 0}</p>
                  <p className="text-xs text-indigo-500 mt-1">Blog Posts</p>
                </div>
                <div className="p-4 bg-cyan-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-cyan-600">{stats.cms_stats?.total_events || 0}</p>
                  <p className="text-xs text-cyan-500 mt-1">Events</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center space-x-2 mb-4">
                <BookMarked className="w-5 h-5 text-amber-600" />
                <h2 className="font-semibold text-secondary-900">Resource Inventory</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-amber-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-amber-600">{stats.resource_stats?.total_resources || 0}</p>
                  <p className="text-[11px] text-amber-500">Resources</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.resource_stats?.total_books || 0}</p>
                  <p className="text-[11px] text-blue-500">Books</p>
                </div>
                <div className="p-3 bg-violet-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-violet-600">{stats.resource_stats?.shared_spaces || 0}</p>
                  <p className="text-[11px] text-violet-500">Spaces</p>
                </div>
              </div>
            </Card>
          </div>

        </div>
      )}

      {/* ───── Cashier Dashboard ───── */}
      {user.role === 'cashier' && (
        <div className="space-y-6">
          <StatHeader icon={RoleIcon} title={roleTitle} subtitle={t('dashboard.cashier_subtitle')} />
          <StatCards items={[
            { label: 'Pending', value: stats.pending_collections || 0, icon: AlertCircle, gradient: 'from-rose-600 to-rose-700' },
            { label: 'Collected', value: stats.total_collected ? `$${stats.total_collected}` : '$0', icon: DollarSign, gradient: 'from-emerald-600 to-emerald-700' },
            { label: 'Students', value: stats.total_students || 0, icon: Users, gradient: 'from-primary-600 to-primary-700' },
            { label: 'Efficiency', value: stats.collection_efficiency ? `${stats.collection_efficiency}%` : '0%', icon: TrendingUp, gradient: 'from-cyan-600 to-cyan-700' },
          ]} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-primary-600" /><span>Monthly Collections</span>
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.chart_data?.monthly_collections || []}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="collected" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /><span>Daily Collections (Last 7 Days)</span>
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.chart_data?.daily_collections || []}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-violet-600" /><span>By Category</span>
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie data={(stats.chart_data?.by_category || []).map(c => ({ name: c.fee_category || 'Uncategorized', value: parseFloat(c.collected) || 0 }))}
                    dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {stats.chart_data?.by_category?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-amber-600" /><span>By Payment Method</span>
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie data={(stats.chart_data?.by_payment_method || []).map(m => ({ name: m.payment_method || 'Other', value: parseFloat(m.total) || 0 }))}
                    dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {stats.chart_data?.by_payment_method?.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {stats.aging_debt && (
            <Card>
              <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" /><span>Aging Debt Analysis</span>
              </h2>
              <div className="grid grid-cols-4 gap-3 text-center">
                {[
                  { label: '30 Days', value: stats.aging_debt?.days_30, color: 'text-amber-600' },
                  { label: '60 Days', value: stats.aging_debt?.days_60, color: 'text-orange-600' },
                  { label: '90 Days', value: stats.aging_debt?.days_90, color: 'text-red-600' },
                  { label: '120+ Days', value: stats.aging_debt?.days_120, color: 'text-rose-700' },
                ].map(d => (
                  <div key={d.label} className="p-3 bg-red-50 rounded-lg">
                    <p className={`text-2xl font-bold ${d.color}`}>${d.value || 0}</p>
                    <p className="text-xs text-secondary-500 mt-1">{d.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ───── Head of School Dashboard ───── */}
      {user.role === 'head_of_school' && (
        <div className="space-y-6">
          <StatHeader icon={RoleIcon} title={roleTitle} subtitle={t('dashboard.head_of_school_subtitle')} />
          <StatCards items={[
            { label: 'Students', value: stats.total_students || 0, icon: GraduationCap, gradient: 'from-primary-600 to-primary-700' },
            { label: 'Staff', value: stats.total_staff || 0, icon: Users, gradient: 'from-emerald-600 to-emerald-700' },
            { label: 'Retention', value: stats.retention_rate ? `${stats.retention_rate}%` : '0%', icon: TrendingUp, gradient: 'from-violet-600 to-violet-700' },
            { label: 'Financial Health', value: stats.financial_health_index ? `${stats.financial_health_index}%` : '0%', icon: DollarSign, gradient: 'from-cyan-600 to-cyan-700' },
            { label: 'Pending Approvals', value: stats.pending_approvals || 0, icon: ClipboardCheck, gradient: 'from-amber-600 to-amber-700' },
            { label: 'Attendance', value: stats.todays_attendance_rate ? `${stats.todays_attendance_rate}%` : '0%', icon: CalendarCheck, gradient: 'from-rose-600 to-rose-700' },
          ]} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(stats.enrollment_funnel || []).length > 0 && (
              <Card>
                <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-primary-600" /><span>Enrollment Funnel</span>
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.enrollment_funnel.map(c => ({ name: c.name, students: c.students_count || c.students?.length || 0 }))}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="students" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
            {(stats.class_performance || []).length > 0 && (
              <Card>
                <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" /><span>Class Performance</span>
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.class_performance.map(c => ({ name: c.name, avgGrade: c.avg_grade || 0, attendance: c.attendance_rate || 0 }))}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="avgGrade" fill="#10b981" name="Avg Grade %" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="attendance" fill="#4f46e5" name="Attendance %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>

          {stats.todays_timetable?.length > 0 && (
            <Card>
              <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-primary-600" /><span>Today's Schedule</span>
              </h2>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-secondary-200"><th className="text-left py-2 px-2">Time</th><th className="text-left py-2 px-2">Class</th><th className="text-left py-2 px-2">Subject</th><th className="text-left py-2 px-2">Teacher</th></tr></thead>
                <tbody>{stats.todays_timetable.map((tt, i) => (
                  <tr key={i} className="border-b border-secondary-100"><td className="py-2 px-2">{tt.start_time?.substring(0,5)}-{tt.end_time?.substring(0,5)}</td><td className="py-2 px-2">{tt.class?.name}</td><td className="py-2 px-2">{tt.subject?.name}</td><td className="py-2 px-2">{tt.teacher?.name}</td></tr>
                ))}</tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* ───── Assistant Head Dashboard ───── */}
      {user.role === 'assistant_head' && (
        <div className="space-y-6">
          <StatHeader icon={RoleIcon} title={roleTitle} subtitle={t('dashboard.assistant_head_subtitle')} />
          <StatCards items={[
            { label: 'Students', value: stats.total_students || 0, icon: Users, gradient: 'from-primary-600 to-primary-700' },
            { label: 'Teachers', value: stats.total_teachers || 0, icon: GraduationCap, gradient: 'from-emerald-600 to-emerald-700' },
            { label: 'Classes', value: stats.total_classes || 0, icon: BookOpen, gradient: 'from-violet-600 to-violet-700' },
            { label: 'Pending Submissions', value: stats.pending_submissions || 0, icon: ClipboardCheck, gradient: 'from-rose-600 to-rose-700' },
            { label: 'Pending Fees', value: stats.pending_fees || 0, icon: DollarSign, gradient: 'from-amber-600 to-amber-700' },
            { label: "Today's Sessions", value: stats.today_timetable?.length || 0, icon: Clock, gradient: 'from-cyan-600 to-cyan-700' },
          ]} />

          {(stats.class_performance || []).length > 0 && (
            <Card>
              <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-primary-600" /><span>Class Performance</span>
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.class_performance.map(c => ({ name: c.name, students: c.students_count || 0, present: c.present_today || 0, absent: c.absent_today || 0 }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="present" fill="#10b981" name="Present" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {stats.today_timetable?.length > 0 && (
            <Card>
              <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-primary-600" /><span>Today's Timetable</span>
              </h2>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-secondary-200"><th className="text-left py-2 px-2">Time</th><th className="text-left py-2 px-2">Class</th><th className="text-left py-2 px-2">Subject</th><th className="text-left py-2 px-2">Teacher</th></tr></thead>
                <tbody>{stats.today_timetable.map((tt, i) => (
                  <tr key={i} className="border-b border-secondary-100"><td className="py-2 px-2">{tt.start_time?.substring(0,5)}-{tt.end_time?.substring(0,5)}</td><td className="py-2 px-2">{tt.class?.name}</td><td className="py-2 px-2">{tt.subject?.name}</td><td className="py-2 px-2">{tt.teacher?.name}</td></tr>
                ))}</tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* ───── Secretary Dashboard ───── */}
      {user.role === 'secretary' && (
        <div className="space-y-6">
          <StatHeader icon={RoleIcon} title={roleTitle} subtitle={t('dashboard.secretary_subtitle')} />
          <StatCards items={[
            { label: 'Total Users', value: stats.total_users || 0, icon: Users, gradient: 'from-primary-600 to-primary-700' },
            { label: 'Students', value: stats.total_students || 0, icon: GraduationCap, gradient: 'from-emerald-600 to-emerald-700' },
            { label: 'Staff', value: stats.total_staff || 0, icon: Users, gradient: 'from-violet-600 to-violet-700' },
            { label: 'Announcements', value: announcements.length, icon: Megaphone, gradient: 'from-amber-600 to-amber-700' },
            { label: "Today's Exams", value: stats.today_exams || 0, icon: BookOpen, gradient: 'from-orange-600 to-orange-700' },
            { label: 'Attendance Marked', value: stats.today_attendances_marked || 0, icon: Clock, gradient: 'from-cyan-600 to-cyan-700' },
          ]} />

          {stats.today_timetable?.length > 0 && (
            <Card>
              <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-primary-600" /><span>Today's Timetable</span>
              </h2>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-secondary-200"><th className="text-left py-2 px-2">Time</th><th className="text-left py-2 px-2">Class</th><th className="text-left py-2 px-2">Subject</th><th className="text-left py-2 px-2">Teacher</th><th className="text-left py-2 px-2">Room</th></tr></thead>
                <tbody>{stats.today_timetable.map((tt, i) => (
                  <tr key={i} className="border-b border-secondary-100"><td className="py-2 px-2">{tt.start_time?.substring(0,5)}-{tt.end_time?.substring(0,5)}</td><td className="py-2 px-2">{tt.class?.name}</td><td className="py-2 px-2">{tt.subject?.name}</td><td className="py-2 px-2">{tt.teacher?.name}</td><td className="py-2 px-2">{tt.room_number}</td></tr>
                ))}</tbody>
              </table>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold flex items-center space-x-2"><Megaphone className="w-4 h-4 text-amber-500" /><span>{t('nav.announcements')}</span></h2>
                <Button size="sm" onClick={() => setShowAnnouncementModal(true)}><Plus className="w-4 h-4 mr-1" /> {t('common.new')}</Button>
              </div>
              {announcements.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {announcements.map((a, i) => (
                    <div key={i} className="p-3 border border-secondary-200 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-secondary-900 truncate">{a.title}</h3>
                            {a.is_public ? <Globe className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <Lock className="w-3.5 h-3.5 text-secondary-400 shrink-0" />}
                          </div>
                          <p className="text-sm text-secondary-600 line-clamp-2">{a.content}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-secondary-500">
                            <span className="px-1.5 py-0.5 rounded bg-secondary-100 capitalize">{a.category}</span>
                            <span>{new Date(a.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-secondary-400"><Megaphone className="w-8 h-8 mx-auto mb-2" /><p className="text-sm">{t('common.no_announcements')}</p></div>
              )}
            </Card>
            <Card>
              <h2 className="text-base font-semibold mb-4">{t('secretary.manage_users')}</h2>
              <p className="text-sm text-secondary-500 mb-4">{t('secretary.manage_users_desc')}</p>
              <Button onClick={() => setShowUserModal(true)}><UserPlusIcon className="w-4 h-4 mr-1" /> {t('secretary.create_user')}</Button>
            </Card>
          </div>
        </div>
      )}

      {/* ───── Teacher Dashboard ───── */}
      {user.role === 'teacher' && (
        <div className="space-y-6">
          <StatHeader icon={RoleIcon} title={roleTitle} subtitle={t('dashboard.teacher_subtitle')} />

          {/* Top stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'My Classes', value: stats.assigned_classes || 0, icon: BookOpen, color: 'from-primary-500 to-primary-600' },
              { label: 'My Subjects', value: stats.assigned_subjects || 0, icon: Calendar, color: 'from-emerald-500 to-emerald-600' },
              { label: 'Total Students', value: stats.total_students || 0, icon: Users, color: 'from-violet-500 to-violet-600' },
              { label: 'Today Present', value: stats.today_attendance?.present || 0, icon: CheckCircle, color: 'from-accent-500 to-accent-600' },
              { label: 'Today Absent', value: stats.today_attendance?.absent || 0, icon: XCircle, color: 'from-red-500 to-red-600' },
              { label: 'Marked Today', value: stats.today_attendance?.total_marked || 0, icon: Clock, color: 'from-cyan-500 to-cyan-600' },
            ].map((s, i) => (
              <div key={i} className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${s.color} p-4 shadow-sm`}>
                <p className="text-white/70 text-[11px] font-medium uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
                <s.icon className="absolute right-2 bottom-2 w-8 h-8 text-white/20" />
              </div>
            ))}
          </div>

          {/* My Classes cards */}
          {(stats.classes || []).length > 0 && (
            <Card>
              <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-primary-600" /><span>My Classes</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.classes.map((cls) => (
                  <div key={cls.id} className="p-4 bg-secondary-50 rounded-xl hover:bg-primary-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-secondary-900">{cls.name}{cls.section ? ` - ${cls.section}` : ''}</h3>
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                        {cls.students_count || cls.students?.length || 0} students
                      </span>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <Button size="sm" variant="secondary" onClick={() => navigate('/dashboard/attendance')}>
                        <Clock className="w-3 h-3 mr-1" /> Attendance
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => navigate('/dashboard/grades')}>
                        <TrendingUp className="w-3 h-3 mr-1" /> Grades
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* My Subjects */}
          {(stats.subjects || []).length > 0 && (
            <Card>
              <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                <Award className="w-5 h-5 text-emerald-600" /><span>My Subjects</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {stats.subjects.map((subj) => (
                  <span key={subj.id} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                    {subj.name}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Today's Schedule */}
          {(stats.today_timetable || []).length > 0 && (
            <Card>
              <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary-600" /><span>Today's Schedule</span>
              </h2>
              <div className="space-y-2">
                {stats.today_timetable.map((tt, i) => (
                  <div key={i} className="flex items-center p-3 bg-secondary-50 rounded-lg hover:bg-primary-50/50 transition-colors">
                    <div className="w-14 text-center flex-shrink-0">
                      <p className="text-xs font-bold text-primary-600">{tt.start_time?.substring(0,5)}</p>
                      <p className="text-[10px] text-secondary-400">{tt.end_time?.substring(0,5)}</p>
                    </div>
                    <div className="w-0.5 h-8 bg-primary-200 mx-3 flex-shrink-0 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-900 truncate">{tt.subject?.name}</p>
                      <p className="text-xs text-secondary-500 truncate">{tt.class?.name} · Room {tt.room_number || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Grades + Recent Attendance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(stats.recent_grades || []).length > 0 && (
              <Card>
                <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-violet-600" /><span>Recent Grades</span>
                </h2>
                <div className="space-y-2">
                  {stats.recent_grades.slice(0, 5).map((g, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-secondary-50 rounded-lg">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-violet-600">{g.student?.name?.charAt(0)}</span>
                        </div>
                        <span className="text-sm text-secondary-900 truncate">{g.student?.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="text-sm font-semibold text-secondary-900">{g.percentage}%</span>
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${g.grade === 'A' || g.grade === 'A+' ? 'bg-emerald-100 text-emerald-700' : g.grade === 'B' || g.grade === 'B+' ? 'bg-blue-100 text-blue-700' : g.grade === 'C' ? 'bg-yellow-100 text-yellow-700' : g.grade === 'D' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                          {g.grade}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {(stats.recent_attendances || []).length > 0 && (
              <Card>
                <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-cyan-600" /><span>Recent Attendance</span>
                </h2>
                <div className="space-y-2">
                  {stats.recent_attendances.slice(0, 5).map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-secondary-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary-600">{a.student?.name?.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-secondary-900 truncate">{a.student?.name}</p>
                          <p className="text-[10px] text-secondary-400">{a.class?.name} · {new Date(a.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full capitalize ${
                        a.status === 'present' ? 'bg-green-100 text-green-700' :
                        a.status === 'absent' ? 'bg-red-100 text-red-700' :
                        a.status === 'late' ? 'bg-orange-100 text-orange-700' :
                        a.status === 'excused' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Quick Actions */}
          <Card>
            <h2 className="text-base font-semibold mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/dashboard/attendance')}>
                <Clock className="w-4 h-4 mr-2" /> Mark Attendance
              </Button>
              <Button onClick={() => navigate('/dashboard/grades')}>
                <TrendingUp className="w-4 h-4 mr-2" /> Enter Grades
              </Button>
              <Button onClick={() => navigate('/dashboard/classes')}>
                <BookOpen className="w-4 h-4 mr-2" /> View Classes
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ───── Student Dashboard ───── */}
      {user.role === 'student' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-sm text-secondary-500 mb-1">
                <GraduationCap className="w-4 h-4" />
                <span>Student Portal</span>
              </div>
              <h1 className="text-2xl font-bold text-secondary-900">
                Welcome back, {user.name?.split(' ')[0]}
              </h1>
              <p className="text-secondary-500 mt-0.5">{stats.student?.class?.name || 'Dashboard'}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="secondary" onClick={() => navigate('/dashboard/timetable')}>
                <Calendar className="w-4 h-4 mr-2" /> Timetable
              </Button>
              <Button onClick={() => navigate('/dashboard/grades')}>
                <TrendingUp className="w-4 h-4 mr-2" /> My Grades
              </Button>
            </div>
          </div>

          <StatCards items={[
            { label: 'Attendance Rate', value: (() => { const a = stats.attendance_stats || {}; const t = a.present + a.late + a.absent; return t > 0 ? `${Math.round((a.present / t) * 100)}%` : 'N/A' })(), icon: CheckCircle, gradient: 'from-primary-600 to-primary-700' },
            { label: 'Present Days', value: (stats.attendance_stats || {}).present || 0, icon: CalendarCheck, gradient: 'from-emerald-600 to-emerald-700' },
            { label: 'Average Grade', value: stats.average_grade ? `${stats.average_grade}%` : 'N/A', icon: Award, gradient: 'from-violet-600 to-violet-700' },
            { label: 'Fee Status', value: `$${stats.fee_summary?.paid || 0} / $${stats.fee_summary?.total || 0}`, icon: DollarSign, gradient: 'from-orange-600 to-orange-700' },
          ]} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {stats.today_timetable?.length > 0 && (
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-primary-600" /><span>Today's Schedule</span>
                    </h2>
                    <span className="text-xs text-secondary-400 bg-secondary-100 px-2 py-1 rounded-full capitalize">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="space-y-2">
                    {stats.today_timetable.map((tt, i) => (
                      <div key={i} className="flex items-center p-3 rounded-lg bg-secondary-50 hover:bg-secondary-100 transition-colors">
                        <div className="w-16 text-center flex-shrink-0">
                          <p className="text-xs font-semibold text-primary-600">{tt.start_time?.substring(0,5)}</p>
                          <p className="text-xs text-secondary-400">{tt.end_time?.substring(0,5)}</p>
                        </div>
                        <div className="w-0.5 h-10 bg-primary-200 mx-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-secondary-900 truncate">{tt.subject?.name || 'Lesson'}</p>
                          <p className="text-xs text-secondary-500 truncate">{tt.teacher?.name}{tt.room_number ? ` · ${tt.room_number}` : ''}</p>
                        </div>
                        {tt.timetable_type && (
                          <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 flex-shrink-0">{tt.timetable_type}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {stats.upcoming_exams?.length > 0 && (
                <Card>
                  <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-amber-600" /><span>Upcoming Exams</span>
                  </h2>
                  <div className="space-y-2">
                    {stats.upcoming_exams.map((exam, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                        <div>
                          <p className="text-sm font-medium text-secondary-900">{exam.subject?.name || 'Exam'}</p>
                          <p className="text-xs text-secondary-500">{exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBA'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-amber-700">{exam.exam_date ? Math.ceil((new Date(exam.exam_date) - new Date()) / (1000 * 60 * 60 * 24)) : '-'}d</p>
                          <p className="text-xs text-amber-500">remaining</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {stats.recent_grades?.length > 0 && (
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-violet-600" /><span>Recent Grades</span>
                    </h2>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${GRADE_COLORS[stats.average_grade >= 80 ? 'A' : stats.average_grade >= 70 ? 'B' : stats.average_grade >= 60 ? 'C' : stats.average_grade >= 50 ? 'D' : 'F'] || 'bg-secondary-100 text-secondary-700'} text-white`}>
                      {stats.average_grade ? `${stats.average_grade}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {stats.recent_grades.map((g, i) => {
                      const pct = g.percentage || 0
                      const grade = pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F'
                      return (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-secondary-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-secondary-900 truncate">{g.exam?.subject?.name || g.exam?.name || 'Subject'}</p>
                            <p className="text-xs text-secondary-400">{g.exam?.class?.name || ''}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-24 bg-secondary-100 rounded-full h-2">
                              <div className={`h-2 rounded-full transition-all ${GRADE_COLORS[grade] || 'bg-secondary-400'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`w-8 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white ${GRADE_COLORS[grade] || 'bg-secondary-400'}`}>{grade}</span>
                          </div>
                        </div>
                      )}
                    )}
                  </div>
                </Card>
              )}

              {stats.grade_trends?.length > 0 && (
                <Card>
                  <h2 className="text-base font-semibold mb-4 flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" /><span>Subject Performance</span>
                  </h2>
                  <div className="space-y-3">
                    {Object.values(stats.grade_trends).slice(0, 5).map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-secondary-700 font-medium truncate">{item.subject}</span>
                          <span className="text-secondary-600 font-medium">{item.average}%</span>
                        </div>
                        <div className="w-full bg-secondary-100 rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full transition-all ${item.average >= 70 ? 'bg-emerald-500' : item.average >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(item.average, 100)}%` }} />
                        </div>
                        {item.trend && (
                          <p className={`text-xs mt-0.5 ${item.trend === 'improving' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {item.trend === 'improving' ? '↑ Improving' : '↓ Needs attention'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>

          {(stats.bulletins?.length > 0 || stats.recent_resources?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.bulletins?.length > 0 && (
                <Card>
                  <h3 className="font-semibold mb-3 flex items-center space-x-2">
                    <Megaphone className="w-4 h-4 text-indigo-500" /><span>Announcements</span>
                  </h3>
                  <div className="space-y-3">
                    {stats.bulletins.slice(0, 3).map((b, i) => (
                      <div key={i} className="border-l-2 border-primary-300 pl-3">
                        <p className="text-sm font-medium text-secondary-900 truncate">{b.title}</p>
                        <p className="text-xs text-secondary-500 mt-0.5 line-clamp-1">{b.content}</p>
                        <p className="text-xs text-secondary-400 mt-0.5">{new Date(b.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {stats.recent_resources?.length > 0 && (
                <Card>
                  <h3 className="font-semibold mb-3 flex items-center space-x-2">
                    <FolderOpen className="w-4 h-4 text-emerald-500" /><span>Resources</span>
                  </h3>
                  <div className="space-y-2">
                    {stats.recent_resources.slice(0, 4).map((r, i) => (
                      <div key={i} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary-50 transition-colors">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-secondary-900 truncate">{r.title}</p>
                          <p className="text-xs text-secondary-400">{r.resource_type || r.category || 'Resource'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {!stats.today_timetable?.length && !stats.recent_grades?.length && !stats.bulletins?.length && (
            <Card>
              <div className="py-12 text-center">
                <GraduationCap className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
                <p className="text-lg font-medium text-secondary-900">Welcome to your dashboard!</p>
                <p className="text-sm text-secondary-500 mt-1">Your data will appear here as your teachers update records.</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ───── Parent Dashboard ───── */}
      {user.role === 'parent' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-sm text-secondary-500 mb-1">
                <Users className="w-4 h-4" />
                <span>Parent Portal</span>
              </div>
              <h1 className="text-2xl font-bold text-secondary-900">Welcome, {user.name?.split(' ')[0] || ''}</h1>
              <p className="text-secondary-500 mt-0.5">Monitor your children's academic progress</p>
            </div>
            <Button onClick={() => navigate('/dashboard/children')}>
              <Users className="w-4 h-4 mr-2" /> My Children
            </Button>
          </div>

          <StatCards items={[
            { label: 'Children', value: stats.children?.length || 0, icon: Users, gradient: 'from-primary-600 to-primary-700' },
            { label: 'Total Fees', value: `$${(stats.children || []).reduce((s, c) => s + (c.total_fees || 0), 0)}`, icon: DollarSign, gradient: 'from-orange-600 to-orange-700' },
            { label: 'Pending Fees', value: `$${(stats.children || []).reduce((s, c) => s + (c.pending_fees || 0), 0)}`, icon: CreditCard, gradient: 'from-amber-600 to-amber-700' },
            { label: 'Events', value: stats.upcoming_events?.length || 0, icon: Calendar, gradient: 'from-violet-600 to-violet-700' },
          ]} />

          {stats.children?.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-secondary-900 mb-4 flex items-center space-x-2">
                <Users className="w-4 h-4 text-primary-600" /><span>My Children</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.children.map(child => (
                  <Card key={child.user?.id || child.id} className="hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-sm">{child.user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-secondary-900 truncate">{child.user?.name || child.name}</p>
                        <p className="text-xs text-secondary-500 truncate">{child.class?.name || child.user?.class?.name || 'No class'}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        child.attendance_stats?.today_status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                        child.attendance_stats?.today_status === 'late' ? 'bg-amber-100 text-amber-700' :
                        child.attendance_stats?.today_status === 'absent' ? 'bg-red-100 text-red-700' :
                        'bg-secondary-100 text-secondary-500'
                      }`}>
                        {child.attendance_stats?.today_status === 'present' ? 'Present' :
                         child.attendance_stats?.today_status === 'late' ? 'Late' :
                         child.attendance_stats?.today_status === 'absent' ? 'Absent' :
                         child.attendance_stats?.today_status === 'excused' ? 'Excused' :
                         child.attendance_stats?.today_status === 'permission' ? 'Permission' : 'Not Marked'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                      <div className="p-2 bg-primary-50 rounded">
                        <p className="font-bold text-primary-700">{child.average_grade || 0}%</p>
                        <p className="text-primary-500">Avg Grade</p>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded">
                        <p className="font-bold text-emerald-700">{child.attendance_stats?.present || 0}</p>
                        <p className="text-emerald-500">Present</p>
                      </div>
                      <div className="p-2 bg-amber-50 rounded">
                        <p className="font-bold text-amber-700">${child.pending_fees || 0}</p>
                        <p className="text-amber-500">Due</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => navigate(`/dashboard/child/${child.user?.id || child.id}/attendance`)}
                        className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-secondary-100 hover:bg-primary-100 hover:text-primary-700 transition-colors">Attendance</button>
                      <button onClick={() => navigate(`/dashboard/child/${child.user?.id || child.id}/grades`)}
                        className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-secondary-100 hover:bg-primary-100 hover:text-primary-700 transition-colors">Grades</button>
                      <button onClick={() => navigate(`/dashboard/child/${child.user?.id || child.id}/fees`)}
                        className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-secondary-100 hover:bg-primary-100 hover:text-primary-700 transition-colors">Fees</button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {(stats.upcoming_events?.length > 0 || stats.announcements?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.upcoming_events?.length > 0 && (
                <Card>
                  <h3 className="font-semibold mb-3 flex items-center space-x-2 text-secondary-900">
                    <Calendar className="w-4 h-4 text-amber-500" /><span>Upcoming Events</span>
                  </h3>
                  <div className="space-y-2">
                    {stats.upcoming_events.slice(0, 3).map((e, i) => (
                      <div key={i} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary-50 transition-colors">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-secondary-900 truncate">{e.title}</p>
                          <p className="text-xs text-secondary-500">{e.event_date ? new Date(e.event_date).toLocaleDateString() : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {stats.announcements?.length > 0 && (
                <Card>
                  <h3 className="font-semibold mb-3 flex items-center space-x-2 text-secondary-900">
                    <Megaphone className="w-4 h-4 text-indigo-500" /><span>Announcements</span>
                  </h3>
                  <div className="space-y-3">
                    {stats.announcements.slice(0, 3).map((a, i) => (
                      <div key={i} className="border-l-2 border-indigo-300 pl-3">
                        <p className="text-sm font-medium text-secondary-900 truncate">{a.title}</p>
                        <p className="text-xs text-secondary-500 mt-0.5 line-clamp-1">{a.content}</p>
                        <p className="text-xs text-secondary-400 mt-0.5">{new Date(a.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Announcement Modal (Secretary) ─── */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAnnouncementModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">{t('modal.new_announcement')}</h3>
              <button onClick={() => setShowAnnouncementModal(false)} className="p-1 hover:bg-secondary-100 rounded"><X className="w-5 h-5 text-secondary-500" /></button>
            </div>
            <form onSubmit={async e => { e.preventDefault(); setSubmitting(true); try { const { data } = await axios.post('/api/secretary/announcements', announcementForm); setAnnouncements(prev => [data, ...prev]); setShowAnnouncementModal(false); setAnnouncementForm({ title: '', content: '', category: 'general', is_public: true }); } catch (err) { console.error(err) } finally { setSubmitting(false) } }} className="space-y-4">
              <Input label={t('form.title')} value={announcementForm.title} onChange={e => setAnnouncementForm(f => ({ ...f, title: e.target.value }))} placeholder={t('form.placeholder_title')} required />
              <div><label className="label">{t('form.content')}</label><textarea className="input min-h-[100px] resize-y" value={announcementForm.content} onChange={e => setAnnouncementForm(f => ({ ...f, content: e.target.value }))} placeholder={t('form.placeholder_content')} required /></div>
              <div><label className="label">{t('form.category')}</label>
                <select className="input" value={announcementForm.category} onChange={e => setAnnouncementForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="general">{t('category.general')}</option><option value="academic">{t('category.academic')}</option><option value="event">{t('category.event')}</option><option value="emergency">{t('category.emergency')}</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={announcementForm.is_public} onChange={e => setAnnouncementForm(f => ({ ...f, is_public: e.target.checked }))} className="w-4 h-4 rounded border-secondary-300 text-primary-600" />
                <span className="text-sm text-secondary-700">{t('form.public')}</span>
              </label>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={() => setShowAnnouncementModal(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={submitting}>{submitting ? t('common.creating') : t('common.create')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── User Modal (Secretary) ─── */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowUserModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">{t('modal.create_user')}</h3>
              <button onClick={() => setShowUserModal(false)} className="p-1 hover:bg-secondary-100 rounded"><X className="w-5 h-5 text-secondary-500" /></button>
            </div>
            <form onSubmit={async e => { e.preventDefault(); setSubmitting(true); try { await axios.post('/api/secretary/users', userForm); setShowUserModal(false); setUserForm({ name: '', email: '', password: '', role: 'student' }); } catch (err) { console.error(err) } finally { setSubmitting(false) } }} className="space-y-4">
              <Input label={t('form.full_name')} value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} placeholder={t('form.placeholder_name')} required />
              <Input label={t('form.email')} type="email" icon={Mail} value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder={t('form.placeholder_email')} required />
              <Input label={t('form.password')} type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} placeholder={t('form.placeholder_password')} required />
              <div><label className="label">{t('form.role')}</label>
                <select className="input" value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="student">{t('role.student')}</option><option value="teacher">{t('role.teacher')}</option><option value="parent">{t('role.parent')}</option>
                  <option value="academician">{t('role.academician')}</option><option value="cashier">{t('role.cashier')}</option><option value="secretary">{t('role.secretary')}</option>
                  <option value="head_of_school">{t('role.head_of_school')}</option><option value="assistant_head">{t('role.assistant_head')}</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={() => setShowUserModal(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={submitting}><UserPlus className="w-4 h-4 mr-1" />{submitting ? t('common.creating') : t('modal.create_user')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>) : (<Outlet />)}
    </Layout>
  )
}

// ─── Reusable Dashboard Components ───

const StatHeader = ({ icon: Icon, title, subtitle }) => (
  <div>
    <div className="flex items-center space-x-2 text-sm text-secondary-500 mb-1">
      <Icon className="w-4 h-4" />
      <span>{title}</span>
    </div>
    <h1 className="text-2xl font-bold text-secondary-900">{title}</h1>
    <p className="text-secondary-500 mt-0.5">{subtitle}</p>
  </div>
)

const StatCards = ({ items }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
    {items.map((s, i) => (
      <div key={i} className={`stat-card bg-gradient-to-br ${s.gradient}`}>
        <div className="relative z-10">
          <p className="text-white/70 text-xs">{s.label}</p>
          <p className="text-2xl font-bold mt-1">{s.value}</p>
        </div>
        <s.icon className="w-10 h-10 text-white/30 absolute bottom-3 right-3" />
      </div>
    ))}
  </div>
)

export default Dashboard