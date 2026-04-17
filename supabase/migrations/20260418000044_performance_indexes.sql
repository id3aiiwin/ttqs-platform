-- 效能索引：為資料量成長後最熱門的查詢路徑補索引
-- 原則：只對「頻繁 filter / sort / join」且尚未有索引的欄位加
-- 使用 IF NOT EXISTS 以保安全（重跑不會失敗）

-- 1. course_enrollments（員工訓練記錄）
-- 熱點：passport 頁、講師分析、dashboard 都會依 employee_id / company_id 查
CREATE INDEX IF NOT EXISTS idx_course_enrollments_employee ON course_enrollments(employee_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_company ON course_enrollments(company_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id);

-- 2. course_registrations（公開課報名）
CREATE INDEX IF NOT EXISTS idx_course_registrations_course ON course_registrations(course_id);
CREATE INDEX IF NOT EXISTS idx_course_registrations_student ON course_registrations(student_id);

-- 3. interactions（CRM 互動紀錄）
-- 熱點：CRM 頁依 contact_date DESC 排序；依 target_id 查某企業/人的互動
CREATE INDEX IF NOT EXISTS idx_interactions_contact_date ON interactions(contact_date DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_target ON interactions(target_type, target_id);

-- 4. notifications（站內通知）
-- 熱點：查某使用者的未讀通知並按時間排序
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- 5. shop_orders（訂單）
CREATE INDEX IF NOT EXISTS idx_shop_orders_user_created ON shop_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(status);

-- 6. quiz_results（測驗結果）
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_completed ON quiz_results(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_results_product ON quiz_results(product_id);

-- 7. course_survey_responses（課後問卷回答）
-- 熱點：survey-results 頁依 survey_id 聚合
CREATE INDEX IF NOT EXISTS idx_course_survey_responses_survey ON course_survey_responses(survey_id);

-- 8. competency_form_entries（職能表單）
CREATE INDEX IF NOT EXISTS idx_competency_entries_employee ON competency_form_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_competency_entries_company_type ON competency_form_entries(company_id, form_type);

-- 9. competency_form_entry_values（表單欄位值）
-- 熱點：每次載入 entry 都會 `.eq('entry_id', ...)`
CREATE INDEX IF NOT EXISTS idx_competency_values_entry ON competency_form_entry_values(entry_id);

-- 10. courses（課程）
-- 熱點：dashboard、分析頁依 company_id 查；依 start_date 排序
CREATE INDEX IF NOT EXISTS idx_courses_company ON courses(company_id);
CREATE INDEX IF NOT EXISTS idx_courses_start_date ON courses(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);

-- 11. meetings（會議）
CREATE INDEX IF NOT EXISTS idx_meetings_company ON meetings(company_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date DESC);

-- 12. profiles：按 company_id 查員工（HR / manager 常用）
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company_id) WHERE company_id IS NOT NULL;

-- 13. company_documents
CREATE INDEX IF NOT EXISTS idx_company_documents_company_tier ON company_documents(company_id, tier);

-- 14. course_forms
CREATE INDEX IF NOT EXISTS idx_course_forms_course ON course_forms(course_id);
