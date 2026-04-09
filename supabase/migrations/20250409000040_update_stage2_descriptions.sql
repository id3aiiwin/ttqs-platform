-- 更新七張進階分析表的說明、適用動詞與範例

-- 1. 處理程序分析表
UPDATE competency_form_defaults SET
  options = '{
    "description": "適用動詞：安裝、準備、起動、開關、拆卸、組裝、計算。適用於以特定順序完成一系列步驟的常規性實體操作任務，核心在於釐清程序步驟並明確訂定每個步驟的品質標準與安全須知。",
    "example": "任務：安裝投影機設備\n程序步驟：連接電源線與視訊線\n品質標準／安全須知：確保電源線無破損，插頭完全插入；視訊線防呆接頭方向需正確\n建議：先接視訊線再接電源線較安全",
    "columns": [
      {"key": "step", "label": "程序步驟", "type": "textarea"},
      {"key": "standard", "label": "品質標準／安全須知", "type": "textarea"},
      {"key": "suggestion", "label": "建議", "type": "textarea"}
    ], "repeatable": true, "add_label": "新增步驟"
  }'::jsonb,
  description = '適用於以特定順序完成一系列步驟的常規性實體操作任務'
WHERE form_type = 'job_analysis' AND field_name = 'procedure_analysis';

-- 2. 問題解決分析表
UPDATE competency_form_defaults SET
  options = '{
    "description": "適用動詞：解決、解釋、計算、預測。適用於診斷與排除異常狀況的任務，核心是將既存的「問題狀況」與「可能造成的原因」互相參照，以便整理出標準的解決行動。",
    "example": "任務：解決客戶收件延遲客訴\n問題現況：客戶反映超過三天未收到包裹\n可能造成原因：物流公司轉運延遲；系統漏單未拋轉\n行動方案：透過單號查詢物流即時進度；若為漏單，立即安排急件補寄",
    "columns": [
      {"key": "problem", "label": "問題現況", "type": "textarea"},
      {"key": "cause", "label": "可能造成原因", "type": "textarea"},
      {"key": "action", "label": "行動方案", "type": "textarea"}
    ], "repeatable": true, "add_label": "新增問題"
  }'::jsonb,
  description = '適用於診斷與排除異常狀況的任務'
WHERE form_type = 'job_analysis' AND field_name = 'problem_solving';

-- 3. 決策分析表
UPDATE competency_form_defaults SET
  options = '{
    "description": "適用動詞：決定、選擇、確認、澄清。適用於需要綜合評估多種條件因素再採取行動的任務，採用「如果…而且…然後…」的邏輯推演設計來規範決策標準。",
    "example": "任務：決定供應商採購名單\n如果（大前提）：A廠商報價低於預算10%\n而且（附加條件）：交貨期能配合在兩週內；過去品質良率達98%以上\n然後實施方案：優先將A廠商列為第一採購順位",
    "columns": [
      {"key": "if_condition", "label": "如果（大前提）", "type": "textarea"},
      {"key": "and_condition", "label": "而且（附加條件）", "type": "textarea"},
      {"key": "then_action", "label": "然後實施方案（行動決定）", "type": "textarea"}
    ], "repeatable": true, "add_label": "新增決策情境"
  }'::jsonb,
  description = '適用於綜合評估多種條件因素再採取行動的任務'
WHERE form_type = 'job_analysis' AND field_name = 'decision_analysis';

-- 4. 審查分析表
UPDATE competency_form_defaults SET
  options = '{
    "description": "適用動詞：檢閱、觀察、檢驗、校對、判定。適用於品管或檢驗任務，核心在於將成品或工作流程與「原模型（標準）」進行比對，找出是否吻合，需設定明確的檢驗管制點與判斷合格的準則。",
    "example": "任務：檢驗生產線馬達成品\n檢驗管制點：馬達運轉測試\n管制審查步驟：將馬達接上通電測試儀→啟動電源觀察運轉狀態\n準則／標準：轉速需達3000 RPM誤差±5%；運作音量不得超過60分貝",
    "columns": [
      {"key": "checkpoint", "label": "檢驗管制點", "type": "textarea"},
      {"key": "review_steps", "label": "管制審查步驟", "type": "textarea"},
      {"key": "criteria", "label": "準則／標準", "type": "textarea"}
    ], "repeatable": true, "add_label": "新增檢驗點"
  }'::jsonb,
  description = '適用於品管或檢驗任務，將成品或流程與標準比對'
