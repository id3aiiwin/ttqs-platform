import Link from 'next/link'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PDDRO_DEFAULT_FORMS } from '@/lib/pddro-defaults'
import type { Company } from '@/types/database'

const PHASE_COLORS: Record<string, string> = {
  P: 'bg-blue-500', D: 'bg-purple-500', DO: 'bg-orange-500', R: 'bg-yellow-500', O: 'bg-green-500',
}
const PHASE_STROKE: Record<string, string> = {
  P: '#3b82f6', D: '#8b5cf6', DO: '#f97316', R: '#eab308', O: '#22c55e',
}
const PHASE_FULL_NAMES: Record<string, string> = {
  P: 'Plan', D: 'Design', DO: 'Do', R: 'Review', O: 'Outcome',
}
const PHASE_CN_NAMES: Record<string, string> = {
  P: '計畫', D: '設計', DO: '執行', R: '查核', O: '成果',
}

interface WorkspaceProps {
  company: Company
  stats: {
    courseCount: number
    overallPddro: number
    pddroProgress: Record<string, { total: number; completed: number; pct: number }>
    totalDocs: number
    approvedDocs: number
    docPct: number
    formPct: number
    coachingProgress: number
    competencyEntryCount: number
    pendingJd: number
    pendingReviewDocs: number
    incompleteForms: number
    pendingActions: { id: string; content: string; is_completed: boolean; due_date: string | null }[]
  }
}

