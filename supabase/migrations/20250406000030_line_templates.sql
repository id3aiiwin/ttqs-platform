-- LINE 訊息模板
create table if not exists line_message_templates (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('instructor', 'student', 'client')),
  name text not null,
  content text not null,
  description text,
  variables text[] default '{}',
  is_default boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_line_templates_category on line_message_templates(category);

-- LINE 發送紀錄
create table if not exists line_send_logs (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references line_message_templates(id),
  category text not null,
  recipient_type text not null,
  recipient_name text,
  recipient_count integer default 0,
  failed_count integer default 0,
  message_content text not null,
  context_type text,
  context_id text,
  sent_by uuid references auth.users(id),
  sent_by_name text,
  created_at timestamptz default now()
);

create index if not exists idx_line_send_logs_created on line_send_logs(created_at desc);

-- RLS
alter table line_message_templates enable row level security;
alter table line_send_logs enable row level security;

create policy "Consultants manage templates" on line_message_templates for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('consultant', 'admin'))
);
create policy "Consultants view send logs" on line_send_logs for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('consultant', 'admin'))
);

-- Seed default templates
insert into line_message_templates (category, name, content, description, variables, is_default) values
-- 講師模板
('instructor', '教材繳交提醒', '📎 教材繳交提醒

{{講師姓名}}老師您好，

課程「{{課程名稱}}」預計 {{開課日期}} 開課，請於開課前一個月繳交簡報教案，以便相關作業。

謝謝！', '提醒講師繳交教材', '{講師姓名,課程名稱,開課日期}', true),

('instructor', '授課日誌提醒', '📝 授課日誌提醒

{{講師姓名}}老師您好，

課程「{{課程名稱}}」已結束，請於 2 天內繳交授課日誌。

謝謝！', '提醒講師繳交授課日誌', '{講師姓名,課程名稱}', true),

('instructor', '問卷通知', '📋 課後問卷通知

{{講師姓名}}老師您好，

課程「{{課程名稱}}」（{{開課日期}}）的課後問卷連結如下，請於課程結束前提醒學員填寫：

問卷連結：{{問卷連結}}

學員掃描 QR Code 或點擊連結即可填寫，無需登入。

謝謝！', '附帶問卷連結通知講師', '{講師姓名,課程名稱,開課日期,問卷連結}', true),

('instructor', '排課通知', '📅 排課通知

{{講師姓名}}老師您好，

您已被安排以下課程：
課程：{{課程名稱}}
日期：{{開課日期}}
時數：{{課程時數}} 小時
企業：{{企業名稱}}

如有問題請回覆，謝謝！', '通知講師新的排課', '{講師姓名,課程名稱,開課日期,課程時數,企業名稱}', true),

-- 學員模板
('student', '上課通知', '📚 上課通知

同學您好，

課程：{{課程名稱}}
日期：{{開課日期}}
時數：{{課程時數}} 小時
講師：{{講師姓名}}

請準時出席，謝謝！', '通知學員上課資訊', '{課程名稱,開課日期,課程時數,講師姓名}', true),

('student', '課程異動通知', '⚠️ 課程異動通知

同學您好，

課程「{{課程名稱}}」有以下異動：
{{異動內容}}

如有疑問請聯繫行政人員，謝謝！', '通知學員課程變更', '{課程名稱,異動內容}', true),

('student', '問卷填寫提醒', '📝 問卷填寫提醒

同學您好，

請協助填寫「{{課程名稱}}」的課後問卷，您的回饋對我們非常重要！

問卷連結：{{問卷連結}}

感謝您的參與！', '提醒學員填寫問卷', '{課程名稱,問卷連結}', true),

-- 客戶模板
('client', '開課確認', '📋 開課確認通知

{{聯繫人姓名}}您好，

貴公司「{{企業名稱}}」的以下課程已確認：
課程：{{課程名稱}}
日期：{{開課日期}}
講師：{{講師姓名}}

如需調整請告知，謝謝！', '通知企業確認開課', '{聯繫人姓名,企業名稱,課程名稱,開課日期,講師姓名}', true),

('client', '評量通知', '🧠 皮紋評量通知

{{聯繫人姓名}}您好，

貴公司「{{企業名稱}}」的皮紋評量服務已安排：
日期：{{評量日期}}
人數：{{評量人數}}

請提前通知參加人員，謝謝！', '通知企業評量安排', '{聯繫人姓名,企業名稱,評量日期,評量人數}', true),

('client', '合約到期提醒', '📌 合約到期提醒

{{聯繫人姓名}}您好，

貴公司「{{企業名稱}}」的服務合約將於 {{合約到期日}} 到期。

如需續約或調整服務內容，歡迎聯繫我們討論。

謝謝！', '提醒企業合約到期', '{聯繫人姓名,企業名稱,合約到期日}', true),

('client', '年度計畫溝通', '📊 年度訓練計畫

{{聯繫人姓名}}您好，

{{年度}} 年度的訓練計畫已準備就緒，包含 {{課程數量}} 門課程規劃。

方便的話我們約時間討論細節，謝謝！', '年度計畫溝通', '{聯繫人姓名,企業名稱,年度,課程數量}', true);
