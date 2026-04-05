-- 移除 courses 表的 pddro_phase 欄位
-- 每門課程都包含完整的 PDDRO 五構面，不需要在課程層級指定

alter table courses drop column pddro_phase;
drop index if exists idx_courses_pddro_phase;
