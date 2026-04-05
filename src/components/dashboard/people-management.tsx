'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ROLE_LABELS } from '@/lib/utils'

interface Person {
  id: string; full_name: string | null; email: string; role: string; roles: string[]
  company_id: string | null; job_title?: string | null; birthday?: string | null
  instructor_level: string | null; accumulated_hours: number; average_satisfaction: number
  analyst_level: string | null; is_personal_client: boolean
  customer_level?: string | null; total_spending?: number; phone?: string | null; gender?: string | null
  r1_pattern?: string | null; l2_pattern?: string | null
  has_full_assessment?: boolean
  [key: string]: unknown
}

interface CourseRecord {
  id: string; title: string; start_date: string | null; hours: number | null; trainer: string | null
  company_id: string | null; review_status: string; total_revenue: number
  [key: string]: unknown
}

interface SurveyRecord {
  courseName: string
  courseDate: string | null
  scores: { le: number; ce: number; ie: number; ve: number; overall: number }
  submittedAt: string
}

interface Props {
  people: Person[]
  companyMap: Record<string, string>
  courses?: CourseRecord[]
  ordersByPerson?: Record<string, { id: string; product_name: string | null; amount: number; status: string; created_at: string }[]>
  surveyHistory?: Record<string, SurveyRecord[]>
}

