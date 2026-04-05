import { Card, CardHeader, CardBody } from '@/components/ui/card'

interface Person {
  id: string
  full_name: string | null
  email: string
}

interface Entry {
  id: string
  employee_id: string
  form_type: string
  status: string
}

const FORM_TYPES = [
  { key: 'job_analysis', label: '工作分析' },
  { key: 'job_description', label: '工作說明書' },
  { key: 'competency_standard', label: '職能標準' },
  { key: 'competency_assessment', label: '職能考核' },
]

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-300 text-gray-700',
  in_progress: 'bg-blue-400 text-white',
  submitted: 'bg-amber-400 text-white',
  reviewed: 'bg-blue-500 text-white',
  approved: 'bg-green-500 text-white',
}

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  in_progress: '填寫中',
  submitted: '已送審',
  reviewed: '已審閱',
  approved: '已核准',
}

interface CompetencyMatrixProps {
  people: Person[]
  entries: Entry[]
  companyId: string
}

export function CompetencyMatrix({ people, entries, companyId }: CompetencyMatrixProps) {
  // 統計
  const totalSlots = people.length * FORM_TYPES.length
  const completedSlots = people.reduce((acc, p) => {
    return acc + FORM_TYPES.filter((ft) =>
      entries.some((e) => e.employee_id === p.id && e.form_type === ft.key && e.status === 'approved')
    ).length
  }, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">職能矩陣總覽</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {people.length} 位人員 × {FORM_TYPES.length} 項表單
              {totalSlots > 0 && `，${completedSlots}/${totalSlots} 已完成`}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-200" /> 未建立</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400" /> 進行中</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> 待審</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" /> 完成</span>
          </div>
        </div>
      </CardHeader>

      {people.length === 0 ? (
        <CardBody>
          <div className="text-center py-12">
            <p className="text-sm text-gray-400 mb-1">尚無人員資料</p>
            <p className="text-xs text-gray-300">請先在「工作說明書」或「職能標準」Tab 新增人員</p>
          </div>
        </CardBody>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[180px]">
                  人員
                </th>
                {FORM_TYPES.map((ft) => (
                  <th key={ft.key} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {ft.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {people.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 sticky left-0 bg-white z-10">
                    <a href={`/companies/${companyId}/employees/${person.id}/passport`}
                      className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                      <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-indigo-700">
                          {(person.full_name || person.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-indigo-600 truncate hover:text-indigo-800">
                          {person.full_name || person.email}
                        </p>
                      </div>
                    </a>
                  </td>
                  {FORM_TYPES.map((ft) => {
                    const entry = entries.find(
                      (e) => e.employee_id === person.id && e.form_type === ft.key
                    )
                    return (
                      <td key={ft.key} className="px-4 py-3 text-center">
                        {entry ? (
                          <a
                            href={`/companies/${companyId}/competency/entries/${entry.id}`}
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[entry.status] ?? 'bg-gray-200 text-gray-600'}`}
                          >
                            {STATUS_LABELS[entry.status] ?? entry.status}
                          </a>
                        ) : (
                          <span className="inline-block w-8 h-8 rounded-lg bg-gray-100 border-2 border-dashed border-gray-200" title="尚未建立" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
