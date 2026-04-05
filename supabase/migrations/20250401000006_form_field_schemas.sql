-- ============================================================
-- 006: PDDRO 表單欄位定義系統
-- 新增系統預設表單 schema 表 + 擴充既有表單表欄位
-- ============================================================

-- 0. 確保 uuid extension
create extension if not exists "uuid-ossp" with schema extensions;

-- 1. 系統預設表單欄位定義（公版）
create table if not exists pddro_form_field_schemas (
  id            uuid primary key default extensions.uuid_generate_v4(),
  standard_name text not null unique,
  version       integer not null default 1,
  field_schema  jsonb not null default '[]'::jsonb,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. 企業模板加入 field_schema（null = 繼承系統預設）
alter table company_form_templates
  add column if not exists field_schema jsonb;

-- 3. 課程表單加入 field_schema（建立課程時從模板快照）
alter table course_forms
  add column if not exists field_schema jsonb;

-- 4. 更新觸發器：pddro_form_field_schemas 的 updated_at
create or replace function update_pddro_schema_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_pddro_schema_updated_at
  before update on pddro_form_field_schemas
  for each row execute function update_pddro_schema_updated_at();

-- 5. RLS 政策
alter table pddro_form_field_schemas enable row level security;

-- 所有已登入使用者可讀取系統預設
create policy "pddro_form_field_schemas_select"
  on pddro_form_field_schemas for select
  to authenticated
  using (true);

-- 僅 consultant 可修改系統預設
create policy "pddro_form_field_schemas_insert"
  on pddro_form_field_schemas for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'consultant'
    )
  );

create policy "pddro_form_field_schemas_update"
  on pddro_form_field_schemas for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'consultant'
    )
  );

create policy "pddro_form_field_schemas_delete"
  on pddro_form_field_schemas for delete
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'consultant'
    )
  );

-- 6. 插入 16 張預設表單的 field_schema
-- P Phase
insert into pddro_form_field_schemas (standard_name, description, field_schema) values
('年度訓練計畫總表', 'P 計畫 - 年度訓練計畫總表（上傳類型）', '{"title":"{company_name} 年度訓練計畫總表","sections":[{"id":"info","title":"基本資訊","fields":[{"id":"year","label":"年度","type":"number","required":true,"placeholder":"例：2025"},{"id":"description","label":"計畫說明","type":"textarea","placeholder":"請簡述年度訓練計畫重點"}]},{"id":"upload","title":"上傳文件","fields":[{"id":"plan_file","label":"計畫總表檔案","type":"file_upload","required":true,"description":"請上傳年度訓練計畫總表"}]}]}'::jsonb);

-- D Phase
insert into pddro_form_field_schemas (standard_name, description, field_schema) values
('訓練需求調查（課前問卷）', 'D 設計 - 訓練需求調查課前問卷', '{"title":"{company_name} 訓練需求調查（課前問卷）","sections":[{"id":"info","title":"課程資訊","fields":[{"id":"course_name","label":"課程名稱","type":"text","required":true,"auto_populate":"course.title"},{"id":"survey_date","label":"調查日期","type":"date","required":true}]},{"id":"needs","title":"訓練需求","fields":[{"id":"current_skills","label":"目前工作中最需要加強的技能","type":"textarea","required":true},{"id":"expected_outcomes","label":"期望透過訓練獲得的成果","type":"textarea","required":true},{"id":"preferred_methods","label":"偏好的學習方式","type":"checkbox","options":[{"label":"講述法","value":"lecture"},{"label":"分組討論","value":"group_discussion"},{"label":"案例研討","value":"case_study"},{"label":"角色扮演","value":"role_play"},{"label":"影片教學","value":"video"},{"label":"實作演練","value":"practice"},{"label":"其他","value":"other"}]},{"id":"preferred_methods_other","label":"其他學習方式說明","type":"text","condition":{"field_id":"preferred_methods","operator":"in","value":"other"}},{"id":"schedule_preference","label":"適合的上課時段","type":"radio","options":[{"label":"上午 (9:00-12:00)","value":"morning"},{"label":"下午 (13:00-17:00)","value":"afternoon"},{"label":"全天 (9:00-17:00)","value":"full_day"},{"label":"皆可","value":"any"}]},{"id":"additional_notes","label":"其他建議或需求","type":"textarea"}]}]}'::jsonb);

