'use client'

import { Card, CardHeader, CardBody } from '@/components/ui/card'

interface Score {
  id: string
  competency_name: string
  score: number
}

interface Idp {
  id: string
  competency_name: string
  current_level: number
  target_level: number
}

interface JobReq {
  competency_name: string
  required_level: number
}

interface CompetencyRadarProps {
  scores: Score[]
  idps: Idp[]
  jobRequirements: JobReq[]
  companyId: string
  employeeId: string
  isConsultant: boolean
}

export function CompetencyRadar({ scores, idps, jobRequirements, companyId, employeeId, isConsultant }: CompetencyRadarProps) {
  // 合併所有職能名稱
  const allNames = new Set<string>()
  scores.forEach((s) => allNames.add(s.competency_name))
  idps.forEach((i) => allNames.add(i.competency_name))
  jobRequirements.forEach((j) => allNames.add(j.competency_name))

  const competencies = Array.from(allNames).map((name) => {
    const score = scores.find((s) => s.competency_name === name)
    const idp = idps.find((i) => i.competency_name === name)
    const req = jobRequirements.find((j) => j.competency_name === name)
    return {
      name,
      current: score?.score ?? idp?.current_level ?? 0,
      target: idp?.target_level ?? 0,
      required: req?.required_level ?? 0,
    }
  })

  if (competencies.length === 0) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-12">
            <p className="text-sm text-gray-400 mb-1">尚無職能資料</p>
            <p className="text-xs text-gray-300">請先在 IDP 發展計畫設定職能目標</p>
          </div>
        </CardBody>
      </Card>
    )
  }

  // SVG 雷達圖
  const size = 320
  const center = size / 2
  const radius = 120
  const levels = 5
  const count = competencies.length
  const angleStep = (2 * Math.PI) / count

  function getPoint(index: number, value: number) {
    const angle = angleStep * index - Math.PI / 2
    const r = (value / levels) * radius
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) }
  }

  function polygonPoints(values: number[]) {
    return values.map((v, i) => {
      const p = getPoint(i, v)
      return `${p.x},${p.y}`
    }).join(' ')
  }

  const hasTarget = competencies.some((c) => c.target > 0)
  const hasRequired = competencies.some((c) => c.required > 0)

  return (
    <>
      <Card>
        <CardHeader><p className="font-semibold text-gray-900">核心職能雷達圖</p></CardHeader>
        <CardBody>
          <div className="flex justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* 背景網格 */}
              {Array.from({ length: levels }, (_, l) => {
                const r = ((l + 1) / levels) * radius
                const pts = Array.from({ length: count }, (_, i) => {
                  const angle = angleStep * i - Math.PI / 2
                  return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
                }).join(' ')
                return <polygon key={l} points={pts} fill="none" stroke="#e5e7eb" strokeWidth="1" />
              })}

              {/* 軸線 */}
              {competencies.map((_, i) => {
                const p = getPoint(i, levels)
                return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="1" />
              })}

              {/* 第三條線：職務最低要求（灰色虛線） */}
              {hasRequired && (
                <polygon
                  points={polygonPoints(competencies.map((c) => c.required))}
                  fill="rgba(156,163,175,0.08)"
                  stroke="#9ca3af"
                  strokeWidth="1.5"
                  strokeDasharray="6 3"
                />
              )}

              {/* 第二條線：IDP 目標（藍色虛線） */}
              {hasTarget && (
                <polygon
                  points={polygonPoints(competencies.map((c) => c.target))}
                  fill="rgba(99,102,241,0.08)"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
              )}

              {/* 第一條線：目前能力（綠色實線） */}
              <polygon
                points={polygonPoints(competencies.map((c) => c.current))}
                fill="rgba(34,197,94,0.15)"
                stroke="#22c55e"
                strokeWidth="2"
              />

              {/* 資料點 */}
              {competencies.map((c, i) => {
                const p = getPoint(i, c.current)
                return <circle key={i} cx={p.x} cy={p.y} r="4" fill="#22c55e" />
              })}

              {/* 等級標籤 (L1-L5) */}
              {Array.from({ length: levels }, (_, l) => {
                const p = getPoint(0, l + 1)
                return (
                  <text key={`lvl-${l}`} x={p.x + 8} y={p.y + 4}
                    className="fill-gray-400" fontSize="9">
                    L{l + 1}
                  </text>
                )
              })}

              {/* 職能名稱標籤 */}
              {competencies.map((c, i) => {
                const p = getPoint(i, levels + 1)
                return (
                  <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
                    className="fill-gray-600" fontSize="11">
                    {c.name.length > 5 ? c.name.slice(0, 5) + '…' : c.name}
                  </text>
                )
              })}
            </svg>
          </div>

          {/* 圖例 */}
          <div className="flex justify-center gap-6 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-green-500 inline-block" /> 目前能力
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-indigo-500 inline-block" style={{ borderBottom: '1.5px dashed #6366f1', height: 0 }} /> IDP 目標
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-gray-400 inline-block" style={{ borderBottom: '1.5px dashed #9ca3af', height: 0 }} /> 職務要求
            </span>
          </div>
        </CardBody>
      </Card>

      {/* 詳細分數表 */}
      <Card className="mt-5">
        <CardHeader><p className="font-semibold text-gray-900">職能詳細分數</p></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-2 text-left">職能</th>
                <th className="px-3 py-2 text-center">目前</th>
                <th className="px-3 py-2 text-center">職務要求</th>
                <th className="px-3 py-2 text-center">IDP 目標</th>
                <th className="px-3 py-2 text-left">進度</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {competencies.map((c) => {
                const gap = c.required > 0 && c.current < c.required
                const target = c.target || c.required || 5
                const pct = Math.min((c.current / target) * 100, 100)
                return (
                  <tr key={c.name} className={gap ? 'bg-red-50/50' : ''}>
                    <td className="px-5 py-2.5 font-medium text-gray-900">{c.name}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-green-600 font-mono font-bold">L{c.current}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {c.required > 0 ? (
                        <span className={`font-mono ${gap ? 'text-red-500 font-bold' : 'text-gray-400'}`}>L{c.required}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {c.target > 0 ? (
                        <span className="text-indigo-600 font-mono">L{c.target}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="w-20 bg-gray-200 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${gap ? 'bg-red-400' : 'bg-green-500'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
