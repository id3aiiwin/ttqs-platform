'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/database'

const STATUS_LABEL: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
  draft:       { label: '草稿',   variant: 'default' },
  planned:     { label: '已規劃', variant: 'info'    },
  in_progress: { label: '進行中', variant: 'warning' },
  completed:   { label: '已完成', variant: 'success' },
  cancelled:   { label: '已取消', variant: 'danger'  },
}

interface CourseItem {
  id: string
  title: string
  status: string
  start_date: string | null
  hours: number | null
  company_name: string
  company_id: string
}

interface CompanyOption {
  id: string
  name: string
}

interface CourseListPanelProps {
  courses: CourseItem[]
  selectedId: string | null
  role: UserRole
  companies?: CompanyOption[]
}

export function CourseListPanel({ courses, selectedId, role, companies }: CourseListPanelProps) {
  const [filterCompany, setFilterCompany] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')

  const isConsultant = role === 'consultant'

  const filtered = courses.filter((c) => {
    if (filterCompany && c.company_id !== filterCompany) return false
    if (filterStatus && c.status !== filterStatus) return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.company_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-900">課程管理</h2>
          {(isConsultant || role === 'hr') && (
            <Link href="/courses/new" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
              + 新增
            </Link>
          )}
        </div>

        {/* 搜尋 */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋課程名稱或企業..."
          className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />

        {/* 篩選列 */}
        {isConsultant && companies && companies.length > 0 && (
          <div className="flex gap-1.5">
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">全部企業</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">全部</option>
              <option value="draft">草稿</option>
              <option value="planned">已規劃</option>
              <option value="in_progress">進行中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2">{filtered.length} / {courses.length} 筆課程</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-sm text-gray-400">{courses.length > 0 ? '沒有符合篩選的課程' : '尚無課程'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((course) => {
              const isSelected = course.id === selectedId
              const status = STATUS_LABEL[course.status] ?? STATUS_LABEL.draft
              return (
                <Link
                  key={course.id}
                  href={`/courses?selected=${course.id}`}
                  className={cn(
                    'block px-4 py-3 transition-colors',
                    isSelected ? 'bg-indigo-50 border-r-2 border-indigo-600' : 'hover:bg-gray-50'
                  )}
                >
                  <p className={cn(
                    'text-sm truncate',
                    isSelected ? 'font-semibold text-indigo-900' : 'font-medium text-gray-900'
                  )}>
                    {course.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{course.company_name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {course.start_date && (
                      <span className="text-xs text-gray-400">{course.start_date}</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
