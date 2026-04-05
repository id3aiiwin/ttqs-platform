export type FormType = 'online' | 'upload' | 'auto'
export type PddroPhase = 'P' | 'D' | 'DO' | 'R' | 'O'

export interface DefaultFormItem {
  name: string
  standard_name: string
  ttqs_indicator: string
  form_type: FormType
  needs_customization: boolean
}

/**
 * PDDRO 五構面公版預設表單
 * 根據 TTQS 官方佐證文件設計
 *
 * P  (Plan)    計畫  — TTQS 指標 1~6
 * D  (Design)  設計  — TTQS 指標 7~11
 * DO (Do)      執行  — TTQS 指標 12~14
 * R  (Review)  查核  — TTQS 指標 15~16
 * O  (Outcome) 成果  — TTQS 指標 17~19
 */
export const PDDRO_DEFAULT_FORMS: Record<PddroPhase, {
  label: string
  description: string
  items: DefaultFormItem[]
}> = {
  P: {
    label: '計畫 Plan',
    description: 'TTQS 指標 1~6',
    items: [
      { standard_name: '年度訓練計畫總表', name: '年度訓練計畫總表', ttqs_indicator: 'P5', form_type: 'upload', needs_customization: true },
    ],
  },
  D: {
    label: '設計 Design',
    description: 'TTQS 指標 7~11',
    items: [
      { standard_name: '訓練需求調查（課前問卷）', name: '訓練需求調查（課前問卷）', ttqs_indicator: 'D11', form_type: 'online', needs_customization: false },
      { standard_name: '教育訓練方案設計表',       name: '教育訓練方案設計表',       ttqs_indicator: 'D8',  form_type: 'online', needs_customization: true },
    ],
  },
  DO: {
    label: '執行 Do',
    description: 'TTQS 指標 12~14',
    items: [
      { standard_name: '公告',           name: '公告',           ttqs_indicator: 'DO12', form_type: 'upload', needs_customization: false },
      { standard_name: '講師評選表',     name: '講師評選表',     ttqs_indicator: 'DO10', form_type: 'online', needs_customization: false },
      { standard_name: '教學方法聯繫單', name: '教學方法聯繫單', ttqs_indicator: 'DO12', form_type: 'online', needs_customization: false },
      { standard_name: '教材審核表',     name: '教材審核表',     ttqs_indicator: 'DO12', form_type: 'online', needs_customization: false },
      { standard_name: '場地評選表',     name: '場地評選表',     ttqs_indicator: 'DO12', form_type: 'online', needs_customization: false },
    ],
  },
  R: {
    label: '查核 Review',
    description: 'TTQS 指標 15~16',
    items: [
      { standard_name: '訓練活動紀錄簽到表',   name: '訓練活動紀錄簽到表',   ttqs_indicator: 'R15', form_type: 'auto',   needs_customization: false },
      { standard_name: '隨堂人員工作日誌表',   name: '隨堂人員工作日誌表',   ttqs_indicator: 'R15', form_type: 'online', needs_customization: false },
      { standard_name: '課程執行流程管控表',   name: '課程執行流程管控表',   ttqs_indicator: 'R16', form_type: 'online', needs_customization: false },
      { standard_name: '教育訓練結案報告',     name: '教育訓練結案報告',     ttqs_indicator: 'R15', form_type: 'auto',   needs_customization: false },
    ],
  },
  O: {
    label: '成果 Outcome',
    description: 'TTQS 指標 17~19',
    items: [
      { standard_name: '滿意度調查',                 name: '滿意度調查',                 ttqs_indicator: 'O17a', form_type: 'auto',   needs_customization: false },
      { standard_name: '課程成果內容',               name: '課程成果內容',               ttqs_indicator: 'O17b', form_type: 'upload', needs_customization: false },
      { standard_name: '結業證書',                   name: '結業證書',                   ttqs_indicator: 'O17b', form_type: 'upload', needs_customization: true },
      { standard_name: '參訓學員訓後動態調查表',     name: '參訓學員訓後動態調查表',     ttqs_indicator: 'O17c', form_type: 'auto',   needs_customization: false },
    ],
  },
}

export const FORM_TYPE_LABELS: Record<FormType, { label: string; color: string; icon: string }> = {
  online: { label: '線上填寫', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '📝' },
  upload: { label: '上傳文件', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '📎' },
  auto:   { label: '自動連動', color: 'bg-green-50 text-green-700 border-green-200', icon: '🔗' },
}

export const FORM_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:     { label: '待處理', color: 'bg-gray-100 text-gray-600' },
  in_progress: { label: '處理中', color: 'bg-yellow-100 text-yellow-700' },
  completed:   { label: '已完成', color: 'bg-green-100 text-green-700' },
}