export function CompanyWorkspace({ company, stats }: WorkspaceProps) {
  const id = company.id
  const phases = ['P', 'D', 'DO', 'R', 'O'] as const
  const hasTodo = stats.pendingJd > 0 || stats.pendingReviewDocs > 0 || stats.incompleteForms > 0

  const navLinks = [
    { href: `/companies/${id}`, label: '工作區總覽', icon: '📊', active: true },
    { href: `/companies/${id}/dashboard`, label: '企業儀表板', icon: '📈' },
    { href: `/courses`, label: '課程管理', icon: '📚', count: stats.courseCount },
    { href: `/companies/${id}/documents`, label: '四階文件', icon: '📁', count: stats.totalDocs },
    { href: `/companies/${id}/organization`, label: '組織架構', icon: '🏢' },
    { href: `/companies/${id}/employees`, label: '員工管理', icon: '👤' },
    { href: `/companies/${id}/competency`, label: '職能管理', icon: '👥' },
    { href: `/companies/${id}/templates`, label: '表單模板', icon: '📋' },
    { href: `/companies/${id}/contracts`, label: '合約管理', icon: '📄' },
    { href: `/companies/${id}/proposals`, label: '年度提案', icon: '💰' },
    { href: `/meetings?company=${id}`, label: '會議記錄', icon: '📅' },
    { href: `/companies/${id}/ttqs-plan`, label: 'TTQS 指標填寫', icon: '🏆' },
  ]

  return (
    <div className="flex h-full">
      {/* 左側企業導覽 */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
        {/* 企業資訊 */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 truncate">{company.name}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{company.industry ?? '—'}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={company.status === 'active' ? 'success' : company.status === 'pending' ? 'warning' : 'default'}>
              {company.status === 'active' ? '輔導中' : company.status === 'pending' ? '待確認' : '已結案'}
            </Badge>
            {company.ttqs_level && (
              <Badge variant="info">{company.ttqs_level === 'gold' ? '金牌' : company.ttqs_level === 'silver' ? '銀牌' : '銅牌'}</Badge>
            )}
          </div>
        </div>

        {/* PDDRO 進度條 */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500">PDDRO 評核進度</p>
            <span className="text-xs font-bold text-gray-700">{stats.overallPddro}%</span>
          </div>
          <div className="flex flex-col gap-2">
            {phases.map((p) => {
              const prog = stats.pddroProgress[p] ?? { pct: 0 }
              return (
                <div key={p}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-gray-600">{PHASE_FULL_NAMES[p]}</span>
                    <span className="text-xs text-gray-400">{prog.pct}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${PHASE_COLORS[p]}`} style={{ width: `${prog.pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 導覽連結 */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navLinks.map((link) => (
            <Link key={link.label}
              href={link.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                link.active ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              <span className="text-base">{link.icon}</span>
              <span className="flex-1">{link.label}</span>
              {link.count !== undefined && <span className="text-xs text-gray-400">{link.count}</span>}
            </Link>
          ))}
        </nav>

        {/* 底部企業設定 */}
        <div className="p-3 border-t border-gray-100">
          <Link href={`/companies/${id}/settings`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            企業設定
          </Link>
        </div>
      </div>

      {/* 右側主要內容 */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">企業輔導工作區</h1>

          {/* 輔導進度總覽 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">輔導進度</p>
                <p className="text-xs text-gray-400">= TTQS指標(40%) + 文件確認(30%) + 表單完成(30%)</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-indigo-600">{stats.coachingProgress}%</p>
              </div>
            </div>
            <div className="h-3 bg-gray-100 rounded-full mb-4">
              <div className="h-3 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all" style={{ width: `${stats.coachingProgress}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-indigo-600">{stats.overallPddro}%</p>
                <p className="text-xs text-gray-400">TTQS 指標</p>
              </div>
              <div>
                <p className="text-lg font-bold text-violet-600">{stats.docPct}%</p>
                <p className="text-xs text-gray-400">文件確認</p>
              </div>
              <div>
                <p className="text-lg font-bold text-purple-600">{stats.formPct}%</p>
                <p className="text-xs text-gray-400">表單完成</p>
              </div>
            </div>
          </div>

          {/* 未完成行動項目 */}
          {stats.pendingActions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-blue-800 mb-2">未完成行動項目</p>
              <div className="space-y-1">
                {stats.pendingActions.map(a => (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                    <span className="text-blue-700">{a.content}</span>
                    {a.due_date && <span className="text-xs text-blue-400 ml-auto">{a.due_date}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 待辦事項 */}
          {hasTodo ? (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {stats.pendingJd > 0 && (
                <Link href={`/companies/${id}/competency?tab=jd`}>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 hover:border-amber-300 transition-colors">
                    <p className="text-2xl font-bold text-amber-700">{stats.pendingJd}</p>
                    <p className="text-xs text-amber-600 mt-1">份 JD 待批閱</p>
                  </div>
                </Link>
              )}
              {stats.pendingReviewDocs > 0 && (
                <Link href={`/companies/${id}/documents`}>
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 hover:border-orange-300 transition-colors">
                    <p className="text-2xl font-bold text-orange-700">{stats.pendingReviewDocs}</p>
                    <p className="text-xs text-orange-600 mt-1">份文件待審閱</p>
                  </div>
                </Link>
              )}
              {stats.incompleteForms > 0 && (
                <Link href={`/courses`}>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                    <p className="text-2xl font-bold text-blue-700">{stats.incompleteForms}</p>
                    <p className="text-xs text-blue-600 mt-1">個表單未完成</p>
                  </div>
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-green-700">目前沒有待辦事項</p>
            </div>
          )}

          {/* 統計卡片 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card><CardBody>
              <p className="text-xs text-gray-400">課程數</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.courseCount}</p>
            </CardBody></Card>
            <Card><CardBody>
              <p className="text-xs text-gray-400">PDDRO 進度</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.overallPddro}%</p>
            </CardBody></Card>
            <Card><CardBody>
              <p className="text-xs text-gray-400">四階文件</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.approvedDocs}/{stats.totalDocs}</p>
              <p className="text-xs text-gray-400 mt-0.5">已確認</p>
            </CardBody></Card>
            <Card><CardBody>
              <p className="text-xs text-gray-400">職能表單</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.competencyEntryCount}</p>
            </CardBody></Card>
          </div>

          {/* PDDRO 圓環進度圖 */}
          <Card className="mb-6">
            <CardHeader><p className="font-semibold text-gray-900">PDDRO 五構面評核進度</p></CardHeader>
            <CardBody>
              <div className="grid grid-cols-5 gap-4">
                {phases.map((p) => {
                  const prog = stats.pddroProgress[p] ?? { total: 0, completed: 0, pct: 0 }
                  const info = PDDRO_DEFAULT_FORMS[p]
                  return (
                    <div key={p} className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.5" fill="none"
                            stroke={PHASE_STROKE[p]} strokeWidth="3"
                            strokeDasharray={`${prog.pct * 0.974} 100`} strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">{prog.pct}%</span>
                      </div>
                      <p className="text-xs font-semibold text-gray-700">{PHASE_FULL_NAMES[p]}</p>
                      <p className="text-xs text-gray-400">{PHASE_CN_NAMES[p]}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{prog.completed}/{prog.total}</p>
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>

          {/* 快速操作 */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { href: `/courses`, icon: '📚', label: '課程管理', sub: `${stats.courseCount} 門課程` },
              { href: `/companies/${id}/documents`, icon: '📁', label: '四階文件', sub: `${stats.approvedDocs}/${stats.totalDocs} 已確認` },
              { href: `/companies/${id}/competency`, icon: '👥', label: '職能管理', sub: `${stats.competencyEntryCount} 份表單` },
              { href: `/companies/${id}/templates`, icon: '📋', label: '表單模板設定', sub: 'PDDRO 表單模板' },
            ].map((item) => (
              <Link key={item.label} href={item.href}>
                <Card className="hover:border-indigo-200 transition-colors cursor-pointer">
                  <CardBody className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.sub}</p>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
