'use client'

import { useState } from 'react'

interface Unit { title: string; youtubeId?: string; description?: string }

interface Props {
  productTitle: string
  units: Unit[]
}

export function CoursePlayer({ productTitle, units }: Props) {
  const [currentUnit, setCurrentUnit] = useState(0)
  const [completed, setCompleted] = useState<Set<number>>(new Set())

  if (units.length === 0) return <p className="text-gray-400 text-center py-8">此課程尚無單元</p>

  const unit = units[currentUnit]

  function markComplete(idx: number) {
    setCompleted(prev => new Set([...prev, idx]))
  }

  return (
    <div className="flex gap-4 h-[500px]">
      {/* 單元列表 */}
      <div className="w-64 flex-shrink-0 bg-gray-50 rounded-lg overflow-y-auto border border-gray-200">
        <div className="p-3 border-b border-gray-200">
          <p className="text-sm font-bold text-gray-900">{productTitle}</p>
          <p className="text-xs text-gray-400">{completed.size}/{units.length} 完成</p>
        </div>
        <div className="p-2 space-y-1">
          {units.map((u, i) => (
            <button key={i} onClick={() => { setCurrentUnit(i); markComplete(i) }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                i === currentUnit ? 'bg-indigo-100 text-indigo-700 font-medium' : completed.has(i) ? 'text-green-600 hover:bg-gray-100' : 'text-gray-700 hover:bg-gray-100'
              }`}>
              <span className="text-xs mr-1">{completed.has(i) ? '✅' : `${i + 1}.`}</span>
              {u.title}
            </button>
          ))}
        </div>
      </div>

      {/* 影片區域 */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 bg-black rounded-lg overflow-hidden">
          {unit?.youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${unit.youtubeId}?modestbranding=1&rel=0`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">無影片內容</div>
          )}
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-sm font-medium text-gray-900">第 {currentUnit + 1} 單元：{unit?.title}</p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentUnit(Math.max(0, currentUnit - 1))} disabled={currentUnit === 0}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-30">上一單元</button>
            <button onClick={() => { markComplete(currentUnit); setCurrentUnit(Math.min(units.length - 1, currentUnit + 1)) }} disabled={currentUnit === units.length - 1}
              className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg disabled:opacity-30">下一單元</button>
          </div>
        </div>
      </div>
    </div>
  )
}
