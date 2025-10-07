# 部署故障排除指南

## 問題診斷

您遇到的錯誤訊息:
```
The user-provided container failed to start and listen on the port defined provided by the PORT=8080 environment variable
```

這表示容器無法在 8080 埠口正確啟動。

## 已實施的修復

### 1. 改進的 server.js
- ✅ 新增健康檢查端點 `/health`
- ✅ 增強錯誤日誌記錄
- ✅ 加入 dist 目錄和 index.html 存在性檢查
- ✅ 確保監聽 `0.0.0.0:8080`

### 2. 優化的 Dockerfile
- ✅ 改善構建快取策略(先複製 package.json)
- ✅ 新增構建驗證步驟(確保 index.html 存在)
- ✅ 新增非 root 使用者執行(安全性)
- ✅ 詳細的調試日誌

### 3. 新增 .dockerignore
- ✅ 排除不必要的檔案,減少構建上下文大小

## Cloud Run 部署檢查清單

### 在部署前確認:

1. **檢查 Cloud Build 日誌**
   - 前往提供的日誌 URL 查看詳細錯誤
   - 確認 `npm run build` 成功執行
   - 確認 `dist/index.html` 存在

2. **驗證構建輸出**
   在 Cloud Build 日誌中應該看到:
   ```
   === Build completed ===
   -rw-r--r-- 1 root root 1010 ... index.html
   ```

3. **確認伺服器啟動**
   在容器日誌中應該看到:
   ```
   === Server Starting ===
   Server is running on port 8080
   Server is ready to accept connections
   ```

## 本地測試方法

### 方法 1: 本地 Docker 測試(如果已安裝 Docker)

```bash
# 構建映像
docker build -t lxp-mart-test .

# 執行容器
docker run -p 8080:8080 lxp-mart-test

# 測試健康檢查
curl http://localhost:8080/health
```

### 方法 2: 本地測試伺服器

```bash
# 構建前端
npm install
npm run build

# 安裝並啟動伺服器
cd server
npm install
PORT=8080 node server.js

# 在另一個終端測試
curl http://localhost:8080/health
```

## 常見問題與解決方案

### 問題 1: dist 目錄不存在
**原因**: 前端構建失敗
**解決**:
```bash
# 檢查構建是否成功
npm run build
ls -la dist/
```

### 問題 2: index.html 不存在
**原因**: Vite 配置問題或構建過程中斷
**解決**:
- 確保 `index.html` 存在於專案根目錄
- 檢查 `vite.config.ts` 配置

### 問題 3: 健康檢查超時
**原因**: 伺服器啟動時間過長或卡住
**解決**:
```bash
# 在 Cloud Run 設定中增加超時時間
gcloud run services update lxp-tampermonkey-demo \
  --timeout=300 \
  --startup-cpu-boost
```

### 問題 4: 權限問題
**原因**: 非 root 使用者無法訪問檔案
**解決**: Dockerfile 已正確設定權限
```dockerfile
RUN chown -R nodejs:nodejs /app
USER nodejs
```

## Cloud Run 特定配置建議

### 方法 1: 使用 gcloud 直接部署(推薦)

```bash
gcloud run deploy lxp-tampermonkey-demo \
  --source . \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --port 8080 \
  --timeout 300 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --startup-cpu-boost \
  --set-env-vars "PORT=8080" \
  --project segian-reptile
```

### 方法 2: 使用 service.yaml 配置檔

專案已包含 `service.yaml` 配置檔,定義了:
- 啟動和存活探針 (startup/liveness probe) - 使用 `/health` 端點
- 資源限制 (512Mi 記憶體, 1 CPU)
- 啟動 CPU 加速
- 超時設定 (300 秒)

```bash
# 先構建並推送映像到 GCR
gcloud builds submit --tag gcr.io/segian-reptile/lxp-mart

# 使用 service.yaml 部署
gcloud run services replace service.yaml \
  --region asia-east1 \
  --project segian-reptile
```

### 健康檢查配置:

如果使用 YAML 配置檔:
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: lxp-tampermonkey-demo
spec:
  template:
    spec:
      containers:
      - image: gcr.io/your-project/lxp-mart
        ports:
        - containerPort: 8080
        startupProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          failureThreshold: 3
```

## 調試步驟

1. **查看 Cloud Build 日誌**
   ```bash
   gcloud builds list --limit 5
   gcloud builds log <BUILD_ID>
   ```

2. **查看 Cloud Run 日誌**
   - 前往 Cloud Console
   - 點擊您提供的日誌 URL
   - 搜尋 "Server Starting" 或 "ERROR"

3. **檢查容器是否啟動**
   ```bash
   gcloud run revisions describe <REVISION_NAME> \
     --region asia-east1 \
     --format="value(status.conditions)"
   ```

## 下次部署前的檢查

- [ ] 確認所有相依套件已安裝
- [ ] 本地執行 `npm run build` 成功
- [ ] 檢查 `dist/index.html` 存在
- [ ] 本地測試伺服器可以啟動
- [ ] 檢查 Cloud Build 配置正確

## 聯繫支援

如果問題持續存在,請提供:
1. 完整的 Cloud Build 日誌
2. Cloud Run 容器日誌
3. 本地構建的輸出結果
