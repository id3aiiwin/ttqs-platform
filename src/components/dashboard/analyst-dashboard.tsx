'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CertificationJourney } from '@/components/certification/certification-journey'
import type { Profile } from '@/types/database'

// 4 階段 10 級認證
const ANALYST_LEVELS = [
  { stage: 1, levels: [
    { id: 'fp3', label: '三級皮紋評量分析師', requirements: [{ label: '個案數', key: 'cases', target: 10 }, { label: '考試分數', key: 'score', target: 70 }] },
    { id: 'fp2', label: '二級皮紋評量分析師', requirements: [{ label: '個案數', key: 'cases', target: 30 }, { label: '考試分數', key: 'score', target: 80 }] },
    { id: 'fp1', label: '一級皮紋評量分析師', requirements: [{ label: '個案數', key: 'cases', target: 50 }, { label: '理論考', key: 'theory', target: 85 }, { label: '實務考', key: 'practice', target: 85 }] },
  ]},
  { stage: 2, levels: [
    { id: 'tc3', label: '三級皮紋評量諮商師', requirements: [{ label: '個案數', key: 'cases', target: 80 }, { label: '複雜個案', key: 'complexCase', target: 5 }] },
    { id: 'tc2', label: '二級皮紋評量諮商師', requirements: [{ label: '個案數', key: 'cases', target: 120 }, { label: '升級活動', key: 'promotion', target: 2 }, { label: '帶新人', key: 'mentor', target: 1 }] },
    { id: 'tc1', label: '一級皮紋評量諮商師', requirements: [{ label: '個案數', key: 'cases', target: 200 }, { label: '發表文章', key: 'article', target: 3 }, { label: '帶新人', key: 'mentor', target: 3 }] },
  ]},
  { stage: 3, levels: [
    { id: 'pt3', label: '三級心理培訓師', requirements: [{ label: '個案數', key: 'cases', target: 300 }, { label: '發表文章', key: 'article', target: 5 }] },
    { id: 'pt2', label: '二級心理培訓師', requirements: [{ label: '個案數', key: 'cases', target: 400 }, { label: '出書', key: 'book', target: 1 }] },
    { id: 'pt1', label: '一級心理培訓師', requirements: [{ label: '個案數', key: 'cases', target: 500 }, { label: '帶新人', key: 'mentor', target: 5 }, { label: '發表文章', key: 'article', target: 10 }] },
  ]},
  { stage: 4, levels: [
    { id: 'lc', label: '生命教練導師', requirements: [{ label: '個案數', key: 'cases', target: 1000 }, { label: '出書', key: 'book', target: 2 }, { label: '帶新人', key: 'mentor', target: 10 }] },
  ]},
]

const STAGE_LABELS = ['', '皮紋評量分析師', '皮紋評量諮商師', '心理培訓師', '生命教練']
const STAGE_COLORS = ['', 'text-blue-700 bg-blue-100', 'text-purple-700 bg-purple-100', 'text-amber-700 bg-amber-100', 'text-red-700 bg-red-100']

interface CaseItem {
  id: string; case_title: string; case_date: string | null; case_type: string; status: string; client_name: string | null
}

interface Props {
  profile: Profile
  cases: CaseItem[]
  caseCount: number
}