insert into pddro_form_field_schemas (standard_name, description, field_schema) values
('教育訓練方案設計表', 'D 設計 - 教育訓練方案設計表（表號 4-1-1）', '{"title":"{company_name} 教育訓練方案設計表","subtitle":"4FM-TR001-4-1-1","sections":[{"id":"basic","title":"課程基本資訊","fields":[{"id":"course_name","label":"課程名稱","type":"text","required":true,"auto_populate":"course.title","columns":2},{"id":"course_objectives","label":"課程目標","type":"repeating_group","required":true,"fields":[{"id":"objective","label":"目標內容","type":"text","required":true}],"min_rows":1,"max_rows":10},{"id":"target_audience","label":"參加對象","type":"text","required":true,"auto_populate":"course.target","columns":2},{"id":"selection_criteria","label":"遴選條件","type":"textarea","columns":2},{"id":"class_size_max","label":"上限人數","type":"number","required":true,"min":1,"columns":1},{"id":"class_size_min","label":"下限人數","type":"number","required":true,"min":1,"columns":1},{"id":"start_date","label":"開課日期","type":"date","required":true,"auto_populate":"course.start_date","columns":1},{"id":"course_hours","label":"課程時數","type":"text","required":true,"auto_populate":"course.hours","placeholder":"例：8小時","columns":1},{"id":"course_time","label":"上課時間","type":"text","required":true,"placeholder":"例：9:00-18:00","columns":1},{"id":"venue_type","label":"預定上課地點","type":"radio","required":true,"options":[{"label":"單位自有教室","value":"internal"},{"label":"外借教室","value":"external"}],"columns":1}]},{"id":"units","title":"課程單元","fields":[{"id":"course_units","label":"課程單元","type":"repeating_group","required":true,"fields":[{"id":"unit_name","label":"單元名稱","type":"text","required":true},{"id":"unit_hours","label":"時數","type":"number","required":true,"min":0.5},{"id":"unit_instructor","label":"預定講師","type":"text","required":true}],"min_rows":1,"max_rows":20}]},{"id":"teaching","title":"教學方式","fields":[{"id":"teaching_methods","label":"主要教學方法","type":"textarea","required":true,"placeholder":"例：簡報講授、影片教學、分組討論、個案研討"},{"id":"equipment_needs","label":"教學環境與教學設備的需求","type":"textarea","required":true,"placeholder":"例：投影機，電腦，網路，麥克風，白板，白板筆"}]},{"id":"evaluation","title":"評估方式","fields":[{"id":"l1_method","label":"L1 反應評估（滿意度調查機制）","type":"text","required":true,"placeholder":"例：滿意度調查","columns":2},{"id":"l1_standard","label":"L1 評估標準","type":"text","placeholder":"例：綜合分數達 90 分","columns":2},{"id":"l2_method","label":"L2 學習評估（考試或報告機制）","type":"text","placeholder":"例：學習成效評估問卷","columns":2},{"id":"l2_standard","label":"L2 評估標準","type":"text","columns":2},{"id":"l3_method","label":"L3 行為評估（課後行動計畫調查機制）","type":"text","placeholder":"例：課後一個月主管進行考評","columns":2},{"id":"l3_standard","label":"L3 評估標準","type":"text","columns":2},{"id":"l4_method","label":"L4 成果評估（工作績效調查機制）","type":"text","columns":2},{"id":"l4_standard","label":"L4 評估標準","type":"text","columns":2}]}]}'::jsonb);

