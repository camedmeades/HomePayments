# CLAUDE.md — billcal project briefing

This file is loaded into every Claude Code session. It captures decisions already made, conventions in force, and the current state of the project so you (the assistant) don't need to re-litigate settled questions or re-discover the codebase from scratch.

---

## About the developer

The developer has **no prior programming experience** in any language, Rust or JavaScript or otherwise. They are a domain expert (a household financial decision-maker in Australia) directing the build. This affects how you should work:

- **Explain what you're about to do** before doing it, in plain English. Avoid jargon unless you also define it.
- **Show diffs and wait for approval.** Default to Ask Permissions mode and do not deviate.
- **Prefer small, runnable, demonstrable slices** over big multi-file changes. After every change, the developer should be able to run `npm run dev` and see the result.
- **When errors appear**, walk through what the error means and the fix in calm prose. Don't just patch and move on.
- **Don't assume tooling familiarity.** Spell out npm commands, file paths, and shortcuts.

---

## What billcal is

A local-first desktop app for managing household, investment, and business bills. It:

1. Connects to Gmail and detects bills, reminders, receipts, overdue notices.
2. Organises them on a colour-coded calendar by entity, category, and status.
3. Tracks payment status (auto / manual / scheduled / paid / overdue).
4. Surfaces a notice board for items needing attention.
5. Analyses cost trends over time and generates insights.
6. Stores everything locally in SQLite with field-level encryption on sensitive columns.

Target user: AU-based, manages personal + investment property + small business bills, currently relies on Gmail search and memory.

---

## Decisions already made — do NOT re-litigate

These were settled after careful discussion. Don't propose alternatives unless the developer explicitly asks.

| Decision | Choice | Rationale |
|---|---|---|
| Desktop framework | **Electron** | Developer has no Rust experience; ecosystem maturity matters more than the privacy positioning of Tauri for a personal-use app |
| Database | **SQLite via better-sqlite3** | Local-first, no server, synchronous API simplifies code |
| ORM | **Drizzle** | Type-safe, lightweight, plays well with sync better-sqlite3 |
| Frontend | **React 18 + TypeScript strict** | |
| Routing | **react-router-dom v6** | Lower learning curve than TanStack Router for a beginner |
| State/data | **TanStack Query** | Caching, mutations, invalidation patterns are well-established |
| UI primitives | **Radix (Dialog, Label, Select) + Tailwind** | Accessible, no vendor lock-in |
| Forms | **React Hook Form + Zod resolvers** | Schema shared between renderer and main process |
| Toasts | **Sonner** | |
| Icons | **lucide-react** | |
| Build tool | **electron-vite** | Handles main + preload + renderer with one config |
| Secret storage | **keytar → Windows Credential Manager** | |
| Encryption | **AES-256-GCM, field-level** on sensitive columns | Master key in OS keychain, NOT user password |
| App lock | **Optional toggle in settings** (off by default) | Not required at every launch |
| Backups | **Auto-export daily to user-chosen folder + 7-day-stale nudge** | |
| Distribution | **Personal use only**, Windows first, Mac later | No OAuth verification, no app store |
| LLM extraction | **Cloud LLM acceptable** with privacy controls; regex fallback supported but not primary | |
| AU specifics | **AUD only, AU financial year (Jul–Jun), BPAY fields, GST tracking** | |
| Bill creation flow | **Always reviewed before commit** in MVP — no silent auto-creation | |

---

## Stack reference

```
Shell:        Electron 33
Renderer:     React 18, TypeScript strict, Vite
Routing:      react-router-dom v6
Data:         @tanstack/react-query, react-hook-form + zod
UI:           Tailwind, Radix (Dialog, Label, Select), lucide-react, sonner
Charts:       Recharts (not added yet — Phase 4)
Calendar:     FullCalendar React (not added yet — Phase 3)
Main:         Node 22 (via Electron), better-sqlite3, drizzle-orm, keytar, electron-log
Auth/Cloud:   googleapis + google-auth-library (not added yet — Phase 2)
LLM:          @anthropic-ai/sdk (not added yet — Phase 2)
Build:        electron-vite, electron-builder (Windows NSIS)
```

---

## Architecture

Three processes:

