#!/usr/bin/env bash
set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}${BOLD}[•]${RESET} $*"; }
success() { echo -e "${GREEN}${BOLD}[✓]${RESET} $*"; }
warn()    { echo -e "${YELLOW}${BOLD}[!]${RESET} $*"; }
error()   { echo -e "${RED}${BOLD}[✗]${RESET} $*" >&2; exit 1; }

echo -e "\n${BOLD}Immigration CRM — Installer${RESET}\n"

# ── Prerequisites ─────────────────────────────────────────────────────────────
info "Checking prerequisites…"

command -v docker  >/dev/null 2>&1 || error "Docker is not installed. Visit https://docs.docker.com/get-docker/"
command -v docker  >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 \
  || error "Docker Compose v2 is not available. Update Docker Desktop or install the plugin."

success "Docker $(docker --version | awk '{print $3}' | tr -d ',')"
success "Docker Compose $(docker compose version --short)"

# ── .env setup ────────────────────────────────────────────────────────────────
info "Configuring backend environment…"

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  success "Created backend/.env from .env.example"
else
  warn "backend/.env already exists — skipping copy"
fi

# ── Build & start containers ──────────────────────────────────────────────────
info "Building and starting containers (this may take a few minutes on first run)…"
docker compose up -d --build
success "All containers started"

# ── Wait for MySQL to be ready ───────────────────────────────────────────────
info "Waiting for MySQL to accept connections…"
until docker compose exec -T mysql mysql -u root --connect-timeout=1 crm_db -e "SELECT 1" >/dev/null 2>&1; do
  sleep 1
done
success "MySQL is ready"

# ── Laravel setup ─────────────────────────────────────────────────────────────
info "Generating application key…"
docker compose exec -T backend php artisan key:generate --force
success "APP_KEY set"

info "Generating JWT secret…"
docker compose exec -T backend php artisan jwt:secret --force
success "JWT_SECRET set"

info "Running database migrations…"
docker compose exec -T backend php artisan migrate --force
success "Migrations complete"

info "Seeding database (roles, permissions, default admin)…"
docker compose exec -T backend php artisan db:seed --class=RolePermissionSeeder --force
docker compose exec -T backend php artisan db:seed --class=UserSeeder --force
success "Database seeded"

info "Warming caches…"
docker compose exec -T backend php artisan config:cache
docker compose exec -T backend php artisan route:cache
docker compose exec -T backend php artisan view:cache
success "Caches warmed"

# ── Done ──────────────────────────────────────────────────────────────────────
echo
echo -e "${GREEN}${BOLD}Installation complete!${RESET}"
echo
echo -e "  ${BOLD}API${RESET}       http://localhost:8000"
echo -e "  ${BOLD}Frontend${RESET}  http://localhost:3000"
echo -e "  ${BOLD}MinIO${RESET}     http://localhost:9001  (minio_user / minio_secret)"
echo
echo -e "  ${BOLD}Default logins${RESET} (password: Password@123)"
echo -e "    superadmin@crm.local  — Super Admin"
echo -e "    admin@crm.local       — Admin"
echo -e "    consultant@crm.local  — Consultant"
echo
echo -e "  Run ${CYAN}docker compose logs -f backend${RESET} to tail the API logs."
echo