-- DO Phase
insert into pddro_form_field_schemas (standard_name, description, field_schema) values
('公告', 'DO 執行 - 課程公告', '{"title":"內訓課程公告","sections":[{"id":"content","title":"公告內容","fields":[{"id":"subject","label":"主旨","type":"textarea","required":true},{"id":"course_date","label":"日期","type":"date","required":true,"auto_populate":"course.start_date"},{"id":"course_time","label":"時間","type":"text","required":true,"placeholder":"例：9:00-18:00","columns":2},{"id":"course_name","label":"課程","type":"text","required":true,"auto_populate":"course.title","columns":2},{"id":"venue","label":"地點","type":"text","required":true,"auto_populate":"course.venue","columns":2},{"id":"participants","label":"參加人員","type":"text","required":true,"columns":2}]},{"id":"sign","title":"簽核","fields":[{"id":"ceo_signature","label":"總經理簽核","type":"signature","signers":["總經理"]},{"id":"announce_date","label":"公告日期","type":"date","required":true}]}]}'::jsonb);

insert into pddro_form_field_schemas (standard_name, description, field_schema) values
('講師評選表', 'DO 執行 - 講師評選表（表號 4-3-1）', '{"title":"{company_name} 講師評選表","subtitle":"4FM-TR001-4-3-1","sections":[{"id":"info","title":"課程資訊","fields":[{"id":"course_name","label":"課程名稱","type":"text","required":true,"auto_populate":"course.title"}]},{"id":"candidates","title":"講師候選人","fields":[{"id":"instructors","label":"講師評選","type":"repeating_group","required":true,"fields":[{"id":"name","label":"姓名","type":"text","required":true},{"id":"education","label":"學歷","type":"text"},{"id":"experience","label":"經歷","type":"textarea","description":"請列出相關經歷"},{"id":"specialty","label":"專長課程","type":"textarea"},{"id":"criteria_industry","label":"業界機構實務經驗","type":"radio","options":[{"label":"是","value":"yes"},{"label":"否","value":"no"}]},{"id":"criteria_university","label":"大學相關科系講師","type":"radio","options":[{"label":"是","value":"yes"},{"label":"否","value":"no"}]},{"id":"criteria_topic","label":"相關主題講授經驗","type":"radio","options":[{"label":"是","value":"yes"},{"label":"否","value":"no"}]},{"id":"criteria_license","label":"特殊證照需求","type":"radio","options":[{"label":"是","value":"yes"},{"label":"否","value":"no"}]},{"id":"criteria_existing","label":"原合格講師","type":"radio","options":[{"label":"是","value":"yes"},{"label":"否","value":"no"}]},{"id":"criteria_other","label":"其他或說明","type":"text"},{"id":"recommendation","label":"說明與建議","type":"radio","required":true,"options":[{"label":"予以聘任","value":"hire"},{"label":"不予聘任","value":"reject"}]}],"min_rows":2,"max_rows":5}]},{"id":"sign","title":"簽核","fields":[{"id":"approval","label":"簽核","type":"signature","signers":["承辦人","主管"]}]}]}'::jsonb);

