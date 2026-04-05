'use client'

import { useRouter } from 'next/navigation'

interface OverviewFilterProps {
  years: number[]
  companies: { id: string; name: string }[]
  plans: { id: string; name: string }[]
  currentYear: string
  currentCompany: string
  currentPlan: string
}

export function OverviewFilter({ years, companies, plans, currentYear, currentCompany, currentPlan }: OverviewFilterProps) {
  const router = useRouter()

  function navigate(year: string, company: string, plan: string) {
    const params = new URLSearchParams()
    if (year) params.set('year', year)
    if (company) params.set('company', company)
    if (plan) params.set('plan', plan)
    router.push(`/overview${params.toString() ? '?' + params.toString() : ''}`)
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">年度：</span>
        <select value={currentYear}
          onChange={(e) => navigate(e.target.value, currentCompany, currentPlan)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
          <option value="">全部</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">企業：</span>
        <select value={currentCompany}
          onChange={(e) => navigate(currentYear, e.target.value, currentPlan)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
          <option value="">全部</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">計畫：</span>
        <select value={currentPlan}
          onChange={(e) => navigate(currentYear, currentCompany, e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
          <option value="">全部</option>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
    </div>
  )
}
