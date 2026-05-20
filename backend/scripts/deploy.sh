#!/bin/bash
# =============================================================
# 5MIN Backend — 코드 업데이트 & 무중단 재배포 스크립트
# 실행 위치: EC2 의 backend/ 디렉터리
# 사용법: bash scripts/deploy.sh
# =============================================================
set -e

export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"

echo "=== [1/4] 의존성 설치 ==="
npm install

echo "=== [2/4] TypeScript 빌드 ==="
npm run build

echo "=== [3/4] DB 마이그레이션 적용 ==="
npx prisma migrate deploy

echo "=== [4/4] PM2 무중단 재시작 ==="
pm2 reload 5min-backend || pm2 start ecosystem.config.js --env production

echo ""
echo "=== 배포 완료 ==="
pm2 status 5min-backend