insert into pddro_form_field_schemas (standard_name, description, field_schema) values
('教學方法聯繫單', 'DO 執行 - 教學方法聯繫單（表號 5-4-1）', '{"title":"{company_name} 教學方法聯繫表","subtitle":"4FM-TR001-5-4-1","sections":[{"id":"info","title":"課程資訊","fields":[{"id":"course_name","label":"課程名稱","type":"text","required":true,"auto_populate":"course.title","columns":2},{"id":"date_range","label":"起訖日期","type":"text","required":true,"auto_populate":"course.start_date","columns":1},{"id":"instructor","label":"講師","type":"text","required":true,"auto_populate":"course.trainer","columns":1}]},{"id":"methods","title":"教學方式","fields":[{"id":"teaching_methods","label":"教學方法","type":"checkbox","required":true,"options":[{"label":"講述法","value":"lecture"},{"label":"分組討論法","value":"group_discussion"},{"label":"個案研討法","value":"case_study"},{"label":"媒體教學法(影片)","value":"video"},{"label":"其他","value":"other"}]},{"id":"teaching_methods_other","label":"其他教學方法","type":"text","condition":{"field_id":"teaching_methods","operator":"in","value":"other"}},{"id":"seating","label":"座位排列方式","type":"radio","required":true,"options":[{"label":"教室型","value":"classroom"},{"label":"小組型","value":"group"},{"label":"戶外","value":"outdoor"},{"label":"其他","value":"other"}]}]},{"id":"equipment","title":"教學設備","fields":[{"id":"required_equipment","label":"配合教學所需設備","type":"checkbox","required":true,"options":[{"label":"電腦","value":"computer"},{"label":"單槍投影機","value":"projector"},{"label":"喇叭","value":"speaker"},{"label":"簡報架/白板","value":"whiteboard"},{"label":"簡報筆","value":"pointer"},{"label":"其他","value":"other"}]},{"id":"equipment_other","label":"其他設備","type":"text","condition":{"field_id":"required_equipment","operator":"in","value":"other"}},{"id":"notes","label":"備註","type":"textarea"}]},{"id":"sign","title":"簽核","fields":[{"id":"approval","label":"簽核","type":"signature","signers":["講師","承辦人員","主管"]}]}]}'::jsonb);

insert into pddro_form_field_schemas (standard_name, description, field_schema) values
('教材審核表', 'DO 執行 - 教材審核表（表號 5-3-1）', '{"title":"{company_name} 教材審核表","subtitle":"4FM-TR001-5-3-1","sections":[{"id":"info","title":"課程資訊","fields":[{"id":"course_name","label":"課程名稱","type":"text","required":true,"auto_populate":"course.title","columns":2},{"id":"instructor","label":"講師","type":"text","required":true,"auto_populate":"course.trainer","columns":2}]},{"id":"review","title":"審核項目","fields":[{"id":"systematic","label":"系統性","type":"radio","required":true,"description":"檢視是否依據課程表中大綱進行編排，每一大項及細節是否清楚","options":[{"label":"通過","value":"pass"},{"label":"不通過","value":"fail"}]},{"id":"practical","label":"實用性","type":"radio","required":true,"description":"是否方便學員閱讀，或是方便記筆記","options":[{"label":"通過","value":"pass"},{"label":"不通過","value":"fail"}]},{"id":"quality","label":"文件品質","type":"radio","required":true,"description":"檢視是否缺頁、錯字、無法辨識等問題","options":[{"label":"通過","value":"pass"},{"label":"不通過","value":"fail"}]},{"id":"review_notes","label":"備註","type":"textarea"}]},{"id":"sign","title":"簽核","fields":[{"id":"approval","label":"簽核","type":"signature","signers":["承辦人員","主管"]}]}]}'::jsonb);

insert into pddro_form_field_schemas (standard_name, description, field_schema) values
('場地評選表', 'DO 執行 - 場地評選表（表號 4-3-2）', '{"title":"{company_name} 場地遴選表","subtitle":"4FM-TR001-4-3-2","sections":[{"id":"info","title":"課程資訊","fields":[{"id":"course_name","label":"課程名稱","type":"text","required":true,"auto_populate":"course.title"}]},{"id":"venues","title":"場地評比","description":"10分，分數越高表示該評分項目得分越高，以分數高者錄取","fields":[{"id":"venue_list","label":"場地評選","type":"repeating_group","required":true,"fields":[{"id":"venue_name","label":"場地名稱","type":"text","required":true},{"id":"safety_score","label":"安全性","type":"rating","required":true,"min":1,"max":10},{"id":"convenience_score","label":"便利性","type":"rating","required":true,"min":1,"max":10},{"id":"service_score","label":"服務多元","type":"rating","required":true,"min":1,"max":10},{"id":"equipment_score","label":"設備","type":"rating","required":true,"min":1,"max":10},{"id":"price_score","label":"價格合理性","type":"rating","required":true,"min":1,"max":10},{"id":"venue_notes","label":"備註","type":"text"}],"min_rows":2,"max_rows":5}]},{"id":"result","title":"評選結果","fields":[{"id":"result_description","label":"評選結果","type":"textarea","required":true}]},{"id":"sign","title":"簽核","fields":[{"id":"approval","label":"簽核","type":"signature","signers":["承辦人員","主管"]}]}]}'::jsonb);

