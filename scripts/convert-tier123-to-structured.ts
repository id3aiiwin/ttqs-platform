/**
 * 將一二三階文件轉為結構化 FormSchema
 * source <(grep -v '^#' .env.local | sed 's/^/export /') && npx tsx scripts/convert-tier123-to-structured.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
}

interface F { id: string; label: string; type: string; required?: boolean; description?: string; placeholder?: string; fields?: F[]; min_rows?: number; max_rows?: number; options?: { label: string; value: string }[]; signers?: string[] }
interface S { id: string; title?: string; description?: string; fields: F[] }
interface Schema { title: string; subtitle?: string; sections: S[] }

const SCHEMAS: Record<string, Schema> = {

'人才發展品質��冊': {
  title: '{{公司名稱}} 人才��展品質管理手冊', subtitle: '1QM',
  sections: [
    { id: 'cover', title: '封面', fields: [
      { id: 'company_name', label: '公司名稱', type: 'text', required: true },
      { id: 'doc_number', label: '文件編號', type: 'text', required: true },
      { id: 'version', label: '版本', type: 'text', required: true },
      { id: 'effective_date', label: '生效日期', type: 'date', required: true },
    ]},
    { id: 'intro', title: '一、企業簡介', fields: [
      { id: 'history', label: '企業沿革', type: 'textarea', required: true, description: '請填入企業歷史、產業類別、規模等' },
      { id: 'philosophy', label: '經營理念', type: 'textarea', required: true },
      { id: 'vision', label: '願景', type: 'textarea', required: true },
      { id: 'mission', label: '使命', type: 'textarea', required: true },
    ]},
    { id: 'org', title: '二、組織架構', fields: [
      { id: 'org_chart', label: '組織圖', type: 'file_upload', required: true, description: '請上傳或繪製企業組織架構圖' },
      { id: 'dept_duties', label: '各部門職掌', type: 'repeating_group', required: true, min_rows: 1, max_rows: 20, fields: [
        { id: 'dept_name', label: '部門名稱', type: 'text', required: true },
        { id: 'duties', label: '職掌說明', type: 'textarea', required: true },
      ]},
    ]},
    { id: 'training_system', title: '三、訓練體��', fields: [
      { id: 'training_chart', label: '訓練體系圖', type: 'file_upload', required: true, description: '請上傳訓練體系架構圖' },
      { id: 'training_policy', label: '訓練政策', type: 'textarea', required: true },
      { id: 'training_objectives', label: '訓練目標', type: 'repeating_group', required: true, min_rows: 1, fields: [
        { id: 'objective', label: '目標', type: 'text', required: true },
      ]},
      { id: 'core_competencies', label: '核心職能清單', type: 'repeating_group', required: true, min_rows: 1, fields: [
        { id: 'competency', label: '職能名稱', type: 'text', required: true },
        { id: 'description', label: '說明', type: 'text' },
      ]},
    ]},
    { id: 'pddro', title: '四、PDDRO 運作流程', description: '此區段為通用內容', fields: [
      { id: 'plan_desc', label: 'P 計畫（Plan）', type: 'textarea', required: true, description: '說明年度訓練計畫的制定流程' },
      { id: 'design_desc', label: 'D 設計（Design）', type: 'textarea', required: true, description: '說明訓練方案的設計流程' },
      { id: 'do_desc', label: 'DO 執行（Do）', type: 'textarea', required: true, description: '說明課程執行的標準作業' },
      { id: 'review_desc', label: 'R 查核（Review）', type: 'textarea', required: true, description: '說明訓練查核與異常處理' },
      { id: 'outcome_desc', label: 'O 成果（Outcome）', type: 'textarea', required: true, description: '說明訓練成果評估方式' },
    ]},
    { id: 'doc_control', title: '五、文件管制', fields: [
      { id: 'doc_levels', label: '文件層級說明', type: 'textarea', required: true, description: '一階至四階文件的定義與管理規範' },
      { id: 'doc_procedure', label: '文件管制程序', type: 'textarea', required: true, description: '文件建立、修訂、廢止的流程' },
      { id: 'record_retention', label: '紀錄保存規定', type: 'textarea', description: '各類文件的保存年限' },
    ]},
    { id: 'appendix', title: '附錄', fields: [
      { id: 'revision_history', label: '版本修訂紀錄', type: 'repeating_group', min_rows: 1, fields: [
        { id: 'version', label: '版本', type: 'text', required: true },
        { id: 'date', label: '日期', type: 'date', required: true },
        { id: 'change', label: '修訂內容', type: 'text', required: true },
        { id: 'approver', label: '核准人', type: 'text' },
      ]},
    ]},
  ],
},

'訓練課程執行程序書': {
  title: '{{公司名稱}} 訓練課程執行程序書', subtitle: '2QP-5-1-1',
  sections: [
    { id: 'purpose', title: '一、目的', fields: [
      { id: 'purpose', label: '目的說明', type: 'textarea', required: true },
    ]},
    { id: 'scope', title: '二、適用範圍', fields: [
      { id: 'scope', label: '適用範圍', type: 'textarea', required: true },
    ]},
    { id: 'definitions', title: '三、名詞定義', fields: [
      { id: 'terms', label: '名詞定義', type: 'repeating_group', min_rows: 1, fields: [
        { id: 'term', label: '名詞', type: 'text', required: true },
        { id: 'definition', label: '��義', type: 'text', required: true },
      ]},
    ]},
    { id: 'authority', title: '四、權責', fields: [
      { id: 'roles', label: '各角色權���', type: 'repeating_group', required: true, min_rows: 1, fields: [
        { id: 'role', label: '角色', type: 'text', required: true },
        { id: 'responsibility', label: '權責說明', type: 'textarea', required: true },
      ]},
    ]},
    { id: 'procedure', title: '五、作業程序', fields: [
      { id: 'needs_analysis', label: '5.1 需求分析', type: 'textarea', required: true },
      { id: 'plan_design', label: '5.2 計畫設計', type: 'textarea', required: true },
      { id: 'procurement', label: '5.3 訓練採購', type: 'textarea', required: true, description: '含金額門檻與審批層級' },
      { id: 'execution', label: '5.4 課程執行', type: 'textarea', required: true },
      { id: 'evaluation', label: '5.5 成效評估', type: 'textarea', required: true },
      { id: 'anomaly', label: '5.6 異常處理', type: 'textarea', required: true },
    ]},
    { id: 'forms', title: '六、相關表單', fields: [
      { id: 'related_forms', label: '相關表單一覽', type: 'repeating_group', min_rows: 1, fields: [
        { id: 'form_number', label: '表單編號', type: 'text', required: true },
        { id: 'form_name', label: '表單名稱', type: 'text', required: true },
      ]},
    ]},
  ],
},

'訓��主管與辦訓人員職能標準表': {
  title: '{{公司名稱}} 訓練主管與辦訓人員職能標準表', subtitle: '3WI-2-5-1',
  sections: [
    { id: 'standards', title: '職能標準', fields: [
      { id: 'positions', label: '職位職能', type: 'repeating_group', required: true, min_rows: 1, fields: [
        { id: 'position', label: '職位名稱', type: 'text', required: true },
        { id: 'competency', label: '職能項目', type: 'text', required: true },
        { id: 'level_standard', label: '標準等級', type: 'text', required: true },
        { id: 'description', label: '等級說明', type: 'textarea' },
      ]},
    ]},
  ],
},

'訓練方案的系統設計流程 ADDIE': {
  title: '{{公司名稱}} 訓練方案的系統設計流程 ADDIE', subtitle: '3WI-4-1-1',
  sections: [
    { id: 'addie', title: 'ADDIE 流程', fields: [
      { id: 'analysis', label: 'A 分析（Analysis）', type: 'textarea', required: true },
      { id: 'design', label: 'D 設計（Design）', type: 'textarea', required: true },
      { id: 'development', label: 'D 開發（Development）', type: 'textarea', required: true },
      { id: 'implementation', label: 'I 實施（Implementation）', type: 'textarea', required: true },
      { id: 'evaluation', label: 'E 評估（Evaluation）', type: 'textarea', required: true },
    ]},
    { id: 'flowchart', title: '流程圖', fields: [
      { id: 'chart', label: '流程圖', type: 'file_upload', description: '上傳 ADDIE 流程圖' },
    ]},
  ],
},

'利益關係人參與系統運作關聯表': {
  title: '{{公��名稱}} 利益關係人參與系統運作關聯表', subtitle: '3WI-4-2-1',
  sections: [
    { id: 'stakeholders', title: '利益關係人', fields: [
      { id: 'list', label: '關係人列表', type: 'repeating_group', required: true, min_rows: 1, max_rows: 15, fields: [
        { id: 'name', label: '關係人', type: 'text', required: true },
        { id: 'type', label: '類型', type: 'radio', options: [{ label: '內部', value: 'internal' }, { label: '外部', value: 'external' }] },
        { id: 'p_role', label: 'P 計畫 參與方式', type: 'text' },
        { id: 'd_role', label: 'D 設計 參與方式', type: 'text' },
        { id: 'do_role', label: 'DO 執行 參與方式', type: 'text' },
        { id: 'r_role', label: 'R 查核 參與方式', type: 'text' },
        { id: 'o_role', label: 'O 成果 參與方式', type: 'text' },
      ]},
    ]},
  ],
},

'講師甄選辦��': {
  title: '{{公司名稱}} 講師甄選辦法', subtitle: '3WI-4-3-1',
  sections: [
    { id: 'purpose', title: '目的', fields: [
      { id: 'purpose', label: '目的', type: 'textarea', required: true },
    ]},
    { id: 'criteria', title: '甄選標準', fields: [
      { id: 'internal_criteria', label: '內部講師條件', type: 'textarea', required: true },
      { id: 'external_criteria', label: '外部講師條件', type: 'textarea', required: true },
      { id: 'special_license', label: '特殊證照需求', type: 'textarea' },
    ]},
    { id: 'process', title: '甄選流程', fields: [
      { id: 'process_desc', label: '甄選流程說明', type: 'textarea', required: true },
      { id: 'approval_levels', label: '簽核層級', type: 'textarea', required: true, description: '請確認聘任簽核的審批層級' },
    ]},
  ],
},

'教育訓練採購作業流程': {
  title: '{{公司名稱}} 教育訓練採購作業流程', subtitle: '3WI-4-3-2',
  sections: [
    { id: 'purpose', title: '目的與範圍', fields: [
      { id: 'purpose', label: '目的', type: 'textarea', required: true },
      { id: 'scope', label: '適用範圍', type: 'textarea', required: true },
    ]},
    { id: 'tiers', title: '採購金額分級', fields: [
      { id: 'levels', label: '金額分級與審批', type: 'repeating_group', required: true, min_rows: 1, fields: [
        { id: 'amount_range', label: '金額範圍', type: 'text', required: true },
        { id: 'approver', label: '審批權限', type: 'text', required: true },
        { id: 'process', label: '作業流程', type: 'text' },
      ]},
    ]},
    { id: 'items', title: '採購項目', fields: [
      { id: 'instructor_fee', label: '講師���點費', type: 'textarea' },
      { id: 'venue_rental', label: '場地租借', type: 'textarea' },
      { id: 'materials', label: '教材印製', type: 'textarea' },
      { id: 'other', label: '其他費用', type: 'textarea' },
    ]},
  ],
},

'異常處理原則': {
  title: '{{公司名稱}} 異常處理原則', subtitle: '3WI-6-4-1',
  sections: [
    { id: 'definition', title: '異常定義', fields: [
      { id: 'types', label: '異常類型', type: 'repeating_group', required: true, min_rows: 1, fields: [
        { id: 'type', label: '異常類型', type: 'text', required: true },
        { id: 'description', label: '定義說明', type: 'text', required: true },
        { id: 'example', label: '舉例', type: 'text' },
      ]},
    ]},
    { id: 'handling', title: '處理原則', fields: [
      { id: 'report_level', label: '通報層級', type: 'textarea', required: true },
      { id: 'response_time', label: '處理時效', type: 'textarea' },
      { id: 'principles', label: '處理原則', type: 'textarea', required: true },
    ]},
  ],
},

'異常矯正處理流程': {
  title: '{{公司名稱}} 異常矯正處���流程', subtitle: '3WI-6-4-2',
  sections: [
    { id: 'flow', title: '矯正流程', fields: [
      { id: 'flowchart', label: '流程圖', type: 'file_upload', description: '請上傳異常矯正流程圖' },
      { id: 'steps', label: '流程步驟', type: 'repeating_group', required: true, min_rows: 1, fields: [
        { id: 'step', label: '步���', type: 'text', required: true },
        { id: 'responsible', label: '權責人', type: 'text', required: true },
        { id: 'description', label: '作業說明', type: 'textarea' },
        { id: 'output', label: '輸出文件', type: 'text' },
      ]},
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
  for (const [name, schema] of Object.entries(SCHEMAS)) {
    await update(name, schema)
  }
  console.log(`\nDone! ${Object.keys(SCHEMAS).length} templates updated`)
}

main()
