'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ROLE_LABELS } from '@/lib/utils'
import { PeopleManagement } from './people-management'
import type { Profile } from '@/types/database'

const ROLE_TABS: { role: string; icon: string; label: string; color: string; activeColor: string }[] = [
  { role: 'consultant', icon: '👑', label: '管理', color: 'border-indigo-300 bg-indigo-50 text-indigo-700', activeColor: 'bg-indigo-600 text-white border-indigo-600' },
  { role: 'admin', icon: '🗂️', label: '行政', color: 'border-blue-300 bg-blue-50 text-blue-700', activeColor: 'bg-blue-600 text-white border-blue-600' },
  { role: 'instructor', icon: '📖', label: '講師', color: 'border-green-300 bg-green-50 text-green-700', activeColor: 'bg-green-600 text-white border-green-600' },
  { role: 'analyst', icon: '🧬', label: '生命教練', color: 'border-pink-300 bg-pink-50 text-pink-700', activeColor: 'bg-pink-600 text-white border-pink-600' },
  { role: 'hr', icon: '🏢', label: 'HR', color: 'border-cyan-300 bg-cyan-50 text-cyan-700', activeColor: 'bg-cyan-600 text-white border-cyan-600' },
  { role: 'manager', icon: '👔', label: '主管', color: 'border-amber-300 bg-amber-50 text-amber-700', activeColor: 'bg-amber-600 text-white border-amber-600' },
  { role: 'employee', icon: '👤', label: '員工', color: 'border-gray-300 bg-gray-50 text-gray-700', activeColor: 'bg-gray-600 text-white border-gray-600' },
  { role: 'student', icon: '🎒', label: '學員', color: 'border-sky-300 bg-sky-50 text-sky-700', activeColor: 'bg-sky-600 text-white border-sky-600' },
]

interface Props { profile: Profile; roles: string[]; data: Record<string, unknown> }