-- R Phase
insert into pddro_form_field_schemas (standard_name, description, field_schema) values
('訓練活動紀錄簽到表', 'R 查核 - 訓練活動紀錄簽到表（表號 5-6-1）', '{"title":"{company_name} 訓練/活動紀錄（簽到）表","subtitle":"4FM-TR001-5-6-1","sections":[{"id":"header","title":"課程資訊","fields":[{"id":"course_name","label":"訓練課程名稱","type":"text","required":true,"auto_populate":"course.title","columns":2},{"id":"training_period","label":"訓練期間","type":"text","required":true,"auto_populate":"course.start_date","columns":2},{"id":"venue","label":"訓練地點","type":"text","required":true,"auto_populate":"course.venue","columns":2},{"id":"total_hours","label":"訓練總時數","type":"text","required":true,"auto_populate":"course.hours","columns":2},{"id":"instructor","label":"講師姓名","type":"text","required":true,"auto_populate":"course.trainer","columns":2},{"id":"student_count_male","label":"男性人數","type":"number","columns":1},{"id":"student_count_female","label":"女性人數","type":"number","columns":1}]},{"id":"attendance","title":"簽到名單","description":"簽名表示出席（請勿簽英文或蓋章，並請保持字跡端正），打\u2717表示缺席","fields":[{"id":"attendees","label":"學員列表","type":"repeating_group","required":true,"fields":[{"id":"department","label":"部門/單位","type":"text","required":true},{"id":"name","label":"姓名","type":"text","required":true},{"id":"gender","label":"性別","type":"radio","required":true,"options":[{"label":"男","value":"male"},{"label":"女","value":"female"}]},{"id":"session1_signed","label":"上午簽到","type":"checkbox","options":[{"label":"已簽到","value":"signed"}]},{"id":"session2_signed","label":"下午簽到","type":"checkbox","options":[{"label":"已簽到","value":"signed"}]},{"id":"notes","label":"備註","type":"text"}],"min_rows":1,"max_rows":50}]}]}'::jsonb);

