#!/bin/bash
# =============================================================
# 5MIN Backend — EC2 최초 셋업 스크립트
# 대상: Amazon Linux 2 (ap-northeast-2, Seoul)
# 실행: sudo bash setup-ec2.sh
# =============================================================
set -e

echo "=== [1/6] NVM & Node.js 20 설치 ==="
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20
# 현재 셸뿐 아니라 새 세션에서도 nvm 로드
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc

echo "=== [2/6] PM2 전역 설치 ==="
npm install -g pm2

echo "=== [3/6] 프로젝트 의존성 설치 ==="
# 이 스크립트는 backend/ 디렉터리에서 실행
npm install

echo "=== [4/6] TypeScript 빌드 ==="
npm run build

echo "=== [5/6] Prisma 마이그레이션 적용 ==="
# .env 파일에 DATABASE_URL이 설정되어 있어야 합니다
# 예: DATABASE_URL="mysql://admin:pw@your-rds.ap-northeast-2.rds.amazonaws.com:3306/fivemin"
npx prisma migrate deploy

echo "=== [6/6] PM2로 서버 시작 ==="
mkdir -p logs
pm2 start ecosystem.config.js --env production
pm2 save

# 인스턴스 재부팅 시 자동 시작 등록
pm2 startup systemd -u ec2-user --hp /home/ec2-user
echo "→ 위 출력된 'sudo env ...' 명령어를 복사해서 실행하세요"

echo ""
echo "=== 셋업 완료 ==="
echo "서버 상태 확인: pm2 status"
echo "로그 확인:      pm2 logs 5min-backend"
echo "포트 3000이 EC2 보안 그룹에서 열려 있는지 확인하세요"
