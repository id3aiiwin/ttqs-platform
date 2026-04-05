-- ============================================================
-- 007: 知識庫預設四階文件 + 連結 PDDRO 課程表單
-- 完整 TTQS 文件體系（參考桃源保全文件表單一覽表）
-- ============================================================

-- 清除舊的系統內建資料（如果有的話），避免重複
DELETE FROM knowledge_base_templates WHERE is_system = true;

-- ============================================================
-- 一階文件：管理手冊
-- ============================================================
INSERT INTO knowledge_base_templates (
  name, standard_name, doc_number_format, pddro_phase, document_type, tier, version,
  description, ttqs_indicator, access_level, is_system,
  auto_replace_rules, review_reminders
) VALUES (
  '人才發展品質手冊',
  '人才發展品質手冊',
  '1QM-[企業代碼]',
  'general',
  'tier_document',
  1,
  'A',
  '企業人才發展品質管理手冊，涵蓋 TTQS 所有面向的管理準則，包含 PDDRO 運作流程（通用）、組織架構、訓練體系、文件管制等。',
  NULL,
  'all',
  true,
  '[
    {"placeholder":"{{公司名稱}}","field":"企業名稱"},
    {"placeholder":"{{企業代碼}}","field":"企業文件代碼"}
  ]'::jsonb,
  '[
    {"section":"企業簡介","description":"請填入企業沿革、產業類別、員工人數等基本資訊"},
    {"section":"經營理念/願景/使命","description":"請填入企業的經營理念、願景與使命宣言"},
    {"section":"組織圖","description":"請放入或繪製企業最新組織架構圖"},
    {"section":"訓練體系圖","description":"請依企業實際訓練體系繪製體系圖"},
    {"section":"各部門職掌","description":"請列出各部門的主要職掌與負責範圍"},
    {"section":"核心職能清單","description":"請依企業需求定義核心職能項目"},
    {"section":"文件管制說明","description":"如有企業自訂的文件管制規範請補充"}
  ]'::jsonb
);

-- ============================================================
-- 二階文件：程序文件
-- ============================================================
INSERT INTO knowledge_base_templates (
  name, standard_name, doc_number_format, pddro_phase, document_type, tier, version,
  description, ttqs_indicator, access_level, is_system,
  auto_replace_rules, review_reminders
) VALUES (
  '訓練課程執行程序書',
  '訓練課程執行程序書',
  '2QP-[企業代碼]-5-1-1',
  'DO',
  'tier_document',
  2,
  'A',
  '規範訓練課程從規劃到執行的標準作業程序，包含採購標準、簽核權限、異常處理權責。',
  NULL,
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[
    {"section":"訓練採購標準","description":"請依企業規模設定採購金額門檻與審批層級"},
    {"section":"簽核權限層級","description":"請確認各層級簽核權限是否符合企業實際"},
    {"section":"異常處理權責","description":"請確認異常事件的通報對象與處理權責"}
  ]'::jsonb
);

