# Billcal — Household Bills & Finance Manager

A local-first desktop app for managing household bills, payment status, and cost trends.
Currently at **Phase 1.1** — entities, categories, and suppliers are fully working.

This README assumes Windows and no prior Node.js experience.

---

## What you need installed first

1. **Node.js 22 LTS** — https://nodejs.org → download the "LTS" installer → run it,
   accept defaults. (At one prompt it asks if you want to install "Tools for Native
   Modules" with Chocolatey — **say yes**. This installs the C++ build tools that
   `better-sqlite3` needs.)
2. **Git** — https://git-scm.com/download/win → run the installer, accept defaults.
3. **A code editor** (optional) — Visual Studio Code: https://code.visualstudio.com

To verify both are installed, open **PowerShell** and run:
```powershell
node --version
git --version
```
You should see something like `v22.x.x` and `git version 2.x.x`.

---

## Getting the code

Open PowerShell and run:

```powershell
cd C:\Dev
git clone https://github.com/camedmeades/HomePayments.git HomePay
cd HomePay
```

This downloads the project into `C:\Dev\HomePay`.

---

## First-time setup

Still inside `C:\Dev\HomePay`, run:

```powershell
npm install
```

This will take **3–10 minutes the first time** — it downloads dependencies and compiles
`better-sqlite3` and `keytar` against Electron's Node version. If you see red error text,
scroll up to find the first error; the most common cause is missing build tools (re-run
the Node installer and pick the native-tools option).

---

## Running the app

```powershell
npm run dev
```

A window titled **Billcal** should appear within 10–15 seconds. You should see:
- A sidebar on the left with navigation entries.
- A Dashboard page showing:
  - App version
  - DB schema version
  - Entity count (3: Personal, Investment, Business)
  - Category count (20)
  - Encryption status (should say "Active")
  - The full path to your local database file (`C:\Dev\HomePay\billcal.db`)

If you see those numbers, **the whole stack is working** — database, IPC bridge,
React, encryption key in Windows Credential Manager, the lot.

To stop the app, close the window or press **Ctrl+C** in PowerShell.

---

## Getting updates

Whenever there are new changes on GitHub, pull them down and reinstall:

```powershell
cd C:\Dev\HomePay
git pull
npm install
```

Then run `npm run dev` as normal.

---

## Where your data lives

All app data is stored in:
```
C:\Dev\HomePay\
```

Inside that folder (created on first launch):
- `billcal.db` — the SQLite database file.
- `logs\main.log` — application logs (useful if something goes wrong).
- `backups\` — destination for auto-backups (Phase 1.3+).

The master encryption key lives in **Windows Credential Manager** under the
"billcal" entry. If you want a clean reset:
1. Delete `billcal.db` from `C:\Dev\HomePay\`.
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

## What's working now (Phase 1.1)

- **Entities**: create, edit, archive, restore. Refuses to archive entities attached to bills.
- **Categories**: create, edit, archive, restore, **merge** (re-points all bills + suppliers to target, archives source — single transaction).
- **Suppliers**: create, edit, remove. Set default entity and category so future bills pre-fill.
- All mutations validated by Zod on both sides of the IPC boundary and logged to the audit table.
- Toasts confirm every success and surface every error.

---

## What's next

- **Phase 1.2** — Bills CRUD: create, edit, archive, mark paid/scheduled/cancelled. Bill list with filters. Detail drawer with payment timeline.
- **Phase 1.3** — Settings page: PIN toggle, backup folder picker, daily backup job.
- **Phase 2** — Gmail OAuth and the review inbox.

---

## Troubleshooting

**"Cannot find module 'better-sqlite3'"** — `npm install` didn't compile the native
modules. Run `npm run postinstall` manually, or reinstall Node with the native-tools
option checked.

**"keytar not available"** — keytar failed to load (rare on Windows). The app will
still run; you'll see "Encryption: Unavailable" on the dashboard. Check
`C:\Dev\HomePay\logs\main.log` for details.

**Window opens to a blank page** — open DevTools (it opens automatically in dev mode)
and check the Console tab for errors. Most often a missing dependency or TypeScript error.

**Anything else** — check `C:\Dev\HomePay\logs\main.log` first, then share the relevant
excerpt and we'll debug.
