'use client'

import { useRouter } from 'next/navigation'

export function OrgDeptFilter({ companyId, departments, current }: {
  companyId: string; departments: { id: string; name: string }[]; current: string
}) {
  const router = useRouter()
  return (
    <select value={current}
      onChange={(e) => {
        const v = e.target.value
        router.push(v ? `/companies/${companyId}/organization?dept=${v}` : `/companies/${companyId}/organization`)
      }}
      className="text-sm border border-gray-300 rounded-lg px-3 py-1 bg-white">
      <option value="">全部</option>
      <option value="__unassigned">未分配</option>
      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
    </select>
  )
}
