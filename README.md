# 🎓 Lilai Ireland 學生進度追蹤系統 (Student Progress Tracker)

> **專為留遊學代辦機構打造的現代化進度追蹤 Web App**，透過將傳統的代辦流程數位化與視覺化，大幅降低人工客服成本，並提升學生的使用者體驗與信任感。

## 💡 專案背景與商業價值 (Business Value)

傳統留遊學代辦產業高度依賴人工客服，學生在報名後常因不清楚後續步驟而感到焦慮，且常遺漏關鍵文件的繳交與學費繳納期限。

本系統旨在解決以下商業痛點：
* **流程透明化**：將繁雜的準備步驟（如：學校申請、簽證、住宿、機票）轉化為視覺化的全局進度條。
* **降低客服成本**：透過前端互動介面與自動化提示，減少重複性的 QA 詢問。
* **精準分眾邏輯**：系統根據學生購買的方案（如：打工度假 vs. 25+8 語言學校），動態渲染對應的任務清單與文件要求。

## 🏗️ 系統架構 (System Architecture)

本專案採用 **前後端分離 (Decoupled Architecture)** 概念，最大化利用既有的 WordPress 基礎設施，並以 React 打造流暢的單頁應用程式 (SPA)。

* **Backend (Headless CMS 概念)**：
  * 使用 WordPress 作為核心資料庫與 API 伺服器。
  * 透過 **Custom Post Type UI (CPT UI)** 與 **Advanced Custom Fields (ACF)** 進行資料建模 (Data Modeling)。
  * 開放 WP REST API 提供前端資料操作端點。
* **Frontend (React SPA)**：
  * 使用 **Vite** 構建的 React 應用程式。
  * 負責狀態管理、API 串接 (Axios)、以及動態介面渲染。
* **Integration (外掛整合)**：
  * 撰寫客製化 PHP 短代碼 (Shortcode) 外掛，將打包後的 React 靜態檔案安全地嵌入 WordPress 既有頁面中，並處理跨網域與登入權限問題。

## 🛠️ 技術棧 (Tech Stack)

* **Frontend**: React.js, Vite, Axios, CSS/Tailwind (視實際使用的樣式庫而定)
* **Backend**: PHP, WordPress REST API, MySQL
* **Tools**: CPT UI, ACF, Git

## 🚀 核心功能 (Core Features)

- [x] **API 資料對接**：成功建置 WordPress REST API 端點，並與前端 React 完成 JSON 資料串接。
- [ ] **全局進度追蹤**：視覺化呈現學生當前階段（報名 -> 申請 -> 繳費 -> 行前準備）。
- [ ] **條件邏輯渲染 (Conditional Rendering)**：根據方案類型動態顯示不同的任務清單與文件上傳需求。
- [ ] **顧問後台管理**：顧問可於 WordPress 後台一覽學生進度，並進行文件審核與狀態更新。
- [ ] **自動化提醒機制**：基於繳費死線與抵達日期的倒數計時與狀態警告。

## 📂 專案目錄結構 (Folder Structure)

本倉庫採用 Monorepo 結構管理前端應用與後端外掛：

```text
lilai-student-tracker/
├── react-app/          # Vite + React 前端專案原始碼
│   ├── src/            # React 組件與邏輯
│   └── package.json    # 前端依賴配置
├── wp-plugin/          # WordPress 客製化 PHP 外掛
│   └── student-tracker.php # 負責註冊短代碼與載入 React 打包檔案
└── README.md