# Deploying Graviti Kanban to EC2

This deploys both services on a single Ubuntu EC2 instance:

- **Backend** (this repo) — Node/Express + Socket.IO, runs on port `4000` under `systemd`.
- **Frontend** ([graviti-kanban-frontend](https://github.com/kavatideepak/graviti-kanban-frontend)) — Vite build served as static files by **nginx**.
- **PostgreSQL** — installed on the same box.
- **nginx** — serves the SPA and reverse-proxies `/api` and `/socket.io` to the backend, so everything is one origin on port 80.

```
Browser ──▶ nginx :80 ──┬─▶ / (static SPA from /var/www/kanban)
                        ├─▶ /api/      ──▶ 127.0.0.1:4000
                        └─▶ /socket.io ──▶ 127.0.0.1:4000 (websocket upgrade)
```

## 1. Launch the EC2 instance

- **AMI:** Ubuntu Server 22.04 or 24.04 LTS
- **Type:** `t3.small` or larger (t2.micro works for a demo but is tight)
- **Security group inbound rules:**
  - `22` (SSH) — your IP only
  - `80` (HTTP) — `0.0.0.0/0`
  - `443` (HTTPS) — `0.0.0.0/0` (only if you add TLS)
- Attach/allocate a key pair (`.pem`) so you can SSH in.

## 2. Run the one-shot setup

SSH in and run:

```bash
ssh -i /path/to/key.pem ubuntu@<PUBLIC_IP>

# on the instance:
curl -fsSL https://raw.githubusercontent.com/kavatideepak/graviti-kanban-backend/main/deploy/setup-ec2.sh -o setup-ec2.sh
export PUBLIC_HOST="<PUBLIC_IP_OR_DOMAIN>"
export DB_PASSWORD="<choose-a-strong-password>"
bash setup-ec2.sh
```

The script installs Node 20, PostgreSQL and nginx, creates the database, clones
both repos into `/opt/kanban`, runs migrations + seed data, registers the backend
as a systemd service, builds the frontend, and configures nginx.

When it finishes, open `http://<PUBLIC_IP_OR_DOMAIN>`.

## 3. Redeploying after code changes

```bash
export PUBLIC_HOST="<PUBLIC_IP_OR_DOMAIN>"
bash /opt/kanban/backend/deploy/deploy.sh
```

## Operations

```bash
sudo systemctl status kanban-server      # backend status
sudo journalctl -u kanban-server -f      # backend logs
sudo systemctl restart kanban-server     # restart backend
sudo nginx -t && sudo systemctl reload nginx
curl http://localhost:4000/api/health    # -> {"ok":true}
```

## Optional: HTTPS with a domain

Point an A record at the instance, then:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d kanban.example.com
```

Certbot rewrites the nginx block to serve `443`. After that, **rebuild the
frontend** with `https://` URLs and set the backend `CLIENT_ORIGIN` to the
`https://` origin, otherwise CORS / mixed-content will break:

```bash
export PUBLIC_URL="https://kanban.example.com"
export PUBLIC_HOST="kanban.example.com"
bash /opt/kanban/backend/deploy/deploy.sh
```

## Optional: managed database (RDS)

Skip the local PostgreSQL install and instead set the backend `.env`
`DATABASE_URL` to your RDS endpoint, then run `npm run db:migrate`. Ensure the
RDS security group allows inbound `5432` from the EC2 instance.

## Environment variables

**Backend** (`/opt/kanban/backend/.env`):

| var | example | notes |
|-----|---------|-------|
| `DATABASE_URL` | `postgres://kanban:pass@localhost:5432/graviti_kanban` | |
| `PORT` | `4000` | must match nginx proxy target |
| `CLIENT_ORIGIN` | `http://<ip-or-domain>` | CORS + Socket.IO origin |

**Frontend** (`/opt/kanban/frontend/.env`, baked in at build time):

| var | example |
|-----|---------|
| `VITE_API_URL` | `http://<ip-or-domain>/api` |
| `VITE_SOCKET_URL` | `http://<ip-or-domain>` |
