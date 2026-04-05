'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const FIXED_DRIVES = [
  { id: 1, name: '開創力', region: '前額葉', hand: '左手拇指', brain: 'right' },
  { id: 2, name: '心像力', region: '後額葉', hand: '左手食指', brain: 'right' },
  { id: 3, name: '律動力', region: '頂葉', hand: '左手中指', brain: 'right' },
  { id: 4, name: '音樂力', region: '顳葉', hand: '左手無名指', brain: 'right' },
  { id: 5, name: '圖像力', region: '枕葉', hand: '左手小指', brain: 'right' },
  { id: 6, name: '管理力', region: '前額葉', hand: '右手拇指', brain: 'left' },
  { id: 7, name: '推理力', region: '後額葉', hand: '右手食指', brain: 'left' },
  { id: 8, name: '操控力', region: '頂葉', hand: '右手中指', brain: 'left' },
  { id: 9, name: '語言力', region: '顳葉', hand: '右手無名指', brain: 'left' },
  { id: 10, name: '辨識力', region: '枕葉', hand: '右手小指', brain: 'left' },
]

const PATTERNS = [
  { group: '斗紋', items: ['Wt', 'Ws', 'We', 'Wi', 'W', 'WC', 'Wd', 'Wp', 'Wpr', 'Wl', 'Wlr'] },
  { group: '箕紋', items: ['U', 'R'] },
  { group: '弧紋', items: ['As', 'Ae', 'Au', 'Ar', 'At', 'A'] },
]

interface Props {
  profileId: string
  profileName: string
  existingAssessment?: {
    drives: { id: number; name: string; percentage: number; pattern: string; description: string }[]
    assessment_date: string | null
    assessment_version: string | null
    assessment_spending: number
    notes: string | null
  } | null
}

export function TalentInputForm({ profileId, profileName, existingAssessment }: Props) {
  const [drives, setDrives] = useState<{ id: number; name: string; percentage: string; pattern: string; description: string }[]>(
    FIXED_DRIVES.map(d => {
      const existing = existingAssessment?.drives?.find(e => e.id === d.id || e.name === d.name)
      return {
        id: d.id,
        name: d.name,
        percentage: existing ? String(existing.percentage) : '',
        pattern: existing?.pattern ?? '',
        description: `${d.region}・${d.hand}`,
      }
    })
  )
  const [assessmentDate, setAssessmentDate] = useState(existingAssessment?.assessment_date ?? '')
  const [assessmentVersion, setAssessmentVersion] = useState(existingAssessment?.assessment_version ?? '')
  const [assessmentSpending, setAssessmentSpending] = useState(String(existingAssessment?.assessment_spending ?? ''))
  const [scheduledDate, setScheduledDate] = useState('')
  const [notes, setNotes] = useState(existingAssessment?.notes ?? '')
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  function updateDrive(idx: number, field: 'percentage' | 'pattern', value: string) {
    const updated = [...drives]
    updated[idx] = { ...updated[idx], [field]: value }
    setDrives(updated)
  }

  function handleSave() {
    const driveData = drives.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      percentage: Number(d.percentage) || 0,
      pattern: d.pattern,
    }))

    // 計算腦區
    const brainRegions: Record<string, { left: number; right: number }> = {}
    driveData.forEach(d => {
      const fixed = FIXED_DRIVES.find(f => f.id === d.id)
      if (!fixed) return
      if (!brainRegions[fixed.region]) brainRegions[fixed.region] = { left: 0, right: 0 }
      brainRegions[fixed.region][fixed.brain === 'left' ? 'left' : 'right'] = d.percentage
    })

    startTransition(async () => {
      await fetch('/api/talent-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profileId,
          drives: driveData,
          brain_regions: brainRegions,
          assessment_date: assessmentDate || null,
          assessment_version: assessmentVersion || null,
          assessment_spending: assessmentSpending ? Number(assessmentSpending) : 0,
          notes: notes || null,
        }),
      })
      if (scheduledDate) {
        await fetch('/api/role-management', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: profileId, scheduled_assessment_date: scheduledDate }),
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">天賦評量輸入</h3>
          <p className="text-sm text-gray-500">{profileName}</p>
        </div>
        {existingAssessment && <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">已有評量資料</span>}
      </div>

      {/* 評量資訊 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-gray-500">評量日期</label>
          <input type="date" value={assessmentDate} onChange={e => setAssessmentDate(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-xs text-gray-500">評量版本</label>
          <input value={assessmentVersion} onChange={e => setAssessmentVersion(e.target.value)}
            placeholder="例：v3.0" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-xs text-gray-500">評量費用</label>
          <input type="number" value={assessmentSpending} onChange={e => setAssessmentSpending(e.target.value)}
            placeholder="NT$" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-xs text-gray-500">預約評量日期</label>
          <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
          <p className="text-[10px] text-gray-400 mt-0.5">設定後儀表板會提醒</p>
        </div>
      </div>

      {/* 10 大驅力輸入 */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">十大驅動力</p>

        {/* 右腦（左手） */}
        <p className="text-xs text-purple-600 font-semibold mb-2">右腦（左手）</p>
        <div className="space-y-2 mb-4">
          {drives.filter((_, i) => i < 5).map((d, i) => (
            <DriveRow key={d.id} drive={d} index={i} onChange={updateDrive} color="purple" />
          ))}
        </div>

        {/* 左腦（右手） */}
        <p className="text-xs text-blue-600 font-semibold mb-2">左腦（右手）</p>
        <div className="space-y-2">
          {drives.filter((_, i) => i >= 5).map((d, i) => (
            <DriveRow key={d.id} drive={d} index={i + 5} onChange={updateDrive} color="blue" />
          ))}
        </div>
      </div>

      {/* 備註 */}
      <div>
        <label className="text-xs text-gray-500">分析師備註</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder="評量觀察與建議..." className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
      </div>

      {/* 儲存 */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={pending}
          className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {pending ? '儲存中...' : existingAssessment ? '更新評量' : '建立評量'}
        </button>
        {saved && <span className="text-sm text-green-600">已儲存</span>}
      </div>
    </div>
  )
}

function DriveRow({ drive, index, onChange, color }: {
  drive: { id: number; name: string; percentage: string; pattern: string; description: string }
  index: number
  onChange: (idx: number, field: 'percentage' | 'pattern', value: string) => void
  color: 'purple' | 'blue'
}) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg ${color === 'purple' ? 'bg-purple-50/50' : 'bg-blue-50/50'}`}>
      <div className="w-20 flex-shrink-0">
        <p className={`text-sm font-bold ${color === 'purple' ? 'text-purple-700' : 'text-blue-700'}`}>{drive.name}</p>
        <p className="text-[10px] text-gray-400">{drive.description}</p>
      </div>
      <div className="flex-1">
        <input type="number" value={drive.percentage} onChange={e => onChange(index, 'percentage', e.target.value)}
          min={0} max={100} placeholder="百分比 (0-100)"
          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
      </div>
      <div className="w-24 flex-shrink-0">
        <select value={drive.pattern} onChange={e => onChange(index, 'pattern', e.target.value)}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white">
          <option value="">紋型</option>
          {PATTERNS.map(g => (
            <optgroup key={g.group} label={g.group}>
              {g.items.map(p => <option key={p} value={p}>{p}</option>)}
            </optgroup>
          ))}
        </select>
      </div>
      {drive.percentage && Number(drive.percentage) > 0 && (
        <div className="w-16 flex-shrink-0">
          <div className="h-2 bg-gray-200 rounded-full">
            <div className={`h-2 rounded-full ${color === 'purple' ? 'bg-purple-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, Number(drive.percentage))}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}
