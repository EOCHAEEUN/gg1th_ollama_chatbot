#!/usr/bin/env bash
# ============================================================
# Nginx 로컬 배포 셋업 스크립트
#   Browser → http://localhost → Nginx
#                                 ├─ /      → React dist
#                                 └─ /api/* → FastAPI 127.0.0.1:8000
#
# 사용법:  sudo bash deploy/setup-nginx.sh
#   (react_basic 디렉토리에서 실행하거나, 스크립트 경로를 그대로 지정)
# ============================================================
set -euo pipefail

FRONTEND_DIR="/home/ai_fish/local_llm_basic_ex/react_basic"
DIST_DIR="${FRONTEND_DIR}/dist"
WEB_ROOT="/var/www/local_llm_app"
CONF_SRC="${FRONTEND_DIR}/deploy/local_llm_app.nginx.conf"
CONF_AVAILABLE="/etc/nginx/sites-available/local_llm_app"
CONF_ENABLED="/etc/nginx/sites-enabled/local_llm_app"

if [[ $EUID -ne 0 ]]; then
  echo "이 스크립트는 sudo로 실행해야 합니다:  sudo bash $0" >&2
  exit 1
fi

echo "==> 1. 빌드 결과 확인"
if [[ ! -f "${DIST_DIR}/index.html" ]]; then
  echo "dist/index.html 이 없습니다. 먼저 'npm run build' 를 실행하세요." >&2
  exit 1
fi
echo "    OK: ${DIST_DIR}"

echo "==> 2. Nginx 설치 확인"
if ! command -v nginx >/dev/null 2>&1; then
  echo "    nginx 미설치 → 설치 진행"
  apt update -qq
  apt install -y nginx
else
  echo "    이미 설치됨: $(nginx -v 2>&1)"
fi

echo "==> 3. 배포 디렉토리 준비: ${WEB_ROOT}"
mkdir -p "${WEB_ROOT}"
echo "    현재 내용:"
ls -al "${WEB_ROOT}" | sed 's/^/      /'

echo "==> 4. dist 내용 배포"
# 이전 빌드의 해시 파일명이 남지 않도록 assets만 정리한 뒤 복사
# (WEB_ROOT 자체는 삭제하지 않음)
rm -rf "${WEB_ROOT:?}/assets"
cp -r "${DIST_DIR}/." "${WEB_ROOT}/"
echo "    배포 후 내용:"
ls -al "${WEB_ROOT}" | sed 's/^/      /'

echo "==> 5. 권한 설정"
chown -R www-data:www-data "${WEB_ROOT}"
chmod -R 755 "${WEB_ROOT}"

echo "==> 6. server block 설치"
cp "${CONF_SRC}" "${CONF_AVAILABLE}"
echo "    ${CONF_AVAILABLE}"

echo "==> 7. 사이트 활성화"
if [[ -L "${CONF_ENABLED}" || -e "${CONF_ENABLED}" ]]; then
  echo "    이미 존재 → 건너뜀: ${CONF_ENABLED}"
else
  ln -s "${CONF_AVAILABLE}" "${CONF_ENABLED}"
  echo "    symlink 생성: ${CONF_ENABLED}"
fi

# 기본 사이트도 listen 80 default_server 이므로 localhost 충돌 → 비활성화
if [[ -L /etc/nginx/sites-enabled/default || -e /etc/nginx/sites-enabled/default ]]; then
  echo "    기본 사이트(default) 비활성화 (80 포트 충돌 방지)"
  rm -f /etc/nginx/sites-enabled/default
fi

echo "==> 8. 문법 검사"
nginx -t

echo "==> 9. Nginx 재시작"
if command -v systemctl >/dev/null 2>&1 && systemctl is-system-running >/dev/null 2>&1; then
  systemctl restart nginx
  systemctl --no-pager status nginx | head -5
else
  service nginx restart
  service nginx status | head -5
fi

echo
echo "==> 완료. 아래로 확인하세요:"
echo "    curl http://localhost/api/models"
echo "    브라우저: http://localhost"
