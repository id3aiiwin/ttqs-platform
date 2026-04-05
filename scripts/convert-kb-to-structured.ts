/**
 * 將知識庫純文字 content 轉為 structured_content (FormSchema)
 * 執行: source <(grep -v '^#' .env.local | sed 's/^/export /') && npx tsx scripts/convert-kb-to-structured.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
}

interface FormField {
  id: string; label: string; type: string
  required?: boolean; placeholder?: string; description?: string
  auto_populate?: string; options?: { label: string; value: string }[]
  fields?: FormField[]; min_rows?: number; max_rows?: number
  columns?: number; signers?: string[]
}
interface FormSection { id: string; title?: string; description?: string; fields: FormField[] }
interface FormSchema { title: string; subtitle?: string; sections: FormSection[] }

// ============================================================
// 每份文件的結構化定義
// ============================================================
const SCHEMAS: Record<string, FormSchema> = {

'教育訓練方案設計表': {
  title: '{{公司名稱}} 教育訓練方案設計表', subtitle: '4FM-TR001-4-1-2',
  sections: [
    { id: 'basic', title: '課程基本資訊', fields: [
      { id: 'course_name', label: '課程名稱', type: 'text', required: true, auto_populate: 'course.title', columns: 2 },
      { id: 'objectives', label: '課程目標', type: 'repeating_group', required: true, fields: [
        { id: 'objective', label: '目標內容', type: 'text', required: true }
      ], min_rows: 1, max_rows: 10 },
      { id: 'target', label: '參加對象', type: 'text', required: true, columns: 2 },
      { id: 'criteria', label: '遴選條件', type: 'textarea', columns: 2 },
      { id: 'max_size', label: '上限人數', type: 'number', required: true, columns: 1 },
      { id: 'min_size', label: '下限人數', type: 'number', required: true, columns: 1 },
      { id: 'start_date', label: '開課日期', type: 'date', required: true, auto_populate: 'course.start_date', columns: 1 },
      { id: 'hours', label: '課程時數', type: 'text', required: true, placeholder: '例：8小時', columns: 1 },
      { id: 'time', label: '上課時間', type: 'text', required: true, placeholder: '例：9:00-18:00', columns: 1 },
      { id: 'venue_type', label: '預定上課地點', type: 'radio', required: true, columns: 1, options: [
        { label: '單位自有教室', value: 'internal' }, { label: '外借教室', value: 'external' }
      ] },
    ]},
    { id: 'units', title: '課程單元', fields: [
      { id: 'units', label: '課程單元', type: 'repeating_group', required: true, fields: [
        { id: 'name', label: '單元名稱', type: 'text', required: true },
        { id: 'hours', label: '時數', type: 'number', required: true },
        { id: 'instructor', label: '預定講師', type: 'text', required: true },
      ], min_rows: 1, max_rows: 20 },
    ]},
    { id: 'teaching', title: '教學方式', fields: [
      { id: 'methods', label: '主要教學方法', type: 'textarea', required: true, placeholder: '例：簡報講授、影片教學、分組討論' },
      { id: 'equipment', label: '教學環境與設備需求', type: 'textarea', required: true },
    ]},
    { id: 'eval', title: '評估方式', fields: [
      { id: 'l1_method', label: 'L1 反應評估', type: 'text', required: true, columns: 2 },
      { id: 'l1_standard', label: 'L1 評估標準', type: 'text', columns: 2 },
      { id: 'l2_method', label: 'L2 學習評估', type: 'text', columns: 2 },
      { id: 'l2_standard', label: 'L2 評估標準', type: 'text', columns: 2 },
      { id: 'l3_method', label: 'L3 行為評估', type: 'text', columns: 2 },
      { id: 'l3_standard', label: 'L3 評估標準', type: 'text', columns: 2 },
      { id: 'l4_method', label: 'L4 成果評估', type: 'text', columns: 2 },
      { id: 'l4_standard', label: 'L4 評估標準', type: 'text', columns: 2 },
    ]},
  ],
},

'講師評選表': {
  title: '{{公司名稱}} 講師評選表', subtitle: '4FM-TR001-4-3-2',
  sections: [
    { id: 'info', title: '課程資訊', fields: [
      { id: 'course_name', label: '課程名稱', type: 'text', required: true, auto_populate: 'course.title' },
    ]},
    { id: 'candidates', title: '講師候選人', fields: [
      { id: 'instructors', label: '講師評選', type: 'repeating_group', required: true, min_rows: 2, max_rows: 5, fields: [
        { id: 'name', label: '姓名', type: 'text', required: true },
        { id: 'education', label: '學歷', type: 'text' },
        { id: 'experience', label: '經歷', type: 'textarea' },
        { id: 'specialty', label: '專長課程', type: 'textarea' },
        { id: 'c_industry', label: '業界實務經驗', type: 'radio', options: [{ label: '是', value: 'yes' }, { label: '否', value: 'no' }] },
        { id: 'c_university', label: '大學講師', type: 'radio', options: [{ label: '是', value: 'yes' }, { label: '否', value: 'no' }] },
        { id: 'c_topic', label: '相關主題經驗', type: 'radio', options: [{ label: '是', value: 'yes' }, { label: '否', value: 'no' }] },
        { id: 'c_license', label: '特殊證照', type: 'radio', options: [{ label: '是', value: 'yes' }, { label: '否', value: 'no' }] },
        { id: 'c_existing', label: '原合格講師', type: 'radio', options: [{ label: '是', value: 'yes' }, { label: '否', value: 'no' }] },
        { id: 'result', label: '聘任建議', type: 'radio', required: true, options: [{ label: '予以聘任', value: 'hire' }, { label: '不予聘任', value: 'reject' }] },
      ]},
    ]},
    { id: 'sign', title: '簽核', fields: [
      { id: 'approval', label: '簽核', type: 'signature', signers: ['承辦人', '主管'] },
    ]},
  ],
},

'場地評選表': {
  title: '{{公司名稱}} 場地遴選表', subtitle: '4FM-TR001-4-3-4',
  sections: [
    { id: 'info', title: '課程資訊', fields: [
      { id: 'course_name', label: '課程名稱', type: 'text', required: true, auto_populate: 'course.title' },
    ]},
    { id: 'venues', title: '場地評比', description: '10分為滿分，分數越高越好', fields: [
      { id: 'venues', label: '場地評選', type: 'repeating_group', required: true, min_rows: 2, max_rows: 5, fields: [
        { id: 'name', label: '場地名稱', type: 'text', required: true },
        { id: 'safety', label: '安全性', type: 'rating' },
        { id: 'convenience', label: '便利性', type: 'rating' },
        { id: 'service', label: '服務多元', type: 'rating' },
        { id: 'equipment', label: '設備', type: 'rating' },
        { id: 'price', label: '價格合理性', type: 'rating' },
      ]},
    ]},
    { id: 'result', title: '評選結果', fields: [
      { id: 'description', label: '評選結果說明', type: 'textarea', required: true },
    ]},
    { id: 'sign', title: '簽核', fields: [
      { id: 'approval', label: '簽核', type: 'signature', signers: ['承辦人員', '主管'] },
    ]},
  ],
},

'教學方法聯繫單': {
  title: '{{公司名稱}} 教學方法聯繫表', subtitle: '4FM-TR001-5-3-2',
  sections: [
    { id: 'info', title: '課程資訊', fields: [
      { id: 'course_name', label: '課程名稱', type: 'text', required: true, auto_populate: 'course.title', columns: 2 },
      { id: 'date', label: '起訖日期', type: 'text', required: true, auto_populate: 'course.start_date', columns: 1 },
      { id: 'instructor', label: '講師', type: 'text', required: true, auto_populate: 'course.trainer', columns: 1 },
    ]},
    { id: 'methods', title: '教學方式', fields: [
      { id: 'methods', label: '教學方法', type: 'checkbox', required: true, options: [
        { label: '講述法', value: 'lecture' }, { label: '分組討論法', value: 'discussion' },
        { label: '個案研討法', value: 'case' }, { label: '媒體教學法(影片)', value: 'video' }, { label: '其他', value: 'other' },
      ]},
      { id: 'seating', label: '座位排列方式', type: 'radio', required: true, options: [
        { label: '教室型', value: 'classroom' }, { label: '小組型', value: 'group' },
        { label: '戶外', value: 'outdoor' }, { label: '其他', value: 'other' },
      ]},
    ]},
    { id: 'equipment', title: '教學設備', fields: [
      { id: 'equip', label: '所需設備', type: 'checkbox', required: true, options: [
        { label: '電腦', value: 'computer' }, { label: '單槍投影機', value: 'projector' },
        { label: '喇叭', value: 'speaker' }, { label: '簡報架/白板', value: 'whiteboard' },
        { label: '簡報筆', value: 'pointer' }, { label: '其他', value: 'other' },
      ]},
      { id: 'notes', label: '備註', type: 'textarea' },
    ]},
    { id: 'sign', title: '簽核', fields: [
      { id: 'approval', label: '簽核', type: 'signature', signers: ['講師', '承辦人員', '主管'] },
    ]},
  ],
},

'教材審核表': {
  title: '{{公司名稱}} 教材審核表', subtitle: '4FM-TR001-5-3-1',
  sections: [
    { id: 'info', title: '課程資訊', fields: [
      { id: 'course_name', label: '課程名稱', type: 'text', required: true, auto_populate: 'course.title', columns: 2 },
      { id: 'instructor', label: '講師', type: 'text', required: true, auto_populate: 'course.trainer', columns: 2 },
    ]},
    { id: 'review', title: '審核項目', fields: [
      { id: 'systematic', label: '系統性', type: 'radio', required: true, description: '檢視是否依據課程大綱編排，大項及細節是否清楚', options: [{ label: '通過', value: 'pass' }, { label: '不通過', value: 'fail' }] },
      { id: 'practical', label: '實用性', type: 'radio', required: true, description: '是否方便學員閱讀或記筆記', options: [{ label: '通過', value: 'pass' }, { label: '不通過', value: 'fail' }] },
      { id: 'quality', label: '文件品質', type: 'radio', required: true, description: '是否缺頁、錯字、無法辨識等問題', options: [{ label: '通過', value: 'pass' }, { label: '不通過', value: 'fail' }] },
      { id: 'notes', label: '備註', type: 'textarea' },
    ]},
    { id: 'sign', title: '簽核', fields: [
      { id: 'approval', label: '簽核', type: 'signature', signers: ['承辦人員', '主管'] },
    ]},
  ],
},

'課程執行流程管控表': {
  title: '{{公司名稱}} 課程執行流程管控表', subtitle: '4FM-TR001-5-1-2',
  sections: [
    { id: 'info', title: '課程資訊', fields: [
      { id: 'course_name', label: '課程名稱', type: 'text', required: true, auto_populate: 'course.title', columns: 2 },
      { id: 'start_date', label: '開課日', type: 'date', required: true, auto_populate: 'course.start_date', columns: 2 },
    ]},
    { id: 'pre', title: '課程前置準備', fields: [
      { id: 'pre_tasks', label: '課前工作', type: 'repeating_group', required: true, min_rows: 1, max_rows: 30, fields: [
        { id: 'item', label: '工作項次', type: 'text', required: true },
        { id: 'content', label: '內容', type: 'text' },
        { id: 'due', label: '預計完成', type: 'text', required: true },
        { id: 'person', label: '負責人', type: 'text' },
        { id: 'done', label: '完成', type: 'checkbox', options: [{ label: '已完成', value: 'done' }] },
      ]},
    ]},
    { id: 'during', title: '課程中執行', fields: [
      { id: 'during_tasks', label: '課中工作', type: 'repeating_group', min_rows: 1, max_rows: 10, fields: [
        { id: 'item', label: '工作項次', type: 'text', required: true },
        { id: 'content', label: '內容', type: 'text' },
        { id: 'done', label: '完成', type: 'checkbox', options: [{ label: '已完成', value: 'done' }] },
      ]},
    ]},
    { id: 'post', title: '課程後整理', fields: [
      { id: 'post_tasks', label: '課後工作', type: 'repeating_group', min_rows: 1, max_rows: 10, fields: [
        { id: 'item', label: '工作項次', type: 'text', required: true },
        { id: 'content', label: '內容', type: 'text' },
        { id: 'done', label: '完成', type: 'checkbox', options: [{ label: '已完成', value: 'done' }] },
      ]},
    ]},
    { id: 'sign', title: '簽核', fields: [
      { id: 'approval', label: '簽核', type: 'signature', signers: ['主管'] },
    ]},
  ],
},

'訓練活動紀錄簽到表': {
  title: '{{公司名稱}} 訓練/活動紀錄（簽到）表', subtitle: '4FM-TR001-5-3-3',
  sections: [
    { id: 'header', title: '課程資訊', fields: [
      { id: 'course_name', label: '課程名稱', type: 'text', required: true, auto_populate: 'course.title', columns: 2 },
      { id: 'period', label: '訓練期間', type: 'text', required: true, columns: 2 },
      { id: 'venue', label: '訓練地點', type: 'text', required: true, columns: 2 },
      { id: 'hours', label: '訓練總時數', type: 'text', required: true, columns: 2 },
      { id: 'instructor', label: '講師姓名', type: 'text', required: true, auto_populate: 'course.trainer', columns: 2 },
      { id: 'male_count', label: '男性人數', type: 'number', columns: 1 },
      { id: 'female_count', label: '女性人數', type: 'number', columns: 1 },
    ]},
    { id: 'attendance', title: '簽到名單', description: '簽名表示出席，打✗表示缺席', fields: [
      { id: 'attendees', label: '學員', type: 'repeating_group', required: true, min_rows: 1, max_rows: 50, fields: [
        { id: 'dept', label: '部門', type: 'text', required: true },
        { id: 'name', label: '姓名', type: 'text', required: true },
        { id: 'gender', label: '性別', type: 'radio', options: [{ label: '男', value: 'M' }, { label: '女', value: 'F' }] },
        { id: 'am', label: '上午簽到', type: 'checkbox', options: [{ label: '已簽', value: 'yes' }] },
        { id: 'pm', label: '下午簽到', type: 'checkbox', options: [{ label: '已簽', value: 'yes' }] },
      ]},
    ]},
  ],
},

'隨堂人員工作日誌表': {
  title: '{{公司名稱}} 隨堂人員工作日誌表', subtitle: '4FM-TR001-5-3-4',
  sections: [
    { id: 'info', title: '課程資訊', fields: [
      { id: 'course_name', label: '課程名稱', type: 'text', required: true, auto_populate: 'course.title', columns: 2 },
      { id: 'date', label: '課程日期', type: 'date', required: true, columns: 1 },
      { id: 'time', label: '課程時間', type: 'text', required: true, placeholder: '9:00-18:00 共8小時', columns: 1 },
      { id: 'instructor', label: '授課講師', type: 'text', required: true, auto_populate: 'course.trainer', columns: 1 },
      { id: 'venue', label: '上課地點', type: 'text', required: true, columns: 1 },
      { id: 'expected', label: '應到人數', type: 'number', required: true, columns: 1 },
      { id: 'actual', label: '實到人數', type: 'number', required: true, columns: 1 },
    ]},
    { id: 'checklist', title: '課程實施情形', fields: [
      { id: 'sign_sheet', label: '簽到單（工整、中文）', type: 'radio', required: true, options: [{ label: '確認', value: 'ok' }, { label: '待處理', value: 'pending' }, { label: '待追蹤', value: 'track' }] },
      { id: 'equipment', label: '軟硬體設備正常', type: 'radio', required: true, options: [{ label: '確認', value: 'ok' }, { label: '待處理', value: 'pending' }, { label: '待追蹤', value: 'track' }] },
      { id: 'meals', label: '訂便當', type: 'radio', options: [{ label: '確認', value: 'ok' }, { label: '待處理', value: 'pending' }, { label: '不適用', value: 'na' }] },
      { id: 'photos', label: '拍照(10張以上)', type: 'radio', required: true, options: [{ label: '確認', value: 'ok' }, { label: '待處理', value: 'pending' }, { label: '待追蹤', value: 'track' }] },
      { id: 'fee', label: '講師酬勞及收據', type: 'radio', options: [{ label: '確認', value: 'ok' }, { label: '待處理', value: 'pending' }, { label: '待追蹤', value: 'track' }] },
      { id: 'certs', label: '學員結業證書', type: 'radio', options: [{ label: '確認', value: 'ok' }, { label: '待處理', value: 'pending' }, { label: '待追蹤', value: 'track' }] },
      { id: 'survey', label: '學員問卷', type: 'radio', required: true, options: [{ label: '確認', value: 'ok' }, { label: '待處理', value: 'pending' }, { label: '待追蹤', value: 'track' }] },
      { id: 'feedback', label: '學員/講師回饋', type: 'textarea' },
    ]},
    { id: 'anomaly', title: '異常與總結', fields: [
      { id: 'has_anomaly', label: '異常狀況', type: 'radio', required: true, options: [{ label: '有', value: 'yes' }, { label: '無', value: 'no' }] },
      { id: 'anomaly_desc', label: '異常描述', type: 'textarea' },
      { id: 'instructor_status', label: '講師整體狀況', type: 'radio', required: true, options: [{ label: '正常', value: 'normal' }, { label: '異常', value: 'abnormal' }] },
      { id: 'instructor_desc', label: '講師狀況描述', type: 'textarea' },
      { id: 'summary', label: '總結', type: 'textarea', required: true },
    ]},
    { id: 'sign', title: '簽核', fields: [
      { id: 'approval', label: '簽核', type: 'signature', signers: ['課程工作人員', '主管'] },
    ]},
  ],
},

'教育訓練結案報告': {
  title: '{{公司名稱}} 教育訓練結案報告', subtitle: '4FM-TR001-5-3-5',
  sections: [
    { id: 'info', title: '基本資訊', fields: [
      { id: 'name', label: '訓練名稱', type: 'text', required: true, auto_populate: 'course.title', columns: 2 },
      { id: 'date', label: '訓練日期', type: 'date', required: true, columns: 1 },
      { id: 'instructor', label: '講師姓名', type: 'text', required: true, auto_populate: 'course.trainer', columns: 1 },
      { id: 'target', label: '訓練對象', type: 'text', required: true, columns: 1 },
      { id: 'count', label: '學員人數', type: 'number', required: true, columns: 1 },
      { id: 'venue', label: '訓練地點', type: 'text', required: true, columns: 2 },
    ]},
    { id: 'content', title: '訓練內容', fields: [
      { id: 'objectives', label: '訓練目標', type: 'repeating_group', required: true, min_rows: 1, fields: [{ id: 'obj', label: '目標', type: 'text', required: true }] },
      { id: 'outline', label: '訓練大綱', type: 'repeating_group', required: true, min_rows: 1, fields: [{ id: 'item', label: '大綱', type: 'text', required: true }] },
      { id: 'methods', label: '訓練方式', type: 'checkbox', required: true, options: [
        { label: '演講', value: 'lecture' }, { label: '小組討論', value: 'discussion' }, { label: '教學影片', value: 'video' },
        { label: '案例研討', value: 'case' }, { label: '角色扮演', value: 'roleplay' }, { label: '活動', value: 'activity' },
      ]},
    ]},
    { id: 'eval', title: '成果評估', fields: [
      { id: 'l1', label: 'L1 反應評估', type: 'text', required: true },
      { id: 'l2', label: 'L2 學習評估', type: 'text' },
      { id: 'l3', label: 'L3 行為評估', type: 'text' },
      { id: 'l4', label: 'L4 成果評估', type: 'text' },
    ]},
    { id: 'followup', title: '後續追蹤', fields: [
      { id: 'action_plan', label: '課後行動計畫', type: 'textarea' },
      { id: 'instructor_feedback', label: '講師回饋', type: 'textarea' },
      { id: 'anomaly', label: '異常狀況處理', type: 'textarea' },
      { id: 'recommendations', label: '整體現況與建議', type: 'textarea', required: true },
    ]},
    { id: 'sign', title: '簽核', fields: [
      { id: 'approval', label: '簽核', type: 'signature', signers: ['承辦人員', '主管', '總經理'] },
    ]},
  ],
},

'公告': {
  title: '內訓課程公告',
  sections: [
    { id: 'content', title: '公告內容', fields: [
      { id: 'subject', label: '主旨', type: 'textarea', required: true },
      { id: 'date', label: '日期', type: 'date', required: true, auto_populate: 'course.start_date' },
      { id: 'time', label: '時間', type: 'text', required: true, columns: 2 },
      { id: 'course', label: '課程', type: 'text', required: true, auto_populate: 'course.title', columns: 2 },
      { id: 'venue', label: '地點', type: 'text', required: true, columns: 2 },
      { id: 'participants', label: '參加人員', type: 'text', required: true, columns: 2 },
    ]},
    { id: 'sign', title: '簽核', fields: [
      { id: 'ceo', label: '總經理簽核', type: 'signature', signers: ['總經理'] },
      { id: 'announce_date', label: '公告日期', type: 'date', required: true },
    ]},
  ],
},

'文件維護審核單': {
  title: '{{公司名稱}} 文件維護審核單',
  sections: [
    { id: 'info', title: '文件資訊', fields: [
      { id: 'doc_number', label: '文件編號', type: 'text', required: true, columns: 2 },
      { id: 'doc_name', label: '文件名稱', type: 'text', required: true, columns: 2 },
      { id: 'old_version', label: '原版本', type: 'text', columns: 1 },
      { id: 'new_version', label: '新版本', type: 'text', columns: 1 },
      { id: 'change_type', label: '變更類別', type: 'radio', required: true, options: [
        { label: '新增', value: 'new' }, { label: '修訂', value: 'revise' }, { label: '廢止', value: 'retire' },
      ]},
    ]},
    { id: 'detail', title: '變更詳情', fields: [
      { id: 'reason', label: '變更原因說明', type: 'textarea', required: true },
      { id: 'summary', label: '變更內容摘要', type: 'textarea', required: true },
      { id: 'impact', label: '影響範圍', type: 'textarea' },
    ]},
    { id: 'sign', title: '簽核', fields: [
      { id: 'approval', label: '簽核', type: 'signature', signers: ['承辦人', '主管', '總經理'] },
    ]},
  ],
},

'異常矯正表': {
  title: '{{公司名稱}} 異常矯正表',
  sections: [
    { id: 'info', title: '異常資訊', fields: [
      { id: 'anomaly_no', label: '異常編號', type: 'text', required: true, columns: 2 },
      { id: 'date', label: '發生日期', type: 'date', required: true, columns: 1 },
      { id: 'reporter', label: '發現人員', type: 'text', required: true, columns: 1 },
      { id: 'course', label: '相關課程', type: 'text', columns: 2 },
    ]},
    { id: 'detail', title: '矯正內容', fields: [
      { id: 'description', label: '異常狀況描述', type: 'textarea', required: true },
      { id: 'cause', label: '原因分析', type: 'textarea', required: true },
      { id: 'action', label: '矯正對策', type: 'textarea', required: true },
      { id: 'prevention', label: '預防措施', type: 'textarea' },
      { id: 'due_date', label: '預計完成日期', type: 'date' },
      { id: 'actual_date', label: '實際完成日期', type: 'date' },
    ]},
    { id: 'verify', title: '驗證', fields: [
      { id: 'result', label: '追蹤驗證結果', type: 'radio', options: [{ label: '有效改善', value: 'effective' }, { label: '需再改善', value: 'needs_more' }] },
      { id: 'verify_note', label: '說明', type: 'textarea' },
    ]},
    { id: 'sign', title: '簽核', fields: [
      { id: 'approval', label: '簽核', type: 'signature', signers: ['承辦人', '主管'] },
    ]},
  ],
},

'年度計畫執行分析檢討表': {
  title: '{{公司名稱}} 年度計畫執行分析檢討表',
  sections: [
    { id: 'info', title: '基本資訊', fields: [
      { id: 'year', label: '年度', type: 'number', required: true },
    ]},
    { id: 'analysis', title: '執行分析', fields: [
      { id: 'courses', label: '課程執行分析', type: 'repeating_group', required: true, min_rows: 1, max_rows: 20, fields: [
        { id: 'name', label: '課程名稱', type: 'text', required: true },
        { id: 'planned', label: '計畫場次', type: 'number' },
        { id: 'actual', label: '實際場次', type: 'number' },
        { id: 'rate', label: '達成率(%)', type: 'number' },
        { id: 'headcount', label: '人次', type: 'number' },
        { id: 'review', label: '檢討說明', type: 'text' },
      ]},
    ]},
    { id: 'summary', title: '綜合檢討', fields: [
      { id: 'overall', label: '整體分析', type: 'textarea', required: true },
      { id: 'improvements', label: '改善建議', type: 'textarea', required: true },
    ]},
    { id: 'sign', title: '簽核', fields: [
      { id: 'approval', label: '簽核', type: 'signature', signers: ['承辦人', '主管', '總經理'] },
    ]},
  ],
},

'訓練人員工作職能盤點落差表': {
  title: '{{公司名稱}} 訓練人員工作職能盤點落差表',
  sections: [
    { id: 'info', title: '受評人資訊', fields: [
      { id: 'name', label: '姓名', type: 'text', required: true, columns: 2 },
      { id: 'title', label: '職稱', type: 'text', required: true, columns: 2 },
      { id: 'eval_date', label: '評核日期', type: 'date', required: true },
    ]},
    { id: 'assessment', title: '職能盤點', fields: [
      { id: 'items', label: '職能項目', type: 'repeating_group', required: true, min_rows: 1, max_rows: 20, fields: [
        { id: 'competency', label: '職能項目', type: 'text', required: true },
        { id: 'standard', label: '標準等級', type: 'number', required: true },
        { id: 'current', label: '目前等級', type: 'number', required: true },
        { id: 'gap', label: '落差', type: 'number' },
        { id: 'plan', label: '發展計畫', type: 'text' },
      ]},
    ]},
    { id: 'sign', title: '簽核', fields: [
      { id: 'approval', label: '簽核', type: 'signature', signers: ['受評人', '主管'] },
    ]},
  ],
},

}

// ============================================================
// 執行更新
// ============================================================
async function update(standardName: string, schema: FormSchema) {
  const url = `${SUPABASE_URL}/rest/v1/knowledge_base_templates?standard_name=eq.${encodeURIComponent(standardName)}&is_system=eq.true`
  const res = await fetch(url, {
    method: 'PATCH', headers,
    body: JSON.stringify({ structured_content: schema }),
  })
  if (!res.ok) console.error(`ERR: ${standardName}`, await res.text())
  else console.log(`OK: ${standardName}`)
}

async function main() {
  for (const [name, schema] of Object.entries(SCHEMAS)) {
    await update(name, schema)
  }
  console.log(`\nDone! ${Object.keys(SCHEMAS).length} templates updated`)
}

main()
