# LXP Mart 電商管理平台

## 專案概述

LXP Mart 是一個基於 React 的電商管理平台,提供商店展示頁面和後台管理介面,支援商品的新增、編輯、刪除與展示功能。

## 技術架構

### 前端技術棧

- **框架與工具**
  - React 19.2.0 - 使用者介面框架
  - TypeScript 5.8.2 - 類型安全的 JavaScript
  - Vite 6.2.0 - 快速的前端構建工具
  - React Router DOM 6.23.1 - 單頁應用路由管理

- **UI 與樣式**
  - @heroicons/react 2.2.0 - 圖標庫
  - Tailwind CSS (通過 Vite 配置) - 原子化 CSS 框架

### 後端技術棧

- **伺服器**
  - Node.js 22 - JavaScript 執行環境
  - Express 4.18.2 - Web 應用框架
  - 靜態檔案服務 - 提供前端打包後的靜態資源

### 資料儲存

- **LocalStorage** - 瀏覽器本地儲存
  - 所有商品資料儲存在客戶端瀏覽器
  - 圖片以 base64 編碼儲存
  - 無後端資料庫

### 架構模式

- **狀態管理**: React Context API (ProductContext)
- **自訂 Hook**: useProducts - 封裝商品 CRUD 邏輯
- **路由架構**: 雙頁面設計 (商店頁面 + 管理頁面)
- **組件設計**: 功能型組件 + TypeScript 介面

## 部署方式

### 本地開發環境

1. **安裝相依套件**

   ```bash
   npm install
   ```

2. **啟動開發伺服器**

   ```bash
   npm run dev
   ```

   應用程式將在 <http://localhost:3000> 執行

### 生產環境部署

#### 方法一：傳統部署

1. **建置前端**

   ```bash
   npm install
   npm run build
   ```

2. **安裝伺服器相依套件**

   ```bash
   cd server
   npm install
   ```

3. **啟動伺服器**

   ```bash
   cd server
   node server.js
   ```

   預設執行於 port 8080

#### 方法二：Docker 容器化部署

專案包含 Dockerfile,採用多階段構建優化映像大小。

1. **建置 Docker 映像**

   ```bash
   docker build -t lxp-mart:latest .
   ```

2. **執行容器**

   ```bash
   docker run -p 8080:8080 lxp-mart:latest
   ```

3. **Docker 構建流程說明**

   **Stage 1 (Builder)**:

   - 使用 `node:22` 作為基礎映像
   - 複製專案檔案
   - 安裝伺服器相依套件 (`/app/server`)
   - 安裝前端相依套件並執行建置 (`/app`)
   - 產生 `/app/dist` 目錄包含靜態檔案

   **Stage 2 (Production)**:

   - 使用 `node:22-slim` 輕量化映像
   - 僅複製必要的建置產物 (`dist/`) 和伺服器檔案 (`server/`)
   - 暴露 port 8080
   - 啟動 Express 伺服器

### Cloud Run 部署

#### 方法 1: 使用 Cloud Build 配置(CI/CD)

專案包含 `cloudbuild.yaml` 配置檔,整合 Cloud Build 觸發器:

```bash
# 手動觸發 Cloud Build
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=segian-reptile \
  --region=asia-east1
```

**注意**: 如果您之前使用 Buildpacks 部署失敗,請參考 [QUICK_FIX.md](./QUICK_FIX.md)

#### 方法 2: 使用部署腳本

```bash
./deploy.sh
```

#### 方法 3: 手動部署

```bash
gcloud run deploy lxp-tampermonkey-demo \
  --source . \
  --region asia-east1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --timeout 300 \
  --memory 512Mi \
  --cpu 1 \
  --startup-cpu-boost \
  --project segian-reptile
```

### 部署故障排除

**常見問題:**

1. **容器啟動失敗**
   - 檢查 Cloud Build 日誌確認前端構建成功
   - 確認 `dist/index.html` 已生成
   - 查看 Cloud Run 日誌尋找錯誤訊息

2. **健康檢查失敗**
   - 容器已配置 `/health` 端點
   - 確認 PORT 環境變數設定為 8080
   - 檢查容器是否正確監聽 `0.0.0.0:8080`

3. **本地測試**

   ```bash
   # 完整測試流程
   npm run build
   cd server && npm install
   PORT=8080 node server.js
   # 在另一個終端測試
   curl http://localhost:8080/health
   ```

**改進項目:**
- ✅ 增強的錯誤日誌記錄
- ✅ 多路徑 dist 目錄檢測
- ✅ `/health` 和 `/ready` 健康檢查端點
- ✅ 優雅關閉處理 (SIGTERM/SIGINT)
- ✅ Docker 健康檢查配置
- ✅ 啟動探針配置 (service.yaml)

