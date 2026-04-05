'use client'

import { useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SimpleJourney } from '@/components/certification/certification-journey'
import type { Profile } from '@/types/database'

const LEVEL_LABELS: Record<string, { label: string; color: string }> = {
  '儲備講師': { label: '儲備講師', color: 'bg-gray-100 text-gray-700' },
  '正式講師': { label: '正式講師', color: 'bg-blue-100 text-blue-700' },
  '資深講師': { label: '資深講師', color: 'bg-purple-100 text-purple-700' },
  '督導講師': { label: '督導講師', color: 'bg-amber-100 text-amber-700' },
}

const INSTRUCTOR_JOURNEY = [
  { id: 'reserve', label: '儲備講師', requirements: [
    { label: '累計授課時數', key: 'hours', target: 150 },
    { label: '回訓次數', key: 'refresh', target: 2 },
    { label: '實習報告', key: 'reports', target: 10 },
  ]},
  { id: 'official', label: '正式講師', requirements: [
    { label: '累計授課時數', key: 'hours', target: 150 },
    { label: '回訓次數', key: 'refresh', target: 2 },
    { label: '平均滿意度', key: 'satisfaction', target: 90 },
    { label: '發表文章', key: 'articles', target: 10 },
  ]},
  { id: 'senior', label: '資深講師', requirements: [
    { label: '累計授課時數', key: 'hours', target: 150 },
    { label: '回訓次數', key: 'refresh', target: 2 },
    { label: '平均滿意度', key: 'satisfaction', target: 90 },
    { label: '發表文章', key: 'articles', target: 20 },
    { label: '推薦人次', key: 'recommendations', target: 30 },
  ]},
  { id: 'supervisor', label: '督導講師', requirements: [] },
]

const LEVEL_REQUIREMENTS: Record<string, { nextLevel: string; requirements: { label: string; key: string; target: number }[] }> = {
  '儲備講師': { nextLevel: '正式講師', requirements: [
    { label: '累計授課時數', key: 'hours', target: 150 },
    { label: '回訓次數', key: 'refresh', target: 2 },
    { label: '實習報告', key: 'reports', target: 10 },
  ]},
  '正式講師': { nextLevel: '資深講師', requirements: [
    { label: '累計授課時數', key: 'hours', target: 150 },
    { label: '回訓次數', key: 'refresh', target: 2 },
    { label: '平均滿意度', key: 'satisfaction', target: 90 },
    { label: '發表文章', key: 'articles', target: 10 },
    { label: '課程審查', key: 'reviews', target: 1 },
  ]},
  '資深講師': { nextLevel: '督導講師', requirements: [
    { label: '累計授課時數', key: 'hours', target: 150 },
    { label: '回訓次數', key: 'refresh', target: 2 },
    { label: '平均滿意度', key: 'satisfaction', target: 90 },
    { label: '發表文章', key: 'articles', target: 20 },
    { label: '進修學習', key: 'learning', target: 3 },
    { label: '推薦人次', key: 'recommendations', target: 30 },
    { label: '課程審查', key: 'reviews', target: 3 },
  ]},
}

interface CourseItem {
  id: string; title: string; status: string; start_date: string | null
  hours: number | null; review_status: string | null; is_counted_in_hours: boolean | null
}

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <Card><CardBody>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </CardBody></Card>
  )
}

export function InstructorDashboard({ profile, courses }: { profile: Profile; courses: CourseItem[] }) {
  const [showPromotion, setShowPromotion] = useState(false)

  const level = profile.instructor_level ?? '儲備講師'
  const levelInfo = LEVEL_LABELS[level] ?? LEVEL_LABELS['儲備講師']
  const levelReqs = LEVEL_REQUIREMENTS[level]

  const approvedCourses = courses.filter(c => c.review_status === 'approved' || c.is_counted_in_hours)
  const pendingCourses = courses.filter(c => c.review_status === 'pending')
  const totalHours = profile.accumulated_hours ?? 0
  const avgSatisfaction = profile.average_satisfaction ?? 0

  const currentValues: Record<string, number> = {
    hours: totalHours,
    refresh: profile.refresh_training_count ?? 0,
    reports: profile.internship_reports_reviewed ?? 0,
    satisfaction: avgSatisfaction,
    articles: profile.articles_count ?? 0,
    recommendations: profile.recommendations_count ?? 0,
    reviews: 0,
    learning: 0,
  }

  const allMet = levelReqs?.requirements.every(r => currentValues[r.key] >= r.target) ?? false

  const _idx = INSTRUCTOR_JOURNEY.findIndex(jl => jl.label === level)
  const instructorLevelIdx = _idx !== -1 ? _idx : 0

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">歡迎，{profile.full_name ?? '講師'}！</h1>
          <span className={`text-sm rounded-full px-3 py-1 font-medium ${levelInfo.color}`}>{levelInfo.label}</span>
        </div>
        <p className="text-gray-500">講師儀表板</p>
      </div>

      {/* 育成流程 */}
      <Card className="mb-8">
        <CardBody>
          <SimpleJourney
            title="講師育成流程"
            levels={INSTRUCTOR_JOURNEY.map((jl, idx) => ({
              id: jl.id,
              label: jl.label,
              requirements: jl.requirements.map(r => ({
                label: r.label,
                target: r.target,
                current: currentValues[r.key] ?? 0,
              })),
            }))}
            currentIdx={instructorLevelIdx}
          />
        </CardBody>
      </Card>

      {/* 統計 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="累計授課時數" value={totalHours} color="text-indigo-600" />
        <StatCard label="核准課程" value={approvedCourses.length} sub={`待審 ${pendingCourses.length}`} color="text-green-600" />
        <StatCard label="平均滿意度" value={avgSatisfaction > 0 ? avgSatisfaction : '—'} color="text-amber-600" />
        <StatCard label="目前等級" value={levelInfo.label} color="text-gray-900" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 升級進度 */}
        {levelReqs && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">升級進度 → {levelReqs.nextLevel}</p>
                {allMet && profile.promotion_status !== 'pending' && (
                  <button onClick={() => setShowPromotion(true)}
                    className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-1.5">
                    申請升級
                  </button>
                )}
                {profile.promotion_status === 'pending' && (
                  <span className="text-xs text-amber-600 bg-amber-100 rounded-full px-2 py-0.5">申請審核中</span>
                )}
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {levelReqs.requirements.map(req => {
                  const current = currentValues[req.key] ?? 0
                  const pct = Math.min(100, Math.round((current / req.target) * 100))
                  const met = current >= req.target
                  return (
                    <div key={req.key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700">{req.label}</span>
                        <span className={met ? 'text-green-600 font-medium' : 'text-gray-500'}>
                          {current} / {req.target} {met ? '✓' : ''}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${met ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>
        )}

        {/* 教學紀錄 */}
        <Card>
          <CardHeader>
            <p className="font-semibold text-gray-900">教學紀錄</p>
          </CardHeader>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {courses.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">尚無教學紀錄</p>
            ) : courses.map(c => (
              <div key={c.id} className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{c.title}</p>
                  <div className="flex items-center gap-2">
                    {c.hours && <span className="text-xs text-gray-400">{c.hours}h</span>}
                    {c.review_status === 'approved' || c.is_counted_in_hours ? (
                      <Badge variant="success">已核准</Badge>
                    ) : c.review_status === 'pending' ? (
                      <Badge variant="warning">待審</Badge>
                    ) : (
                      <Badge variant="danger">退回</Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{c.start_date ?? '未排期'}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
