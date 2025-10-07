# Cloud Build 配置遷移指南

## 問題分析

### 舊配置的問題

您原本的 `cloudbuild.yaml` 使用 **Google Cloud Buildpacks** (`gcr.io/k8s-skaffold/pack`):

```yaml
- name: gcr.io/k8s-skaffold/pack
  args:
    - build
    - --builder=gcr.io/buildpacks/builder:latest
```

**問題:**
1. Buildpacks 會自動偵測專案類型,但可能無法正確處理我們的多階段 React + Express 架構
2. 無法使用我們優化過的 Dockerfile
3. 難以控制構建流程和環境變數
4. Buildpacks 可能會忽略 `server/` 目錄結構
5. 無法設定健康檢查和啟動探針

### 新配置的改進

新的 `cloudbuild.yaml` 使用 **Docker 構建**:

```yaml
- name: 'gcr.io/cloud-builders/docker'
  args:
    - 'build'
    - '-t'
    - '$_AR_HOSTNAME/$_AR_PROJECT_ID/$_AR_REPOSITORY/$REPO_NAME/$_SERVICE_NAME:$COMMIT_SHA'
    - '--file=Dockerfile'
    - '.'
```

**優勢:**
1. ✅ 使用我們優化過的 Dockerfile
2. ✅ 完整控制構建流程
3. ✅ 正確處理 `dist/` 和 `server/` 目錄
4. ✅ 包含健康檢查配置
5. ✅ 非 root 使用者執行(安全性)
6. ✅ 明確的環境變數設定

## 配置對比

### 構建階段

| 項目 | 舊配置 (Buildpacks) | 新配置 (Dockerfile) |
|------|-------------------|-------------------|
| 前端構建 | 自動偵測 | 明確執行 `npm run build` |
| 伺服器依賴 | 可能遺漏 | 明確安裝 `server/node_modules` |
| 多階段構建 | 不支援 | 支援(builder + production) |
| 檔案權限 | 預設 | 自訂 (nodejs 使用者) |
| 健康檢查 | 無 | 有 (/health 端點) |

### 部署設定

| 設定 | 舊配置 | 新配置 |
|-----|--------|--------|
| Port | 未明確設定 | `--port=8080` |
| Timeout | 預設 (60s) | `--timeout=300` (5分鐘) |
| Memory | 預設 (256Mi) | `--memory=512Mi` |
| CPU | 預設 (1) | `--cpu=1` |
| 環境變數 | 無 | `PORT=8080` |
| Max instances | 預設 (100) | `--max-instances=10` |
| Min instances | 預設 (0) | `--min-instances=0` |

## 遷移步驟

### 方法 1: 透過 GCP Console 更新

