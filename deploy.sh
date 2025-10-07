#!/bin/bash

# LXP Mart Cloud Run 部署腳本
# 使用方法: ./deploy.sh

set -e  # 遇到錯誤立即退出

echo "=== LXP Mart Cloud Run 部署 ==="
echo ""

# 設定變數
PROJECT_ID="segian-reptile"
SERVICE_NAME="lxp-tampermonkey-demo"
REGION="asia-east1"

echo "專案: $PROJECT_ID"
echo "服務: $SERVICE_NAME"
echo "區域: $REGION"
echo ""

# 確認使用者
echo "正在使用的 GCP 帳號:"
gcloud config get-value account
echo ""

read -p "是否繼續部署? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "部署已取消"
    exit 1
fi

echo ""
echo "步驟 1/3: 構建前端..."
npm install
npm run build

echo ""
echo "步驟 2/3: 檢查構建產物..."
if [ ! -f "dist/index.html" ]; then
    echo "錯誤: dist/index.html 不存在!"
    echo "請確認前端構建成功"
    exit 1
fi
echo "✓ dist/index.html 存在"
ls -lh dist/

echo ""
echo "步驟 3/3: 部署到 Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --timeout 300 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --startup-cpu-boost \
  --set-env-vars "PORT=8080" \
  --project $PROJECT_ID

echo ""
echo "=== 部署完成 ==="
echo "服務 URL:"
gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID \
  --format="value(status.url)"