insert into pddro_form_field_schemas (standard_name, description, field_schema) values
('隨堂人員工作日誌表', 'R 查核 - 隨堂人員工作日誌表（表號 5-6-2）', '{"title":"{company_name} 隨堂人員工作日誌表","subtitle":"4FM-TR001-5-6-2","sections":[{"id":"info","title":"課程資訊","fields":[{"id":"course_name","label":"課程名稱","type":"text","required":true,"auto_populate":"course.title","columns":2},{"id":"course_date","label":"課程日期","type":"date","required":true,"auto_populate":"course.start_date","columns":1},{"id":"course_time","label":"課程時間","type":"text","required":true,"placeholder":"例：9:00-18:00 共8小時","columns":1},{"id":"instructor","label":"授課講師","type":"text","required":true,"auto_populate":"course.trainer","columns":1},{"id":"venue","label":"上課地點","type":"text","required":true,"auto_populate":"course.venue","columns":1},{"id":"expected_count","label":"應到人數","type":"number","required":true,"columns":1},{"id":"actual_count","label":"實到人數","type":"number","required":true,"columns":1}]},{"id":"checklist","title":"課程實施情形","fields":[{"id":"sign_sheet_ok","label":"簽到單（工整、中文）","type":"radio","required":true,"options":[{"label":"確認","value":"confirmed"},{"label":"待處理","value":"pending"},{"label":"待追蹤","value":"tracking"}]},{"id":"equipment_ok","label":"軟硬體設備正常（麥克風、白板筆、投影設備等）","type":"radio","required":true,"options":[{"label":"確認","value":"confirmed"},{"label":"待處理","value":"pending"},{"label":"待追蹤","value":"tracking"}]},{"id":"meals_ok","label":"訂便當（是否要素食）","type":"radio","options":[{"label":"確認","value":"confirmed"},{"label":"待處理","value":"pending"},{"label":"不適用","value":"na"}]},{"id":"photos_ok","label":"拍照","type":"radio","required":true,"options":[{"label":"確認（10張以上）","value":"confirmed"},{"label":"待處理","value":"pending"},{"label":"待追蹤","value":"tracking"}]},{"id":"instructor_fee_ok","label":"講師酬勞及收據","type":"radio","options":[{"label":"確認","value":"confirmed"},{"label":"待處理","value":"pending"},{"label":"待追蹤","value":"tracking"}]},{"id":"certificates_ok","label":"學員結業證書","type":"radio","options":[{"label":"確認","value":"confirmed"},{"label":"待處理","value":"pending"},{"label":"待追蹤","value":"tracking"}]},{"id":"survey_ok","label":"學員問卷","type":"radio","required":true,"options":[{"label":"確認","value":"confirmed"},{"label":"待處理","value":"pending"},{"label":"待追蹤","value":"tracking"}]},{"id":"feedback","label":"學員/講師回饋","type":"textarea"}]},{"id":"anomaly","title":"異常狀況","fields":[{"id":"has_anomaly","label":"異常狀況","type":"radio","required":true,"options":[{"label":"有","value":"yes"},{"label":"無","value":"no"}]},{"id":"anomaly_description","label":"描述狀況","type":"textarea","condition":{"field_id":"has_anomaly","operator":"eq","value":"yes"}}]},{"id":"instructor_status","title":"講師狀況","fields":[{"id":"instructor_normal","label":"講師整體狀況（是否符合課程大綱）","type":"radio","required":true,"options":[{"label":"正常","value":"normal"},{"label":"異常","value":"abnormal"}]},{"id":"instructor_description","label":"描述狀況","type":"textarea"}]},{"id":"summary","title":"總結","fields":[{"id":"other_tasks","label":"其他交辦事項","type":"textarea"},{"id":"overall_summary","label":"總結","type":"textarea","required":true}]},{"id":"sign","title":"簽核","fields":[{"id":"approval","label":"簽核","type":"signature","signers":["課程工作人員","主管"]}]}]}'::jsonb);

insert into pddro_form_field_schemas (standard_name, description, field_schema) values
('課程執行流程管控表', 'R 查核 - 課程執行流程管控表（表號 5-1-1）', '{"title":"{company_name} 課程執行流程管控表","subtitle":"4FM-TR001-5-1-1","description":"課程前中後檢核清單與流程","sections":[{"id":"info","title":"課程資訊","fields":[{"id":"course_name","label":"課程名稱","type":"text","required":true,"auto_populate":"course.title","columns":2},{"id":"start_date","label":"開課日","type":"date","required":true,"auto_populate":"course.start_date","columns":2}]},{"id":"pre_course","title":"課程前置準備","fields":[{"id":"pre_tasks","label":"課前工作項目","type":"repeating_group","required":true,"fields":[{"id":"task_category","label":"工作項次","type":"text","required":true,"placeholder":"例：講師、部門宣傳、人數統計"},{"id":"task_content","label":"內容","type":"text"},{"id":"due_date","label":"預計完成時間","type":"text","required":true},{"id":"responsible","label":"承辦負責人","type":"text"},{"id":"completed","label":"完成","type":"checkbox","options":[{"label":"已完成","value":"done"}]},{"id":"task_notes","label":"備註","type":"text"}],"min_rows":1,"max_rows":30}]},{"id":"during_course","title":"課程中執行","fields":[{"id":"during_tasks","label":"課中工作項目","type":"repeating_group","fields":[{"id":"task_category","label":"工作項次","type":"text","required":true},{"id":"task_content","label":"內容","type":"text"},{"id":"due_date","label":"預計完成時間","type":"text"},{"id":"responsible","label":"承辦負責人","type":"text"},{"id":"completed","label":"完成","type":"checkbox","options":[{"label":"已完成","value":"done"}]},{"id":"task_notes","label":"備註","type":"text"}],"min_rows":1,"max_rows":10}]},{"id":"post_course","title":"課程後整理","fields":[{"id":"post_tasks","label":"課後工作項目","type":"repeating_group","fields":[{"id":"task_category","label":"工作項次","type":"text","required":true},{"id":"task_content","label":"內容","type":"text"},{"id":"due_date","label":"預計完成時間","type":"text"},{"id":"responsible","label":"承辦負責人","type":"text"},{"id":"completed","label":"完成","type":"checkbox","options":[{"label":"已完成","value":"done"}]},{"id":"task_notes","label":"備註","type":"text"}],"min_rows":1,"max_rows":10}]},{"id":"sign","title":"簽核","fields":[{"id":"approval","label":"簽核","type":"signature","signers":["主管"]}]}]}'::jsonb);

