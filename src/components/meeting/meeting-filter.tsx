'use client'

import { useRouter } from 'next/navigation'

interface MeetingFilterProps {
  companies: { id: string; name: string }[]
  currentCompanyId: string
}

export function MeetingFilter({ companies, currentCompanyId }: MeetingFilterProps) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">篩選企業：</span>
      <select
        value={currentCompanyId}
        onChange={(e) => {
          const val = e.target.value
          router.push(val ? `/meetings?company=${val}` : '/meetings')
        }}
        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
      >
        <option value="">全部企業</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  )
}
