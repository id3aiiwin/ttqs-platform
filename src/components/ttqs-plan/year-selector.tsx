'use client'

import { useRouter } from 'next/navigation'

export function YearSelector({ companyId, currentYear, availableYears }: {
  companyId: string; currentYear: number; availableYears: number[]
}) {
  const router = useRouter()
  return (
    <select value={currentYear}
      onChange={(e) => router.push(`/companies/${companyId}/ttqs-plan?year=${e.target.value}`)}
      className="text-sm font-medium border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
      {availableYears.map((y) => <option key={y} value={y}>{y} 年度</option>)}
    </select>
  )
}
