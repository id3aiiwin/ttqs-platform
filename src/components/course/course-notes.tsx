'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const NOTE_TYPES: Record<string, { label: string; color: string }> = {
  observation: { label: '觀察紀錄', color: 'bg-blue-100 text-blue-700' },
  teaching:    { label: '教學狀況', color: 'bg-purple-100 text-purple-700' },
  issue:       { label: '問題記錄', color: 'bg-red-100 text-red-700' },
  suggestion:  { label: '改善建議', color: 'bg-green-100 text-green-700' },
  other:       { label: '其他', color: 'bg-gray-100 text-gray-700' },
}

interface Note {
  id: string
  author_name: string | null
  note_type: string
  content: string
  employee_id: string | null
  employee_name: string | null
  created_at: string
}

interface Employee {
  id: string
  name: string
}

interface Props {
  courseId: string
  notes: Note[]
  isConsultant: boolean
  /** 該課程的學員列表（用於選擇個別學員） */
  employees?: Employee[]
}

export function CourseNotes({ courseId, notes, isConsultant, employees }: Props) {
  const [adding, setAdding] = useState(false)
  const [noteType, setNoteType] = useState('observation')
  const [content, setContent] = useState('')
  const [target, setTarget] = useState<'class' | 'individual'>('class')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [filterTarget, setFilterTarget] = useState<'all' | 'class' | 'individual'>('all')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleAdd() {
    if (!content.trim()) return
    if (target === 'individual' && !selectedEmployee) { alert('請選擇學員'); return }

    const emp = employees?.find(e => e.id === selectedEmployee)

    startTransition(async () => {
      await fetch('/api/course-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          note_type: noteType,
          content: content.trim(),
          employee_id: target === 'individual' ? selectedEmployee : null,
          employee_name: target === 'individual' ? emp?.name : null,
        }),
      })
      setContent('')
      setAdding(false)
      setSelectedEmployee('')
      setTarget('class')
      router.refresh()
    })
  }

  async function handleDelete(noteId: string) {
    if (!confirm('確定刪除？')) return
    startTransition(async () => {
      await fetch('/api/course-notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: noteId }),
      })
      router.refresh()
    })
  }

  // 篩選紀錄
  const filtered = notes.filter(n => {
    if (filterTarget === 'class') return !n.employee_id
    if (filterTarget === 'individual') return !!n.employee_id
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">內部</span>
          <span className="text-xs text-gray-400">僅顧問/講師可見</span>
        </div>
        {isConsultant && !adding && (
          <button onClick={() => setAdding(true)}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ 新增紀錄</button>
        )}
      </div>

      {/* 新增表單 */}
      {adding && (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 mb-4 space-y-2">
          <div className="flex items-center gap-3">
            {/* 對象選擇 */}
            <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => setTarget('class')}
                className={`px-3 py-1.5 text-xs font-medium ${target === 'class' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                整班
              </button>
              <button onClick={() => setTarget('individual')}
                className={`px-3 py-1.5 text-xs font-medium ${target === 'individual' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                單一學員
              </button>
            </div>

            <select value={noteType} onChange={e => setNoteType(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white">
              {Object.entries(NOTE_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* 學員選擇 */}
          {target === 'individual' && (
            <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
              <option value="">選擇學員...</option>
              {(employees ?? []).map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          )}

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            placeholder={target === 'individual' ? '記錄該學員的學習狀況、表現、需關注事項...' : '記錄教學觀察、課程狀況、問題或建議...'}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={pending || !content.trim()}
              className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded px-3 py-1.5 disabled:opacity-50">新增</button>
            <button onClick={() => { setAdding(false); setContent(''); setSelectedEmployee(''); setTarget('class') }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5">取消</button>
          </div>
        </div>
      )}

      {/* 篩選 */}
      {notes.length > 0 && (
        <div className="flex gap-1 mb-3">
          {(['all', 'class', 'individual'] as const).map(f => (
            <button key={f} onClick={() => setFilterTarget(f)}
              className={`text-xs px-2.5 py-1 rounded-full ${filterTarget === f ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              {f === 'all' ? '全部' : f === 'class' ? '整班' : '個別學員'}
              <span className="ml-1 text-[10px]">
                ({f === 'all' ? notes.length : f === 'class' ? notes.filter(n => !n.employee_id).length : notes.filter(n => !!n.employee_id).length})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 紀錄列表 */}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">尚無課程紀錄</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(note => {
            const typeInfo = NOTE_TYPES[note.note_type] ?? NOTE_TYPES.other
            return (
              <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-3 group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs rounded-full px-2 py-0.5 ${typeInfo.color}`}>{typeInfo.label}</span>
                    {note.employee_name ? (
                      <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5">
                        學員：{note.employee_name}
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">整班</span>
                    )}
                    {note.author_name && <span className="text-xs text-gray-400">{note.author_name}</span>}
                    <span className="text-xs text-gray-300">
                      {new Date(note.created_at).toLocaleDateString('zh-TW')} {new Date(note.created_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {isConsultant && (
                    <button onClick={() => handleDelete(note.id)}
                      className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      刪除
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
