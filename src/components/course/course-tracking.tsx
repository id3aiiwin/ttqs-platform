'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface AbsentItem { name: string; reason: string }

interface TrackingRecord {
  id: string
  tracking_date: string
  expected_count: number | null
  actual_count: number | null
  absent_list: AbsentItem[]
  schedule_status: string
  equipment_ok: boolean
  equipment_note: string | null
  engagement_level: string
  engagement_note: string | null
  has_incident: boolean
  incident_desc: string | null
  incident_action: string | null
  photo_count: number
  summary: string | null
  recorded_by_name: string | null
}

interface Props {
  courseId: string
  records: TrackingRecord[]
  isConsultant: boolean
}

const SCHEDULE_LABELS: Record<string, { label: string; color: string }> = {
  on_time: { label: '準時', color: 'text-green-700 bg-green-100' },
  delayed: { label: '延遲', color: 'text-yellow-700 bg-yellow-100' },
  ahead: { label: '提前', color: 'text-blue-700 bg-blue-100' },
  cancelled: { label: '取消', color: 'text-red-700 bg-red-100' },
}

const ENGAGEMENT_LABELS: Record<string, { label: string; color: string }> = {
  high: { label: '高度參與', color: 'text-green-700 bg-green-100' },
  normal: { label: '一般', color: 'text-gray-700 bg-gray-100' },
  low: { label: '參與度低', color: 'text-red-700 bg-red-100' },
}

