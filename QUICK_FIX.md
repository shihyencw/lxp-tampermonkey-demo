# 🚀 快速修復 Cloud Run 部署失敗

## 問題根因

您的部署使用 **Buildpacks** 而不是我們優化過的 **Dockerfile**,導致:
- ❌ 前端構建可能失敗或不完整
- ❌ `server/` 目錄結構可能被忽略
- ❌ 健康檢查配置缺失
- ❌ 容器啟動超時

## 立即解決方案

### 選項 1: 手動觸發使用新 cloudbuild.yaml (推薦)

```bash
# 1. 切換到專案目錄
cd /path/to/lxp-mart-電商管理平台

# 2. 確認新的 cloudbuild.yaml 存在
ls -l cloudbuild.yaml

# 3. 手動觸發構建(使用新配置)
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=segian-reptile \
  --region=asia-east1
```

這個命令會:
1. ✅ 使用我們的 Dockerfile 構建映像
2. ✅ 正確處理前端和後端
3. ✅ 包含健康檢查配置
4. ✅ 設定正確的環境變數

### 選項 2: 使用簡化部署腳本

```bash
# 執行自動部署腳本
./deploy.sh
```

這會自動執行:
- 前端構建驗證
- Cloud Run 部署
- 設定所有必要參數

### 選項 3: 直接使用 gcloud run deploy

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
  --set-env-vars "PORT=8080" \
  --project segian-reptile
```

## 更新 Cloud Build 觸發器(長期解決方案)

### 步驟 1: 提交新配置到 Git

```bash
# 確保新的 cloudbuild.yaml 已在專案根目錄
git add cloudbuild.yaml

# 提交
git commit -m "更新 Cloud Build 配置使用 Dockerfile"

# 推送到 remote
git push origin main
```

### 步驟 2: 驗證觸發器配置

前往 Cloud Console:
1. 開啟 [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers?project=segian-reptile)
2. 找到觸發器 "lxp-tampermonkey-demo"
3. 確認 "Configuration" 指向 `cloudbuild.yaml`
4. 點擊 "Run" 測試新配置

## 部署監控

### 查看構建進度

```bash
# 列出最近的構建
gcloud builds list --limit 5 --project segian-reptile

# 查看特定構建日誌
gcloud builds log <BUILD_ID> --project segian-reptile
```

### 查看 Cloud Run 服務狀態

```bash
# 服務詳情
gcloud run services describe lxp-tampermonkey-demo \
  --region asia-east1 \
  --project segian-reptile

# 最新的 revisions
gcloud run revisions list \
  --service lxp-tampermonkey-demo \
  --region asia-east1 \
  --limit 5 \
  --project segian-reptile
```

## 成功指標

部署成功後,您應該看到:

### 1. Cloud Build 輸出

```
✓ Step 1 - Build Docker Image: SUCCESS (5-8 分鐘)
✓ Step 2 - Push Image: SUCCESS (1-2 分鐘)
✓ Step 3 - Deploy: SUCCESS (1-2 分鐘)
```

### 2. Cloud Run 日誌

```
=== Starting LXP Mart Server ===
Node version: v22.x.x
Selected dist path: /app/dist
Dist exists: true
Index exists: true
=== Server Started Successfully ===
Listening on 0.0.0.0:8080
Server is ready to accept connections
```

### 3. 健康檢查通過

```bash
# 獲取服務 URL
SERVICE_URL=$(gcloud run services describe lxp-tampermonkey-demo \
  --region asia-east1 \
  --project segian-reptile \
  --format="value(status.url)")

# 測試健康檢查
curl $SERVICE_URL/health

# 預期輸出:
{"status":"ok","distExists":true,"indexExists":true}
```

## 常見錯誤及解決

### 錯誤 1: "Container failed to start"

**原因**: Buildpacks 構建的映像無法正確啟動

**解決**: 使用新的 `cloudbuild.yaml`(選項 1)

### 錯誤 2: "dist/index.html not found"

**原因**: 前端構建在 Buildpacks 中失敗

**解決**: Dockerfile 明確執行 `npm run build`

### 錯誤 3: "Cannot find module 'express'"

**原因**: server/node_modules 未正確安裝

**解決**: Dockerfile 確保安裝 server 依賴

### 錯誤 4: "Health check timeout"

**原因**: 容器啟動太慢或健康檢查配置錯誤

**解決**: 新配置包含 `/health` 端點和增加超時

## 關鍵差異對比

| 項目 | 舊方式 (Buildpacks) | 新方式 (Dockerfile) | 狀態 |
|------|-------------------|-------------------|------|
| 前端構建 | 自動偵測 ❓ | 明確 `npm run build` ✅ | 已修復 |
| 伺服器設定 | 猜測 ❓ | 明確配置 ✅ | 已修復 |
| 健康檢查 | 無 ❌ | `/health` 端點 ✅ | 已修復 |
| 啟動時間 | 預設 60s ⚠️ | 300s 超時 ✅ | 已修復 |
| 記憶體 | 256Mi ⚠️ | 512Mi ✅ | 已修復 |
| 日誌 | 最少 ⚠️ | 詳細診斷 ✅ | 已修復 |

## 立即行動

**最快解決方案** - 執行以下命令:

```bash
cd "$(dirname "$0")" && \
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=segian-reptile \
  --region=asia-east1 && \
echo "✅ 部署完成! 正在獲取服務 URL..." && \
gcloud run services describe lxp-tampermonkey-demo \
  --region=asia-east1 \
  --project=segian-reptile \
  --format="value(status.url)"
```

複製貼上這一條命令即可完成部署!

## 需要幫助?

1. 📖 查看 [CLOUDBUILD_MIGRATION.md](./CLOUDBUILD_MIGRATION.md) 了解詳細遷移步驟
2. 📋 參考 [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) 進行全面檢查
3. 🔧 閱讀 [DEPLOYMENT.md](./DEPLOYMENT.md) 進行故障排除

---

**TL;DR**: 您的部署使用 Buildpacks,需改用我們的 Dockerfile。執行上方"立即行動"中的命令即可修復!