-- ============================================================
-- 三階文件：工作指導書
-- ============================================================
INSERT INTO knowledge_base_templates (
  name, standard_name, doc_number_format, pddro_phase, document_type, tier, version,
  description, ttqs_indicator, access_level, is_system,
  auto_replace_rules, review_reminders
) VALUES
-- 3-1: 訓練主管與辦訓人員職能標準表
(
  '訓練主管與辦訓人員職能標準表',
  '訓練主管與辦訓人員職能標準表',
  '3WI-[企業代碼]-2-5-1',
  'P',
  'tier_document',
  3,
  NULL,
  '定義訓練主管與辦訓人員應具備的職能項目與等級標準。',
  '2',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[
    {"section":"職位名稱","description":"請依企業實際職位名稱調整"},
    {"section":"職能項目","description":"請依企業需求定義辦訓人員的職能項目"},
    {"section":"等級標準","description":"請設定各職能的等級評核標準"}
  ]'::jsonb
),
-- 3-2: 訓練方案的系統設計流程 ADDIE
(
  '訓練方案的系統設計流程 ADDIE',
  '訓練方案的系統設計流程 ADDIE',
  '3WI-[企業代碼]-4-1-1',
  'D',
  'tier_document',
  3,
  NULL,
  '說明訓練方案如何依 ADDIE（分析、設計、開發、實施、評估）模式進行系統化設計。',
  '8',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[{"section":"企業名稱","description":"請替換為企業名稱"}]'::jsonb
),
-- 3-3: 利益關係人參與系統運作關聯表
(
  '利益關係人參與系統運作關聯表',
  '利益關係人參與系統運作關聯表',
  '3WI-[企業代碼]-4-2-1',
  'D',
  'tier_document',
  3,
  NULL,
  '列出訓練品質系統的利益關係人（經營者、主管、HR、員工、講師等），及各自的參與角色與方式。',
  '9',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[
    {"section":"利益關係人名單","description":"請依企業實際列出利益關係人（含外部如講師、供應商等）"},
    {"section":"參與角色與方式","description":"請描述各關係人在 PDDRO 各階段的實際參與方式"}
  ]'::jsonb
),
-- 3-4: 講師甄選辦法
(
  '講師甄選辦法',
  '講師甄選辦法',
  '3WI-[企業代碼]-4-3-1',
  'DO',
  'tier_document',
  3,
  NULL,
  '規範內外部講師的甄選標準、評核流程與聘任程序。',
  '10',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[
    {"section":"甄選標準門檻","description":"請依企業需求設定講師學歷、經歷、證照等門檻"},
    {"section":"簽核層級","description":"請確認聘任簽核的審批層級"}
  ]'::jsonb
),
-- 3-5: 教育訓練採購作業流程
(
  '教育訓練採購作業流程',
  '教育訓練採購作業流程',
  '3WI-[企業代碼]-4-3-2',
  'DO',
  'tier_document',
  3,
  NULL,
  '規範訓練相關採購（講師酬勞、場地租借、教材印製等）的作業流程與審批權限。',
  '12',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[
    {"section":"採購金額分級","description":"請設定不同金額級距的審批流程"},
    {"section":"審批權限","description":"請確認各層級的核決金額與審批人"}
  ]'::jsonb
),
-- 3-6: 異常處理原則
(
  '異常處理原則',
  '異常處理原則',
  '3WI-[企業代碼]-6-4-1',
  'R',
  'tier_document',
  3,
  NULL,
  '定義訓練執行過程中異常事件（講師缺席、設備故障、學員不足等）的處理原則。',
  '16',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[{"section":"通報層級","description":"請確認異常事件的通報對象與層級"}]'::jsonb
),
-- 3-7: 異常矯正處理流程
(
  '異常矯正處理流程',
  '異常矯正處理流程',
  '3WI-[企業代碼]-6-4-2',
  'R',
  'tier_document',
  3,
  NULL,
  '說明異常事件的矯正措施流程，包含原因分析、改善對策、追蹤驗證等。',
  '16',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[{"section":"流程圖權責人","description":"請確認流程圖中各步驟的權責人是否正確"}]'::jsonb
);