function daysUntilBirthday(birthday: string | null | undefined): number | null {
  if (!birthday) return null
  const today = new Date()
  const bday = new Date(birthday)
  const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
  if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1)
  return Math.ceil((thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatBirthday(birthday: string | null | undefined): string {
  if (!birthday) return ''
  return `${new Date(birthday).getMonth() + 1}/${new Date(birthday).getDate()}`
}

export function PeopleManagement({ people, companyMap, courses, ordersByPerson, surveyHistory }: Props) {
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'birthday' | 'spending'>('name')
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)

  let filtered = people.filter(p => {
    if (search && !(p.full_name ?? '').toLowerCase().includes(search.toLowerCase()) && !p.email.toLowerCase().includes(search.toLowerCase()) && !(p.phone ?? '').includes(search)) return false
    if (filterRole && !(p.roles ?? []).includes(filterRole) && p.role !== filterRole) return false
    if (filterLevel && p.customer_level !== filterLevel) return false
    return true
  })

  if (sortBy === 'birthday') {
    filtered = [...filtered].sort((a, b) => (daysUntilBirthday(a.birthday) ?? 999) - (daysUntilBirthday(b.birthday) ?? 999))
  } else if (sortBy === 'spending') {
    filtered = [...filtered].sort((a, b) => (b.total_spending ?? 0) - (a.total_spending ?? 0))
  }

  // 近期生日（7天內）
  const upcomingBirthdays = people.filter(p => {
    const days = daysUntilBirthday(p.birthday)
    return days !== null && days <= 7
  }).sort((a, b) => (daysUntilBirthday(a.birthday) ?? 999) - (daysUntilBirthday(b.birthday) ?? 999))

  return (
    <>
      {/* 近期生日提醒 */}
      {upcomingBirthdays.length > 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-pink-700 mb-2">🎂 近期生日（7 天內）</p>
          <div className="flex flex-wrap gap-3">
            {upcomingBirthdays.map(p => {
              const days = daysUntilBirthday(p.birthday)!
              return (
                <button key={p.id} onClick={() => setSelectedPerson(p)}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${days === 0 ? 'bg-red-100 border-red-300 text-red-700 font-bold' : 'bg-white border-pink-200 text-pink-700 hover:bg-pink-100'}`}>
                  {p.full_name ?? p.email} · {formatBirthday(p.birthday)}
                  {days === 0 ? ' 🎉今天！' : ` ${days}天後`}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 搜尋 + 篩選 */}
      <div className="flex gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋姓名、email、電話..."
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
          <option value="">全部角色</option>
          <option value="instructor">講師</option>
          <option value="analyst">分析師</option>
          <option value="student">個人學員</option>
          <option value="employee">企業員工</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'name' | 'birthday' | 'spending')}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
          <option value="name">預設排序</option>
          <option value="birthday">按生日排序</option>
          <option value="spending">按消費排序</option>
        </select>
      </div>

      <p className="text-xs text-gray-400 mb-3">{filtered.length} 人</p>

      {/* 人員卡片列表 */}
      <div className="space-y-2">
        {filtered.slice(0, 50).map(p => {
          const bdays = daysUntilBirthday(p.birthday)
          const hasInstructor = (p.roles ?? []).includes('instructor')
          const hasAnalyst = (p.roles ?? []).includes('analyst')

          return (
            <button key={p.id} onClick={() => setSelectedPerson(p)}
              className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-gray-900">{p.full_name || '—'}</span>
                    {p.customer_level && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">{p.customer_level}</span>
                    )}
                    {bdays !== null && bdays <= 7 && (
                      <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${bdays === 0 ? 'bg-red-100 text-red-700' : 'bg-pink-100 text-pink-600'}`}>
                        🎂 {bdays === 0 ? '今天！' : `${bdays}天後`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{p.email}{p.phone ? ` · ${p.phone}` : ''}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(p.roles ?? [p.role]).map(r => (
                      <span key={r} className="text-[10px] bg-indigo-50 text-indigo-700 rounded px-1.5 py-0.5">{ROLE_LABELS[r] ?? r}</span>
                    ))}
                    {p.company_id && companyMap[p.company_id] && (
                      <span className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{companyMap[p.company_id]}</span>
                    )}
                    {p.is_personal_client && !p.company_id && (
                      <span className="text-[10px] bg-orange-50 text-orange-600 rounded px-1.5 py-0.5">個人</span>
                    )}
                    {p.has_full_assessment && (
                      <span className="text-[10px] bg-purple-50 text-purple-600 rounded px-1.5 py-0.5">完整評量</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  {hasInstructor && (
                    <div className="text-xs text-gray-500 mb-0.5">
                      <span className="font-medium text-green-600">{p.instructor_level ?? '儲備'}</span> · {p.accumulated_hours ?? 0}h
                      {p.average_satisfaction > 0 && <span> · 滿意度 {p.average_satisfaction}</span>}
                    </div>
                  )}
                  {hasAnalyst && (
                    <div className="text-xs text-gray-500">{p.analyst_level ?? '三級皮紋評量分析師'}</div>
                  )}
                  {(p.total_spending ?? 0) > 0 && (
                    <div className="text-xs text-gray-400">消費 NT${(p.total_spending ?? 0).toLocaleString()}</div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {filtered.length > 50 && <p className="text-center text-xs text-gray-400 mt-3">顯示前 50 筆，共 {filtered.length} 筆</p>}

      {/* 人員詳情 Modal */}
      {selectedPerson && (
        <PersonDetailModal
          person={selectedPerson}
          companyMap={companyMap}
          courses={courses ?? []}
          ordersByPerson={ordersByPerson}
          surveyHistory={surveyHistory}
          onClose={() => setSelectedPerson(null)}
        />
      )}
    </>
  )
}

// ===== 人員詳情 Modal =====
function PersonDetailModal({ person: p, companyMap, courses, ordersByPerson, surveyHistory, onClose }: {
  person: Person; companyMap: Record<string, string>; courses: CourseRecord[]
  ordersByPerson?: Record<string, { id: string; product_name: string | null; amount: number; status: string; created_at: string }[]>
  surveyHistory?: Record<string, SurveyRecord[]>
  onClose: () => void
}) {
  const [tab, setTab] = useState('info')
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const roles = p.roles ?? [p.role]
  const hasInstructor = roles.includes('instructor')
  const hasAnalyst = roles.includes('analyst')
  const hasStudent = roles.includes('student') || roles.includes('employee')
  const bdays = daysUntilBirthday(p.birthday)

  const instructorCourses = courses.filter(c => c.trainer === p.full_name)

  const tabs = [
    { id: 'info', label: '基本資料' },
    ...(hasInstructor ? [{ id: 'instructor', label: '講師資料' }] : []),
    ...(hasAnalyst ? [{ id: 'analyst', label: '分析師' }] : []),
    { id: 'talent', label: '評量報告' },
    ...(hasStudent ? [{ id: 'learning', label: '學習履歷' }] : []),
    { id: 'purchases', label: '購買紀錄' },
    { id: 'surveys', label: '問卷紀錄' },
  ]

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{p.full_name || p.email}</h2>
                {p.customer_level && (
                  <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">{p.customer_level}</span>
                )}
                {bdays !== null && bdays <= 7 && (
                  <span className={`text-xs rounded-full px-2 py-0.5 ${bdays === 0 ? 'bg-red-100 text-red-700' : 'bg-pink-100 text-pink-600'}`}>
                    🎂 {bdays === 0 ? '今天生日！' : `${bdays}天後生日`}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-0.5">{p.email}{p.phone ? ` · ${p.phone}` : ''}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {roles.map(r => (
                  <span key={r} className="text-xs bg-indigo-50 text-indigo-700 rounded px-2 py-0.5 font-medium">{ROLE_LABELS[r] ?? r}</span>
                ))}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap ${tab === t.id ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'info' && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Field label="姓名" value={p.full_name} />
              <Field label="Email" value={p.email} />
              <Field label="電話" value={p.phone} />
              <Field label="性別" value={p.gender} />
              <Field label="生日" value={p.birthday ? `${p.birthday}${bdays !== null && bdays <= 7 ? ` 🎂 ${bdays === 0 ? '今天！' : `${bdays}天後`}` : ''}` : null} />
              <Field label="企業" value={p.company_id ? (companyMap[p.company_id] ?? '—') : p.is_personal_client ? '個人客戶' : '—'} />
              <Field label="職稱" value={p.job_title} />
              <Field label="客戶分級" value={p.customer_level} />
              <Field label="總消費" value={(p.total_spending ?? 0) > 0 ? `NT$ ${(p.total_spending ?? 0).toLocaleString()}` : '—'} />
              <Field label="R1 管理力" value={p.r1_pattern} />
              <Field label="L2 心像力" value={p.l2_pattern} />
              <Field label="角色" value={roles.map(r => ROLE_LABELS[r] ?? r).join('、')} />
            </div>
          )}

          {tab === 'instructor' && (() => {
            const approvedCount = instructorCourses.filter(c => c.review_status === 'approved').length
            const totalCourseRevenue = instructorCourses.reduce((s, c) => s + (c.total_revenue ?? 0), 0)
            const satisfactionCourses = instructorCourses.filter(c => (c as Record<string, unknown>).satisfaction_score != null && Number((c as Record<string, unknown>).satisfaction_score) > 0)
            const avgSatisfaction = satisfactionCourses.length > 0
              ? (satisfactionCourses.reduce((s, c) => s + Number((c as Record<string, unknown>).satisfaction_score), 0) / satisfactionCourses.length).toFixed(1)
              : (p.average_satisfaction > 0 ? String(p.average_satisfaction) : '—')

            return (
              <div>
                <div className="grid grid-cols-5 gap-3 mb-4">
                  <MiniStat label="等級" value={p.instructor_level ?? '儲備講師'} />
                  <MiniStat label="累計時數" value={`${p.accumulated_hours ?? 0}h`} />
                  <MiniStat label="核准課程數" value={String(approvedCount)} />
                  <MiniStat label="總營收" value={`NT$ ${totalCourseRevenue.toLocaleString()}`} />
                  <MiniStat label="平均滿意度" value={avgSatisfaction} />
                </div>
                <p className="text-xs font-medium text-gray-500 mb-2">授課紀錄</p>
                <div className="space-y-2">
                  {instructorCourses.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">尚無授課紀錄</p>
                  ) : instructorCourses.map(c => {
                    const isExpanded = expandedCourses.has(c.id)
                    const courseType = c.company_id ? 'enterprise' : 'public'
                    const satisfactionVal = (c as Record<string, unknown>).satisfaction_score != null
                      ? String((c as Record<string, unknown>).satisfaction_score) : null

                    return (
                      <div key={c.id} className="bg-gray-50 rounded-lg">
                        <button
                          className="w-full text-left p-3"
                          onClick={() => {
                            const next = new Set(expandedCourses)
                            if (isExpanded) next.delete(c.id); else next.add(c.id)
                            setExpandedCourses(next)
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                                <p className="text-sm font-medium text-gray-900">{c.title}</p>
                              </div>
                              <p className="text-xs text-gray-400 ml-5">{c.start_date ?? '未排期'}{c.hours ? ` · ${c.hours}h` : ''}{c.company_id ? ` · ${companyMap[c.company_id] ?? ''}` : ' · 公開課'}</p>
                            </div>
                            <Badge variant={c.review_status === 'approved' ? 'success' : c.review_status === 'pending' ? 'warning' : 'danger'}>
                              {c.review_status === 'approved' ? '核准' : c.review_status === 'pending' ? '待審' : '退回'}
                            </Badge>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-0 ml-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {satisfactionVal && (
                              <div className="text-xs"><span className="text-gray-400">滿意度分數</span><p className="font-medium text-gray-700">{satisfactionVal}</p></div>
                            )}
                            <div className="text-xs"><span className="text-gray-400">審核狀態</span><p className="mt-0.5">
                              <Badge variant={c.review_status === 'approved' ? 'success' : c.review_status === 'pending' ? 'warning' : 'danger'}>
                                {c.review_status === 'approved' ? '核准' : c.review_status === 'pending' ? '待審' : '退回'}
                              </Badge></p>
                            </div>
                            <div className="text-xs"><span className="text-gray-400">營收</span><p className="font-medium text-gray-700">NT$ {(c.total_revenue ?? 0).toLocaleString()}</p></div>
                            <div className="text-xs"><span className="text-gray-400">課程類型</span><p className="mt-0.5">
                              <Badge variant={courseType === 'enterprise' ? 'info' : 'default'}>
                                {courseType === 'enterprise' ? '企業內訓' : '公開課'}
                              </Badge></p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {tab === 'analyst' && (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <MiniStat label="等級" value={p.analyst_level ?? '三級皮紋評量分析師'} />
                <MiniStat label="個案管理" value="查看個案頁面" />
              </div>
              <Link href="/analyst-cases" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">前往個案管理 →</Link>
            </div>
          )}

          {tab === 'talent' && (
            <div className="text-center py-6">
              <Link href={`/my-talent?view=${p.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                🧠 查看完整天賦評量報告
              </Link>
            </div>
          )}

          {tab === 'learning' && (
            <div className="text-center py-6">
              {p.company_id ? (
                <Link href={`/companies/${p.company_id}/employees/${p.id}/passport`} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                  📚 查看學習護照
                </Link>
              ) : (
                <p className="text-sm text-gray-400">此學員無企業歸屬，學習紀錄請從課程管理查看</p>
              )}
            </div>
          )}

          {tab === 'surveys' && (() => {
            const records = surveyHistory?.[p.id] ?? []
            if (records.length === 0) {
              return <p className="text-sm text-gray-400 text-center py-6">此學員無問卷填寫紀錄</p>
            }
            const avgOverall = records.reduce((s, r) => s + r.scores.overall, 0) / records.length
            const scoreColor = (v: number) => v >= 4.5 ? 'text-green-600' : v >= 3.5 ? 'text-indigo-600' : v >= 2.5 ? 'text-amber-600' : 'text-red-600'
            const barColor = (v: number) => v >= 4.5 ? 'bg-green-500' : v >= 3.5 ? 'bg-indigo-500' : v >= 2.5 ? 'bg-amber-500' : 'bg-red-500'
            const sectionLabels: { key: keyof SurveyRecord['scores']; label: string }[] = [
              { key: 'le', label: '學習效果' },
              { key: 'ce', label: '課程評價' },
              { key: 'ie', label: '講師評價' },
              { key: 've', label: '場地' },
            ]

            return (
              <div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <MiniStat label="填寫次數" value={`${records.length} 次`} />
                  <MiniStat label="平均整體分數" value={`${avgOverall.toFixed(1)} / 5.0`} />
                </div>
                <p className="text-xs font-medium text-gray-500 mb-2">問卷紀錄</p>
                <div className="space-y-3">
                  {records.map((r, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{r.courseName}</p>
                          <p className="text-xs text-gray-400">{r.courseDate ?? '未排期'}</p>
                        </div>
                        <span className={`text-sm font-bold ${scoreColor(r.scores.overall)}`}>
                          {r.scores.overall.toFixed(1)} / 5.0
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {sectionLabels.map(s => (
                          <div key={s.key} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-16 flex-shrink-0">{s.label}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className={`h-2 rounded-full ${barColor(r.scores[s.key])}`}
                                style={{ width: `${(r.scores[s.key] / 5) * 100}%` }} />
                            </div>
                            <span className="text-xs text-gray-600 w-14 text-right">{r.scores[s.key].toFixed(1)} / 5.0</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">填寫時間：{new Date(r.submittedAt).toLocaleDateString('zh-TW')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {tab === 'purchases' && (() => {
            const personOrders = ordersByPerson?.[p.id] ?? []
            const totalSpending = personOrders.reduce((s, o) => s + o.amount, 0) || (p.total_spending ?? 0)

            return (
              <div>
                <MiniStat label="總消費" value={totalSpending > 0 ? `NT$ ${totalSpending.toLocaleString()}` : 'NT$ 0'} />
                <p className="text-xs font-medium text-gray-500 mb-2 mt-4">購買紀錄</p>
                <div className="space-y-2">
                  {personOrders.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">尚無購買紀錄</p>
                  ) : personOrders.map(o => (
                    <div key={o.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{o.product_name ?? '產品'}</p>
                        <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('zh-TW')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">NT$ {o.amount.toLocaleString()}</span>
                        <Badge variant={o.status === 'paid' ? 'success' : o.status === 'pending' ? 'warning' : 'danger'}>
                          {o.status === 'paid' ? '已付款' : o.status === 'pending' ? '待付款' : '已取消'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-gray-700">{value || '—'}</p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  )
}