insert into pddro_form_field_schemas (standard_name, description, field_schema) values
('教育訓練結案報告', 'R 查核 - 教育訓練結案報告（表號 5-7-1）', '{"title":"{company_name} 教育訓練結案報告","subtitle":"4FM-TR001-5-7-1","sections":[{"id":"info","title":"課程基本資訊","fields":[{"id":"training_name","label":"訓練名稱","type":"text","required":true,"auto_populate":"course.title","columns":2},{"id":"training_date","label":"訓練日期","type":"date","required":true,"auto_populate":"course.start_date","columns":1},{"id":"instructor","label":"講師姓名","type":"text","required":true,"auto_populate":"course.trainer","columns":1},{"id":"target_audience","label":"訓練對象","type":"text","required":true,"auto_populate":"course.target","columns":1},{"id":"student_count","label":"學員人數","type":"number","required":true,"columns":1},{"id":"venue","label":"訓練地點","type":"text","required":true,"auto_populate":"course.venue","columns":2}]},{"id":"content","title":"訓練內容","fields":[{"id":"objectives","label":"訓練目標","type":"repeating_group","required":true,"fields":[{"id":"objective","label":"目標","type":"text","required":true}],"min_rows":1,"max_rows":10},{"id":"outline","label":"訓練大綱","type":"repeating_group","required":true,"fields":[{"id":"item","label":"大綱項目","type":"text","required":true}],"min_rows":1,"max_rows":10},{"id":"training_methods","label":"訓練進行方式","type":"checkbox","required":true,"options":[{"label":"演講","value":"lecture"},{"label":"小組討論","value":"group_discussion"},{"label":"教學影片","value":"video"},{"label":"案例研討","value":"case_study"},{"label":"角色扮演","value":"role_play"},{"label":"活動","value":"activity"},{"label":"其他","value":"other"}]},{"id":"methods_other","label":"其他方式","type":"text","condition":{"field_id":"training_methods","operator":"in","value":"other"}}]},{"id":"evaluation","title":"訓練成果評估方式","fields":[{"id":"l1_content","label":"L1 反應評估","type":"text","required":true,"placeholder":"例：課程滿意度調查表綜合分數達90分"},{"id":"l2_content","label":"L2 學習評估","type":"text","placeholder":"例：學習成效評估"},{"id":"l3_content","label":"L3 行為評估","type":"text","placeholder":"例：課後一個月主管進行考評"},{"id":"l4_content","label":"L4 成果評估","type":"text"}]},{"id":"followup","title":"後續追蹤","fields":[{"id":"action_plan","label":"課後行動計畫","type":"textarea"},{"id":"instructor_feedback","label":"講師回饋","type":"textarea"},{"id":"anomaly_handling","label":"異常狀況處理","type":"textarea"},{"id":"recommendations","label":"整體現況與建議","type":"textarea","required":true}]},{"id":"sign","title":"簽核","fields":[{"id":"approval","label":"簽核","type":"signature","signers":["承辦人員","主管","總經理"]}]}]}'::jsonb);