-- ============================================================
-- 四階文件：表單（非課程表單的獨立表單）
-- ============================================================
INSERT INTO knowledge_base_templates (
  name, standard_name, doc_number_format, pddro_phase, document_type, tier, version,
  description, ttqs_indicator, access_level, is_system,
  auto_replace_rules, review_reminders
) VALUES
-- 非課程表單的四階文件
(
  '訓練人員工作職能盤點落差表',
  '訓練人員工作職能盤點落差表',
  '4FM-[企業代碼]-2-5-1',
  'P',
  'tier_document',
  4,
  NULL,
  '盤點辦訓人員目前職能水平與標準之間的落差，作為辦訓人員培訓的依據。',
  '2',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[
    {"section":"職能項目","description":"請對照三階職能標準表填入評核項目"},
    {"section":"評核標準","description":"請設定各職能的等級與評分標準"}
  ]'::jsonb
),
(
  '年度教育訓練需求調查問卷',
  '年度教育訓練需求調查問卷',
  '4FM-[企業代碼]-3-1-1',
  'P',
  'tier_document',
  4,
  NULL,
  '年度訓練需求調查問卷，彙整各部門訓練需求作為年度計畫依據。',
  '5',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[
    {"section":"部門列表","description":"請列出企業所有部門供選擇"},
    {"section":"調查項目","description":"可依企業需求增減調查題項"}
  ]'::jsonb
),
(
  '年度訓練課程計畫表',
  '年度訓練課程計畫表',
  '4FM-[企業代碼]-3-2-1',
  'P',
  'tier_document',
  4,
  NULL,
  '年度訓練課程計畫總表，列出全年度課程規劃、時程、預算與負責人。',
  '5',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[
    {"section":"年度課程清單","description":"請依企業年度規劃填入課程清單"},
    {"section":"預算","description":"請填入各課程預算"}
  ]'::jsonb
),
(
  '年度計畫執行分析檢討表',
  '年度計畫執行分析檢討表',
  '4FM-[企業代碼]-6-1-1',
  'R',
  'tier_document',
  4,
  NULL,
  '年度訓練計畫執行後的分析檢討，比對計畫與實際執行狀況，提出改善建議。',
  '16',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[{"section":"年度計畫對應項目","description":"請對照年度計畫表逐項檢討"}]'::jsonb
),
(
  '異常矯正表',
  '異常矯正表',
  '4FM-[企業代碼]-6-4-3',
  'R',
  'tier_document',
  4,
  NULL,
  '記錄訓練異常事件的矯正措施、原因分析、改善對策與追蹤結果。',
  '16',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[]'::jsonb
),
(
  '文件維護審核單',
  '文件維護審核單',
  '4FM-[企業代碼]-8-1-1',
  'general',
  'tier_document',
  4,
  NULL,
  '文件新增、修訂、廢止時的審核紀錄表，含版本異動說明與簽核。',
  NULL,
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[]'::jsonb
),
(
  '文件表單一覽表',
  '文件表單一覽表',
  '4FM-[企業代碼]-8-1-2',
  'general',
  'tier_document',
  4,
  NULL,
  '彙整企業所有受控文件與表單的清單，含文件編號、名稱、版本、修改日期。可由系統自動產生。',
  NULL,
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[]'::jsonb
);