1. **前往 Cloud Build 觸發器**
   - 開啟 [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
   - 找到您的觸發器 (ID: `47d62adc-b7d0-446b-8b22-54981f041bbb`)

2. **編輯觸發器**
   - 點擊觸發器名稱進入編輯模式
   - 在 "Configuration" 區域選擇 "Cloud Build configuration file"
   - 確認路徑為 `cloudbuild.yaml`

3. **上傳新的 cloudbuild.yaml**
   - 將新的 `cloudbuild.yaml` 提交到您的 Git repository
   - 確保檔案在專案根目錄

4. **觸發測試構建**
   - 點擊 "Run trigger" 測試新配置
   - 觀察構建日誌

### 方法 2: 使用 gcloud CLI 更新

```bash
# 更新觸發器配置
gcloud builds triggers update <TRIGGER_NAME> \
  --build-config=cloudbuild.yaml \
  --project=segian-reptile
```

### 方法 3: 手動觸發構建測試

在上傳新配置前,可以先手動測試:

```bash
# 使用新的 cloudbuild.yaml 手動觸發構建
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=segian-reptile \
  --region=asia-east1
```

## 新配置的關鍵特性

### 1. 明確的構建步驟

```yaml
- name: 'gcr.io/cloud-builders/docker'
  args:
    - 'build'
    - '--file=Dockerfile'
    - '.'
  timeout: 600s  # 10 分鐘構建時間
```

### 2. 雙標籤策略

映像同時標記為:
- `COMMIT_SHA` - 特定版本追蹤
- `latest` - 最新版本

### 3. 詳細的部署參數

```yaml
- '--port=8080'              # 容器埠口
- '--timeout=300'            # 請求超時
- '--memory=512Mi'           # 記憶體限制
- '--cpu=1'                  # CPU 配置
- '--set-env-vars=PORT=8080' # 環境變數
```

### 4. 效能優化

```yaml
options:
  machineType: 'N1_HIGHCPU_8'  # 高效能構建機器
  diskSizeGb: 100               # 足夠的磁碟空間
```

## 驗證新配置

### 檢查清單

部署後請驗證:

1. **Cloud Build 日誌**
   ```
   ✓ Step 1: Build Docker Image - SUCCESS
   ✓ Step 2: Push Image - SUCCESS
   ✓ Step 3: Push Latest Tag - SUCCESS
   ✓ Step 4: Deploy to Cloud Run - SUCCESS
   ```

2. **容器啟動日誌**
   應該看到:
   ```
   === Starting LXP Mart Server ===
   === Server Started Successfully ===
   Listening on 0.0.0.0:8080
   ```

3. **健康檢查**
   ```bash
   curl https://lxp-tampermonkey-demo-xxx.a.run.app/health
   # 預期: {"status":"ok","distExists":true,"indexExists":true}
   ```

4. **應用程式功能**
   - [ ] 首頁載入正常
   - [ ] 靜態資源正常
   - [ ] favicon 顯示
   - [ ] 商店頁面正常
   - [ ] 管理頁面正常

## 回滾計劃

如果新配置有問題,可以快速回滾:

### 方法 1: 在 Cloud Run 中回滾 Revision

```bash
# 列出所有 revisions
gcloud run revisions list \
  --service=lxp-tampermonkey-demo \
  --region=asia-east1

# 回滾到上一個 revision
gcloud run services update-traffic lxp-tampermonkey-demo \
  --to-revisions=<PREVIOUS_REVISION>=100 \
  --region=asia-east1
```

### 方法 2: 恢復舊的 cloudbuild.yaml

如果需要,可以暫時恢復使用 Buildpacks 配置(不推薦)。

## 故障排除

### 構建失敗

**症狀**: Docker 構建階段失敗

**解決**:
1. 檢查 Dockerfile 語法
2. 確認所有必要檔案存在
3. 查看完整構建日誌

```bash
gcloud builds log <BUILD_ID>
```

### 推送失敗

**症狀**: 無法推送到 Artifact Registry

**解決**:
1. 確認 Artifact Registry 權限
2. 檢查 repository 是否存在

```bash
gcloud artifacts repositories list \
  --project=segian-reptile \
  --location=asia-east1
```

### 部署失敗

**症狀**: Cloud Run 部署失敗

**解決**:
1. 增加超時時間
2. 檢查映像是否成功推送
3. 查看 Cloud Run 日誌

```bash
gcloud run services describe lxp-tampermonkey-demo \
  --region=asia-east1 \
  --format=yaml
```

## 預期改進

使用新配置後,您應該會看到:

1. ✅ **構建成功率提高** - 不再依賴 Buildpacks 自動偵測
2. ✅ **啟動速度更快** - 優化的 Dockerfile 和健康檢查
3. ✅ **更好的可觀察性** - 詳細的日誌輸出
4. ✅ **更高的可靠性** - 明確的構建和部署流程
5. ✅ **更容易除錯** - 可以本地測試相同的 Dockerfile

## 下一步

1. **備份現有配置** (如果需要回滾)
2. **提交新的 cloudbuild.yaml** 到 Git repository
3. **觸發測試構建**
4. **驗證部署結果**
5. **監控應用程式效能**

## 支援資源

- 📄 [DEPLOYMENT.md](./DEPLOYMENT.md) - 詳細部署指南
- 📋 [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) - 部署檢查清單
- 📖 [README.md](./README.md) - 專案文檔

---

**注意**: 新配置已經過本地測試和驗證,應該能解決您目前遇到的部署失敗問題。

最後更新: 2025-10-07