WHERE form_type = 'job_analysis' AND field_name = 'review_analysis';

-- 5. 調整／修正分析表
UPDATE competency_form_defaults SET
  options = '{
    "description": "適用動詞：調整、修改、改善、改良。適用於改良產品或微調工作流程以符合標準的任務，核心在於指認出需要微調的點並訂定修正後的標準。",
    "example": "任務：修改產品包裝設計\n調整／修正點：減少包裝盒過度浪費之耗材\n修正點步驟：重新測量產品長寬高→將緩衝材由保麗龍替換為環保紙材\n準則／標準：跌落測試達100公分無破損；單件包材成本需降低至少5%",
    "columns": [
      {"key": "adjustment_point", "label": "調整／修正點", "type": "textarea"},
      {"key": "correction_steps", "label": "修正點步驟", "type": "textarea"},
      {"key": "criteria", "label": "準則／標準", "type": "textarea"}
    ], "repeatable": true, "add_label": "新增修正項"
  }'::jsonb,
  description = '適用於改良產品或微調工作流程以符合標準的任務'
WHERE form_type = 'job_analysis' AND field_name = 'adjustment_analysis';

-- 6. 物體分析表
UPDATE competency_form_defaults SET
  options = '{
    "description": "適用動詞：設置、瞭解。適用於必須操作特定實體工具、設備或軟體系統的任務，核心是將該物體拆解，明確標示各部件名稱、位置場所及其操作目的。",
    "example": "任務：操作POS收銀機台\n物體部分名稱：條碼掃描器\n位置／場所：機台右側連接埠\n目的：讀取商品條碼以帶入系統價格",
    "columns": [
      {"key": "part_name", "label": "物體部分名稱", "type": "text"},
      {"key": "location", "label": "位置／場所", "type": "text"},
      {"key": "purpose", "label": "目的", "type": "textarea"}
    ], "repeatable": true, "add_label": "新增部件"
  }'::jsonb,
  description = '適用於操作特定實體工具、設備或軟體系統的任務'
WHERE form_type = 'job_analysis' AND field_name = 'object_analysis';

-- 7. 概念分析表
UPDATE competency_form_defaults SET
  options = '{
    "description": "適用動詞：理解、瞭解、定義、界定。適用於企劃或理解抽象事物的認知型任務，能夠清楚辨認各層級的想法、行動與事物，並透過列舉特徵與範例來輔助員工理解標準。",
    "example": "任務：界定「優質的客訴應對」\n重要特性：在24小時內給予初步回覆；語氣保持同理心且不爭辯\n變異特性：補償方案的額度（依嚴重度變動）\n範例：「很抱歉讓您有不好的體驗，我們已為您安排補寄…」\n非範例：「這不是我們的問題，請你自己去找物流…」",
    "columns": [
      {"key": "important_traits", "label": "重要特性", "type": "textarea"},
      {"key": "variable_traits", "label": "變異特性", "type": "textarea"},
      {"key": "example", "label": "範例", "type": "textarea"},
      {"key": "non_example", "label": "非範例", "type": "textarea"}
    ], "repeatable": true, "add_label": "新增概念"
  }'::jsonb,
  description = '適用於企劃或理解抽象事物的認知型任務'
WHERE form_type = 'job_analysis' AND field_name = 'concept_analysis';

-- 同步更新已建立的企業模板
UPDATE competency_form_templates t
SET options = d.options, display_name = d.standard_name
FROM competency_form_defaults d
WHERE t.form_type = d.form_type
  AND t.field_name = d.field_name
  AND d.form_type = 'job_analysis'
  AND d.sort_order >= 10;
