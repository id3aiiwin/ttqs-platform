/**
 * 把 30 份模板轉為統一的「文字段落 + 表單欄位」整合格式
 * source <(grep -v '^#' .env.local | sed 's/^/export /') && npx tsx scripts/convert-to-unified-format.ts
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }

type F = { id: string; label: string; type: string; required?: boolean; description?: string; placeholder?: string; options?: { label: string; value: string }[]; fields?: F[]; min_rows?: number; max_rows?: number; signers?: string[]; auto_populate?: string; columns?: number }
type S = { id: string; title?: string; description?: string; fields: F[] }
type Schema = { title: string; subtitle?: string; sections: S[] }

let _c = 0
function id() { return 'b' + (++_c) }
function p(text: string): F { return { id: id(), label: '', type: 'static_text', description: text } }
function h(text: string): F { return { id: id(), label: text, type: 'section_header' } }
function txt(label: string, opts?: Partial<F>): F { return { id: id(), label, type: 'text', ...opts } }
function area(label: string, opts?: Partial<F>): F { return { id: id(), label, type: 'textarea', ...opts } }
function num(label: string, opts?: Partial<F>): F { return { id: id(), label, type: 'number', ...opts } }
function dt(label: string, opts?: Partial<F>): F { return { id: id(), label, type: 'date', ...opts } }
function radio(label: string, options: string[], opts?: Partial<F>): F { return { id: id(), label, type: 'radio', options: options.map(o => ({ label: o, value: o })), ...opts } }
function check(label: string, options: string[], opts?: Partial<F>): F { return { id: id(), label, type: 'checkbox', options: options.map(o => ({ label: o, value: o })), ...opts } }
function table(label: string, cols: string[], opts?: Partial<F>): F { return { id: id(), label, type: 'repeating_group', min_rows: 1, max_rows: 20, fields: cols.map(c => ({ id: id(), label: c, type: 'text' })), ...opts } }
function sign(signers: string[]): F { return { id: id(), label: '簽核', type: 'signature', signers } }
function file(label: string): F { return { id: id(), label, type: 'file_upload' } }
function rating(label: string): F { return { id: id(), label, type: 'rating' } }

const ALL: Record<string, Schema> = {

// ======== 一階 ========
'人才發展品質手冊': { title: '{{公司名稱}} 人才發展品質管理手冊', subtitle: '1QM', sections: [
  { id: id(), title: '封面', fields: [
    txt('公司名稱', { required: true }),
    txt('文件編號', { required: true }),
    txt('版本', { required: true }),
    dt('生效日期', { required: true }),
  ]},
  { id: id(), title: '一、企業簡介', fields: [
    p('（請依企業實際情況填寫以下內容）'),
    area('公司簡介', { required: true, description: '企業沿革、成立年份、產業類別、員工人數、營業項目等' }),
    area('社會責任', { description: '企業社會責任理念與實踐' }),
    area('企業理念', { required: true, description: '企業核心價值與經營理念' }),
    area('公司願景', { required: true }),
    area('公司使命', { required: true }),
    table('公司目標', ['目標內容'], { required: true }),
  ]},
  { id: id(), title: '二、組織架構', fields: [
    file('組織圖'),
    txt('員工人數', { description: '各部門人數分布' }),
    table('各部門職掌', ['部門名稱', '部門主管', '人數', '職掌說明'], { required: true }),
  ]},
  { id: id(), title: '三、訓練體系', fields: [
    file('訓練體系圖'),
    area('訓練政策', { required: true, description: '企業對員工訓練的政策宣言' }),
    table('訓練目標', ['目標'], { required: true }),
    table('核心職能清單', ['職能名稱', '說明', '要求等級'], { required: true }),
    table('訓練類別', ['類別名稱', '對象', '說明']),
  ]},
  { id: id(), title: '四、PDDRO 運作流程', description: '此區段為通用內容，各企業一致', fields: [
    p('本公司依據 TTQS 訓練品質規範，建立 PDDRO 五大循環的運作機制：'),
    area('P 計畫（Plan）', { required: true, description: '年度訓練計畫的制定流程，包含需求調查、目標設定、預算編列等' }),
    area('D 設計（Design）', { required: true, description: '訓練方案的設計流程，包含 ADDIE 系統設計、利益關係人參與等' }),
    area('DO 執行（Do）', { required: true, description: '課程執行的標準作業，包含講師甄選、教材審核、場地安排等' }),
    area('R 查核（Review）', { required: true, description: '訓練查核與異常處理，包含簽到管控、工作日誌、結案報告等' }),
    area('O 成果（Outcome）', { required: true, description: '訓練成果評估方式，包含 L1-L4 四級評估、訓後追蹤等' }),
  ]},
  { id: id(), title: '五、文件管制', fields: [
    p('本公司之人才發展品質管理文件分為四個層級：\n一階：管理手冊（本手冊）\n二階：程序文件\n三階：工作指導書\n四階：表單紀錄'),
    area('文件管制程序', { required: true, description: '文件建立、修訂、廢止的流程' }),
    area('紀錄保存規定', { description: '各類文件的保存年限' }),
  ]},
  { id: id(), title: '附錄：版本修訂紀錄', fields: [
    table('版本修訂紀錄', ['版本', '日期', '修訂內容', '核准人']),
  ]},
]},

// ======== 二階 ========
'訓練課程執行程序書': { title: '{{公司名稱}} 訓練課程執行程序書', subtitle: '2QP-5-1-1', sections: [
  { id: id(), fields: [
    h('一、目的'), area('目的說明', { required: true }),
    h('二、適用範圍'), area('適用範圍', { required: true }),
    h('三、名詞定義'), table('名詞定義', ['名詞', '定義']),
    h('四、權責'), table('各角色權責', ['角色', '權責說明']),
    h('五、作業程序'),
    area('5.1 需求分析', { required: true }),
    area('5.2 計畫設計', { required: true }),
    area('5.3 訓練採購', { required: true, description: '含金額門檻與審批層級' }),
    area('5.4 課程執行', { required: true }),
    area('5.5 成效評估', { required: true }),
    area('5.6 異常處理', { required: true }),
    h('六、相關表單'), table('相關表單', ['表單編號', '表單名稱']),
  ]},
]},

// ======== 三階 ========
'訓練主管與辦訓人員職能標準表': { title: '{{公司名稱}} 訓練主管與辦訓人員職能標準表', subtitle: '3WI-2-5-1', sections: [
  { id: id(), fields: [
    p('依據 TTQS 評核指標 2，訓練主管與辦訓人員應具備以下職能：'),
    table('職位職能標準', ['職位名稱', '職能項目', '標準等級', '等級說明'], { required: true }),
  ]},
]},

'訓練方案的系統設計流程 ADDIE': { title: '{{公司名稱}} 訓練方案的系統設計流程 ADDIE', subtitle: '3WI-4-1-1', sections: [
  { id: id(), fields: [
    p('本公司訓練方案依據 ADDIE 模型進行系統化設計：'),
    h('A 分析（Analysis）'), area('分析階段說明', { required: true, description: '需求分析、目標對象分析、任務分析' }),
    h('D 設計（Design）'), area('設計階段說明', { required: true, description: '學習目標、課程架構、評量方式設計' }),
    h('D 開發（Development）'), area('開發階段說明', { required: true, description: '教材開發、教學活動設計' }),
    h('I 實施（Implementation）'), area('實施階段說明', { required: true, description: '課程執行、講師管理、學員管理' }),
    h('E 評估（Evaluation）'), area('評估階段說明', { required: true, description: 'L1-L4 評估、回饋改善' }),
    file('ADDIE 流程圖'),
  ]},
]},

'利益關係人參與系統運作關聯表': { title: '{{公司名稱}} 利益關係人參與系統運作關聯表', subtitle: '3WI-4-2-1', sections: [
  { id: id(), fields: [
    p('列出訓練品質系統的所有利益關係人，及其在 PDDRO 各階段的參與方式：'),
    table('利益關係人', ['關係人', '類型(內/外)', 'P計畫', 'D設計', 'DO執行', 'R查核', 'O成果'], { required: true }),
  ]},
]},

'講師甄選辦法': { title: '{{公司名稱}} 講師甄選辦法', subtitle: '3WI-4-3-1', sections: [
  { id: id(), fields: [
    h('一、目的'), area('目的', { required: true }),
    h('二、甄選標準'),
    area('內部講師條件', { required: true }),
    area('外部講師條件', { required: true }),
    area('特殊證照需求'),
    h('三、甄選流程'),
    area('甄選流程說明', { required: true }),
    area('簽核層級', { required: true, description: '請確認聘任簽核的審批層級' }),
  ]},
]},

'教育訓練採購作業流程': { title: '{{公司名稱}} 教育訓練採購作業流程', subtitle: '3WI-4-3-2', sections: [
  { id: id(), fields: [
    h('一、目的與範圍'),
    area('目的', { required: true }),
    area('適用範圍', { required: true }),
    h('二、採購金額分級'),
    table('金額分級與審批', ['金額範圍', '審批權限', '作業流程'], { required: true }),
    h('三、採購項目'),
    area('講師鐘點費'),
    area('場地租借'),
    area('教材印製'),
    area('其他費用'),
  ]},
]},

'異常處理原則': { title: '{{公司名稱}} 異常處理原則', subtitle: '3WI-6-4-1', sections: [
  { id: id(), fields: [
    h('一、異常定義'),
    table('異常類型', ['異常類型', '定義說明', '舉例'], { required: true }),
    h('二、處理原則'),
    area('通報層級', { required: true }),
    area('處理時效'),
    area('處理原則', { required: true }),
  ]},
]},

'異常矯正處理流程': { title: '{{公司名稱}} 異常矯正處理流程', subtitle: '3WI-6-4-2', sections: [
  { id: id(), fields: [
    file('異常矯正流程圖'),
    table('流程步驟', ['步驟', '權責人', '作業說明', '輸出文件'], { required: true }),
  ]},
]},

// ======== 四階（非課程表單）========
'訓練人員工作職能盤點落差表': { title: '{{公司名稱}} 訓練人員工作職能盤點落差表', subtitle: '4FM-2-5-1', sections: [
  { id: id(), title: '受評人資訊', fields: [
    txt('姓名', { required: true }), txt('職稱', { required: true }), dt('評核日期', { required: true }),
  ]},
  { id: id(), title: '職能盤點', fields: [
    table('職能項目', ['職能項目', '標準等級', '目前等級', '落差', '發展計畫'], { required: true }),
  ]},
  { id: id(), fields: [sign(['受評人', '主管'])] },
]},

'年度教育訓練需求調查問卷': { title: '{{公司名稱}} 年度教育訓練需求調查問卷', sections: [
  { id: id(), title: '填答人資訊', fields: [
    txt('姓名', { required: true }), txt('部門', { required: true }), txt('職稱'),
  ]},
  { id: id(), title: '訓練需求', fields: [
    area('目前工作中最需加強的能力', { required: true }),
    area('希望公司開設的課程主題', { required: true }),
    radio('適合的訓練時段', ['上班時間', '下班後', '假日', '皆可']),
    check('偏好的學習方式', ['實體授課', '線上課程', '混合式', '工作坊']),
    area('其他建議'),
  ]},
]},

'年度訓練課程計畫表': { title: '{{公司名稱}} 年度訓練課程計畫表', sections: [
  { id: id(), fields: [
    num('年度', { required: true }),
    table('年度課程計畫', ['課程名稱', '對象', '預定月份', '時數', '預算', '負責人'], { required: true }),
    sign(['承辦人', '主管', '總經理']),
  ]},
]},

'年度計畫執行分析檢討表': { title: '{{公司名稱}} 年度計畫執行分析檢討表', sections: [
  { id: id(), fields: [
    num('年度', { required: true }),
    table('課程執行分析', ['課程名稱', '計畫場次', '實際場次', '達成率(%)', '人次', '檢討說明'], { required: true }),
    area('整體分析', { required: true }),
    area('改善建議', { required: true }),
    sign(['承辦人', '主管', '總經理']),
  ]},
]},

'異常矯正表': { title: '{{公司名稱}} 異常矯正表', sections: [
  { id: id(), fields: [
    txt('異常編號', { required: true }), dt('發生日期', { required: true }),
    txt('發現人員', { required: true }), txt('相關課程'),
    area('異常狀況描述', { required: true }),
    area('原因分析', { required: true }),
    area('矯正對策', { required: true }),
    area('預防措施'),
    dt('預計完成日期'), dt('實際完成日期'),
    radio('追蹤驗證結果', ['有效改善', '需再改善']),
    area('說明'),
    sign(['承辦人', '主管']),
  ]},
]},

'文件維護審核單': { title: '{{公司名稱}} 文件維護審核單', sections: [
  { id: id(), fields: [
    txt('文件編號', { required: true }), txt('文件名稱', { required: true }),
    txt('原版本'), txt('新版本'),
    radio('變更類別', ['新增', '修訂', '廢止'], { required: true }),
    area('變更原因說明', { required: true }),
    area('變更內容摘要', { required: true }),
    area('影響範圍'),
    sign(['承辦人', '主管', '總經理']),
  ]},
]},

'文件表單一覽表': { title: '{{公司名稱}} 文件表單一覽表', sections: [
  { id: id(), fields: [
    p('本表列出企業所有受控文件與表單，可由系統自動產生。'),
    table('文件清單', ['階層', '文件編號', '文件名稱', '版本', '修改日期'], { required: true, max_rows: 50 }),
  ]},
]},

// ======== 四階（課程表單）========
'教育訓練方案設計表': { title: '{{公司名稱}} 教育訓練方案設計表', subtitle: '4FM-4-1-2', sections: [
  { id: id(), title: '課程基本資訊', fields: [
    txt('課程名稱', { required: true, auto_populate: 'course.title' }),
    table('課程目標', ['目標內容'], { required: true }),
    txt('參加對象', { required: true }), area('遴選條件'),
    num('上限人數', { required: true }), num('下限人數', { required: true }),
    dt('開課日期', { required: true, auto_populate: 'course.start_date' }),
    txt('課程時數', { required: true }), txt('上課時間', { required: true }),
    radio('預定上課地點', ['單位自有教室', '外借教室'], { required: true }),
  ]},
  { id: id(), title: '課程單元', fields: [
    table('課程單元', ['單元名稱', '時數', '預定講師'], { required: true }),
  ]},
  { id: id(), title: '教學方式', fields: [
    area('主要教學方法', { required: true, placeholder: '簡報講授、影片教學、分組討論、個案研討' }),
    area('教學環境與設備需求', { required: true }),
  ]},
  { id: id(), title: '評估方式', fields: [
    txt('L1 反應評估', { required: true }), txt('L1 評估標準'),
    txt('L2 學習評估'), txt('L2 評估標準'),
    txt('L3 行為評估'), txt('L3 評估標準'),
    txt('L4 成果評估'), txt('L4 評估標準'),
  ]},
]},

'講師評選表': { title: '{{公司名稱}} 講師評選表', subtitle: '4FM-4-3-2', sections: [
  { id: id(), fields: [
    txt('課程名稱', { required: true, auto_populate: 'course.title' }),
    table('講師候選人', ['姓名', '學歷', '經歷', '專長'], { required: true, min_rows: 2, max_rows: 5 }),
    p('遴選條件：□ 業界實務經驗　□ 大學講師　□ 相關主題經驗　□ 特殊證照　□ 原合格講師'),
    sign(['承辦人', '主管']),
  ]},
]},

'場地評選表': { title: '{{公司名稱}} 場地遴選表', subtitle: '4FM-4-3-4', sections: [
  { id: id(), fields: [
    txt('課程名稱', { required: true, auto_populate: 'course.title' }),
    p('10分為滿分，分數越高表示該評分項目得分越高，以分數高者錄取'),
    table('場地評選', ['場地名稱', '安全性', '便利性', '服務多元', '設備', '價格合理性', '備註'], { required: true, min_rows: 2 }),
    area('評選結果', { required: true }),
    sign(['承辦人員', '主管']),
  ]},
]},

'教學方法聯繫單': { title: '{{公司名稱}} 教學方法聯繫表', subtitle: '4FM-5-3-2', sections: [
  { id: id(), fields: [
    txt('課程名稱', { required: true, auto_populate: 'course.title' }),
    txt('起訖日期', { required: true }), txt('講師', { required: true, auto_populate: 'course.trainer' }),
    check('教學方法', ['講述法', '分組討論法', '個案研討法', '媒體教學法(影片)', '其他'], { required: true }),
    radio('座位排列方式', ['教室型', '小組型', '戶外', '其他'], { required: true }),
    check('配合教學所需設備', ['電腦', '單槍投影機', '喇叭', '簡報架/白板', '簡報筆', '其他'], { required: true }),
    area('備註'),
    sign(['講師', '承辦人員', '主管']),
  ]},
]},

'教材審核表': { title: '{{公司名稱}} 教材審核表', subtitle: '4FM-5-3-1', sections: [
  { id: id(), fields: [
    txt('課程名稱', { required: true, auto_populate: 'course.title' }),
    txt('講師', { required: true, auto_populate: 'course.trainer' }),
    radio('系統性', ['通過', '不通過'], { required: true, description: '檢視是否依據課程大綱編排，大項及細節是否清楚' }),
    radio('實用性', ['通過', '不通過'], { required: true, description: '是否方便學員閱讀或記筆記' }),
    radio('文件品質', ['通過', '不通過'], { required: true, description: '是否缺頁、錯字、無法辨識等問題' }),
    area('備註'),
    sign(['承辦人員', '主管']),
  ]},
]},

'課程執行流程管控表': { title: '{{公司名稱}} 課程執行流程管控表', subtitle: '4FM-5-1-2', sections: [
  { id: id(), fields: [
    txt('課程名稱', { required: true, auto_populate: 'course.title' }),
    dt('開課日', { required: true, auto_populate: 'course.start_date' }),
    h('課程前置準備'),
    table('課前工作', ['工作項次', '內容', '預計完成', '負責人', '完成(Y/N)'], { required: true, max_rows: 30 }),
    h('課程中執行'),
    table('課中工作', ['工作項次', '內容', '完成(Y/N)'], { max_rows: 10 }),
    h('課程後整理'),
    table('課後工作', ['工作項次', '內容', '完成(Y/N)'], { max_rows: 10 }),
    sign(['主管']),
  ]},
]},

'訓練活動紀錄簽到表': { title: '{{公司名稱}} 訓練/活動紀錄（簽到）表', subtitle: '4FM-5-3-3', sections: [
  { id: id(), fields: [
    p('註：簽名表示出席（請勿簽英文或蓋章，並請保持字跡端正），打✗表示缺席。'),
    txt('訓練課程名稱', { required: true, auto_populate: 'course.title' }),
    txt('訓練期間', { required: true }), txt('訓練地點', { required: true }),
    txt('訓練總時數', { required: true }), txt('講師姓名', { required: true, auto_populate: 'course.trainer' }),
    num('男性人數'), num('女性人數'),
    table('學員簽到', ['部門/單位', '姓名', '性別', '上午簽到', '下午簽到', '備註'], { required: true, max_rows: 50 }),
  ]},
]},

'隨堂人員工作日誌表': { title: '{{公司名稱}} 隨堂人員工作日誌表', subtitle: '4FM-5-3-4', sections: [
  { id: id(), fields: [
    txt('課程名稱', { required: true, auto_populate: 'course.title' }),
    dt('課程日期', { required: true }), txt('課程時間', { required: true }),
    txt('授課講師', { required: true, auto_populate: 'course.trainer' }),
    txt('上課地點', { required: true }), num('應到人數', { required: true }), num('實到人數', { required: true }),
    h('課程實施情形'),
    radio('簽到單（工整、中文）', ['確認', '待處理', '待追蹤'], { required: true }),
    radio('軟硬體設備正常', ['確認', '待處理', '待追蹤'], { required: true }),
    radio('訂便當', ['確認', '待處理', '不適用']),
    radio('拍照(10張以上)', ['確認', '待處理', '待追蹤'], { required: true }),
    radio('講師酬勞及收據', ['確認', '待處理', '待追蹤']),
    radio('學員結業證書', ['確認', '待處理', '待追蹤']),
    radio('學員問卷', ['確認', '待處理', '待追蹤'], { required: true }),
    area('學員/講師回饋'),
    radio('異常狀況', ['有', '無'], { required: true }), area('異常描述'),
    radio('講師整體狀況', ['正常', '異常'], { required: true }), area('講師狀況描述'),
    area('總結', { required: true }),
    sign(['課程工作人員', '主管']),
  ]},
]},

'教育訓練結案報告': { title: '{{公司名稱}} 教育訓練結案報告', subtitle: '4FM-5-3-5', sections: [
  { id: id(), title: '基本資訊', fields: [
    txt('訓練名稱', { required: true, auto_populate: 'course.title' }),
    dt('訓練日期', { required: true }), txt('講師姓名', { required: true, auto_populate: 'course.trainer' }),
    txt('訓練對象', { required: true }), num('學員人數', { required: true }),
    txt('訓練地點', { required: true }),
  ]},
  { id: id(), title: '訓練內容', fields: [
    table('訓練目標', ['目標'], { required: true }),
    table('訓練大綱', ['大綱項目'], { required: true }),
    check('訓練方式', ['演講', '小組討論', '教學影片', '案例研討', '角色扮演', '活動', '其他'], { required: true }),
  ]},
  { id: id(), title: '成果評估', fields: [
    txt('L1 反應評估', { required: true }), txt('L2 學習評估'),
    txt('L3 行為評估'), txt('L4 成果評估'),
  ]},
  { id: id(), title: '後續追蹤', fields: [
    area('課後行動計畫'), area('講師回饋'),
    area('異常狀況處理'), area('整體現況與建議', { required: true }),
    sign(['承辦人員', '主管', '總經理']),
  ]},
]},

'公告': { title: '內訓課程公告', sections: [
  { id: id(), fields: [
    area('主旨', { required: true }),
    dt('日期', { required: true, auto_populate: 'course.start_date' }),
    txt('時間', { required: true }), txt('課程', { required: true, auto_populate: 'course.title' }),
    txt('地點', { required: true }), txt('參加人員', { required: true }),
    p('以上公告，敬請週知~'),
    sign(['總經理']),
    dt('公告日期', { required: true }),
  ]},
]},

'參訓學員意見調查表': { title: '{{公司名稱}} 參訓學員意見調查表', sections: [
  { id: id(), fields: [
    p('此表單已連動課程滿意度調查系統，無需另外設定。'),
  ]},
]},

'結業證書': { title: '{{公司名稱}} 結業證書', sections: [
  { id: id(), fields: [
    file('證書範本檔案'),
    area('備註'),
  ]},
]},

'訓練需求調查（課前問卷）': { title: '{{公司名稱}} 訓練需求調查（課前問卷）', sections: [
  { id: id(), fields: [
    txt('課程名稱', { required: true, auto_populate: 'course.title' }),
    dt('調查日期', { required: true }),
    area('最需加強的技能', { required: true }),
    area('期望獲得的成果', { required: true }),
    check('偏好學習方式', ['講述法', '分組討論', '案例研討', '角色扮演', '影片教學', '實作演練']),
    area('其他建議'),
  ]},
]},

'年度訓練計畫總表': { title: '{{公司名稱}} 年度訓練計畫總表', sections: [
  { id: id(), fields: [
    num('年度', { required: true }),
    file('計畫總表檔案'),
    p('TTQS 課程建檔目錄：'),
    check('P 計畫', ['年度訓練計畫總表']),
    check('D 設計', ['訓練需求調查', '教育訓練方案設計表']),
    check('DO 執行', ['公告', '講師評選表', '教學方法聯繫單', '教材審核表', '場地評選表']),
    check('R 查核', ['簽到表', '工作日誌', '管控表', '結案報告']),
    check('O 成果', ['滿意度調查', '課程成果', '結業證書']),
  ]},
]},

}

async function update(name: string, schema: Schema) {
  // 同時產生純文字 content
  const lines: string[] = [schema.title]
  for (const s of schema.sections) {
    if (s.title) lines.push('\n' + s.title)
    for (const f of s.fields) {
      if (f.type === 'static_text' && f.description) lines.push(f.description)
      else if (f.type === 'section_header') lines.push('\n' + f.label)
      else if (f.type === 'signature') lines.push((f.signers ?? []).map(s => `${s}：　　　日期：`).join('\n'))
      else if (f.type === 'repeating_group') lines.push(f.label + '：' + (f.fields ?? []).map(c => c.label).join(' | '))
      else if (f.type === 'checkbox' || f.type === 'radio') lines.push(f.label + '：' + (f.options ?? []).map(o => '□' + o.label).join('　'))
      else if (f.type === 'file_upload') lines.push(f.label + '：（附件）')
      else lines.push(f.label + '：_______________')
    }
  }
  const content = lines.join('\n')

  const encoded = encodeURIComponent(name)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/knowledge_base_templates?standard_name=eq.${encoded}&is_system=eq.true`, {
    method: 'PATCH', headers,
    body: JSON.stringify({ structured_content: schema, content }),
  })
  if (!res.ok) console.error(`ERR: ${name}`, await res.text())
  else console.log(`OK: ${name}`)
}

async function main() {
  for (const [name, schema] of Object.entries(ALL)) await update(name, schema)
  console.log(`\nDone! ${Object.keys(ALL).length} templates updated`)
}
main()
