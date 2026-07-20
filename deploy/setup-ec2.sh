#!/usr/bin/env bash
#
# Turnkey provisioning for Graviti Kanban on a fresh Ubuntu 22.04/24.04 EC2 host.
# Installs Node 20, PostgreSQL, and nginx; deploys backend (systemd) + frontend (static).
#
# Usage (on the EC2 box, as a sudo-capable user):
#   export PUBLIC_HOST="<your-ec2-public-ip-or-domain>"   # e.g. 13.234.x.x  or  kanban.example.com
#   export DB_PASSWORD="<choose-a-strong-password>"
#   bash setup-ec2.sh
#
# Re-running is safe (idempotent-ish): it pulls latest code and rebuilds.

set -euo pipefail

# ---- config (override via environment) --------------------------------------
PUBLIC_HOST="${PUBLIC_HOST:?Set PUBLIC_HOST to your EC2 public IP or domain}"
DB_PASSWORD="${DB_PASSWORD:?Set DB_PASSWORD to a strong password}"
DB_NAME="${DB_NAME:-graviti_kanban}"
DB_USER="${DB_USER:-kanban}"
BACKEND_REPO="${BACKEND_REPO:-https://github.com/kavatideepak/graviti-kanban-backend.git}"
FRONTEND_REPO="${FRONTEND_REPO:-https://github.com/kavatideepak/graviti-kanban-frontend.git}"
APP_DIR="${APP_DIR:-/opt/kanban}"
WEB_ROOT="${WEB_ROOT:-/var/www/kanban}"
BACKEND_PORT="${BACKEND_PORT:-4000}"
# Use https:// here instead if you terminate TLS (see DEPLOY.md).
PUBLIC_URL="${PUBLIC_URL:-http://${PUBLIC_HOST}}"

echo "==> Deploying Graviti Kanban for ${PUBLIC_URL}"

# ---- system packages --------------------------------------------------------
echo "==> Installing system packages"
sudo apt-get update -y
sudo apt-get install -y curl git nginx postgresql postgresql-contrib

if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 18 ]; then
  echo "==> Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "    node $(node -v), npm $(npm -v)"

# ---- postgres ---------------------------------------------------------------
echo "==> Configuring PostgreSQL role + database"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
SQL
# createdb is not idempotent; ignore "already exists".
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
  || sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"

DATABASE_URL="postgres://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"

# ---- fetch code -------------------------------------------------------------
echo "==> Fetching source into ${APP_DIR}"
sudo mkdir -p "${APP_DIR}"
sudo chown -R "$USER":"$USER" "${APP_DIR}"

clone_or_pull () {
  local repo="$1" dir="$2"
  if [ -d "${dir}/.git" ]; then
    git -C "${dir}" pull --ff-only
  else
    git clone "${repo}" "${dir}"
  fi
}
clone_or_pull "${BACKEND_REPO}"  "${APP_DIR}/backend"
clone_or_pull "${FRONTEND_REPO}" "${APP_DIR}/frontend"

# ---- backend ----------------------------------------------------------------
echo "==> Building backend"
cd "${APP_DIR}/backend"
cat > .env <<ENV
DATABASE_URL=${DATABASE_URL}
PORT=${BACKEND_PORT}
CLIENT_ORIGIN=${PUBLIC_URL}
ENV
npm ci
npm run db:migrate
# Seed demo data only on first setup (no users yet). Comment out if unwanted.
if [ ! -f "${APP_DIR}/.seeded" ]; then
  npm run db:seed || true
  touch "${APP_DIR}/.seeded"
fi

echo "==> Installing systemd service"
sudo tee /etc/systemd/system/kanban-server.service >/dev/null <<UNIT
[Unit]
Description=Graviti Kanban backend
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=${USER}
WorkingDirectory=${APP_DIR}/backend
Environment=NODE_ENV=production
ExecStart=$(command -v node) ${APP_DIR}/backend/src/server.js
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable kanban-server
sudo systemctl restart kanban-server

# ---- frontend ---------------------------------------------------------------
echo "==> Building frontend"
cd "${APP_DIR}/frontend"
cat > .env <<ENV
VITE_API_URL=${PUBLIC_URL}/api
VITE_SOCKET_URL=${PUBLIC_URL}
ENV
npm ci
npm run build
sudo mkdir -p "${WEB_ROOT}"
sudo rm -rf "${WEB_ROOT:?}/"*
sudo cp -r dist/* "${WEB_ROOT}/"

# ---- nginx ------------------------------------------------------------------
echo "==> Configuring nginx"
sudo tee /etc/nginx/sites-available/kanban >/dev/null <<NGINX
server {
    listen 80;
    server_name ${PUBLIC_HOST};

    root ${WEB_ROOT};
    index index.html;

    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # REST API
    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Socket.IO (websockets)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/kanban /etc/nginx/sites-enabled/kanban
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo ""
echo "============================================================"
echo " Done. Open: ${PUBLIC_URL}"
echo " Backend health: ${PUBLIC_URL}/api/health"
echo " Logs: sudo journalctl -u kanban-server -f"
echo "============================================================"
