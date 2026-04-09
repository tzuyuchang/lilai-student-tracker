# 🎓 Lilai Ireland - 留遊學代辦進度追蹤與 CRM 系統 (Student Tracker & CRM)

> **專為留遊學代辦機構打造的現代化 Headless Web App**。
> 本系統將傳統破碎的代辦流程（Google 表單、人工對帳、Email 往返）整合為一站式的自動化平台。不僅為學生提供視覺化的進度追蹤，更為顧問團隊打造強大的後台 CRM 與財務計算系統。

---

## 💡 商業價值與痛點解決 (Business Value)

傳統留遊學代辦產業面臨「資料孤島 (Data Silos)」與「高度依賴人工客服」的痛點。本系統透過數位轉型解決以下問題：

1. **消滅資料孤島 (Form Integration)**：徹底淘汰外部 Google 表單，透過 React 動態表單直接將報名資料寫入自有資料庫。
2. **自動化財務與利潤計算 (Financial Automation)**：系統自動根據學生選擇的語言學校，動態計算「應繳學費總額」與「公司預估佣金 (Commission)」，免除人工按計算機的失誤。
3. **流程透明化 (Visual Tracker)**：將繁雜的準備步驟轉化為全局進度條，大幅降低學生焦慮與客服詢問率。
4. **精準分眾邏輯 (Conditional Rendering)**：根據方案類型（打工度假 vs. 25+8 語校）與所選學校，動態渲染對應的任務清單與文件要求。

---

## 🏗️ 系統架構 (System Architecture)

本專案採用 **前後端分離 (Decoupled / Headless Architecture)** 概念，最大化利用既有的 WordPress 基礎設施，並以 React 打造極致流暢的單頁應用程式 (SPA)。

* **Backend (Headless CMS)**：
  * 使用 WordPress 作為核心關聯式資料庫與 API 伺服器。
  * 透過 **CPT UI** 與 **ACF (Advanced Custom Fields)** 進行資料建模，並完美封裝 REST API。
* **Frontend (React SPA)**：
  * 使用 **Vite** 構建的 React 應用程式，負責狀態管理、API 串接 (Axios)、以及動態介面渲染。
* **Integration (外掛整合橋樑)**：
  * 撰寫客製化 PHP 短代碼 (Shortcode) 外掛，將打包後的 React 靜態檔案安全地嵌入 WordPress 既有頁面中。

---

## 🗄️ 核心資料庫設計 (Database Schema)

系統底層採用關聯式設計 (Relational Design)，主要分為兩個核心 Entity：

1. **`schools` (語言學校資料庫)**
   * `base_tuition_fee`: 基礎學費
   * `registration_fee`: 註冊費
   * `commission_percentage`: 佣金抽成比例 (%)
   * `form_fields_required`: 報名必備特殊動態欄位

2. **`student_plan` (學生方案資料庫)**
   * `selected_school`: 關聯至 `schools` (Foreign Key 概念)
   * **財務模組**: `estimated_commission` (預估利潤), `tuition_due_date` (繳費死線)
   * **進度模組**: `current_stage` (當前階段)
   * **文件模組**: `passport_file`, `tuition_receipt_file` 等 (透過 File URL 與 WP 媒體庫連動)

---

## 🚀 開發進度與任務清單 (Roadmap)

### Phase 1: 基礎架構與資料建模 (Backend Schema) ✅
- [x] 建置 WordPress REST API 端點。
- [x] 建立 `student_plan` 與 `schools` 關聯式資料庫。
- [x] 完成 ACF 欄位配置與 REST API 格式化 (`acf_format=standard`)。
- [x] 前端 Vite + React 環境初始化，完成 Axios API 測試抓取。

### Phase 2: 動態報名表與 CRM 整合 (Frontend Forms) 🏃‍♂️ *[目前階段]*
- [ ] **動態選校系統**：前端 Fetch 學校清單，渲染下拉選單與卡片。
- [ ] **即時費用試算**：根據所選學校，前端即時 State 試算總學費與佣金。
- [ ] **資料寫入 (POST)**：將 React 報名表單資料打包，透過 REST API 寫入 WordPress 資料庫。

### Phase 3: 學生儀表板與進度追蹤 (Student Dashboard)
- [ ] **全局進度條**：視覺化呈現報名 -> 申請 -> 繳費 -> 行前準備。
- [ ] **檔案上傳組件**：前端實作護照/機票上傳，對接 WP Media API。
- [ ] **條件邏輯渲染**：依照方案動態開關任務清單 (Checkbox)。

### Phase 4: 自動化與進階功能 (Automation)
- [ ] **JWT 身份驗證**：實作安全的跨網域登入機制。
- [ ] **WP Cron 排程**：基於繳費死線與抵達日期的 Email 倒數提醒。

---

## 📂 專案目錄結構 (Monorepo Structure)

```text
lilai-student-tracker/
├── react-app/          # Vite + React 前端專案原始碼
│   ├── src/            # React 組件、Hooks、API Services
│   └── package.json    # 前端依賴配置
├── wp-plugin/          # WordPress 客製化 PHP 外掛
│   └── student-tracker.php # 註冊短代碼與掛載 React App
├── README.md           # 專案說明文件
└── .gitignore