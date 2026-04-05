const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }

interface F { id: string; label: string; type: string; required?: boolean; description?: string; placeholder?: string; fields?: F[]; min_rows?: number; max_rows?: number; options?: { label: string; value: string }[]; signers?: string[] }
interface S { id: string; title?: string; description?: string; fields: F[] }
interface Schema { title: string; subtitle?: string; sections: S[] }

const SCHEMAS: Record<string, Schema> = {

'人才發展品質手冊': {
  title: '{{公司名稱}} 人才發展品質管理手冊', subtitle: '1QM',
  sections: [
    { id: 'cover', title: '封面', fields: [
      { id: 'company_name', label: '公司名稱', type: 'text', required: true },
      { id: 'doc_number', label: '文件編號', type: 'text', required: true },
      { id: 'version', label: '版本', type: 'text', required: true },
      { id: 'effective_date', label: '生效日期', type: 'date', required: true },
    ]},
    { id: 'intro', title: '一、企業簡介', fields: [
      { id: 'history', label: '企業沿革', type: 'textarea', required: true, description: '企業歷史、產業類別、規模' },
      { id: 'philosophy', label: '經營理念', type: 'textarea', required: true },
      { id: 'vision', label: '願景', type: 'textarea', required: true },
      { id: 'mission', label: '使命', type: 'textarea', required: true },
    ]},
    { id: 'org', title: '二、組織架構', fields: [
      { id: 'org_chart', label: '組織圖', type: 'file_upload', required: true, description: '上傳企業組織架構圖' },
      { id: 'dept_duties', label: '各部門職掌', type: 'repeating_group', required: true, min_rows: 1, max_rows: 20, fields: [
        { id: 'dept_name', label: '部門名稱', type: 'text', required: true },
        { id: 'duties', label: '職掌說明', type: 'textarea', required: true },
      ]},
    ]},
    { id: 'training', title: '三、訓練體系', fields: [
      { id: 'training_chart', label: '訓練體系圖', type: 'file_upload', required: true },
      { id: 'policy', label: '訓練政策', type: 'textarea', required: true },
      { id: 'objectives', label: '訓練目標', type: 'repeating_group', required: true, min_rows: 1, fields: [
        { id: 'obj', label: '目標', type: 'text', required: true },
      ]},
      { id: 'competencies', label: '核心職能清單', type: 'repeating_group', required: true, min_rows: 1, fields: [
        { id: 'name', label: '職能名稱', type: 'text', required: true },
        { id: 'desc', label: '說明', type: 'text' },
      ]},
    ]},
    { id: 'pddro', title: '四、PDDRO 運作流程', description: '通用內容', fields: [
      { id: 'p', label: 'P 計畫（Plan）', type: 'textarea', required: true },
      { id: 'd', label: 'D 設計（Design）', type: 'textarea', required: true },
      { id: 'do', label: 'DO 執行（Do）', type: 'textarea', required: true },
      { id: 'r', label: 'R 查核（Review）', type: 'textarea', required: true },
      { id: 'o', label: 'O 成果（Outcome）', type: 'textarea', required: true },
    ]},
    { id: 'doc_ctrl', title: '五、文件管制', fields: [
      { id: 'levels', label: '文件層級說明', type: 'textarea', required: true },
      { id: 'procedure', label: '文件管制程序', type: 'textarea', required: true },
      { id: 'retention', label: '紀錄保存規定', type: 'textarea' },
    ]},
    { id: 'appendix', title: '附錄', fields: [
      { id: 'history', label: '版本修訂紀錄', type: 'repeating_group', min_rows: 1, fields: [
        { id: 'ver', label: '版本', type: 'text', required: true },
        { id: 'date', label: '日期', type: 'date', required: true },
        { id: 'change', label: '修訂內容', type: 'text', required: true },
        { id: 'approver', label: '核准人', type: 'text' },
      ]},
    ]},
  ],
},

'訓練主管與辦訓人員職能標準表': {
  title: '{{公司名稱}} 訓練主管與辦訓人員職能標準表', subtitle: '3WI-2-5-1',
  sections: [
    { id: 'standards', title: '職能標準', fields: [
      { id: 'positions', label: '職位職能', type: 'repeating_group', required: true, min_rows: 1, fields: [
        { id: 'position', label: '職位名稱', type: 'text', required: true },
        { id: 'competency', label: '職能項目', type: 'text', required: true },
        { id: 'standard', label: '標準等級', type: 'text', required: true },
        { id: 'desc', label: '等級說明', type: 'textarea' },
      ]},
    ]},
  ],
},

'講師甄選辦法': {
  title: '{{公司名稱}} 講師甄選辦法', subtitle: '3WI-4-3-1',
  sections: [
    { id: 'purpose', title: '目的', fields: [
      { id: 'purpose', label: '目的', type: 'textarea', required: true },
    ]},
    { id: 'criteria', title: '甄選標準', fields: [
      { id: 'internal', label: '內部講師條件', type: 'textarea', required: true },
      { id: 'external', label: '外部講師條件', type: 'textarea', required: true },
      { id: 'license', label: '特殊證照需求', type: 'textarea' },
    ]},
    { id: 'process', title: '甄選流程', fields: [
      { id: 'flow', label: '甄選流程說明', type: 'textarea', required: true },
      { id: 'approval', label: '簽核層級', type: 'textarea', required: true },
    ]},
  ],
},

'年度訓練計畫總表': {
  title: '{{公司名稱}} 年度訓練計畫總表',
  sections: [
    { id: 'info', title: '基本資訊', fields: [
      { id: 'year', label: '年度', type: 'number', required: true },
    ]},
    { id: 'checklist', title: 'TTQS 課程建檔目錄', fields: [
      { id: 'plan_file', label: '計畫總表檔案', type: 'file_upload', description: '上傳年度訓練計畫' },
      { id: 'p_check', label: 'P 計畫', type: 'checkbox', options: [{ label: '年度訓練計畫總表', value: 'plan' }] },
      { id: 'd_check', label: 'D 設計', type: 'checkbox', options: [{ label: '訓練需求調查', value: 'needs' }, { label: '教育訓練方案設計表', value: 'design' }] },
      { id: 'do_check', label: 'DO 執行', type: 'checkbox', options: [{ label: '公告', value: 'announce' }, { label: '講師評選表', value: 'instructor' }, { label: '教學方法聯繫單', value: 'method' }, { label: '教材審核表', value: 'material' }, { label: '場地評選表', value: 'venue' }] },
      { id: 'r_check', label: 'R 查核', type: 'checkbox', options: [{ label: '簽到表', value: 'sign' }, { label: '工作��誌', value: 'log' }, { label: '管控表', value: 'control' }, { label: '結案報告', value: 'report' }] },
      { id: 'o_check', label: 'O 成果', type: 'checkbox', options: [{ label: '滿意度調查', value: 'survey' }, { label: '課程成果', value: 'result' }, { label: '結業證書', value: 'cert' }] },
    ]},
  ],
},

'文件表單一覽表': {
  title: '{{公司名稱}} 文件表單一覽表',
  sections: [
    { id: 'list', title: '文件清單', description: '可由系統自動產生', fields: [
      { id: 'documents', label: '文件列表', type: 'repeating_group', required: true, min_rows: 1, max_rows: 50, fields: [
        { id: 'tier', label: '階層', type: 'select', required: true, options: [{ label: '一階', value: '1' }, { label: '二階', value: '2' }, { label: '三階', value: '3' }, { label: '四階', value: '4' }] },
        { id: 'number', label: '文件編號', type: 'text', required: true },
        { id: 'name', label: '文件名稱', type: 'text', required: true },
        { id: 'version', label: '版本', type: 'text' },
        { id: 'date', label: '修改日期', type: 'date' },
      ]},
    ]},
  ],
},

'參訓學員意見調查表': {
  title: '{{公司名稱}} 參訓學員意見調查表',
  sections: [
    { id: 'info', fields: [
      { id: 'note', label: '此表單已連動課程滿意度調查系統，無需另外設定', type: 'static_text' },
    ]},
  ],
},

'年度教育訓練需求調查問卷': {
  title: '{{公司名稱}} 年度教育訓練需求調查問卷',
  sections: [
    { id: 'respondent', title: '填答人資訊', fields: [
      { id: 'name', label: '姓名', type: 'text', required: true },
      { id: 'dept', label: '部門', type: 'text', required: true },
      { id: 'title', label: '職稱', type: 'text' },
    ]},
    { id: 'needs', title: '訓練需求', fields: [
      { id: 'current_gap', label: '目前工作中最需加強的能力', type: 'textarea', required: true },
      { id: 'desired_courses', label: '希望公司開設的課程主題', type: 'textarea', required: true },
      { id: 'preferred_time', label: '適合的訓練時段', type: 'radio', options: [
        { label: '上班時間', value: 'work' }, { label: '下班後', value: 'after' }, { label: '假日', value: 'weekend' }, { label: '皆可', value: 'any' },
      ]},
      { id: 'preferred_method', label: '偏好的學習方式', type: 'checkbox', options: [
        { label: '實體授課', value: 'onsite' }, { label: '線上課程', value: 'online' }, { label: '混合式', value: 'hybrid' }, { label: '��作坊', value: 'workshop' },
      ]},
      { id: 'suggestions', label: '其他建議', type: 'textarea' },
    ]},
  ],
},

'年度訓練課程計畫表': {
  title: '{{公司名稱}} 年度訓練課程計畫表',
  sections: [
    { id: 'info', title: '基本資訊', fields: [
      { id: 'year', label: '年度', type: 'number', required: true },
    ]},
    { id: 'courses', title: '課程規劃', fields: [
      { id: 'plan', label: '年度課程計畫', type: 'repeating_group', required: true, min_rows: 1, max_rows: 30, fields: [
        { id: 'name', label: '課程名稱', type: 'text', required: true },
        { id: 'target', label: '對象', type: 'text' },
        { id: 'month', label: '預定月份', type: 'text' },
        { id: 'hours', label: '時數', type: 'number' },
        { id: 'budget', label: '預算', type: 'number' },
        { id: 'person', label: '負責人', type: 'text' },
      ]},
    ]},
    { id: 'sign', title: '簽核', fields: [
      { id: 'approval', label: '簽核', type: 'signature', signers: ['承辦人', '主管', '總經理'] },
    ]},
  ],
},

'結業證書': {
  title: '{{公司名稱}} 結業證書',
  sections: [
    { id: 'cert', title: '證書資訊', fields: [
      { id: 'template', label: '證書範本檔案', type: 'file_upload', description: '上傳結業證書範本' },
      { id: 'notes', label: '備註', type: 'textarea' },
    ]},
  ],
},

'訓練需求調查（課前問卷）': {
  title: '{{公司名稱}} 訓練需求調查（課前問卷）',
  sections: [
    { id: 'info', title: '課程資訊', fields: [
      { id: 'course_name', label: '課程名稱', type: 'text', required: true, auto_populate: 'course.title' },
      { id: 'date', label: '調查日期', type: 'date', required: true },
    ]},
    { id: 'needs', title: '訓練需求', fields: [
      { id: 'skills', label: '最需加強的技能', type: 'textarea', required: true },
      { id: 'outcomes', label: '期望獲得的成果', type: 'textarea', required: true },
      { id: 'methods', label: '偏好學習方式', type: 'checkbox', options: [
        { label: '講述法', value: 'lecture' }, { label: '分組討論', value: 'discussion' }, { label: '案例研討', value: 'case' },
        { label: '角色扮演', value: 'roleplay' }, { label: '影片教學', value: 'video' }, { label: '實作演練', value: 'practice' },
      ]},
      { id: 'notes', label: '其他建議', type: 'textarea' },
    ]},
  ],
},

}

async function update(name: string, schema: Schema) {
  const url = `${SUPABASE_URL}/rest/v1/knowledge_base_templates?standard_name=eq.${encodeURIComponent(name)}&is_system=eq.true`
  const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify({ structured_content: schema }) })
  if (!res.ok) console.error(`ERR: ${name}`, await res.text())
  else console.log(`OK: ${name}`)
}

async function main() {
  for (const [name, schema] of Object.entries(SCHEMAS)) await update(name, schema)
  console.log(`\nDone! ${Object.keys(SCHEMAS).length} templates updated`)
}
main()
