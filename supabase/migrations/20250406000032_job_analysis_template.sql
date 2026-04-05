-- Expand field_type to support structured data
-- Note: competency_form_defaults and competency_form_templates use text type for field_type
-- We just need to insert with the right values

-- Seed job_analysis defaults
INSERT INTO competency_form_defaults (form_type, field_name, standard_name, field_type, is_required, options, description, sort_order) VALUES

-- ===== 第一階段：基礎盤點（必填）=====

-- 基本資料
('job_analysis', 'basic_info', '基本資料', 'repeating_group', true,
 '{"fields": [
   {"key": "job_title", "label": "工作職稱", "type": "text", "required": true},
   {"key": "department", "label": "部門單位", "type": "text", "required": true},
   {"key": "organization", "label": "公司組織", "type": "text"},
   {"key": "supervisor", "label": "主管", "type": "text"},
   {"key": "analyst", "label": "分析人", "type": "text", "required": true},
   {"key": "date", "label": "日期", "type": "date", "required": true},
   {"key": "approval_unit", "label": "批准單位", "type": "text"},
   {"key": "co_units", "label": "會辦單位", "type": "text"}
 ], "repeatable": false}'::jsonb,
 '填寫該職務的基本資訊', 1),

-- 表單一：工作職務分析量表（職責+任務）
('job_analysis', 'duty_task_inventory', '工作職務分析量表', 'repeating_group', true,
 '{"fields": [
   {"key": "duty_name", "label": "職責 (Duty)", "type": "text", "required": true, "placeholder": "以行為動詞描述工作範圍，例：準備餐點", "help": "相關任務的總稱，須包含動詞、受詞及特定物"},
   {"key": "tasks", "label": "任務 (Task)", "type": "task_list", "required": true, "placeholder": "行動動詞＋目標名詞，例：烤餅乾", "help": "最小且具意義的工作單元，須有清楚的起點與終點"}
 ], "repeatable": true, "add_label": "新增職責", "min": 1}'::jsonb,
 '列出該職務的所有職責與對應任務', 2),

-- 表單二：工作分析表格（任務展開為步驟）
('job_analysis', 'task_breakdown', '工作分析表格', 'repeating_group', true,
 '{"fields": [
   {"key": "duty_ref", "label": "職責 (Duty)", "type": "text", "required": true},
   {"key": "task_name", "label": "任務名稱", "type": "text", "required": true},
   {"key": "steps", "label": "構成要素/步驟", "type": "step_list", "required": true, "help": "將任務展開為具體的執行步驟，通常每份任務有兩種或以上的步驟"}
 ], "repeatable": true, "add_label": "新增任務分析", "min": 1}'::jsonb,
 '將每項任務向下展開為具體的步驟', 3),

-- ===== 第二階段：進階特定行為模式分析（選填）=====

-- 1. 處理程序分析表
('job_analysis', 'procedure_analysis', '處理程序分析表', 'table', false,
 '{"description": "適用動詞：安裝、準備、起動、開關、拆卸、組裝、計算。適用於需以特定順序完成一系列步驟的工作。",
  "columns": [
   {"key": "step", "label": "程序步驟", "type": "textarea"},
   {"key": "standard", "label": "品質標準／安全須知", "type": "textarea"},
   {"key": "suggestion", "label": "建議", "type": "textarea"}
  ], "repeatable": true, "add_label": "新增步驟"}'::jsonb,
 '適用動詞：安裝、準備、起動、開關、拆卸、組裝、計算', 10),

-- 2. 問題解決分析表
('job_analysis', 'problem_solving', '問題解決分析表', 'table', false,
 '{"description": "適用動詞：解決、解釋、計算、預測。將既存問題與可能原因互相參照，整理出解決行動。",
  "columns": [
   {"key": "problem", "label": "問題現況", "type": "textarea"},
   {"key": "cause", "label": "不能(可能)造成原因", "type": "textarea"},
   {"key": "action", "label": "行動方案", "type": "textarea"}
  ], "repeatable": true, "add_label": "新增問題"}'::jsonb,
 '適用動詞：解決、解釋、計算、預測', 11),

-- 3. 決策分析表
('job_analysis', 'decision_analysis', '決策分析表', 'table', false,
 '{"description": "適用動詞：決定、選擇、確認、澄清。根據條件因素決定應採取的行動。",
  "columns": [
   {"key": "if_condition", "label": "如果 (大前提)", "type": "textarea"},
   {"key": "and_condition", "label": "而且 (附加條件)", "type": "textarea"},
   {"key": "then_action", "label": "然後實施方案 (行動決定)", "type": "textarea"}
  ], "repeatable": true, "add_label": "新增決策情境"}'::jsonb,
 '適用動詞：決定、選擇、確認、澄清', 12),

-- 4. 審查分析表
('job_analysis', 'review_analysis', '審查分析表', 'table', false,
 '{"description": "適用動詞：檢閱、觀察、檢驗、校對、判定。將成品或流程與標準比對。",
  "columns": [
   {"key": "checkpoint", "label": "檢驗管制點", "type": "textarea"},
   {"key": "review_steps", "label": "管制審查步驟", "type": "textarea"},
   {"key": "criteria", "label": "準則／標準", "type": "textarea"}
  ], "repeatable": true, "add_label": "新增檢驗點"}'::jsonb,
 '適用動詞：檢閱、觀察、檢驗、校對、判定', 13),

-- 5. 調整／修正分析表
('job_analysis', 'adjustment_analysis', '調整／修正分析表', 'table', false,
 '{"description": "適用動詞：調整、修改、改善、改良。改良產品或步驟以符合標準。",
  "columns": [
   {"key": "adjustment_point", "label": "調整／修正點", "type": "textarea"},
   {"key": "correction_steps", "label": "修正點步驟", "type": "textarea"},
   {"key": "criteria", "label": "準則／標準", "type": "textarea"}
  ], "repeatable": true, "add_label": "新增修正項"}'::jsonb,
 '適用動詞：調整、修改、改善、改良', 14),

-- 6. 物體分析表
('job_analysis', 'object_analysis', '物體分析表', 'table', false,
 '{"description": "適用動詞：設置、瞭解。適用於操作特定設備或工具。",
  "columns": [
   {"key": "part_name", "label": "物體部分名稱", "type": "text"},
   {"key": "location", "label": "位置／場所", "type": "text"},
   {"key": "purpose", "label": "目的", "type": "textarea"}
  ], "repeatable": true, "add_label": "新增部件"}'::jsonb,
 '適用動詞：設置、瞭解', 15),

-- 7. 概念分析表
('job_analysis', 'concept_analysis', '概念分析表', 'table', false,
 '{"description": "適用動詞：理解、瞭解、定義、界定。清楚辨認各層級的想法、行動與事物。",
  "columns": [
   {"key": "important_traits", "label": "重要特性", "type": "textarea"},
   {"key": "variable_traits", "label": "變異特性", "type": "textarea"},
   {"key": "example", "label": "範例", "type": "textarea"},
   {"key": "non_example", "label": "非範例", "type": "textarea"}
  ], "repeatable": true, "add_label": "新增概念"}'::jsonb,
 '適用動詞：理解、瞭解、定義、界定', 16)

ON CONFLICT DO NOTHING;