export function CourseTracking({ courseId, records, isConsultant }: Props) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    expected_count: '', actual_count: '', absent_names: '',
    schedule_status: 'on_time', equipment_ok: true, equipment_note: '',
    engagement_level: 'normal', engagement_note: '',
    has_incident: false, incident_desc: '', incident_action: '',
    photo_count: '', summary: '',
  })
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit() {
    const absentList = form.absent_names.split('\n').filter(l => l.trim()).map(l => {
      const [name, ...rest] = l.split(/[,，]/)
      return { name: name.trim(), reason: rest.join(',').trim() || '未說明' }
    })

    startTransition(async () => {
      await fetch('/api/course-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          expected_count: form.expected_count ? Number(form.expected_count) : null,
          actual_count: form.actual_count ? Number(form.actual_count) : null,
          absent_list: absentList,
          schedule_status: form.schedule_status,
          equipment_ok: form.equipment_ok,
          equipment_note: form.equipment_note || null,
          engagement_level: form.engagement_level,
          engagement_note: form.engagement_note || null,
          has_incident: form.has_incident,
          incident_desc: form.incident_desc || null,
          incident_action: form.incident_action || null,
          photo_count: form.photo_count ? Number(form.photo_count) : 0,
          summary: form.summary || null,
        }),
      })
      setAdding(false)
      router.refresh()
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400">課程進行中的即時狀況追蹤</p>
        {isConsultant && !adding && (
          <button onClick={() => setAdding(true)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ 新增紀錄</button>
        )}
      </div>

      {/* 新增表單 */}
      {adding && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mb-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">課中狀況記錄</h4>

          {/* 出席 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">應到人數</label>
              <input type="number" value={form.expected_count} onChange={e => setForm({ ...form, expected_count: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="text-xs text-gray-500">實到人數</label>
              <input type="number" value={form.actual_count} onChange={e => setForm({ ...form, actual_count: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">缺席名單（每行一人：姓名, 原因）</label>
            <textarea value={form.absent_names} onChange={e => setForm({ ...form, absent_names: e.target.value })} rows={2}
              placeholder="王小明, 請假&#10;李美美, 出差" className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
          </div>

          {/* 課程狀況 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">進度狀況</label>
              <select value={form.schedule_status} onChange={e => setForm({ ...form, schedule_status: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white">
                <option value="on_time">準時</option><option value="delayed">延遲</option>
                <option value="ahead">提前</option><option value="cancelled">取消</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">學員參與度</label>
              <select value={form.engagement_level} onChange={e => setForm({ ...form, engagement_level: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white">
                <option value="high">高度參與</option><option value="normal">一般</option><option value="low">參與度低</option>
              </select>
            </div>
          </div>
          {form.engagement_level !== 'normal' && (
            <input value={form.engagement_note} onChange={e => setForm({ ...form, engagement_note: e.target.value })}
              placeholder="參與度說明..." className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
          )}

          {/* 設備 */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.equipment_ok} onChange={e => setForm({ ...form, equipment_ok: e.target.checked })}
                className="rounded text-indigo-600" />
              設備正常
            </label>
            {!form.equipment_ok && (
              <input value={form.equipment_note} onChange={e => setForm({ ...form, equipment_note: e.target.value })}
                placeholder="設備問題..." className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5" />
            )}
          </div>

          {/* 異常 */}
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.has_incident} onChange={e => setForm({ ...form, has_incident: e.target.checked })}
                className="rounded text-red-600" />
              有異常事件
            </label>
            {form.has_incident && (
              <div className="mt-2 space-y-2">
                <textarea value={form.incident_desc} onChange={e => setForm({ ...form, incident_desc: e.target.value })} rows={2}
                  placeholder="異常描述..." className="w-full text-sm border border-red-300 rounded px-2 py-1.5" />
                <input value={form.incident_action} onChange={e => setForm({ ...form, incident_action: e.target.value })}
                  placeholder="處理措施..." className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">課程照片數</label>
              <input type="number" value={form.photo_count} onChange={e => setForm({ ...form, photo_count: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">綜合摘要</label>
            <textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} rows={3}
              placeholder="今日課程整體狀況..." className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
          </div>

          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={pending}
              className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded px-4 py-1.5 disabled:opacity-50">
              {pending ? '儲存...' : '儲存紀錄'}
            </button>
            <button onClick={() => setAdding(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5">取消</button>
          </div>
        </div>
      )}

      {/* 紀錄列表 */}
      {records.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">尚無課中追蹤紀錄</p>
      ) : (
        <div className="space-y-3">
          {records.map(r => {
            const schedule = SCHEDULE_LABELS[r.schedule_status] ?? SCHEDULE_LABELS.on_time
            const engagement = ENGAGEMENT_LABELS[r.engagement_level] ?? ENGAGEMENT_LABELS.normal
            const absentList = Array.isArray(r.absent_list) ? r.absent_list : []
            return (
              <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{r.tracking_date}</span>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${schedule.color}`}>{schedule.label}</span>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${engagement.color}`}>{engagement.label}</span>
                    {r.has_incident && <span className="text-xs rounded-full px-2 py-0.5 bg-red-100 text-red-700">有異常</span>}
                  </div>
                  {r.recorded_by_name && <span className="text-xs text-gray-400">{r.recorded_by_name}</span>}
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs mb-2">
                  <div>
                    <span className="text-gray-400">出席：</span>
                    <span className="text-gray-700">{r.actual_count ?? '—'} / {r.expected_count ?? '—'}</span>
                    {absentList.length > 0 && <span className="text-red-500 ml-1">（缺席 {absentList.length}）</span>}
                  </div>
                  <div>
                    <span className="text-gray-400">設備：</span>
                    <span className={r.equipment_ok ? 'text-green-600' : 'text-red-600'}>{r.equipment_ok ? '正常' : '有問題'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">照片：</span>
                    <span className="text-gray-700">{r.photo_count} 張</span>
                  </div>
                </div>

                {absentList.length > 0 && (
                  <div className="text-xs text-gray-500 mb-2">
                    缺席：{absentList.map(a => `${a.name}(${a.reason})`).join('、')}
                  </div>
                )}

                {r.has_incident && r.incident_desc && (
                  <div className="text-xs bg-red-50 rounded px-2 py-1 mb-2">
                    <span className="text-red-600 font-medium">異常：</span>{r.incident_desc}
                    {r.incident_action && <span className="text-gray-600"> → {r.incident_action}</span>}
                  </div>
                )}

                {r.summary && <p className="text-sm text-gray-700">{r.summary}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
