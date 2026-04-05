'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleActionItemTodo, toggleActionItemComplete } from '@/app/(dashboard)/meetings/actions'
import type { MeetingActionItem } from '@/types/database'

interface ActionItemsListProps {
  items: MeetingActionItem[]
  consultantMap: Record<string, string>
}

export function ActionItemsList({ items, consultantMap }: ActionItemsListProps) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleToggleComplete(itemId: string, current: boolean) {
    startTransition(async () => {
      await toggleActionItemComplete(itemId, !current)
      router.refresh()
    })
  }

  function handleToggleTodo(itemId: string, current: boolean) {
    startTransition(async () => {
      await toggleActionItemTodo(itemId, !current)
      router.refresh()
    })
  }

  if (items.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">無 Action Item</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 py-2">
          {/* 完成勾選 */}
          <button
            onClick={() => handleToggleComplete(item.id, item.is_completed)}
            disabled={pending}
            className="flex-shrink-0 mt-0.5"
          >
            {item.is_completed ? (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
            )}
          </button>

          {/* 內容 */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {item.content}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              {item.assignee_id && (
                <span>負責：{consultantMap[item.assignee_id] ?? '?'}</span>
              )}
              {item.due_date && <span>期限：{item.due_date}</span>}
              {item.is_completed && item.completed_at && (
                <span className="text-green-500">完成於 {new Date(item.completed_at).toLocaleDateString('zh-TW')}</span>
              )}
            </div>
          </div>

          {/* 加入待辦 */}
          <button
            onClick={() => handleToggleTodo(item.id, item.is_added_to_todo)}
            disabled={pending}
            className={`flex-shrink-0 text-xs rounded-full border px-2.5 py-0.5 transition-colors ${
              item.is_added_to_todo
                ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-indigo-200 hover:text-indigo-500'
            }`}
            title={item.is_added_to_todo ? '已加入待辦' : '加入待辦'}
          >
            {item.is_added_to_todo ? '已加入待辦' : '加入待辦'}
          </button>
        </div>
      ))}
    </div>
  )
}
