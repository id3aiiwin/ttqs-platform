-- 合併「工作職務分析量表」與「工作分析表格」為單一「工作分析表格」
-- 三層結構：職責 → 任務 → 構成要素/步驟

-- 刪除舊的兩個欄位
DELETE FROM competency_form_defaults
WHERE form_type = 'job_analysis' AND field_name IN ('duty_task_inventory', 'task_breakdown');

-- 插入合併後的新欄位
INSERT INTO competency_form_defaults (form_type, field_name, standard_name, field_type, is_required, options, description, sort_order) VALUES
('job_analysis', 'job_analysis_table', '工作分析表格', 'repeating_group', true,
 '{"fields": [
   {"key": "duty_name", "label": "職責 (Duty)", "type": "text", "required": true,
    "placeholder": "例：準備餐點",
    "help": "相關任務的總稱，說明主要的工作面向，須包含動詞、受詞"},
   {"key": "tasks", "label": "任務 (Task)", "type": "task_with_steps", "required": true,
    "help": "有明確起點與終點、能產出具體成果的最小工作單元"}
 ], "repeatable": true, "add_label": "新增職責", "min": 1}'::jsonb,
 '列出該職務的所有職責、任務及構成要素/步驟', 2)
ON CONFLICT DO NOTHING;

-- 同步更新已建立的企業模板
DELETE FROM competency_form_templates
WHERE form_type = 'job_analysis' AND field_name IN ('duty_task_inventory', 'task_breakdown');

INSERT INTO competency_form_templates (company_id, form_type, field_name, standard_name, display_name, field_type, is_required, options, sort_order)
SELECT
  company_id,
  'job_analysis',
  'job_analysis_table',
  '工作分析表格',
  '工作分析表格',
  'repeating_group',
  true,
  '{"fields": [
    {"key": "duty_name", "label": "職責 (Duty)", "type": "text", "required": true,
     "placeholder": "例：準備餐點",
     "help": "相關任務的總稱，說明主要的工作面向，須包含動詞、受詞"},
    {"key": "tasks", "label": "任務 (Task)", "type": "task_with_steps", "required": true,
     "help": "有明確起點與終點、能產出具體成果的最小工作單元"}
  ], "repeatable": true, "add_label": "新增職責", "min": 1}'::jsonb,
  2
FROM competency_form_templates
WHERE form_type = 'job_analysis' AND field_name = 'basic_info'
ON CONFLICT DO NOTHING;
