import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const ROLE_LABELS: Record<string, string> = { hr: 'HR', manager: '主管', employee: '員工' }
const ROLE_COLORS: Record<string, string> = {
  hr: 'bg-purple-100 text-purple-700', manager: 'bg-blue-100 text-blue-700', employee: 'bg-gray-100 text-gray-600',
}

interface Employee { id: string; full_name: string | null; email: string; role: string; department_id: string | null }
interface Dept { id: string; name: string; manager_id: string | null; is_active: boolean }

export function OrgChart({ departments, byDept, deptMap, companyId }: {
  departments: Dept[]
  byDept: Record<string, Employee[] | null>
  deptMap: Record<string, { name: string; managerId: string | null }>
  companyId: string
}) {
  const activeDepts = departments.filter((d) => d.is_active)
  const unassigned = byDept['__unassigned'] ?? []

  return (
    <div className="flex flex-col gap-4">
      {activeDepts.map((dept) => {
        const members = byDept[dept.id] ?? []
        const manager = members.find((m) => m.id === dept.manager_id)
        return (
          <div key={dept.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{dept.name}</span>
                <span className="text-xs text-gray-400">{members.length} 人</span>
              </div>
              {manager && (
                <span className="text-xs text-gray-500">主管：{manager.full_name || manager.email}</span>
              )}
            </div>
            {members.length === 0 ? (
              <div className="px-4 py-3 text-xs text-gray-400">尚無成員</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {members.map((m) => (
                  <div key={m.id} className="px-4 py-2 flex items-center gap-3">
                    <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-indigo-700">
                        {(m.full_name || m.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/companies/${companyId}/employees/${m.id}/passport`}
                        className="text-sm text-gray-900 hover:text-indigo-600 truncate block">
                        {m.full_name || m.email}
                      </Link>
                    </div>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${ROLE_COLORS[m.role] ?? ROLE_COLORS.employee}`}>
                      {ROLE_LABELS[m.role] ?? m.role}
                    </span>
                    {m.id === dept.manager_id && (
                      <span className="text-xs text-blue-500">部門主管</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* 未分配部門 */}
      {unassigned.length > 0 && (
        <div className="border border-amber-200 rounded-lg overflow-hidden">
          <div className="bg-amber-50 px-4 py-2.5 flex items-center gap-2">
            <span className="text-sm font-semibold text-amber-800">未分配部門</span>
            <Badge variant="warning">{unassigned.length} 人</Badge>
          </div>
          <div className="divide-y divide-gray-50">
            {unassigned.map((m) => (
              <div key={m.id} className="px-4 py-2 flex items-center gap-3">
                <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-amber-700">
                    {(m.full_name || m.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-900 flex-1 truncate">{m.full_name || m.email}</span>
                <span className={`text-xs rounded-full px-2 py-0.5 ${ROLE_COLORS[m.role] ?? ROLE_COLORS.employee}`}>
                  {ROLE_LABELS[m.role] ?? m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeDepts.length === 0 && unassigned.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-8">尚無部門和人員資料</p>
      )}
    </div>
  )
}
