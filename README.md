# Immigration CRM

An immigration services CRM. Backend is Laravel 10 (PHP 8.2, PostgreSQL, Redis). Frontend is React 18 + TypeScript + Vite. Both run in Docker; Apache serves the Laravel API and nginx serves the built React app.

---

## Installation

**Requires:** Docker Desktop with Compose v2.

```bash
chmod +x install.sh
./install.sh
```

The script will:
1. Copy `backend/.env.example` → `backend/.env` (skipped if already exists)
2. Build images and start all containers
3. Wait for PostgreSQL to be ready
4. Run `key:generate` and `jwt:secret`
5. Run migrations and seed roles, permissions, and a default admin user
6. Warm config, route, and view caches

Once complete:

| Service  | URL                                        |
|----------|--------------------------------------------|
| API      | http://localhost:8000                      |
| Frontend | http://localhost:3000                      |
| MinIO    | http://localhost:9001 (`minio_user` / `minio_secret`) |

The default admin credentials are created by `UserSeeder`.

---

## Commands

### Docker

```bash
docker compose up -d            # start all services
docker compose up -d --build    # rebuild images then start
docker compose down             # stop
docker compose logs -f backend  # tail backend logs
```

### Backend (inside container or with local PHP)

```bash
# enter the container
docker compose exec backend bash

php artisan migrate
php artisan migrate:fresh --seed   # wipe + re-seed
php artisan db:seed --class=RolePermissionSeeder

# clear caches (needed after .env or config changes)
php artisan config:clear && php artisan route:clear && php artisan view:clear

# tests
php artisan test                             # all tests
php artisan test tests/Feature/AuthTest.php  # single file
php artisan test --filter test_method_name   # single test
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # Vite dev server on http://localhost:5173
npm run build    # tsc + vite build
npm run lint     # ESLint (ts, tsx)
npm run preview  # preview production build
```

---

## Architecture

### Request lifecycle (backend)

`routes/api.php` → Middleware (`auth:api`, `CheckPermission`) → Controller → Service or Repository → Resource (JSON shaping)

All routes live under the `/api/v1` prefix. Protected routes use `auth:api` (JWT). Fine-grained access is controlled by `CheckPermission` middleware which reads `permission:some.action` route middleware strings and calls `$user->can(...)`.

Controllers use `$this->authorize(...)` (Policy) for ownership checks on top of the middleware permission check — both layers exist.

### Authentication (JWT)

`tymon/jwt-auth`. The `User` model implements `JWTSubject`. Login returns `access_token` + `expires_in`. The frontend stores the token in Zustand (persisted to localStorage as `crm-auth`) and refreshes via `POST /auth/refresh` on 401.

`JWT_TTL=15` (minutes access token), `JWT_REFRESH_TTL=20160` (14 days refresh window).

### Repository pattern (backend)

`RepositoryServiceProvider` binds every `*RepositoryInterface` to its `Eloquent\*Repository`. Controllers receive repositories via constructor injection — they never call Eloquent directly. Repositories own filtering, pagination, and complex queries. Services (`AuthService`, `LeadConversionService`) own multi-step business logic that spans multiple models.

### API response envelope

All endpoints return the same shape:

```json
{ "success": true, "data": <T or T[]>, "message": "...", "meta": { "current_page", "per_page", "total", "last_page" } }
```

`meta` is only present on paginated responses. `message` is only present on mutations. Axios client types are `ApiResponse<T>` and `PaginatedResponse<T>` in `frontend/src/api/client.ts`.

### Frontend data flow

```
src/pages/{feature}/         →  renders UI, reads from hooks
src/hooks/use{Feature}.ts    →  React Query useQuery / useMutation, owns cache keys + invalidation
src/api/{feature}.api.ts     →  thin wrappers around the axios client
src/api/client.ts            →  axios instance, request interceptor (inject Bearer), response interceptor (401 → refresh → retry)
```

Zustand (`src/store/authStore.ts`) holds only auth state. Everything else is React Query server state. Optimistic updates are implemented on kanban mutations (`useUpdateStage`, `useDeleteOpportunity`) via `onMutate` snapshot → `onError` rollback → `onSettled` invalidate.

### Routing + auth guards

`src/router/index.tsx` uses `createBrowserRouter`. All app routes are wrapped in `ProtectedRoute`, which checks `isAuthenticated`, and optionally `requiredRole` or `requiredPermission`. Admin-only routes are nested under a second `ProtectedRoute` with `requiredRole="admin"`. Pages are lazy-loaded with Suspense.

### Key env vars

Backend `.env` (copy from `.env.example`):
- `APP_KEY` — generate with `php artisan key:generate`
- `JWT_SECRET` — generate with `php artisan jwt:secret`
- `DB_*` — defaults in docker-compose match mysql service (`root` / no password)
- `REDIS_*` — defaults match redis service
- `AWS_*` / `FILESYSTEM_DISK=s3` — points at the minio service

Frontend: `VITE_API_URL` defaults to `/api/v1` if unset (proxy handled by nginx in production, Vite proxy in dev).

### Database

MySQL 8.0. Two migrations: `create_crm_tables` (all core tables) and `create_opportunity_stage_history_table`. Seeders: `RolePermissionSeeder` (must run first), `UserSeeder` (creates default admin). All core models use soft deletes.
