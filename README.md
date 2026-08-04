# FleetFuel — Fleet Fuel Management

A responsive, mobile-optimised web application for managing **diesel & super-diesel**
requests and issues across the E&C construction fleet, with **running tracking
(km for vehicles, hours for machinery/generators)**, **monthly reports with charts**,
automatic **Ceypetco fuel-price** tracking (LKR), and **daily database backups**.

Built as a single Next.js full-stack app backed by SQLite.

---

## Highlights

- **Fleet** — assets keyed by your existing **E&C asset codes** (DT, VR, LB, HEX, MB…),
  imported from `MACHINE_LIST_2025.10.01.xlsx`. Each asset auto-tracks **km** (road
  vehicles) or **hours** (machinery/gensets).
- **Two fuel flows** — record a **direct fuel issue**, or submit a **request** that an
  admin **approves** (which creates the linked issue). Every issue snapshots the price
  effective on its date and computes cost in **LKR**.
- **Running & efficiency** — odometer/hour-meter readings drive per-asset running charts
  and efficiency (**km/L** for vehicles, **L/hr** for machinery).
- **Reports** — monthly summary + breakdowns by fuel, category and asset, with charts;
  export to **Excel/CSV** and **print to PDF**.
- **Roles** — **Admin** has full control; **User** is **add-only** (can create requests,
  issues and readings; cannot edit, delete or approve). Enforced server-side.
- **Prices** — diesel & super-diesel price history. Best-effort monthly scrape of
  [ceypetco.gov.lk](https://ceypetco.gov.lk/historical-prices/) with **manual entry as the
  reliable source of truth** (the government site blocks bots).
- **Ops** — daily SQLite snapshot with rotation; in-process scheduler for monthly price
  refresh + daily backup; full audit log.

## Tech stack

Next.js 16 (App Router, TypeScript) · Prisma 6 + **SQLite** · Tailwind CSS v4 ·
Recharts · jose + bcryptjs (auth) · Zod · SheetJS (`xlsx`) · node-cron.

---

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment (copy and fill secrets)
cp .env.example .env
#    Generate AUTH_SECRET:  node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# 3. Create the database and import the fleet
npx prisma migrate dev      # creates data/app.db
npm run seed                # imports assets, fuel prices, default users

# 4. Run
npm run dev                 # http://localhost:3000
```

### Importing the full fleet

`prisma/fleet-seed.json` ships with a representative sample. To load the complete
~402-asset fleet, drop the original workbook at `prisma/fleet.xlsx` and run:

```bash
npx tsx scripts/gen-fleet-json.ts   # regenerates prisma/fleet-seed.json from the .xlsx
npm run seed                        # re-imports (idempotent upsert by asset code)
```

### Default logins (from the seed — change after first sign-in)

| Role  | Username   | Password         |
|-------|------------|------------------|
| Admin | `admin`    | `ChangeMe!2026`  |
| User  | `operator` | `Operator!2026`  |

> Passwords come from `SEED_ADMIN_PASSWORD` / `SEED_USER_PASSWORD` in `.env`.

---

## How it works

### Roles (add-only Users)
All mutations pass a single server-side chokepoint (`src/lib/rbac.ts` → `assertCan`).
The permission matrix lives in `src/lib/permissions.ts`: **ADMIN** can `create/update/
delete/approve/manage`; **USER** can only `create`. UI hiding is cosmetic — a User who
forges a request still gets `403 FORBIDDEN`. Verify with `npm run test:permissions`.

### Metering
Every fuel issue with a reading, and every manual reading, writes a cumulative
`MeterReading`. Running over a period = the reading delta (anchored to the last reading
before the period). Efficiency is km/L (vehicles) or L/hr (machinery). Backward readings
are rejected.

### Fuel prices
`FuelPrice` keeps full history; a fuel issue is costed at the latest price whose
`effectiveFrom <= issueDate`. Admins add/override prices at **Admin → Fuel Prices**.
The **Refresh from Ceypetco** button (and the monthly job) attempt a scrape with
browser-like headers; because the site blocks bots, it falls back gracefully and asks
for manual entry rather than writing bad data.

### Backups
`VACUUM INTO` produces a consistent snapshot in `/backups` (gitignored), rotated by
`backup.retentionDays` (default 7). Trigger from **Admin → Backups** or `npm run backup`.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev / production build / serve |
| `npm run seed` | Idempotent fleet + price + user import from `prisma/fleet-seed.json` |
| `npm run backup` | One-off database snapshot (for system cron) |
| `npm run refresh-prices` | One-off Ceypetco price refresh (for system cron) |
| `npm run test:permissions` | Assert the add-only permission matrix |
| `npm run test:flow` | Functional check of price/cost/running/efficiency math |

---

## Deployment (single VPS)

Run as a long-lived Node process so the scheduler and single-file SQLite work
(**do not use serverless** — no persistent cron, ephemeral filesystem):

```bash
npm ci && npx prisma migrate deploy && npm run seed   # first deploy only
npm run build && npm run start                        # serves on :3000
```

The in-process scheduler (price refresh + backup) registers automatically when
`ENABLE_SCHEDULER=true`. Alternatively, disable it and drive the cron routes from
system cron:

```cron
0 6 1 * *  curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" http://127.0.0.1:3000/api/cron/refresh-prices
30 2 * * * curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" http://127.0.0.1:3000/api/cron/backup
```

For disaster recovery, copy `/backups` off-box (rsync / cloud) on a schedule.

---

## Security

- **All secrets live in `.env` (gitignored).** Never commit `AUTH_SECRET`, `CRON_SECRET`,
  passwords, or API tokens. `.env.example` documents the variables with placeholders.
- Passwords are bcrypt-hashed; sessions are signed JWTs in httpOnly cookies.
- If a credential is ever exposed (e.g. pasted in chat), **revoke/rotate it immediately**.

## Notes on this build

- **PDF reports** use the print-optimised report page (browser “Print / Save as PDF”),
  which renders the charts faithfully — chosen over a heavy PDF library for reliability.
- **UI** is hand-built with Tailwind (no component-CLI dependency), fully responsive with
  a mobile bottom-nav.
