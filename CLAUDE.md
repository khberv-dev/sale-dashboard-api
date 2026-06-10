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

# Database (requires built dist)
npm run db:sync         # build then sync schema via TypeORM
npm run db:seed         # build then run dist/seed.js
npm run db:clear        # drop schema
```

## Architecture

NestJS 11 REST + WebSocket API backed by PostgreSQL (TypeORM). All routes are prefixed `/api`. The database schema uses `synchronize: true` — entity changes are applied automatically on startup; there are no migration files.

### Module layout

| Path | Purpose |
|---|---|
| `src/modules/auth` | JWT sign-in (`passport-jwt`). `@IsPublic()` skips guard; `@IsAdmin()` marks admin-only. |
| `src/modules/user` | `UserService` (self-profile, password, attendance) + `ManagerService` (admin CRUD for managers). |
| `src/modules/sale` | Sale CRUD, sale-type management, leaderboard stats with salary computation. |
| `src/modules/team` | Team management; managers belong to one team. |
| `src/modules/contract` | Contract signing flow with captcha. |
| `src/modules/integration` | AmoCRM (lead-count sync), Sipuni (call duration), Telegram `StaffBotService` (daily reports). Cron schedules are read from env at startup. |
| `src/shared/modules/stats` | `SalesService`, `SalaryService`, `CallsService` — shared calculation logic reused across modules. |
| `src/shared/modules/ws` | `EventGateway` (Socket.io) broadcasts `new-sale` events to all connected clients. |
| `src/shared/modules/notify` | `BotService` — Telegram bot notifications for sale events. |
| `src/shared/entities` | TypeORM entities: `User`, `Sale`, `SaleType`, `Team`, `CrmProfile`, `Call`, `Attendance`, `SalaryBonus`, `Contract`. |

### Auth flow

`DefaultAuthGuard` (`src/common/guards/default-auth.guard.ts`) composes `JwtAuthGuard` + `RolesGuard`. Apply it as a decorator on controllers or individual routes. Use `@IsPublic()` to bypass auth, `@IsAdmin()` to restrict to the `ADMIN` role.

### Salary calculation

`SalaryService.calculateSalary` computes: fixed base (1,000,000) + tiered sale bonus (3–10% based on monthly sale amount) + `SalaryBonus` records (attendance bonuses, manual adjustments). Constants live in `src/shared/constants.ts`.

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
- `BOT_TOKEN`, `STAFF_BOT_TOKEN`, `GROUP_ID` — Telegram bots
- `AMOCRM_API_URL`, `AMOCRM_API_KEY` — AmoCRM integration
- `SIPUNI_API_*` — Sipuni call tracking
- `CRON_LEAD_COUNT_SYNC`, `CRON_DAILY_REPORT` — cron expressions read at process start (changing them requires a restart)

### Static files

Avatar uploads are stored in `./uploads/` and served at `/public/*` via `ServeStaticModule`.

### Language note

User-facing response messages are written in Uzbek.