詳細的故障排除指南請參考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 資安風險評估

### 高風險項目

#### 1. **無身份驗證機制**
- **風險描述**: 管理頁面無任何身份驗證,任何人皆可訪問並修改商品資料
- **影響範圍**: 未授權用戶可新增、修改、刪除商品資訊
- **建議措施**:
  - 實作使用者登入系統 (JWT、Session、OAuth)
  - 加入 RBAC (角色權限控制)
  - 管理介面應受保護路由守衛

#### 2. **客戶端資料儲存不安全**
- **風險描述**: 所有資料儲存於 localStorage,易被竄改或清除
- **影響範圍**:
  - 資料完整性無法保證
  - 用戶可透過瀏覽器開發工具直接修改商品價格、庫存等資訊
  - 資料無備份機制,清除瀏覽器資料即遺失所有商品
- **建議措施**:
  - 建立後端資料庫 (PostgreSQL、MongoDB 等)
  - 實作伺服器端資料驗證
  - 定期備份機制

### 中風險項目

#### 3. **缺乏輸入驗證與清理**
- **風險描述**: 商品表單輸入未經嚴格驗證,可能包含惡意腳本或無效資料
- **影響範圍**:
  - XSS (跨站腳本攻擊) 風險
  - 資料品質問題
- **建議措施**:
  - 實作前端與後端雙重驗證
  - 使用 DOMPurify 清理 HTML 內容
  - 限制上傳檔案類型與大小

#### 4. **圖片儲存 base64 安全性問題**
- **風險描述**:
  - Base64 編碼圖片儲存於 localStorage 佔用大量空間
  - 可能包含惡意內容或過大檔案導致瀏覽器當機
- **影響範圍**:
  - 儲存空間耗盡 (localStorage 上限約 5-10MB)
  - 效能問題
- **建議措施**:
  - 實作圖片上傳至雲端儲存 (AWS S3、Cloudinary)
  - 檔案類型驗證 (MIME type checking)
  - 檔案大小限制 (建議 < 5MB)
  - 圖片壓縮處理

#### 5. **CORS 設定缺失**
- **風險描述**: Express 伺服器未明確設定 CORS 政策
- **影響範圍**: 可能允許任意來源的請求
- **建議措施**:
  - 使用 `cors` middleware 限制允許的來源
  - 設定適當的 HTTP 標頭 (CSP, X-Frame-Options)

### 低風險項目

#### 6. **缺乏 HTTPS**
- **風險描述**: 伺服器監聽於 HTTP,資料傳輸未加密
- **影響範圍**: 中間人攻擊 (MITM) 風險
- **建議措施**:
  - 使用反向代理 (Nginx) 配置 SSL/TLS
  - Let's Encrypt 免費憑證
  - 強制 HTTPS 重定向

#### 7. **錯誤處理資訊洩漏**
- **風險描述**: 伺服器錯誤可能暴露系統資訊
- **影響範圍**: 攻擊者可獲取技術堆疊細節
- **建議措施**:
  - 統一錯誤處理中介軟體
  - 生產環境隱藏詳細錯誤訊息
  - 實作日誌記錄系統

#### 8. **缺乏速率限制**
- **風險描述**: API 端點無請求頻率限制
- **影響範圍**: DDoS 攻擊或 API 濫用
- **建議措施**:
  - 使用 `express-rate-limit` 中介軟體
  - 實作 IP 封鎖機制

#### 9. **Docker 映像安全性**
- **風險描述**:
  - 使用 `node:22` 而非固定版本標籤
  - 容器以 root 使用者執行
- **影響範圍**:
  - 映像版本不一致性
  - 容器逃逸風險較高
- **建議措施**:
  - 使用具體版本標籤 (如 `node:22.1.0-slim`)
  - 建立非 root 使用者執行應用程式
  - 定期掃描映像漏洞 (Trivy, Snyk)

## 安全加固建議優先級

### 立即處理 (P0)

1. 實作管理介面身份驗證
2. 建立後端資料庫取代 localStorage
3. 實作輸入驗證與清理

### 短期處理 (P1)

4. 圖片上傳雲端儲存方案
5. 設定 CORS 與安全標頭
6. 部署 HTTPS

### 中期處理 (P2)

7. 實作速率限制
8. 完善錯誤處理與日誌系統
9. Docker 安全性加固

### 長期優化 (P3)

10. 實作 CI/CD 安全掃描
11. 建立安全監控與告警機制
12. 定期安全稽核與滲透測試

## 聯絡資訊

如有技術問題或安全疑慮,請聯繫開發團隊。

---

**最後更新**: 2025-10-07
**文件版本**: 1.0
