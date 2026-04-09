-- 更新工作分析表的基本資料欄位：
-- 移除 organization, approval_unit, co_units
-- analyst 欄位加上 auto_fill 標記
UPDATE competency_form_defaults
SET options = '{"fields": [
  {"key": "job_title", "label": "工作職稱", "type": "text", "required": true},
  {"key": "department", "label": "部門單位", "type": "text", "required": true},
  {"key": "supervisor", "label": "主管", "type": "text"},
  {"key": "analyst", "label": "分析人", "type": "text", "required": true, "auto_fill": "employee_name"},
  {"key": "date", "label": "日期", "type": "date", "required": true}
], "repeatable": false}'::jsonb
WHERE form_type = 'job_analysis' AND field_name = 'basic_info';

-- 同步更新已建立的企業模板（尚未被同仁修改過的）
UPDATE competency_form_templates
SET options = '{"fields": [
  {"key": "job_title", "label": "工作職稱", "type": "text", "required": true},
  {"key": "department", "label": "部門單位", "type": "text", "required": true},
  {"key": "supervisor", "label": "主管", "type": "text"},
  {"key": "analyst", "label": "分析人", "type": "text", "required": true, "auto_fill": "employee_name"},
  {"key": "date", "label": "日期", "type": "date", "required": true}
], "repeatable": false}'::jsonb
WHERE form_type = 'job_analysis' AND field_name = 'basic_info';