1. **Main** (Electron, Node) — `electron/main.ts`. Window creation, lifecycle, hardening. Owns the database, encryption keys, Gmail OAuth tokens. Never directly accessed by the UI.
2. **Preload** (Electron, sandboxed) — `electron/preload.ts`. Exposes a typed `window.api` object to the renderer via `contextBridge`. The ONLY surface the renderer touches.
3. **Renderer** (React) — `src/`. Pure UI. No Node access, no file system, no native APIs. Talks to main exclusively through `window.api`.

The IPC contract lives in `shared/ipc-contract.ts` and is the single source of truth for:
- Channel names (the `IPC` const)
- Zod schemas for every request and response
- The `BillcalApi` interface that types `window.api`

**Both sides validate.** The main process re-parses input through Zod inside each service function. Don't trust the preload to have filtered anything.

### IPC flow for a CRUD call

```
React component
  → useMutation calls api.entities.create(input)         [src/lib/api.ts]
  → window.api.entities.create(input)                     [bridged in preload]
  → ipcRenderer.invoke('entities:create', input)
  → main process handler in electron/ipc.ts
  → service function createEntity(input)                  [electron/services/entities.ts]
    → Zod parse + business logic + DB insert + audit log
  → returns Entity to renderer
  → TanStack Query invalidates ['entities'], toast fires
```

When adding new functionality, follow this exact path. Don't shortcut around it.

---

## Project structure

```
billcal/
├── electron/                      Main process (Node, has full access)
│   ├── main.ts                    Entry — window, hardening, lifecycle
│   ├── preload.ts                 Sandboxed bridge to renderer
│   ├── ipc.ts                     IPC handler registration
│   ├── db/
│   │   ├── schema.ts              ALL Drizzle tables — single source of truth
│   │   ├── index.ts               Connection, migration runner, pragmas
│   │   ├── seed.ts                Default entities + categories on first run
│   │   └── migrations/            SQL migration files (hand-written or generated)
│   ├── services/                  One file per domain
│   │   ├── audit.ts               Audit log helper used by every mutation
│   │   ├── entities.ts            Entity CRUD
│   │   ├── categories.ts          Category CRUD + merge
│   │   ├── suppliers.ts           Supplier CRUD
│   │   ├── health.ts              Diagnostic for the Dashboard
│   │   └── (bills, gmail, ... arriving in later phases)
│   └── lib/
│       ├── paths.ts               User data dir resolution
│       ├── logger.ts              electron-log setup
│       └── crypto.ts              AES-256-GCM field-level encryption
├── src/                           Renderer (React, no Node access)
│   ├── main.tsx                   React entry, QueryClient, Toaster
│   ├── App.tsx                    Routes
│   ├── routes/                    One file per page
│   ├── components/                Shared components (AppShell, forms, etc.)
│   │   └── ui/                    Primitives (Button, Input, Dialog, pickers)
│   ├── hooks/                     Reusable hooks (currently empty)
│   ├── lib/
│   │   ├── api.ts                 Typed wrapper around window.api
│   │   └── format.ts              AUD, dates, AU FY helpers
│   └── styles.css                 Tailwind + component classes
└── shared/                        Used by BOTH main and renderer
    ├── types.ts                   Domain types (Entity, Bill, etc.)
    └── ipc-contract.ts            IPC channels, Zod schemas, BillcalApi
```

**Path aliases (set in tsconfig + vite + electron-vite config):**
- `@/foo` → `src/foo`
- `@shared/foo` → `shared/foo`

Do not introduce other aliases without good reason.

---

## Conventions

### Files
- **One concern per file.** A 300-line component or service is the upper bound; split before then.
- **Default to named exports.** Default exports only for React route components if it simplifies imports.
- **No barrel files** (`index.ts` re-exports) unless there's a clear reason. They hurt tree-shaking and discoverability.

### TypeScript
- `strict: true` is non-negotiable. `noUncheckedIndexedAccess: true` is on — array/object access returns `T | undefined`, handle it.
- Domain types live in `shared/types.ts`. Zod schemas in `shared/ipc-contract.ts`. Don't duplicate.
- Prefer `type` over `interface` except where declaration merging is needed (e.g. extending `Window`).

