# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev       # watch mode
npm run build           # compile TypeScript

# Linting / formatting
npm run lint            # ESLint with auto-fix
npm run format          # Prettier

# Tests
npm run test            # unit tests (Jest, rootDir: src)
npm run test:watch      # watch mode
npm run test:cov        # with coverage
npm run test:e2e        # e2e tests (./test/jest-e2e.json)

# Database (requires built dist for db:sync/db:seed)
npm run db:sync         # build then sync schema via TypeORM
npm run db:seed         # build then run dist/seed.js
npm run db:clear        # drop schema
npm run db:reset        # BROKEN: package.json calls "npm run db:clean" (no such script) — use db:clear then db:sync manually
```

## Architecture

NestJS 11 REST + WebSocket API backed by PostgreSQL (TypeORM). All routes are prefixed `/api`. The database schema uses `synchronize: true` — entity changes applied automatically on startup; no migration files.

### Module layout

| Path | Purpose |
|---|---|
| `src/modules/auth` | JWT sign-in (`passport-jwt`). `@IsPublic()` skips guard; `@IsAdmin()` marks admin-only. |
| `src/modules/user` | `UserService` (self-profile, password, attendance) + `ManagerService` (admin CRUD for managers). |
| `src/modules/sale` | Sale CRUD, sale-type management, leaderboard stats with salary computation. |
| `src/modules/team` | Team management; managers belong to one team. |
| `src/modules/contract` | Contract signing flow with captcha (uses global `CacheModule` for captcha sessions). |
| `src/modules/integration` | AmoCRM (lead-count sync), Sipuni (call duration — currently commented out), Telegram `StaffBotService` (daily reports). |
| `src/shared/modules/stats` | `SalesService`, `SalaryService`, `CallsService` — shared calculation logic reused across modules. |
| `src/shared/modules/ws` | `EventGateway` (Socket.io) broadcasts `new-sale` events to all connected clients. |
| `src/shared/modules/notify` | `BotService` — Telegram bot notifications for sale events. |
| `src/shared/entities` | TypeORM entities: `User`, `Sale`, `SaleType`, `Team`, `CrmProfile`, `Call`, `Attendance`, `SalaryBonus`, `Contract`, `PlanHistory`, `PositionHistory`. |

### Auth flow

`DefaultAuthGuard` (`src/common/guards/default-auth.guard.ts`) is a decorator that composes `JwtAuthGuard` + `RolesGuard`. Apply it on controllers or individual routes. Use `@IsPublic()` to bypass auth, `@IsAdmin()` to restrict to the `ADMIN` role.

JWT payload carries `{ sub: userId, role }`. The admin's monthly sales target (`monthPlan` in stats responses) is not a column on `User` — it's the latest `PlanHistory` row for the admin user (see "Plan and position history" below).

### Sale creation paths

`SaleService.persistAndBroadcast` (private, `src/modules/sale/sale.service.ts`) is the single path for recording a sale, shared by manual creation (`create`) and the AmoCRM webhook handler (`whCreate`, triggered when a lead's `status_id` is `'142'`). It saves the `Sale`, computes whether the month's cumulative total just crossed a 100,000,000 threshold (`is100MPassed`), broadcasts `new-sale` via `EventGateway`, and sends a Telegram notification via `BotService`.

### Salary calculation

`SalaryService.calculateSalary` computes: position-based fixed base (`FIXED_SALARY_BY_POSITION`, `src/shared/constants.ts`) + tiered sale bonus (3–10% based on monthly sale amount thresholds defined inline) + `SalaryBonus` records (attendance bonuses, manual adjustments) + a flat `PLAN_REACHED_BONUS_SUM` if the manager's sale amount meets/exceeds their most recent `PlanHistory` entry. Attendance bonus and call duration bonus constants also live in `src/shared/constants.ts`. Salary is computed live per manager on every `getStats` call — no caching.

### Plan and position history

`PlanHistory` and `PositionHistory` (`src/shared/entities`) are append-only logs of every change to a manager's monthly plan or position, each row timestamped via `date`. `User.position` still holds the current position directly, but there is no `User.plan` column — the current plan is always derived from the latest `PlanHistory` row (`ORDER BY date DESC`), which `UserService`, `ManagerService`, `SalaryService`, and `sale.service.ts` all read this way rather than storing it. `UserService.updateManager` and `UserService.setMonthPlan` insert a new `PlanHistory`/`PositionHistory` row on change instead of mutating in place. `MINIMUM_MONTHLY_PLAN` (`src/shared/constants.ts`) is enforced wherever a plan is set — requests below it throw `BadRequestException`.

### Cron jobs

Cron expressions are read from `process.env` directly at module load time (not via `ConfigService`), so changing `CRON_*` env vars requires a process restart. `CRON_CALL_DURATION_SYNC` is currently commented out in `synchronize.service.ts`.

### Path aliases

| Alias | Maps to |
|---|---|
| `@/*` | `src/*` |
| `@core/*` | `src/core/*` |
| `@modules/*` | `src/modules/*` |
| `@common/*` | `src/common/*` |
| `@shared/*` | `src/shared/*` |

### Environment variables

See `.env.example`. Key variables:
- `PORT` — HTTP port
- `DB_*` — PostgreSQL connection
- `JWT_SECRET`, `JWT_EXPIRES`
- `BOT_TOKEN`, `STAFF_BOT_TOKEN`, `GROUP_ID` — Telegram bots (`grammy` library, in devDependencies)
- `AMOCRM_API_URL`, `AMOCRM_API_KEY` — AmoCRM integration
- `SIPUNI_API_*` — Sipuni call tracking
- `CRON_LEAD_COUNT_SYNC`, `CRON_DAILY_REPORT` — cron expressions read at process start
- `PROXY_URL` — optional HTTP proxy for AmoCRM/Sipuni external API clients

### Static files

Avatar uploads stored in `./uploads/` and served at `/public/*` via `ServeStaticModule`.

### Language note

User-facing response messages are written in Uzbek.