export function UnifiedDashboard({ profile, roles, data }: Props) {
  const availableTabs = ROLE_TABS.filter(t => roles.includes(t.role))
  const [activeRole, setActiveRole] = useState(availableTabs[0]?.role ?? 'employee')

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">歡迎，{profile.full_name ?? '使用者'}！</h1>
      </div>

      {availableTabs.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {availableTabs.map(tab => (
            <button key={tab.role} onClick={() => setActiveRole(tab.role)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border whitespace-nowrap ${
                activeRole === tab.role ? tab.activeColor : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {(activeRole === 'consultant' || activeRole === 'admin') && <ConsultantContent data={data} isAdmin={activeRole === 'admin'} />}
      {activeRole === 'hr' && <HrContent data={data} />}
      {activeRole === 'manager' && <ManagerContent data={data} />}
      {(activeRole === 'instructor' || activeRole === 'supervisor') && <InstructorContent profile={profile} data={data} />}
      {activeRole === 'analyst' && <AnalystContent profile={profile} data={data} />}
      {activeRole === 'employee' && <EmployeeContent data={data} />}
      {activeRole === 'student' && <StudentContent data={data} />}
    </div>
  )
}

// ===== 顧問/行政管理（大改造） =====
function ConsultantContent({ data, isAdmin }: { data: Record<string, unknown>; isAdmin: boolean }) {
  const [subTab, setSubTab] = useState('overview')
  const companies = (data.companies ?? []) as { id: string; name: string; status: string; industry: string | null }[]
  const allPeople = (data.allPeople ?? []) as { id: string; full_name: string | null; email: string; role: string; roles: string[]; company_id: string | null; job_title: string | null; instructor_level: string | null; accumulated_hours: number; average_satisfaction: number; analyst_level: string | null; is_personal_client: boolean }[]
  const allCourses = (data.allCourses ?? []) as { id: string; title: string; status: string; course_type: string; start_date: string | null; hours: number | null; trainer: string | null; company_id: string | null; review_status: string; is_counted_in_hours: boolean; total_revenue: number }[]
  const companyMap = (data.companyMap ?? {}) as Record<string, string>

  const instructors = allPeople.filter(p => p.roles?.includes('instructor') || p.role === 'instructor')
  const analysts = allPeople.filter(p => p.roles?.includes('analyst') || p.role === 'analyst')
  const students = allPeople.filter(p => p.is_personal_client || p.roles?.includes('student'))
  const pendingCourses = allCourses.filter(c => c.review_status === 'pending')

  const subTabs = [
    { id: 'overview', label: '總覽', count: null },
    { id: 'people', label: '生命教練', count: allPeople.length },
    { id: 'instructors', label: '講師管理', count: instructors.length },
    { id: 'courses', label: '課程管理', count: allCourses.length },
    { id: 'review', label: '課程審核', count: pendingCourses.length },
  ]

  return (
    <div>
      {/* 子分頁 */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1">
        {subTabs.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`flex-1 text-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              subTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
            {t.count !== null && t.count > 0 && <span className="ml-1 text-xs text-gray-400">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* 總覽 */}
      {subTab === 'overview' && (() => {
        const monthRev = (data.monthRevenue as number) ?? 0
        const lastRev = (data.lastMonthRevenue as number) ?? 0
        const revChange = lastRev > 0 ? Math.round(((monthRev - lastRev) / lastRev) * 100) : 0
        const upcoming = (data.upcomingCourses ?? []) as { id: string; title: string; start_date: string | null; trainer: string | null; company_id: string | null }[]
        const upcomingAssessments = (data.upcomingAssessments ?? []) as { id: string; full_name: string | null; email: string; company_id: string | null; scheduled_assessment_date: string; line_user_id: string | null }[]
        const trainerWork = (data.trainerWorkload ?? []) as [string, number][]
        const maxWork = trainerWork[0]?.[1] ?? 1
        const pendingApprovals = (data.pendingApprovalCount as number) ?? 0
        const noSurvey = (data.noSurveyCount as number) ?? 0
        const pendingTodo = (data.pendingTodoCount as number) ?? 0
        const pendingOrder = (data.pendingOrderCount as number) ?? 0

        return (
          <>
            {/* 營收 + 核心指標 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-4 text-white">
                <p className="text-indigo-200 text-xs">本月營收</p>
                <p className="text-2xl font-bold mt-1">NT$ {monthRev.toLocaleString()}</p>
                {revChange !== 0 && (
                  <p className={`text-xs mt-1 ${revChange > 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {revChange > 0 ? '↑' : '↓'} {Math.abs(revChange)}% vs 上月
                  </p>
                )}
              </div>
              <StatCard label="企業數" value={companies.length} sub={`輔導中 ${companies.filter(c => c.status === 'active').length}`} color="text-indigo-600" />
              <StatCard label="講師" value={instructors.length} color="text-green-600" />
              <StatCard label="課程總數" value={allCourses.length} sub={`待審 ${pendingCourses.length}`} color="text-amber-600" />
            </div>

            {/* 待處理清單 */}
            {(pendingCourses.length > 0 || pendingOrder > 0 || pendingApprovals > 0 || pendingTodo > 0 || noSurvey > 0) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-amber-800 mb-2">待處理</p>
                <div className="flex flex-wrap gap-3">
                  {pendingCourses.length > 0 && <Link href="/courses" className="text-xs bg-white rounded-lg px-3 py-2 border border-amber-200 text-amber-700 hover:bg-amber-100">待審課程 <strong>{pendingCourses.length}</strong></Link>}
                  {pendingOrder > 0 && <Link href="/product-management" className="text-xs bg-white rounded-lg px-3 py-2 border border-amber-200 text-amber-700 hover:bg-amber-100">待確認訂單 <strong>{pendingOrder}</strong></Link>}
                  {pendingApprovals > 0 && <span className="text-xs bg-white rounded-lg px-3 py-2 border border-amber-200 text-amber-700">待簽核 <strong>{pendingApprovals}</strong></span>}
                  {pendingTodo > 0 && <Link href="/todos" className="text-xs bg-white rounded-lg px-3 py-2 border border-amber-200 text-amber-700 hover:bg-amber-100">待辦事項 <strong>{pendingTodo}</strong></Link>}
                  {noSurvey > 0 && <span className="text-xs bg-white rounded-lg px-3 py-2 border border-amber-200 text-amber-700">未回填滿意度 <strong>{noSurvey}</strong></span>}
                </div>
              </div>
            )}

            {/* 近期評量提醒 */}
            {upcomingAssessments.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-purple-800 mb-2">🧠 近期評量（7 天內）</p>
                <div className="space-y-2">
                  {upcomingAssessments.map(a => {
                    const days = Math.ceil((new Date(a.scheduled_assessment_date).getTime() - new Date().getTime()) / (1000*60*60*24))
                    return (
                      <div key={a.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-purple-100">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{a.full_name ?? a.email}</p>
                          <p className="text-xs text-gray-400">
                            {a.scheduled_assessment_date}
                            {a.company_id ? ` · ${companyMap[a.company_id] ?? ''}` : ' · 個人'}
                            {days === 0 ? <span className="text-red-600 font-medium ml-1">今天！</span> : <span className="text-purple-600 ml-1">{days} 天後</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {a.line_user_id ? (
                            <span className="text-[10px] bg-green-100 text-green-700 rounded px-1.5 py-0.5">LINE 已綁</span>
                          ) : (
                            <span className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">未綁 LINE</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* 近期課程 */}
              <Card>
                <CardHeader><p className="font-semibold text-gray-900">近期課程（7 天內）</p></CardHeader>
                <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                  {upcoming.length === 0 ? (
                    <p className="px-6 py-6 text-sm text-gray-400 text-center">未來 7 天沒有課程</p>
                  ) : upcoming.map(c => (
                    <div key={c.id} className="px-6 py-2.5">
                      <p className="text-sm font-medium text-gray-900">{c.title}</p>
                      <p className="text-xs text-gray-400">{c.start_date} · {c.trainer ?? '—'} · {c.company_id ? (companyMap[c.company_id] ?? '') : '公開課'}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 講師工作量 */}
              <Card>
                <CardHeader><p className="font-semibold text-gray-900">本月講師工作量</p></CardHeader>
                <div className="px-6 py-3">
                  {trainerWork.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">本月無課程</p>
                  ) : trainerWork.slice(0, 8).map(([name, hrs]) => (
                    <div key={name} className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-gray-700 w-20 truncate">{name}</span>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full">
                        <div className="h-3 bg-indigo-500 rounded-full" style={{ width: `${(hrs / maxWork) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">{hrs}h</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* 快捷入口 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <QuickLink href="/companies" icon="🏢" title="企業管理" desc={`${companies.length} 家`} />
              <QuickLink href="/courses" icon="📚" title="課程管理" desc={`${allCourses.length} 堂`} />
              <QuickLink href="/knowledge-base" icon="📋" title="知識庫" />
              <QuickLink href="/crm" icon="💬" title="互動紀錄" />
              <QuickLink href="/todos" icon="✅" title="待辦事項" />
              <QuickLink href="/product-management" icon="🛒" title="產品管理" />
              <QuickLink href="/meetings" icon="📅" title="會議記錄" />
              <QuickLink href="/profile" icon="⚙️" title="個人設定" />
            </div>
          </>
        )
      })()}

      {/* 人才管理 */}
      {subTab === 'people' && <PeopleManagement people={allPeople} companyMap={companyMap} courses={allCourses} />}

      {/* 講師管理 */}
      {subTab === 'instructors' && <InstructorTab instructors={instructors} />}

      {/* 課程管理 */}
      {subTab === 'courses' && <CourseTab courses={allCourses} companyMap={companyMap} />}

      {/* 課程審核 */}
      {subTab === 'review' && <ReviewTab courses={pendingCourses} companyMap={companyMap} isAdmin={isAdmin} />}
    </div>
  )
}

// ===== 人才管理 =====
function PeopleTab({ people, companyMap }: { people: { id: string; full_name: string | null; email: string; role: string; roles: string[]; company_id: string | null; job_title: string | null; instructor_level: string | null; analyst_level: string | null; is_personal_client: boolean }[]; companyMap: Record<string, string> }) {
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')

  const filtered = people.filter(p => {
    if (search && !(p.full_name ?? '').includes(search) && !p.email.includes(search)) return false
    if (filterRole && !p.roles?.includes(filterRole) && p.role !== filterRole) return false
    return true
  })

  return (
    <>
      <div className="flex gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋姓名或 email..."
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
          <option value="">全部角色</option>
          <option value="instructor">講師</option>
          <option value="analyst">分析師</option>
          <option value="student">學員</option>
          <option value="employee">員工</option>
          <option value="hr">HR</option>
          <option value="manager">主管</option>
        </select>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">姓名</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">角色</th>
                <th className="px-4 py-2 text-left">企業</th>
                <th className="px-4 py-2 text-left">職稱</th>
                <th className="px-4 py-2 text-left">等級</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.slice(0, 50).map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{p.full_name || '—'}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{p.email}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {(p.roles ?? [p.role]).map(r => (
                        <span key={r} className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{ROLE_LABELS[r] ?? r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{p.company_id ? (companyMap[p.company_id] ?? '—') : p.is_personal_client ? '個人' : '—'}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{p.job_title ?? '—'}</td>
                  <td className="px-4 py-2 text-xs">{p.instructor_level ?? p.analyst_level ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-gray-400 text-sm py-8">沒有符合的人員</p>}
          {filtered.length > 50 && <p className="text-center text-gray-400 text-xs py-2">顯示前 50 筆，共 {filtered.length} 筆</p>}
        </div>
      </Card>
    </>
  )
}

// ===== 講師管理 =====
function InstructorTab({ instructors }: { instructors: { id: string; full_name: string | null; email: string; instructor_level: string | null; accumulated_hours: number; average_satisfaction: number }[] }) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-2 text-left">講師</th>
              <th className="px-4 py-2 text-left">等級</th>
              <th className="px-4 py-2 text-right">累計時數</th>
              <th className="px-4 py-2 text-right">平均滿意度</th>
              <th className="px-4 py-2 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {instructors.map(i => (
              <tr key={i.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{i.full_name || '—'}</p>
                  <p className="text-xs text-gray-400">{i.email}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={i.instructor_level === '督導講師' ? 'warning' : i.instructor_level === '資深講師' ? 'info' : 'default'}>
                    {i.instructor_level ?? '儲備講師'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-medium">{i.accumulated_hours ?? 0}h</td>
                <td className="px-4 py-3 text-right">
                  {i.average_satisfaction > 0 ? (
                    <span className={i.average_satisfaction >= 90 ? 'text-green-600' : i.average_satisfaction >= 80 ? 'text-amber-600' : 'text-red-600'}>
                      {i.average_satisfaction}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <Link href={`/my-talent?view=${i.id}`} className="text-xs text-indigo-600 hover:text-indigo-700 mr-2">天賦</Link>
                  <ExtraHoursButton instructorId={i.id} instructorName={i.full_name ?? ''} />
                </td>
              </tr>
            ))}
            {instructors.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 text-sm py-8">尚無講師</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ===== 課程管理 =====
function CourseTab({ courses, companyMap }: { courses: { id: string; title: string; course_type: string; start_date: string | null; hours: number | null; trainer: string | null; company_id: string | null; review_status: string; total_revenue: number }[]; companyMap: Record<string, string> }) {
  const [filter, setFilter] = useState('')
  const filtered = filter ? courses.filter(c => c.course_type === filter) : courses

  return (
    <>
      <div className="flex gap-2 mb-4">
        {['', 'enterprise', 'public'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full ${filter === f ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>
            {f === '' ? '全部' : f === 'enterprise' ? '企業內訓' : '公開課'}
          </button>
        ))}
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">課程</th>
                <th className="px-4 py-2 text-left">類型</th>
                <th className="px-4 py-2 text-left">企業/日期</th>
                <th className="px-4 py-2 text-left">講師</th>
                <th className="px-4 py-2 text-center">審核</th>
                <th className="px-4 py-2 text-right">營收</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.slice(0, 30).map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{c.title}</td>
                  <td className="px-4 py-2">
                    <Badge variant={c.course_type === 'enterprise' ? 'info' : 'warning'}>
                      {c.course_type === 'enterprise' ? '企業' : '公開'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {c.company_id ? (companyMap[c.company_id] ?? '') : '—'}<br/>{c.start_date ?? ''}
                  </td>
                  <td className="px-4 py-2 text-gray-700">{c.trainer ?? '—'}</td>
                  <td className="px-4 py-2 text-center">
                    <Badge variant={c.review_status === 'approved' ? 'success' : c.review_status === 'pending' ? 'warning' : 'danger'}>
                      {c.review_status === 'approved' ? '核准' : c.review_status === 'pending' ? '待審' : '退回'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700">{c.total_revenue > 0 ? `$${c.total_revenue.toLocaleString()}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-gray-400 text-sm py-8">沒有課程</p>}
        </div>
      </Card>
    </>
  )
}

// ===== 課程審核 =====
function ReviewTab({ courses, companyMap, isAdmin }: { courses: { id: string; title: string; start_date: string | null; trainer: string | null; company_id: string | null; hours: number | null }[]; companyMap: Record<string, string>; isAdmin: boolean }) {
  if (isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">行政人員無課程核定權限</p>
        <p className="text-sm text-gray-400">請由顧問（管理者）進行課程審核</p>
      </div>
    )
  }

  return (
    <Card>
      <div className="divide-y divide-gray-100">
        {courses.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">沒有待審課程</p>
        ) : courses.map(c => (
          <div key={c.id} className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{c.title}</p>
              <p className="text-xs text-gray-400">{c.company_id ? (companyMap[c.company_id] ?? '—') : '公開課'} · {c.start_date ?? '未排期'} · {c.trainer ?? '無講師'}</p>
            </div>
            <Link href={`/courses?selected=${c.id}`} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 rounded-lg px-3 py-1.5">
              審核
            </Link>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ===== 快捷入口 =====
function QuickLink({ href, icon, title, desc }: { href: string; icon: string; title: string; desc?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        {desc && <p className="text-xs text-gray-400">{desc}</p>}
      </div>
    </Link>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ===== 其他角色（簡化版，保持原有邏輯） =====
function HrContent({ data }: { data: Record<string, unknown> }) {
  const employees = (data.hrEmployees ?? []) as { id: string; full_name: string | null; email: string }[]
  const courses = (data.hrCourses ?? []) as { id: string; title: string; status: string }[]
  const documents = (data.hrDocuments ?? []) as { id: string; status: string }[]
  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="員工" value={employees.length} color="text-gray-900" />
        <StatCard label="進行中" value={courses.filter(c => c.status === 'in_progress').length} color="text-yellow-600" />
        <StatCard label="已完成" value={courses.filter(c => c.status === 'completed').length} color="text-green-600" />
        <StatCard label="文件" value={`${documents.filter(d => d.status === 'approved').length}/${documents.length}`} color="text-indigo-600" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card><CardHeader><p className="font-semibold text-gray-900">最近課程</p></CardHeader>
          <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
            {courses.slice(0, 5).map(c => <div key={c.id} className="px-6 py-2.5 text-sm text-gray-700">{c.title}</div>)}
          </div>
        </Card>
        <Card><CardHeader><p className="font-semibold text-gray-900">員工</p></CardHeader>
          <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
            {employees.slice(0, 8).map(e => <div key={e.id} className="px-6 py-2 text-sm text-gray-700">{e.full_name || e.email}</div>)}
          </div>
        </Card>
      </div>
    </>
  )
}

function ManagerContent({ data }: { data: Record<string, unknown> }) {
  const employees = (data.managerEmployees ?? []) as { id: string; full_name: string | null; email: string }[]
  return (
    <>
      <StatCard label="部門人數" value={employees.length} color="text-gray-900" />
      <Card className="mt-4"><CardHeader><p className="font-semibold text-gray-900">部門成員</p></CardHeader>
        <div className="divide-y divide-gray-100">
          {employees.map(e => <div key={e.id} className="px-6 py-2.5 text-sm text-gray-700">{e.full_name || e.email}</div>)}
          {employees.length === 0 && <p className="px-6 py-8 text-sm text-gray-400 text-center">尚無成員</p>}
        </div>
      </Card>
    </>
  )
}

function InstructorContent({ profile, data }: { profile: Profile; data: Record<string, unknown> }) {
  const courses = (data.instructorCourses ?? []) as { id: string; title: string; start_date: string | null; hours: number | null; review_status: string | null; is_counted_in_hours: boolean | null }[]
  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="累計時數" value={profile.accumulated_hours ?? 0} color="text-indigo-600" />
        <StatCard label="核准" value={courses.filter(c => c.review_status === 'approved' || c.is_counted_in_hours).length} color="text-green-600" />
        <StatCard label="滿意度" value={profile.average_satisfaction > 0 ? profile.average_satisfaction : '—'} color="text-amber-600" />
        <StatCard label="等級" value={profile.instructor_level ?? '儲備講師'} color="text-gray-900" />
      </div>
      <Card><CardHeader><p className="font-semibold text-gray-900">教學紀錄</p></CardHeader>
        <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
          {courses.map(c => (
            <div key={c.id} className="px-6 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{c.title}</p>
                <p className="text-xs text-gray-400">{c.start_date ?? ''}{c.hours ? ` · ${c.hours}h` : ''}</p>
              </div>
              <Badge variant={c.review_status === 'approved' || c.is_counted_in_hours ? 'success' : c.review_status === 'pending' ? 'warning' : 'danger'}>
                {c.review_status === 'approved' || c.is_counted_in_hours ? '核准' : c.review_status === 'pending' ? '待審' : '退回'}
              </Badge>
            </div>
          ))}
          {courses.length === 0 && <p className="px-6 py-8 text-sm text-gray-400 text-center">尚無教學紀錄</p>}
        </div>
      </Card>
    </>
  )
}

function AnalystContent({ profile, data }: { profile: Profile; data: Record<string, unknown> }) {
  const cases = (data.analystCases ?? []) as { id: string; case_title: string; status: string; client_name: string | null }[]
  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="累計個案" value={(data.analystCaseCount ?? 0) as number} color="text-indigo-600" />
        <StatCard label="等級" value={profile.analyst_level ?? '三級皮紋評量分析師'} color="text-gray-900" />
        <StatCard label="進行中" value={cases.filter(c => c.status === 'in_progress').length} color="text-yellow-600" />
      </div>
      <Card><CardHeader><p className="font-semibold text-gray-900">最近個案</p></CardHeader>
        <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
          {cases.slice(0, 8).map(c => (
            <div key={c.id} className="px-6 py-2.5 flex items-center justify-between">
              <div><p className="text-sm text-gray-900">{c.case_title}</p>{c.client_name && <p className="text-xs text-gray-400">{c.client_name}</p>}</div>
              <Badge variant={c.status === 'completed' ? 'success' : 'warning'}>{c.status === 'completed' ? '完成' : '進行中'}</Badge>
            </div>
          ))}
          {cases.length === 0 && <p className="px-6 py-8 text-sm text-gray-400 text-center">尚無個案</p>}
        </div>
      </Card>
    </>
  )
}

const FORM_TYPE_LABELS: Record<string, string> = {
  job_analysis: '工作分析',
  job_description: '工作說明書',
  competency_standard: '職能標準',
  competency_assessment: '職能考核',
}

const ENTRY_STATUS_MAP: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' }> = {
  draft:       { label: '草稿',   variant: 'default' },
  in_progress: { label: '填寫中', variant: 'info' },
  submitted:   { label: '已送審', variant: 'warning' },
  reviewed:    { label: '已審閱', variant: 'info' },
  approved:    { label: '已核准', variant: 'success' },
}

function EmployeeContent({ data }: { data: Record<string, unknown> }) {
  const enrollments = (data.enrollments ?? []) as { id: string; status: string; course: { title: string; start_date: string | null; hours: number | null; course_type: string } | null }[]
  const companyEnrollments = enrollments.filter(e => e.course?.course_type === 'enterprise')
  const companyId = (data.employeeCompanyId as string) ?? ''
  const formEntries = (data.myFormEntries ?? []) as { id: string; form_type: string; status: string; created_at: string }[]
  const pendingEntries = formEntries.filter(e => e.status !== 'approved')
  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="企業" value={(data.employeeCompanyName as string) ?? '—'} color="text-indigo-600" />
        <StatCard label="企業課程" value={companyEnrollments.length} color="text-green-600" />
        <StatCard label="待填表單" value={pendingEntries.length} color={pendingEntries.length > 0 ? 'text-red-600' : 'text-gray-400'} />
      </div>

      {/* 待填表單 — 最優先顯示 */}
      {formEntries.length > 0 && (
        <Card className="mb-6">
          <CardHeader><p className="font-semibold text-gray-900">我的表單</p></CardHeader>
          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {formEntries.map(e => {
              const st = ENTRY_STATUS_MAP[e.status] ?? ENTRY_STATUS_MAP.draft
              return (
                <Link key={e.id} href={`/companies/${companyId}/competency/entries/${e.id}`}
                  className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{FORM_TYPE_LABELS[e.form_type] ?? e.form_type}</p>
                    <p className="text-xs text-gray-400">{new Date(e.created_at).toLocaleDateString('zh-TW')}</p>
                  </div>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </Link>
              )
            })}
          </div>
        </Card>
      )}

      <Card><CardHeader><p className="font-semibold text-gray-900">企業課程紀錄</p></CardHeader>
        <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
          {companyEnrollments.map(e => (
            <div key={e.id} className="px-6 py-2.5 flex items-center justify-between">
              <p className="text-sm text-gray-900">{e.course?.title ?? '課程'}</p>
              <Badge variant={e.status === 'completed' ? 'success' : 'warning'}>{e.status === 'completed' ? '完成' : '進行中'}</Badge>
            </div>
          ))}
          {companyEnrollments.length === 0 && <p className="px-6 py-8 text-sm text-gray-400 text-center">尚無紀錄</p>}
        </div>
      </Card>
    </>
  )
}

function StudentContent({ data }: { data: Record<string, unknown> }) {
  const enrollments = (data.enrollments ?? []) as { id: string; status: string; course: { title: string; start_date: string | null; hours: number | null; course_type: string } | null }[]
  const completed = enrollments.filter(e => e.status === 'completed').length
  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="已完成" value={completed} color="text-green-600" />
        <StatCard label="時數" value={enrollments.filter(e => e.status === 'completed').reduce((s, e) => s + (e.course?.hours ?? 0), 0)} sub="小時" color="text-indigo-600" />
        <StatCard label="進行中" value={enrollments.filter(e => e.status !== 'completed').length} color="text-yellow-600" />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <QuickLink href="/shop" icon="🛒" title="課程商店" />
        <QuickLink href="/my-orders" icon="📦" title="我的訂單" />
        <QuickLink href="/my-talent" icon="🧠" title="天賦評量" />
      </div>
      <Card><CardHeader><p className="font-semibold text-gray-900">學習紀錄</p></CardHeader>
        <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
          {enrollments.map(e => (
            <div key={e.id} className="px-6 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">{e.course?.title ?? '課程'}</p>
                <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${e.course?.course_type === 'enterprise' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                  {e.course?.course_type === 'enterprise' ? '企業' : '個人'}
                </span>
              </div>
              <Badge variant={e.status === 'completed' ? 'success' : 'warning'}>{e.status === 'completed' ? '完成' : '進行中'}</Badge>
            </div>
          ))}
          {enrollments.length === 0 && <p className="px-6 py-8 text-sm text-gray-400 text-center">尚無紀錄</p>}
        </div>
      </Card>
    </>
  )
}

// ===== 講師額外時數按鈕 =====
function ExtraHoursButton({ instructorId, instructorName }: { instructorId: string; instructorName: string }) {
  const [open, setOpen] = useState(false)
  const [hours, setHours] = useState('')
  const [reason, setReason] = useState('')
  const router = useRouter()

  async function handleAdd() {
    if (!hours) return
    await fetch('/api/instructor-extra-hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructor_id: instructorId, hours: Number(hours), reason: reason || null, date: new Date().toISOString().split('T')[0] }),
    })
    setOpen(false); setHours(''); setReason('')
    router.refresh()
  }

  if (!open) return <button onClick={() => setOpen(true)} className="text-xs text-amber-600 hover:text-amber-700">+時數</button>

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-xl p-5 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
        <p className="text-sm font-bold text-gray-900 mb-3">新增額外時數 — {instructorName}</p>
        <div className="space-y-2 mb-3">
          <input type="number" value={hours} onChange={e => setHours(e.target.value)} placeholder="時數 *" autoFocus
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="原因（選填）"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleAdd} disabled={!hours} className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded px-3 py-1.5 disabled:opacity-50">新增</button>
          <button onClick={() => setOpen(false)} className="text-xs text-gray-400 px-2">取消</button>
        </div>
      </div>
    </div>
  )
}