### Database
- **IDs are UUID v4** (text). Use the `uuid` package's `v4` import.
- **Timestamps are ISO 8601 strings** in the DB, not numbers. Easier to debug in DB Studio.
- **Money is INTEGER cents.** Never use floats. The renderer formats with `formatAUD(cents)`.
- **Every mutation writes an audit_log row** via `writeAudit()` in `services/audit.ts`.
- **Use transactions for multi-table writes** (see `mergeCategory` for the pattern).

### React
- **Functional components only.** No class components.
- **State location:** TanStack Query for server/main-process state, `useState` for local UI state. No Redux, no Zustand for now.
- **Forms:** React Hook Form + `zodResolver`. Shared Zod schemas from `shared/ipc-contract.ts`.
- **Mutations:** Always invalidate the relevant TanStack query key on success. Always show a toast.
- **Error display:** Toasts for transient errors. Inline field errors via `<FieldError>` for form validation.

### Errors
- Throw `Error(message)` with a user-readable message inside service functions. The IPC handler wrapper catches and surfaces it to the renderer.
- Never expose internal error details (stack traces, file paths) to the renderer. The handler does the right thing already.
- Log errors with `log.error()` from `electron/lib/logger.ts` before re-throwing.

### Naming
- React components: `PascalCase.tsx`
- Hooks, helpers, services: `camelCase.ts`
- Route files: `lowercase.tsx` (e.g. `dashboard.tsx`)
- DB column names: `snake_case`, mapped to `camelCase` in TS types
- IPC channel names: `domain:verb` (e.g. `entities:create`)

---

## AU specifics

These are baked in. Don't try to make the app multi-currency or multi-locale yet.

- **Currency:** AUD only. Format with `formatAUD(cents)` from `src/lib/format.ts` (uses `Intl.NumberFormat('en-AU')`).
- **Dates:** Display `DD MMM YYYY` via `formatDate(iso)`. Store ISO 8601 in DB.
- **Financial year:** 1 July – 30 June. Use `australianFinancialYear(date)` from `src/lib/format.ts`. Exports must offer a FY toggle alongside calendar year.
- **GST:** 10%. Track `gstAmountCents` per bill where applicable. Bills under the business entity should always have a GST field surfaced.
- **BPAY:** Detect biller code (4–7 digits) and reference number. Bill detail UI must show these prominently when present.
- **Tax treatments:** Entity has a `type` field (`personal | investment | business | other`) that drives export and reporting behaviour.

---

## Privacy & security model

This app holds sensitive financial data and (eventually) Gmail content. Treat security as a feature.

### Threat model
- **Defends against:** casual exfiltration of the .db file from backups, USB sticks, sync folders. Cross-process snooping inside the renderer.
- **Does NOT defend against:** an attacker with logged-in access to the user's Windows account. That's accepted.

### What's encrypted
Sensitive columns in the DB hold AES-256-GCM ciphertext via `encryptField()` / `decryptField()` in `electron/lib/crypto.ts`. Currently encrypted columns:
- `bills.amount_enc`, `bills.notes_enc`
- `email_sources.subject_enc`, `email_sources.snippet_enc`
- `attachments.extracted_text_enc`

Plaintext shadow columns (`bills.amount_cents`) exist where queryability matters more than confidentiality — sums and ordering work, but the encrypted column protects disclosure on file leak.

### Key handling
- Master key is 32 random bytes generated on first launch.
- Stored in Windows Credential Manager via `keytar` (service `billcal`, account `master-key-v1`).
- Never written to disk, never shipped with the app, never sent over IPC to the renderer.

### Renderer hardening
- `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false` on the BrowserWindow.
- Strict CSP in `index.html`.
- All external link clicks deferred to `shell.openExternal()`.
- All permission requests denied by default in `app.on('web-contents-created')`.

### Gmail (when wired up in Phase 2)
- OAuth 2.0 PKCE flow with loopback redirect. No client secret.
- Tokens stored in keytar, NEVER in the DB.
- Request minimum scopes (`gmail.readonly` initially; `gmail.modify` only when label-writing is added).
- Email bodies sent to the LLM extraction provider only after explicit user consent in settings.
- The Gmail message ID is stored; the full message body is NOT stored unless the user enables that setting.

---

