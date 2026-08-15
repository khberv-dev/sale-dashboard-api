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
npm run test            # unit tests (Jest, rootDir: src, testRegex .*\.spec\.ts$)
npm run test -- path/to/file.spec.ts    # single file
npm run test -- -t "test name"          # single test by name
npm run test:cov        # with coverage
npm run test:e2e        # BROKEN: ./test/jest-e2e.json does not exist (no test/ directory)

# Database
npm run db:sync         # build then sync schema via TypeORM
npm run db:seed         # build then run dist/seed.js
npm run db:clear        # drop schema
npm run db:reset        # BROKEN: package.json calls "npm run db:clean" (no such script) — run db:clear then db:sync instead
```

The repo has no `*.spec.ts` files and no `test/` directory, so both test commands currently find nothing to run.

## Architecture

NestJS 11 REST + WebSocket API backed by PostgreSQL (TypeORM). All routes are prefixed `/api` (`main.ts`). Global `ValidationPipe` runs with `whitelist` + `forbidNonWhitelisted`, so any body/query field not declared on a DTO is a 400 — DTOs must be updated when adding request fields.

`synchronize: true` is set in `src/config/data-source.config.ts`; there are no migration files. Entities are loaded from the compiled glob `dist/**/*.entity.js`, not from `src` — a newly added entity only reaches the DB after a build.

### Module layout

| Path | Purpose |
|---|---|
| `src/modules/auth` | JWT sign-in (`passport-jwt`). |
| `src/modules/user` | `UserService` (self-profile, password, attendance, plan/position updates) + `ManagerService` (admin CRUD for managers). |
| `src/modules/sale` | Sale CRUD, sale-type management, leaderboard stats with salary computation, AmoCRM webhook. |
| `src/modules/team` | Team management; managers belong to one team. |
| `src/modules/contract` | Contract signing flow with captcha (captcha codes stored in the global `CacheModule`). |
| `src/modules/learning` | Enrollment into the external learning platform, which also records a sale. |
| `src/modules/integration` | Outbound API clients + cron: AmoCRM (lead-count sync), Sipuni (call duration — cron currently commented out), `LearningService`, Telegram `StaffBotService` (daily reports). |
| `src/shared/modules/stats` | `SalesService`, `SalaryService`, `CallsService` — calculation logic reused across modules. |
| `src/shared/modules/ws` | `EventGateway` (Socket.io) broadcasts to all connected clients; `new-sale` is the only event. |
| `src/shared/modules/notify` | `BotService` — Telegram notifications for sale events. |
| `src/shared/entities` | `User`, `Sale`, `SaleType`, `Team`, `CrmProfile`, `Call`, `Attendance`, `SalaryBonus`, `Contract`, `PlanHistory`, `PositionHistory`. |

### Auth flow

`DefaultAuthGuard` (`src/common/guards/default-auth.guard.ts`) is a composed decorator (`JwtAuthGuard` + `RolesGuard`), applied per controller or per route. `@IsPublic()` bypasses JWT; `@IsAdmin()` restricts to the `ADMIN` role.

JWT payload is `{ sub: userId, role }`; `JwtStrategy.validate` reshapes it, so handlers read `req.user.id` (not `req.user.sub`).

Guarding is opt-in per controller, and coverage is currently uneven: `TeamController` has no guard at all, and `ContractController` only guards `GET all` (captcha generate + contract sign are intentionally public). `POST /api/sale/wh-create` is `@IsPublic()` because AmoCRM calls it — it has no signature verification. Don't assume a controller is authenticated; check for the decorator.

### Sale recording paths

`SaleService.persistAndBroadcast` (private) is the single write path for a sale. Three entry points reach it:

- `createSale` — manual creation from the dashboard, parses `date` + `time` into `saleAt`.
- `whCreate` — AmoCRM webhook, fires only when a lead's `status_id` is `'142'`; maps `responsible_user_id` → `CrmProfile.accountId` → manager, and swallows per-lead errors so one bad lead can't fail the batch.
- `recordSale` — the public wrapper other modules call (currently `EnrollmentService`); resolves the manager and delegates.

Anything recording a sale should go through `recordSale` rather than the repository, because `persistAndBroadcast` also computes `is100MPassed` (whether the month's cumulative total just crossed a 100,000,000 boundary), broadcasts `new-sale` over WS, and sends the Telegram notification. Note it calls `getStats` twice (before and after the insert) to detect that crossing, so a sale write is expensive.

### Learning platform enrollment

`EnrollmentService.enroll` (`src/modules/learning/enrollment.service.ts`) creates the enrollment on the external platform **first**, then records the sale. The order is deliberate and the sale write is wrapped in try/catch: an enrollment cannot be rolled back, so a failed sale write is logged and reported via `saleRecorded: false` in the response rather than throwing, which would push the manager to retry and double-enroll.

`LearningService` (`src/modules/integration/learning.service.ts`) authenticates with a shared `X-Auth` key (not JWT) against `external/*` endpoints, and builds its Axios client lazily so missing config degrades only these routes instead of blocking startup. Its `request` wrapper forwards the platform's own 4xx messages verbatim (they're already Uzbek) and collapses 5xx/network errors into a generic message.

### Salary calculation

`SalaryService.calculateSalary` sums: position-based fixed base (`FIXED_SALARY_BY_POSITION`) + tiered sale bonus (3–10%, thresholds inline in the service) + `SalaryBonus` rows in range (attendance bonuses, manual adjustments) + flat `PLAN_REACHED_BONUS_SUM` when the manager's sale amount meets their latest `PlanHistory` plan. Bonus/threshold constants live in `src/shared/constants.ts`. Salary is recomputed live per manager on every `getStats` call, with no caching — `getStats` runs `calculateSalary` once per manager per range, and it is called twice per sale.

### Plan and position history

`PlanHistory` and `PositionHistory` are append-only logs, each row timestamped by `date`. `User.position` holds the current position directly, but there is **no** `User.plan` column — the current plan is always the latest `PlanHistory` row (`ORDER BY date DESC`), read that way by `UserService`, `SalaryService`, and `SaleService.getManagersResult` (as an inline subquery). `UserService.updateManager` / `setMonthPlan` insert a new history row instead of mutating. `MINIMUM_MONTHLY_PLAN` is enforced wherever a plan is set (`BadRequestException` below it).

`monthPlan` in the stats response is the **admin** user's latest plan, not a manager's. When the `byTeam` filter is on, it's divided by the total team count.

### Stats filtering

`getStats(filter, userId)` resolves `filter.byTeam` into the requesting user's `teamId`, then threads that team filter through the manager leaderboard, the daily series, and the 6-month series. The three queries are hand-written SQL with positional params (`$3` is the team id when present) — keep the param arrays and the conditional fragments in sync when editing them.

### Cron jobs

Cron expressions in `synchronize.service.ts` are read from `process.env` directly at decorator-evaluation time, not via `ConfigService`, so changing `CRON_*` requires a process restart. `CRON_CALL_DURATION_SYNC` is commented out.

### Path aliases

`@/*` → `src/*`, `@core/*`, `@modules/*`, `@common/*`, `@shared/*` → the matching `src` directory. Imports across modules use these consistently; follow that rather than relative paths.

### Environment variables

See `.env.example`. `PORT`, `DB_*`, `JWT_SECRET`/`JWT_EXPIRES`, `BOT_TOKEN`/`STAFF_BOT_TOKEN`/`GROUP_ID` (Telegram, via `grammy` — note it's in devDependencies), `AMOCRM_API_URL`/`AMOCRM_API_KEY`, `SIPUNI_API_*`, `LEARNING_API_URL`/`LEARNING_API_KEY`, `CRON_*`, and `PROXY_URL` (optional HTTPS proxy applied by the AmoCRM/Sipuni/Learning clients).

### Static files

Avatar uploads are written to `./uploads/` and served at `/public/*` via `ServeStaticModule`.

### Language

User-facing response messages, validation messages, and code comments are written in Uzbek. Log messages are in English. Match this when adding code.
