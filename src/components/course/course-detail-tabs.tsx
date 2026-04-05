'use client'

import { useState } from 'react'

interface Tab { id: string; label: string; visible: boolean }

interface Props {
  tabs: Tab[]
  children: Record<string, React.ReactNode>
  summaryCards?: React.ReactNode
}

export function CourseDetailTabs({ tabs, children, summaryCards }: Props) {
  const visibleTabs = tabs.filter(t => t.visible)
  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id ?? '')

  return (
    <div>
      {/* 摘要卡片 */}
      {summaryCards}

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {visibleTabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 text-center py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {visibleTabs.map(tab => (
        <div key={tab.id} className={activeTab === tab.id ? '' : 'hidden'}>
          {children[tab.id]}
        </div>
      ))}
    </div>
  )
}