## Build, dev, and common commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies. Postinstall rebuilds native modules for Electron. |
| `npm run dev` | Launch app in dev mode with HMR. |
| `npm run typecheck` | Run tsc across both tsconfig project references. **Run before saying "done".** |
| `npm run build` | Build production bundles to `out/`. |
| `npm run package:win` | Build a Windows NSIS installer to `dist/`. |
| `npm run db:generate` | Generate a Drizzle migration after editing `schema.ts`. |
| `npm run db:studio` | Open Drizzle Studio to inspect the DB. |
| `npm run format` | Prettier format. |

**After any code change, run `npm run typecheck` before declaring victory.** Type errors are silent in `npm run dev` (Vite shows them in the browser, but they'll bite at build time).

---

## Current state — end of Phase 1.1

### Working features
- **Dashboard:** Shows app version, DB schema version, entity/category counts, encryption status, DB file path.
- **Entities (full CRUD):** Create, edit, archive, restore. Refuses to archive if bills reference the entity. Audit logged.
- **Categories (full CRUD + merge):** Create, edit, archive, restore, **merge** (reassigns bills + supplier defaults to target, archives source — single transaction). Audit logged.
- **Suppliers (full CRUD):** Create, edit, remove. Domain + default entity + default category fields ready for Phase 2 Gmail matching.

### Working infrastructure
- Encrypted local SQLite with full schema for all data-model tables (bills, email_sources, attachments, payment_events, rules, insights, audit_log, settings, sync_cursor).
- Field-level encryption via OS keychain.
- IPC layer with Zod validation on both sides.
- Audit logging on all mutations.
- Toast notifications for all success/error feedback.
- Calm UI with Radix Dialog modals, curated colour palette, 60-icon picker.

### Not yet built
- **Bills CRUD** (Phase 1.2 — next)
- **Settings page** real content (Phase 1.3)
- **Calendar view** (Phase 3)
- **Dashboard urgency widgets** (Phase 3)
- **Gmail OAuth + sync + review inbox** (Phase 2)
- **Trends + insights** (Phase 4)
- **Backup/export/import** (Phase 1.3 + 5)

---

## Phase 1.2 — what's next

**Goal:** Manual bill creation, list, and detail drawer. End of Phase 1.2 the developer can create bills by hand, see them in a list with filters, open a detail drawer to inspect/edit/mark-paid, and the field-level encryption is finally exercised end-to-end.

### Scope

1. **Bill service** (`electron/services/bills.ts`):
   - `listBills(filters)` — filter by entity, category, status, supplier, date range, search term.
   - `getBill(id)` — full bill with timeline of payment events.
   - `createBill(input)` — encrypts `notes` into `notes_enc`; stores `amountCents` and also `amount_enc` ciphertext.
   - `updateBill(input)` — re-encrypts changed fields.
   - `archiveBill(id)` — soft delete via `archived_at`.
   - `setPaymentStatus(id, status, dates)` — appends a `payment_events` row.

2. **IPC contract additions** in `shared/ipc-contract.ts`:
   - New `IPC.bills.*` channels: `list`, `get`, `create`, `update`, `archive`, `setStatus`.
   - Zod schemas: `BillSchema`, `BillCreateSchema`, `BillUpdateSchema`, `BillListFiltersSchema`.

3. **Bill list route** (`src/routes/bills.tsx`):
   - Table view with sortable columns (supplier, amount, due date, status, entity, category).
   - Filter bar: entity, category, status, supplier, date range, free-text search.
   - Row click → opens detail drawer (does NOT navigate away).
   - "New bill" button → opens create dialog.

4. **Bill create/edit form** (`src/components/BillForm.tsx`):
   - All Bill fields. Amount input handles AUD with cents correctly (use a controlled `currencyInput` helper — write one in `src/lib/format.ts`).
   - Date pickers (use native `<input type="date">` for now; FullCalendar comes in Phase 3).
   - Supplier picker with "Create new" inline option.
   - Entity + Category pickers default from supplier if supplier has defaults set.
   - BPAY fields and GST field collapsed under a "Payment details" disclosure.
   - Notes textarea.

5. **Bill detail drawer** (`src/components/BillDetailDrawer.tsx`):
   - Slide-from-right via Radix Dialog with custom positioning, OR react-resizable-panels — pick one and stick with it.
   - Header: supplier, amount, status badge.
   - Body: all fields, payment event timeline.
   - Footer actions: Mark paid, Mark scheduled, Mark cancelled, Edit, Archive.
   - Each action posts a `payment_events` row.

6. **Encryption wiring**:
   - `services/bills.ts` must call `encryptField()` for `notes` and `amount` on write, `decryptField()` on read.
   - Failures to decrypt (corruption, missing key) must not crash — log and return `null` for the field with a clear UI indicator.

### Definition of done for 1.2
- Can create a bill by hand.
- Can see it in the list with the correct AUD formatting and DD-MMM-YYYY date.
- Can filter the list down to just one entity or category.
- Can click into the detail drawer and edit the bill.
- Can mark it as paid; the payment event appears in the timeline; the row in the list updates.
- `notes_enc` and `amount_enc` are populated and decrypt cleanly.
- `npm run typecheck` passes with no errors.

---

## Roadmap (high-level)

- **Phase 1.3** — Settings page: PIN lock toggle, backup folder picker, daily backup job with electron's `app.on('before-quit')` and a scheduled job. Backup file is a copy of `billcal.db` to the chosen folder, timestamped. 7-day-stale nudge in the top bar.
- **Phase 2** — Gmail OAuth (PKCE loopback), incremental message sync, classification, LLM extraction (Anthropic SDK with Claude Haiku 4.5), review inbox, supplier auto-creation, rule suggestions.
- **Phase 3** — Calendar view (FullCalendar), dashboard urgency widgets, notice board, desktop notifications.
- **Phase 4** — Trends (Recharts), insight generator, recurring bill detection.
- **Phase 5** — CSV/Excel/PDF export, FY tax pack, hardening, performance pass.

---

## Safety rules — things to NEVER do

1. **Never auto-mark a bill as paid** without a receipt email that matches supplier + amount + period. Even then, suggest, don't commit. Show "Possible payment confirmation found. Mark as paid?" and require explicit user confirmation.
2. **Never store plaintext OAuth tokens** in the DB. Tokens live in keytar.
3. **Never send Gmail message bodies to an LLM** without an explicit per-conversation user consent flag that the user has flipped on in settings.
4. **Never silently swallow errors.** Always log. Always surface to the user with a useful message.
5. **Never write to the renderer's globals** from main except via `contextBridge` in preload.
6. **Never disable contextIsolation, sandbox, or webSecurity** on the BrowserWindow. If a feature seems to require it, the feature is wrong.
7. **Never commit secrets** (API keys, OAuth client secrets) to the repo. Use OS env or keytar.
8. **Never write SQL string concatenation.** All DB access goes through Drizzle so parameter binding is automatic.
9. **Never use `dangerouslySetInnerHTML`** in the renderer. We don't need it.
10. **Never break the IPC contract silently.** If you change a Zod schema, update the renderer call sites in the same change.

---

## Known gotchas

- **better-sqlite3 native compilation:** Requires Visual Studio Build Tools on Windows. If `npm install` fails on this module, the Node installer's "Tools for Native Modules" option is the fix.
- **electron-vite path resolution:** The migration folder path in `electron/db/index.ts` is resolved relative to the compiled main process bundle (`out/main/`), not source. If migrations stop running after a structural change, this is the first place to look.
- **keytar on dev machines:** Can fail silently with permission errors. If `isEncryptionAvailable()` returns false on the Dashboard, check the main log.
- **TanStack Query staleTime:** Set to 30s globally. If a mutation succeeds but the UI doesn't refresh, you forgot to invalidate the relevant query key.
- **Path aliases must match in three places:** `tsconfig.node.json`, `tsconfig.web.json`, and `electron.vite.config.ts`. Add a new alias to all three or it won't resolve.
- **Drizzle migrations require a journal file:** `electron/db/migrations/meta/_journal.json` must be kept in sync. If you generate a new migration manually, also add the entry to the journal.

---

## When you're unsure

- Read the relevant existing file before writing a new one — the patterns are already established.
- If a decision feels significant, **propose it and wait for confirmation** rather than making it unilaterally.
- If the developer asks for something that conflicts with this document, **flag the conflict** and ask which should win — sometimes the doc is wrong and needs updating, sometimes the request is misremembered.
- For environment-specific gotchas (Windows paths, native modules, build tooling), **consult `https://docs.claude.com/en/docs/claude-code` and the relevant library docs rather than guessing**.

---

*End of CLAUDE.md.*
*This file should be updated at the end of each phase to reflect new conventions, completed work, and the scope of the next phase.*
