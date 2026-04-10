-- 基本資料新增「職位目的」欄位（同仁填寫）
UPDATE competency_form_defaults
SET options = '{"fields": [
  {"key": "job_title", "label": "工作職稱", "type": "text", "required": true},
  {"key": "department", "label": "部門單位", "type": "text", "required": true},
  {"key": "job_purpose", "label": "職位目的", "type": "textarea", "required": true, "placeholder": "請簡述此職位存在的主要目的與價值", "full_width": true},
  {"key": "supervisor", "label": "主管", "type": "text"},
  {"key": "analyst", "label": "分析人", "type": "text", "required": true, "auto_fill": "employee_name"},
  {"key": "date", "label": "日期", "type": "date", "required": true}
], "repeatable": false}'::jsonb
WHERE form_type = 'job_analysis' AND field_name = 'basic_info';

-- 同步更新已建立的企業模板
UPDATE competency_form_templates
SET options = '{"fields": [
  {"key": "job_title", "label": "工作職稱", "type": "text", "required": true},
  {"key": "department", "label": "部門單位", "type": "text", "required": true},
  {"key": "job_purpose", "label": "職位目的", "type": "textarea", "required": true, "placeholder": "請簡述此職位存在的主要目的與價值", "full_width": true},
  {"key": "supervisor", "label": "主管", "type": "text"},
  {"key": "analyst", "label": "分析人", "type": "text", "required": true, "auto_fill": "employee_name"},
  {"key": "date", "label": "日期", "type": "date", "required": true}
], "repeatable": false}'::jsonb
WHERE form_type = 'job_analysis' AND field_name = 'basic_info';