-- ============================================================
-- 四階文件：課程表單（連結 PDDRO form schema）
-- 這些是已在 pddro_form_field_schemas 中定義的課程表單
-- ============================================================
INSERT INTO knowledge_base_templates (
  name, standard_name, doc_number_format, pddro_phase, document_type, tier, version,
  description, ttqs_indicator, access_level, is_system,
  auto_replace_rules, review_reminders
) VALUES
(
  '教育訓練方案設計表',
  '教育訓練方案設計表',
  '4FM-[企業代碼]-4-1-2',
  'D',
  'course_form',
  4,
  NULL,
  '課程方案設計表，含課程目標、對象、單元、教學方法、L1-L4 評估方式。已建立線上填寫 schema。',
  '8',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[{"section":"表頭企業名稱","description":"系統自動替換，無需手動修改"}]'::jsonb
),
(
  '講師評選表',
  '講師評選表',
  '4FM-[企業代碼]-4-3-2',
  'DO',
  'course_form',
  4,
  NULL,
  '講師候選人比較評選表，含學經歷、遴選條件勾選、聘任建議。已建立線上填寫 schema。',
  '10',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[{"section":"表頭企業名稱","description":"系統自動替換，無需手動修改"}]'::jsonb
),
(
  '場地評選表',
  '場地評選表',
  '4FM-[企業代碼]-4-3-4',
  'DO',
  'course_form',
  4,
  NULL,
  '場地遴選評比表，含安全性、便利性等五項評分。已建立線上填寫 schema。',
  '12',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[{"section":"表頭企業名稱","description":"系統自動替換，無需手動修改"}]'::jsonb
),
(
  '課程執行流程管控表',
  '課程執行流程管控表',
  '4FM-[企業代碼]-5-1-2',
  'R',
  'course_form',
  4,
  NULL,
  '課程前中後工作項目檢核與流程管控表。已建立線上填寫 schema。',
  '16',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[{"section":"表頭企業名稱","description":"系統自動替換，無需手動修改"}]'::jsonb
),
(
  '教材審核表',
  '教材審核表',
  '4FM-[企業代碼]-5-3-1',
  'DO',
  'course_form',
  4,
  NULL,
  '教材系統性、實用性、文件品質審核表。已建立線上填寫 schema。',
  '12',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[{"section":"表頭企業名稱","description":"系統自動替換，無需手動修改"}]'::jsonb
),
(
  '教學方法聯繫單',
  '教學方法聯繫單',
  '4FM-[企業代碼]-5-3-2',
  'DO',
  'course_form',
  4,
  NULL,
  '與講師確認教學方法、座位排列、所需設備的聯繫表。已建立線上填寫 schema。',
  '12',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[{"section":"表頭企業名稱","description":"系統自動替換，無需手動修改"}]'::jsonb
),
(
  '訓練活動紀錄簽到表',
  '訓練活動紀錄簽到表',
  '4FM-[企業代碼]-5-3-3',
  'R',
  'course_form',
  4,
  NULL,
  '學員簽到表，含課程資訊、學員名單與多時段簽到紀錄。已建立線上填寫 schema。',
  '15',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[{"section":"表頭企業名稱","description":"系統自動替換，無需手動修改"}]'::jsonb
),
(
  '隨堂人員工作日誌表',
  '隨堂人員工作日誌表',
  '4FM-[企業代碼]-5-3-4',
  'R',
  'course_form',
  4,
  NULL,
  '課程工作人員日誌，含課程實施情形 checklist、異常狀況、講師狀況、總結。已建立線上填寫 schema。',
  '15',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[{"section":"表頭企業名稱","description":"系統自動替換，無需手動修改"}]'::jsonb
),
(
  '教育訓練結案報告',
  '教育訓練結案報告',
  '4FM-[企業代碼]-5-3-5',
  'R',
  'course_form',
  4,
  NULL,
  '課程結案報告，含完整摘要、L1-L4 評估、行動計畫、講師回饋、建議。三層簽核。已建立線上填寫 schema。',
  '15',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[{"section":"表頭企業名稱","description":"系統自動替換，無需手動修改"}]'::jsonb
),
(
  '參訓學員意見調查表',
  '滿意度調查',
  '4FM-[企業代碼]-7-1-2',
  'O',
  'course_form',
  4,
  NULL,
  '課程滿意度調查表，已建立線上問卷系統（自動連動）。',
  '17',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[{"section":"表頭企業名稱","description":"系統自動替換，無需手動修改"}]'::jsonb
),
-- 其他已在 PDDRO 但非獨立四階文件編號的（公告、訓練需求調查、課程成果、結業證書、訓後動態調查）
(
  '訓練需求調查（課前問卷）',
  '訓練需求調查（課前問卷）',
  NULL,
  'D',
  'course_form',
  4,
  NULL,
  '課前訓練需求調查問卷，了解學員需求與偏好。已建立線上填寫 schema。',
  '11',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[]'::jsonb
),
(
  '公告',
  '公告',
  NULL,
  'DO',
  'course_form',
  4,
  NULL,
  '內訓課程公告範本。已建立線上填寫 schema。',
  '12',
  'all',
  true,
  '[]'::jsonb,
  '[]'::jsonb
),
(
  '課程成果內容',
  '課程成果內容',
  NULL,
  'O',
  'course_form',
  4,
  NULL,
  '課程成果彙整（上傳類型）。',
  '17',
  'all',
  true,
  '[]'::jsonb,
  '[]'::jsonb
),
(
  '結業證書',
  '結業證書',
  NULL,
  'O',
  'course_form',
  4,
  NULL,
  '學員結業證書範本（上傳類型）。',
  '17',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[{"section":"證書內容","description":"請依企業 CI 調整證書版面與用印"}]'::jsonb
),
(
  '參訓學員訓後動態調查表',
  '參訓學員訓後動態調查表',
  NULL,
  'O',
  'course_form',
  4,
  NULL,
  'L3 行為評估訓後動態調查問卷。已建立線上填寫 schema。',
  '17',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[]'::jsonb
),
(
  '年度訓練計畫總表',
  '年度訓練計畫總表',
  NULL,
  'P',
  'course_form',
  4,
  NULL,
  '年度訓練計畫總表（上傳類型），可同時作為 PDDRO P 階段佐證文件。',
  '5',
  'all',
  true,
  '[{"placeholder":"{{公司名稱}}","field":"企業名稱"}]'::jsonb,
  '[]'::jsonb
);
