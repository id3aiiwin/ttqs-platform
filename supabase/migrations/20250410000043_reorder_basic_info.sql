-- 調整基本資料排版（3欄 grid）：
-- Row 1: 工作職稱、分析人、日期
-- Row 2: 部門單位、主管
-- Row 3: 職位目的（滿版）
UPDATE competency_form_defaults
SET options = '{"fields": [
  {"key": "job_title", "label": "工作職稱", "type": "text", "required": true},
  {"key": "analyst", "label": "分析人", "type": "text", "required": true, "auto_fill": "employee_name"},
  {"key": "date", "label": "日期", "type": "date", "required": true},
  {"key": "department", "label": "部門單位", "type": "text", "required": true},
  {"key": "supervisor", "label": "主管", "type": "text", "col_span": 2},
  {"key": "job_purpose", "label": "職位目的", "type": "textarea", "required": true, "placeholder": "請簡述此職位存在的主要目的與價值", "full_width": true}
], "repeatable": false}'::jsonb
WHERE form_type = 'job_analysis' AND field_name = 'basic_info';

UPDATE competency_form_templates
SET options = '{"fields": [
  {"key": "job_title", "label": "工作職稱", "type": "text", "required": true},
  {"key": "analyst", "label": "分析人", "type": "text", "required": true, "auto_fill": "employee_name"},
  {"key": "date", "label": "日期", "type": "date", "required": true},
  {"key": "department", "label": "部門單位", "type": "text", "required": true},
  {"key": "supervisor", "label": "主管", "type": "text", "col_span": 2},
  {"key": "job_purpose", "label": "職位目的", "type": "textarea", "required": true, "placeholder": "請簡述此職位存在的主要目的與價值", "full_width": true}
], "repeatable": false}'::jsonb
WHERE form_type = 'job_analysis' AND field_name = 'basic_info';
