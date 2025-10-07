# Cloud Run 部署檢查清單

## 部署前檢查 ✓

### 1. 本地構建測試

```bash
# 清除舊的構建
rm -rf dist/

# 構建前端
npm install
npm run build

# 確認 dist/index.html 存在
ls -la dist/index.html
```

- [ ] 前端構建成功
- [ ] `dist/index.html` 檔案存在
- [ ] `dist/assets/` 目錄包含 JS 檔案

### 2. 本地伺服器測試

```bash
# 安裝伺服器依賴
cd server
npm install

# 啟動伺服器
PORT=8080 node server.js
```

應該看到以下輸出:
```
=== Starting LXP Mart Server ===
Node version: v22.x.x
...
=== Server Started Successfully ===
Listening on 0.0.0.0:8080
Server is ready to accept connections
```

在另一個終端測試:
```bash
# 測試健康檢查
curl http://localhost:8080/health

# 預期回應
{"status":"ok","distExists":true,"indexExists":true}

# 測試首頁
curl -I http://localhost:8080/
# 應該回應 200 OK
```

- [ ] 伺服器成功啟動
- [ ] `/health` 端點回應正常
- [ ] 首頁可以訪問

### 3. Dockerfile 驗證

確認關鍵配置:
- [ ] 使用多階段構建
- [ ] 構建階段執行 `npm run build`
- [ ] 生產映像包含 `dist/` 和 `server/`
- [ ] 以非 root 使用者執行
- [ ] 暴露 port 8080
- [ ] 包含健康檢查

### 4. GCP 權限確認

```bash
# 確認當前帳號
gcloud config get-value account

# 確認專案
gcloud config get-value project

# 測試是否有部署權限
gcloud run services list --region asia-east1
```

- [ ] 已登入正確的 GCP 帳號
- [ ] 有 Cloud Run 部署權限
- [ ] 專案 ID 正確 (segian-reptile)

## 開始部署

### 方法 1: 使用部署腳本(推薦)

```bash
./deploy.sh
```

腳本會自動:
1. 構建前端
2. 驗證構建產物
3. 部署到 Cloud Run

### 方法 2: 手動部署

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

## 部署中監控

### 觀察 Cloud Build 日誌

部署過程中會看到:
1. 上傳原始碼
2. 構建 Docker 映像
3. 推送映像到 GCR
4. 部署到 Cloud Run

**關鍵檢查點:**
- [ ] `npm run build` 成功
- [ ] 看到 "=== Build completed ==="
- [ ] `dist/index.html` 存在的確認訊息
- [ ] Docker 映像構建成功
- [ ] 新的 revision 建立成功

### 檢查部署狀態

```bash
# 查看服務狀態
gcloud run services describe lxp-tampermonkey-demo \
  --region asia-east1 \
  --project segian-reptile

# 查看最新 revision
gcloud run revisions list \
  --service lxp-tampermonkey-demo \
  --region asia-east1 \
  --limit 5 \
  --project segian-reptile
```

## 部署後驗證

### 1. 健康檢查

```bash
# 取得服務 URL
SERVICE_URL=$(gcloud run services describe lxp-tampermonkey-demo \
  --region asia-east1 \
  --project segian-reptile \
  --format="value(status.url)")

# 測試健康檢查
curl $SERVICE_URL/health

# 預期回應
{"status":"ok","distExists":true,"indexExists":true}
```

- [ ] `/health` 端點回應正常
- [ ] `distExists` 和 `indexExists` 都是 true

### 2. 應用程式測試

```bash
# 在瀏覽器中開啟
echo $SERVICE_URL
```

測試項目:
- [ ] 首頁正常載入
- [ ] 可以看到"商店"和"管理"導航
- [ ] 靜態資源(JS, CSS, 圖示)正常載入
- [ ] 瀏覽器標籤顯示 favicon
- [ ] 可以在管理頁面新增商品
- [ ] 商品資料儲存在 localStorage

### 3. 查看日誌

```bash
# 查看容器日誌
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=lxp-tampermonkey-demo" \
  --limit 50 \
  --project segian-reptile
```

應該看到:
- [ ] "=== Starting LXP Mart Server ==="
- [ ] "=== Server Started Successfully ==="
- [ ] "Server is ready to accept connections"
- [ ] 無錯誤訊息

### 4. 效能驗證

```bash
# 測試回應時間
time curl -s -o /dev/null $SERVICE_URL

# 預期: < 2 秒
```

- [ ] 首次請求 < 3 秒(冷啟動)
- [ ] 後續請求 < 1 秒

## 問題排查

### 如果容器啟動失敗

1. **查看 Cloud Build 日誌**
   - 前往 Cloud Console > Cloud Build
   - 檢查最新的構建
   - 尋找錯誤訊息

2. **檢查容器日誌**
   - 前往 Cloud Console > Cloud Run > 服務詳情 > 日誌
   - 篩選最新的 revision
   - 尋找 "ERROR" 或 "CRITICAL"

3. **常見問題:**
   - `dist/index.html not found` → 前端構建失敗
   - `Cannot find module 'express'` → server/node_modules 未正確複製
   - `EADDRINUSE` → PORT 設定問題
   - `Permission denied` → 檔案權限問題

### 快速修復

```bash
# 強制重新構建
gcloud builds submit --tag gcr.io/segian-reptile/lxp-mart

# 回滾到上一個 revision
gcloud run services update-traffic lxp-tampermonkey-demo \
  --to-revisions PREVIOUS_REVISION=100 \
  --region asia-east1
```

## 部署成功確認

全部檢查完成後:
- [ ] 服務 URL 可以正常訪問
- [ ] 健康檢查端點正常
- [ ] 應用程式功能正常
- [ ] 無錯誤日誌
- [ ] 回應時間合理

**恭喜!部署成功!** 🎉

---

最後更新: 2025-10-07