-- O Phase
insert into pddro_form_field_schemas (standard_name, description, field_schema) values
('滿意度調查', 'O 成果 - 滿意度調查（自動連動既有 survey 系統）', '{"title":"{company_name} 參訓學員意見調查表","sections":[{"id":"info","fields":[{"id":"auto_link_note","label":"此表單自動連動課程滿意度調查系統","type":"static_text"}]}]}'::jsonb);

insert into pddro_form_field_schemas (standard_name, description, field_schema) values
('課程成果內容', 'O 成果 - 課程成果內容（上傳類型）', '{"title":"{company_name} 課程成果內容","sections":[{"id":"content","title":"課程成果","fields":[{"id":"summary","label":"成果摘要","type":"textarea","required":true},{"id":"result_files","label":"成果檔案","type":"file_upload","description":"請上傳課程成果相關檔案（照片、報告等）"},{"id":"notes","label":"備註","type":"textarea"}]}]}'::jsonb);

insert into pddro_form_field_schemas (standard_name, description, field_schema) values
('結業證書', 'O 成果 - 結業證書（上傳類型）', '{"title":"{company_name} 結業證書","sections":[{"id":"cert","title":"證書資訊","fields":[{"id":"cert_template","label":"證書範本","type":"file_upload","description":"請上傳結業證書範本或已製作之證書"},{"id":"notes","label":"備註","type":"textarea"}]}]}'::jsonb);

insert into pddro_form_field_schemas (standard_name, description, field_schema) values
('參訓學員訓後動態調查表', 'O 成果 - L3 行為評估訓後動態調查', '{"title":"{company_name} 參訓學員訓後動態調查表","sections":[{"id":"info","title":"課程資訊","fields":[{"id":"course_name","label":"課程名稱","type":"text","required":true,"auto_populate":"course.title"},{"id":"training_date","label":"訓練日期","type":"date","required":true,"auto_populate":"course.start_date"},{"id":"survey_date","label":"調查日期","type":"date","required":true,"description":"建議於課後1-3個月進行"},{"id":"instructor","label":"講師","type":"text","auto_populate":"course.trainer"}]},{"id":"behavior","title":"行為改變評估","fields":[{"id":"apply_frequency","label":"您將課程中學到的知識/技能應用於工作的頻率","type":"radio","required":true,"options":[{"label":"經常應用","value":"5"},{"label":"時常應用","value":"4"},{"label":"偶爾應用","value":"3"},{"label":"很少應用","value":"2"},{"label":"完全沒有","value":"1"}]},{"id":"behavior_change","label":"參加訓練後，您在工作行為上有哪些具體改變？","type":"textarea","required":true},{"id":"performance_impact","label":"訓練對您的工作績效有何影響？","type":"textarea","required":true},{"id":"obstacles","label":"應用所學時遇到的困難或障礙","type":"textarea"},{"id":"supervisor_support","label":"主管是否支持您應用所學？","type":"radio","options":[{"label":"非常支持","value":"5"},{"label":"支持","value":"4"},{"label":"普通","value":"3"},{"label":"不太支持","value":"2"},{"label":"完全不支持","value":"1"}]},{"id":"additional_training","label":"是否需要後續進階訓練？","type":"radio","options":[{"label":"是","value":"yes"},{"label":"否","value":"no"}]},{"id":"additional_training_needs","label":"進階訓練需求說明","type":"textarea","condition":{"field_id":"additional_training","operator":"eq","value":"yes"}},{"id":"suggestions","label":"其他建議","type":"textarea"}]}]}'::jsonb);
