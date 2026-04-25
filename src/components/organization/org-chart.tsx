import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const ROLE_LABELS: Record<string, string> = { hr: 'HR', manager: '主管', employee: '員工' }
const ROLE_COLORS: Record<string, string> = {
  hr: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  employee: 'bg-gray-100 text-gray-600',
}

interface Employee {
  id: string; full_name: string | null; email: string; role: string; department_id: string | null
}
interface Dept {
  id: string; name: string; manager_id: string | null; is_active: boolean; parent_id: string | null
}

function MemberRow({ m, companyId, managerId }: { m: Employee; companyId: string; managerId: string | null }) {
  return (
    <div className="px-4 py-2 flex items-center gap-3">
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
      {m.id === managerId && <span className="text-xs text-blue-500">主管</span>}
    </div>
  )
}

export function OrgChart({ departments, byDept, deptMap, companyId }: {
  departments: Dept[]
  byDept: Record<string, Employee[] | null>
  deptMap: Record<string, { name: string; managerId: string | null }>
  companyId: string
}) {
  const topLevel = departments.filter(d => d.is_active && !d.parent_id)
  const childSections = (parentId: string) => departments.filter(d => d.is_active && d.parent_id === parentId)
  const unassigned = byDept['__unassigned'] ?? []

  return (
    <div className="flex flex-col gap-4">
      {topLevel.map(dept => {
        const directMembers = byDept[dept.id] ?? []
        const sections = childSections(dept.id)
        const manager = directMembers.find(m => m.id === dept.manager_id)
          ?? sections.flatMap(s => byDept[s.id] ?? []).find(m => m.id === dept.manager_id)

        const totalCount = directMembers.length + sections.reduce((s, sec) => s + (byDept[sec.id]?.length ?? 0), 0)

        return (
          <div key={dept.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* 部門標頭 */}
            <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{dept.name}</span>
                <span className="text-xs text-gray-400">{totalCount} 人</span>
                {sections.length > 0 && (
                  <span className="text-xs text-indigo-400">{sections.length} 科別</span>
                )}
              </div>
              {manager && (
                <span className="text-xs text-gray-500">部門主管：{manager.full_name || manager.email}</span>
              )}
            </div>

            {/* 直屬部門的成員（無科別） */}
            {directMembers.length > 0 && (
              <div className="divide-y divide-gray-50">
                {directMembers.map(m => (
                  <MemberRow key={m.id} m={m} companyId={companyId} managerId={dept.manager_id} />
                ))}
              </div>
            )}

            {/* 科別 */}
            {sections.map(sec => {
              const secMembers = byDept[sec.id] ?? []
              const secManager = secMembers.find(m => m.id === sec.manager_id)
              return (
                <div key={sec.id} className="border-t border-gray-100">
                  {/* 科別標頭 */}
                  <div className="bg-indigo-50/40 px-4 pl-8 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-indigo-400">└</span>
                      <span className="text-xs font-semibold text-indigo-700">{sec.name}</span>
                      <span className="text-xs text-gray-400">{secMembers.length} 人</span>
                    </div>
                    {secManager && (
                      <span className="text-xs text-gray-500">科主管：{secManager.full_name || secManager.email}</span>
                    )}
                  </div>
                  {secMembers.length === 0 ? (
                    <div className="px-4 py-2 pl-10 text-xs text-gray-400">尚無成員</div>
                  ) : (
                    <div className="divide-y divide-gray-50 pl-4">
                      {secMembers.map(m => (
                        <MemberRow key={m.id} m={m} companyId={companyId} managerId={sec.manager_id} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {totalCount === 0 && (
              <div className="px-4 py-3 text-xs text-gray-400">尚無成員</div>
            )}
          </div>
        )
      })}

      {/* 未分配 */}
      {unassigned.length > 0 && (
        <div className="border border-amber-200 rounded-lg overflow-hidden">
          <div className="bg-amber-50 px-4 py-2.5 flex items-center gap-2">
            <span className="text-sm font-semibold text-amber-800">未分配部門</span>
            <Badge variant="warning">{unassigned.length} 人</Badge>
          </div>
          <div className="divide-y divide-gray-50">
            {unassigned.map(m => (
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

      {topLevel.length === 0 && unassigned.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-8">尚無部門和人員資料</p>
      )}
    </div>
  )
}
