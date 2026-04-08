'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ROUTE_LABELS: Record<string, string> = {
  dashboard: '儀表板',
  companies: '企業管理',
  courses: '課程管理',
  overview: '企業總表',
  people: '學員資料',
  instructors: '講師資料',
  'life-coaches': '生命教練',
  'role-management': '角色管理',
  'course-review': '課程審核',
  'course-templates': '課程模板',
  'knowledge-base': '知識庫',
  'survey-results': '問卷總覽',
  'survey-import': '問卷匯入',
  'quiz-management': '測驗管理',
  'quiz-results': '測驗紀錄',
  'assessment-reports': '評量報告',
  'instructor-analytics': '講師績效',
  'client-analytics': '客戶分析',
  'talent-analytics': '評量分析',
  'training-roi': '訓練 ROI',
  'course-interest': '課程興趣',
  'data-export': '資料匯出',
  crm: '互動紀錄',
  meetings: '會議記錄',
  todos: '待辦事項',
  'product-management': '產品管理',
  'line-templates': 'LINE 模板',
  'audit-log': '操作紀錄',
  'instructor-promotion': '講師等級',
  'analyst-cases': '生命教練等級',
  'my-courses': '我的授課',
  'my-learning': '我的學習',
  'my-history': '學習履歷',
  'my-quizzes': '測驗紀錄',
  shop: '課程商店',
  'my-orders': '我的訂單',
  'my-talent': '天賦評量',
  notifications: '通知中心',
  profile: '個人設定',
  // Company sub-pages
  documents: '四階文件',
  organization: '組織架構',
  employees: '員工管理',
  competency: '職能管理',
  templates: '表單模板',
  contracts: '合約管理',
  proposals: '年度提案',
  settings: '企業設定',
  'ttqs-plan': 'TTQS 指標',
  edit: '編輯',
  new: '新增',
}

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  const crumbs: { label: string; href: string }[] = []

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const href = '/' + segments.slice(0, i + 1).join('/')

    if (isUuid(seg)) {
      // Skip UUID segments in display but keep in path
      continue
    }

    const label = ROUTE_LABELS[seg] ?? seg
    crumbs.push({ label, href })
  }

  if (crumbs.length <= 1) return null

  return (
    <nav className="flex items-center gap-1 text-sm min-w-0">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={crumb.href} className="flex items-center gap-1 min-w-0">
            {i > 0 && (
              <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {isLast ? (
              <span className="text-gray-700 font-medium truncate">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-gray-400 hover:text-gray-600 truncate transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