export function AnalystDashboard({ profile, cases, caseCount }: Props) {
  const [adding, setAdding] = useState(false)
  const [caseForm, setCaseForm] = useState({ title: '', client: '', date: '', notes: '' })
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const currentLevel = profile.analyst_level ?? '三級皮紋評量分析師'

  // 根據個案數自動判斷已通過的等級
  // 扁平化所有等級，按順序排列
  const allLevels = ANALYST_LEVELS.flatMap(stage =>
    stage.levels.map(level => ({
      ...level,
      stage: stage.stage,
      casesRequired: level.requirements.find(r => r.key === 'cases')?.target ?? 0,
    }))
  )

  // 找到目前等級的位置（以 profile 記錄為準）
  let currentStage = 1
  let currentLevelIdx = 0
  for (const stage of ANALYST_LEVELS) {
    for (let i = 0; i < stage.levels.length; i++) {
      if (stage.levels[i].label === currentLevel) {
        currentStage = stage.stage
        currentLevelIdx = i
      }
    }
  }

  // 判斷每個等級的完成狀態（根據個案數）
  function isLevelCompleted(stageNum: number, levelIdx: number): boolean {
    const flat = ANALYST_LEVELS.flatMap((s, si) =>
      s.levels.map((l, li) => ({ stage: s.stage, levelIdx: li, casesRequired: l.requirements.find(r => r.key === 'cases')?.target ?? 0 }))
    )
    const currentFlatIdx = flat.findIndex(f => f.stage === currentStage && f.levelIdx === currentLevelIdx)
    const thisFlatIdx = flat.findIndex(f => f.stage === stageNum && f.levelIdx === levelIdx)
    return thisFlatIdx < currentFlatIdx
  }

  function getLevelCurrent(req: { key: string; target: number }, stageNum: number, levelIdx: number): number {
    if (isLevelCompleted(stageNum, levelIdx)) return req.target // 已完成的等級顯示滿
    const isCurrentLevel = stageNum === currentStage && levelIdx === currentLevelIdx
    if (!isCurrentLevel) return 0 // 未來等級顯示 0
    // 目前等級：顯示實際進度
    if (req.key === 'cases') return caseCount
    return 0 // 其他指標暫無追蹤數據
  }

  function handleAddCase() {
    if (!caseForm.title.trim()) return
    startTransition(async () => {
      await fetch('/api/analyst-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analyst_id: profile.id,
          case_title: caseForm.title.trim(),
          client_name: caseForm.client.trim() || null,
          case_date: caseForm.date || null,
          notes: caseForm.notes.trim() || null,
        }),
      })
      setCaseForm({ title: '', client: '', date: '', notes: '' })
      setAdding(false)
      router.refresh()
    })
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">皮紋評量分析師儀表板</h1>
          <span className={`text-sm rounded-full px-3 py-1 font-medium ${STAGE_COLORS[currentStage]}`}>{currentLevel}</span>
        </div>
        <p className="text-gray-500">歡迎，{profile.full_name ?? '分析師'}！</p>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card><CardBody>
          <p className="text-sm text-gray-500">累計個案數</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{caseCount}</p>
        </CardBody></Card>
        <Card><CardBody>
          <p className="text-sm text-gray-500">目前等級</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{currentLevel}</p>
        </CardBody></Card>
        <Card><CardBody>
          <p className="text-sm text-gray-500">認證階段</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{STAGE_LABELS[currentStage]}</p>
        </CardBody></Card>
      </div>

      {/* 育成流程 */}
      <Card className="mb-6">
        <CardBody>
          <CertificationJourney
            title="育成流程"
            stages={ANALYST_LEVELS.map((stage) => ({
              id: `stage-${stage.stage}`,
              name: STAGE_LABELS[stage.stage],
              color: STAGE_COLORS[stage.stage],
              levels: stage.levels.map((level, lIdx) => ({
                id: level.id,
                label: level.label,
                requirements: level.requirements.map(r => ({
                  label: r.label,
                  target: r.target,
                  current: getLevelCurrent(r, stage.stage, lIdx),
                })),
                isCompleted: isLevelCompleted(stage.stage, lIdx),
                isCurrent: stage.stage === currentStage && lIdx === currentLevelIdx,
              })),
            }))}
            currentStageIdx={currentStage - 1}
            currentLevelIdx={currentLevelIdx}
          />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {/* 個案管理 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">個案管理</p>
              {!adding && (
                <button onClick={() => setAdding(true)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ 新增個案</button>
              )}
            </div>
          </CardHeader>

          {adding && (
            <div className="px-6 pb-3">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 space-y-2">
                <input value={caseForm.title} onChange={e => setCaseForm({ ...caseForm, title: e.target.value })} placeholder="個案標題 *"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" autoFocus />
                <div className="grid grid-cols-2 gap-2">
                  <input value={caseForm.client} onChange={e => setCaseForm({ ...caseForm, client: e.target.value })} placeholder="個案對象"
                    className="text-sm border border-gray-300 rounded px-2 py-1.5" />
                  <input type="date" value={caseForm.date} onChange={e => setCaseForm({ ...caseForm, date: e.target.value })}
                    className="text-sm border border-gray-300 rounded px-2 py-1.5" />
                </div>
                <textarea value={caseForm.notes} onChange={e => setCaseForm({ ...caseForm, notes: e.target.value })} placeholder="備註" rows={2}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
                <div className="flex gap-2">
                  <button onClick={handleAddCase} disabled={pending || !caseForm.title.trim()}
                    className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded px-3 py-1.5 disabled:opacity-50">新增</button>
                  <button onClick={() => setAdding(false)} className="text-xs text-gray-400 px-2">取消</button>
                </div>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {cases.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">尚無個案紀錄</p>
            ) : cases.map(c => (
              <div key={c.id} className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{c.case_title}</p>
                  <Badge variant={c.status === 'completed' ? 'success' : c.status === 'cancelled' ? 'danger' : 'warning'}>
                    {c.status === 'completed' ? '已完成' : c.status === 'cancelled' ? '已取消' : '進行中'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                  {c.client_name && <span>{c.client_name}</span>}
                  {c.case_date && <span>{c.case_date}</span>}
                  <span>{c.case_type}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
