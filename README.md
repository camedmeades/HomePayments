# Billcal — Household Bills & Finance Manager

A local-first desktop app for managing household bills, payment status, and cost trends.
Currently at **Phase 1.0** — project scaffold. You should be able to install dependencies,
run it, and see the app open with a working sidebar and a Dashboard that confirms the
database is operational.

This README assumes Windows and no prior Node.js experience.

---

## What you need installed first

1. **Node.js 22 LTS** — https://nodejs.org → download the "LTS" installer → run it,
   accept defaults. (At one prompt it asks if you want to install "Tools for Native
   Modules" with Chocolatey — **say yes**. This installs the C++ build tools that
   `better-sqlite3` needs.)
2. **A code editor** — Visual Studio Code is the obvious choice:
   https://code.visualstudio.com
3. **Git** (optional, recommended) — https://git-scm.com/download/win

To verify Node is installed, open **PowerShell** and run:
```powershell
node --version
npm --version
```
You should see something like `v22.x.x` and `10.x.x`.

---

## First-time setup

Open PowerShell, navigate to wherever you've unzipped this project, then:

```powershell
cd billcal
npm install
```

This will take **3–10 minutes the first time** — it's downloading dependencies and
compiling `better-sqlite3` and `keytar` against Electron's Node version. If you see
red error text, scroll up to find the first error; the most common cause is missing
build tools (re-run the Node installer and pick the native-tools option).

---

## Running the app

```powershell
npm run dev
```

A window titled **Billcal** should appear within 10–15 seconds. You should see:
- A sidebar on the left with nine navigation entries.
- A Dashboard page in the centre showing:
  - App version
  - DB schema version
  - Entity count (3: Personal, Investment, Business)
  - Category count (20)
  - Encryption status (should say "Active")
  - The full path to your local database file

If you see those numbers, **the whole stack is working** — database, IPC bridge,
React, encryption key in Windows Credential Manager, the lot.

To stop the app, close the window or press **Ctrl+C** in PowerShell.

---

## Where your data lives

On Windows, application data is stored at:
```
%APPDATA%\billcal\
```
which expands to something like:
```
C:\Users\<your-username>\AppData\Roaming\billcal\
```

Inside that folder:
- `billcal.db` — the SQLite database file.
- `logs/main.log` — application logs (useful if something goes wrong).
- `backups/` — destination for auto-backups (Phase 1.3+).

The master encryption key lives in **Windows Credential Manager** under the
"billcal" entry. If you want a clean reset:
1. Delete the `billcal` folder above.
2. Open "Credential Manager" via Windows search → "Windows Credentials" tab → look
   for an entry starting with `billcal` → remove it.

---

## Common scripts

| Command | What it does |
|---|---|
| `npm run dev` | Launch app in development mode (hot reload) |
| `npm run build` | Build production bundles into `out/` |
| `npm run package:win` | Build a Windows installer (`.exe`) into `dist/` |
| `npm run typecheck` | Run TypeScript across the whole project |
| `npm run db:generate` | After editing `electron/db/schema.ts`, generate a migration |
| `npm run db:studio` | Open Drizzle Studio in a browser to inspect the DB |

---

## Project structure

```
billcal/
├── electron/                 Main process (runs in Node.js)
│   ├── main.ts               Entry — creates the window, lifecycle
│   ├── preload.ts            Secure bridge into the renderer
│   ├── ipc.ts                Registers IPC handlers
│   ├── db/
│   │   ├── schema.ts         All database tables (Drizzle ORM)
│   │   ├── index.ts          Connection + migration runner
│   │   ├── seed.ts           Default entities & categories
│   │   └── migrations/       SQL migration files
│   ├── services/             Business logic, one file per domain
│   └── lib/                  paths, logger, crypto
├── src/                      React renderer
│   ├── main.tsx              React entry
│   ├── App.tsx               Routes
│   ├── components/           Shared UI components
│   ├── routes/               One file per page
│   ├── lib/                  api client, formatters
│   └── styles.css            Tailwind imports + component classes
├── shared/                   Types + IPC contract (used by both sides)
└── ...config files
```

---

## What's next (Phase 1.2)

- Bills CRUD: create, edit, archive, mark paid/scheduled/cancelled.
- Bill detail drawer (slide-from-right).
- Bills list with filters by entity/category/status.
- Payment event timeline on each bill.

Then Phase 1.3: Settings page (PIN toggle, backup folder picker, daily backup job).

Then Phase 2: Gmail OAuth and the review inbox.

## Status — Phase 1.1

You can now:
- **Entities**: create, edit, archive, restore (with confirm). Reserved colour/icon picker. Refuses to archive entities attached to bills.
- **Categories**: create, edit, archive, restore, **merge** (re-points all bills + suppliers to target, archives source — all in a single transaction).
- **Suppliers**: create, edit, remove. Set default entity and category so future bills pre-fill.
- All mutations are validated by Zod on both sides of the IPC boundary and logged to the audit table.
- Toasts confirm every success and surface every error from the main process.

---

## Troubleshooting

**"Cannot find module 'better-sqlite3'"** — `npm install` didn't compile the native
modules. Run `npm run postinstall` manually, or reinstall Node with the native-tools
option checked.

**"keytar not available"** — keytar failed to load (rare on Windows). The app will
still run; you'll see "Encryption: Unavailable" on the dashboard. Logs in
`%APPDATA%\billcal\logs\main.log` will show the underlying error.

**Window opens to a blank page** — open DevTools (it should open automatically in
dev mode) and check the Console tab for errors. Most often this is a missing
dependency or a TypeScript error preventing the renderer build.

**Anything else** — check the logs first (`%APPDATA%\billcal\logs\main.log`), then
share the relevant excerpt and we'll debug.
