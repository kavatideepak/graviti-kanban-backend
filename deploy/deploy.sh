#!/usr/bin/env bash
#
# Redeploy latest code on an already-provisioned host (see setup-ec2.sh first).
# Pulls both repos, rebuilds, runs migrations, restarts services.
#
#   export PUBLIC_HOST="<ip-or-domain>"
#   bash deploy.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/kanban}"
WEB_ROOT="${WEB_ROOT:-/var/www/kanban}"
PUBLIC_HOST="${PUBLIC_HOST:?Set PUBLIC_HOST}"
PUBLIC_URL="${PUBLIC_URL:-http://${PUBLIC_HOST}}"

echo "==> Backend"
cd "${APP_DIR}/backend"
git pull --ff-only
npm ci
npm run db:migrate
sudo systemctl restart kanban-server

echo "==> Frontend"
cd "${APP_DIR}/frontend"
git pull --ff-only
cat > .env <<ENV
VITE_API_URL=${PUBLIC_URL}/api
VITE_SOCKET_URL=${PUBLIC_URL}
ENV
npm ci
npm run build
sudo rm -rf "${WEB_ROOT:?}/"*
sudo cp -r dist/* "${WEB_ROOT}/"

echo "==> Done. ${PUBLIC_URL}"
