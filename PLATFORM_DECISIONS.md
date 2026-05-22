# Mum and Dad Planner — Architecture Decisions & MVP PRD

**Purpose of this document:** This is a decision brief to be reviewed by an independent AI (Claude.ai or ChatGPT) for a second opinion on architecture choices, open questions, and MVP scope before development begins.

**Author context:** The product owner has no prior programming experience. They are directing an AI-assisted build. All technical decisions need to be sound enough that a future developer (human or AI) can maintain them without needing to undo foundational choices.

---

## 1. What We Are Building

A cloud-based family management platform called **Mum and Dad Planner**.

### Core concept
A shared household tool used by both partners (and eventually their children). Think of it as a private family operating system — not a social network, not a productivity tool for individuals, but a coordination layer for a household.

### Features planned (in priority order)
1. **Shopping lists** — shared, real-time, multiple lists (groceries, hardware, etc.), tick items off
2. **Bills & payments** — track household/investment/business bills, due dates, amounts, payment status, payment history
3. **Meal planner / recipes** — save regular family meals, weekly meal plan, link recipes to shopping lists
4. **Kids sport planner** — events, venues, which child, gear checklists, calendar view

### User profile
- Australian household
- Husband and wife as primary users, sharing one account/household
- Kids may eventually get limited access (view only, sport events)
- Eventually: other families use the platform (multi-tenant SaaS)

### Business trajectory
1. **Now:** Private tool for one family (the builder)
2. **Near term:** Invite friends/family to try it (small closed beta)
3. **Medium term:** Open signup, multi-tenant, different families fully isolated
4. **Long term:** Monetise with subscription tiers

---

## 2. Architectural Decisions

### Decision 1: Web app, not desktop

**Chosen:** Cloud web application (accessible via browser on any device)
**Rejected:** Electron desktop app (was previously prototyped)
**Rationale:** Wife needs to use it on her own device. Kids need access. Eventually other families need it. A desktop app cannot support any of these requirements.

---

### Decision 2: Monorepo structure with separated frontend and API

**Chosen:**
```
mum-and-dad-planner/
├── apps/
│   ├── web/        ← Next.js (browser UI)
│   └── api/        ← Dedicated API server
└── packages/
    ├── db/         ← Drizzle schema (shared)
    └── types/      ← Shared TypeScript types
```

**Rejected:** Single Next.js app where API routes live inside the frontend project

**Rationale:** A future mobile app (iOS/Android via React Native) needs to talk to the same API. If the API is baked into the web app, adding mobile means either duplicating business logic or a messy coupling. Separating them from day one costs a little more setup but avoids a painful restructure later.

**Open question for review:** For a single developer (AI-assisted) building an MVP with one family as the only user, is this separation premature? Is the added complexity worth it at this stage, or should we start monolithic and split later?

---

### Decision 3: Framework — Next.js 15 (App Router)

**Chosen:** Next.js 15 with TypeScript strict mode, App Router
**Alternatives considered:** Remix, SvelteKit, plain React + Express backend
**Rationale:**
- Largest ecosystem and community
- Best-in-class documentation and AI training data (AI assistance is more reliable with popular frameworks)
- App Router supports React Server Components which reduce client-side JavaScript
- Deploys cleanly to AWS Amplify, Vercel, and containerised environments
- The product owner will rely heavily on AI-assisted development — Next.js is the safest choice for this workflow

---

### Decision 4: Database — PostgreSQL via Supabase (MVP) → AWS RDS (long term)

**Chosen for MVP:** Supabase managed PostgreSQL
**Chosen for long term:** AWS RDS PostgreSQL in a private VPC

**Rationale for Supabase in MVP:**
- Free tier is generous (500MB database, 2GB bandwidth)
- Provides database + auth + real-time subscriptions in one platform
- No infrastructure management required
- Row-level security (RLS) is a first-class feature
- Hosted on AWS infrastructure anyway

**Rationale for migrating to RDS long term:**
- Full control over instance size, backup schedule, read replicas
- Private VPC — database not reachable from the public internet
- Connection pooling via PgBouncer for high concurrency
- Supabase's auth limitations become apparent at scale (see Decision 5)

**Migration path:** Supabase → RDS is a database dump and restore. Schema stays identical (both PostgreSQL). This is a known, well-documented migration.

**Open question for review:** Is Supabase a credible production database for a small SaaS (under 1,000 households) long term, or is the migration to RDS realistically unavoidable? What are the failure modes of staying on Supabase?

---

### Decision 5: Authentication — Supabase Auth (MVP) → Clerk (long term)

**Chosen for MVP:** Supabase Auth (email/password, magic link, Google OAuth)
**Chosen for long term:** Clerk

**Rationale for Supabase Auth in MVP:**
- Included in Supabase free tier — no additional service
- Handles sign-up, sign-in, email verification, password reset
- Integrates directly with Supabase RLS policies

**Rationale for migrating to Clerk long term:**
- Clerk is purpose-built for multi-tenant SaaS ("organisations" = households)
- Handles member invitations, roles (owner/member), and billing-tier gating natively
- Direct Stripe integration for subscription management
- Better UI components (drop-in sign-in/sign-up flows that match your brand)
- Supabase Auth has no native concept of "organisations with members" — you have to build that yourself

**Migration path:** Supabase Auth uses JWTs. Clerk also uses JWTs. The migration requires updating the auth middleware and re-issuing sessions — not trivial but well-documented.

**Open question for review:** Is it better to start with Clerk from day one (accepting the ~$25/month cost once past the free tier) rather than build Supabase Auth first and migrate? What does the Clerk free tier actually include and is it sufficient for a private beta of under 50 users?

---

### Decision 6: ORM — Drizzle

**Chosen:** Drizzle ORM
**Alternatives considered:** Prisma, raw SQL, Kysely
**Rationale:**
- Type-safe — all queries are checked at compile time
- Works with both Supabase and AWS RDS (both PostgreSQL) without changes
- Lightweight — no separate daemon, no generated client to re-run on every schema change
- The product owner's previous prototype used Drizzle; AI assistants working on this codebase already have context
- Prisma was rejected because its generated client approach adds friction in an AI-assisted workflow

---

### Decision 7: API layer — tRPC

**Chosen:** tRPC (TypeScript Remote Procedure Call)
**Alternatives considered:** REST with OpenAPI, GraphQL
**Rationale:**
- End-to-end type safety: a change to the API is immediately visible as a type error in the frontend — no runtime surprises
- No code generation step (unlike GraphQL with codegen)
- Works naturally in a Next.js monorepo — the `apps/web` frontend calls `apps/api` procedures with full TypeScript autocomplete
- When a React Native mobile app is added, it uses the same tRPC client
- REST was rejected because it requires manually keeping types in sync between API and frontend — error-prone in an AI-assisted build

**Open question for review:** tRPC works best in a TypeScript-only stack. Are there any scenarios in this project (webhooks, third-party integrations, Supabase real-time) where tRPC's RPC model creates friction that REST would handle more cleanly?

---

### Decision 8: UI — Tailwind + shadcn/ui

**Chosen:** Tailwind CSS + shadcn/ui component library
**Alternatives considered:** Tailwind + Radix (build components manually), MUI, Chakra UI
**Rationale:**
- shadcn/ui gives pre-built, accessible, unstyled components (built on Radix primitives) that you copy into your project and own — no vendor lock-in
- Tailwind handles all custom styling
- Unlike MUI or Chakra, shadcn/ui doesn't fight you when you want to customise
- The previous Electron prototype used Radix + Tailwind; shadcn/ui is the natural evolution of that

---

### Decision 9: Multi-tenancy model — shared database, row-level security

**Chosen:** Single PostgreSQL database, all tenants in shared tables, `household_id` foreign key on every feature table, enforced by PostgreSQL Row-Level Security policies

**Rejected:**
- Separate database per tenant (extreme isolation, extreme cost and complexity)
- Separate schema per tenant (good isolation, complex migrations)

**Rationale:** Separate databases are appropriate for enterprise SaaS with compliance requirements (healthcare, finance, legal). A consumer family app does not have those requirements. Shared database with RLS is used successfully by Supabase itself, Linear, Notion, and most consumer SaaS. It is the correct default.

**Data model sketch:**
```
households          id, name, created_at
household_members   household_id, user_id, role (owner|member), joined_at
bills               household_id, ...bill fields
shopping_lists      household_id, ...list fields
recipes             household_id, ...recipe fields
sport_events        household_id, ...event fields
```

RLS policy example (PostgreSQL):
```sql
CREATE POLICY "household members only" ON bills
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));
```

**Open question for review:** At what scale (number of households, rows per table) does shared-schema RLS start to become a performance concern? Is there a design pattern that keeps shared schema but makes future migration to schema-per-tenant easier if needed?

---

### Decision 10: Hosting — AWS Amplify

**Chosen:** AWS Amplify (for the Next.js web app)
**Rationale:**
- Product owner preference is AWS ecosystem
- Amplify connects directly to GitHub — every push auto-deploys
- Supports Next.js App Router natively (as of 2024)
- Free tier: 1,000 build minutes/month, 15GB storage, 5GB data transfer
- Scales automatically

**Not chosen:** Vercel (simpler, but not AWS), AWS ECS/EKS (too complex for current stage)

**Open question for review:** AWS Amplify's Next.js support improved significantly in 2024 but has historically lagged behind Vercel. Are there specific Next.js 15 features (Server Actions, streaming, Partial Prerendering) that Amplify does not yet support reliably? Should we use Vercel for the web frontend and AWS only for the API/database?

---

## 3. MVP PRD — What Gets Built First

### Guiding principle
The MVP must be usable by both partners in a real household from day one. It should not require the product owner to explain to his wife how to use it. It should feel like a finished product for its scope, not a prototype.

### MVP Feature Set

#### F1 — Household onboarding
- Sign up with email + password
- Create a household (give it a name)
- Invite partner by email
- Partner accepts invite, joins the household
- Both partners see the same data

#### F2 — Shopping Lists
- Create a named list
- Add items (with optional quantity)
- Tick items off (checked state persists)
- Delete items
- Archive/delete a list
- Real-time sync: if both partners have the app open, changes appear without refreshing

#### F3 — Bills & Payments
- Create a bill: supplier name, amount (AUD), due date, category, which entity (personal/investment/business), payment method, notes
- Bill list with filters (entity, category, status, due date range)
- Mark bill as paid (with optional paid date)
- Mark bill as scheduled
- Bill history (log of status changes)
- Dashboard widget: bills due in the next 7 days

#### F4 — Meal Planner
- Create a recipe: name, ingredients (with quantities), instructions (optional), tags
- Weekly meal plan: assign recipes to days of the week
- "Add ingredients to shopping list" — one tap creates items in a chosen shopping list

#### F5 — Kids Sport Planner
- Create a sport event: child name, sport, date/time, venue, notes
- Gear checklist per event (pack bag, uniform, water bottle, etc.)
- Mark checklist items as packed
- Calendar view of upcoming events (current month)

### MVP Non-goals (explicitly out of scope)
- Gmail integration or email parsing
- Push notifications (email reminders are sufficient for MVP)
- Mobile app (responsive web only)
- Multiple children's profiles (just a name field on each event)
- Recurring bill auto-generation
- Financial reporting or trends
- CSV export
- Public signup (MVP is private — invite only)

### Definition of done for MVP
- Both partners can sign in on any device (phone browser, desktop)
- All 5 feature areas are functional with no critical bugs
- Data is correctly isolated (one household cannot see another's data)
- App loads in under 3 seconds on a standard Australian NBN connection
- Works on current iOS Safari, Android Chrome, and desktop Chrome/Edge

---

## 4. Open Questions Summary

These are the decisions that need external validation before committing to the build.

| # | Question | Why it matters |
|---|---|---|
| 1 | Should the API be separated from the web app from day one, or is a monolithic Next.js app acceptable for MVP? | Determines repo structure — hard to change later |
| 2 | Is Supabase a credible long-term production database for a small SaaS (<1,000 households), or is migration to RDS inevitable? | Affects whether we invest in Supabase-specific features |
| 3 | Should we start with Clerk for auth rather than Supabase Auth, accepting the eventual cost? | Clerk's free tier may cover the entire private beta |
| 4 | Are there Next.js 15 features that AWS Amplify does not yet support? Should Vercel host the frontend even if the rest is AWS? | Affects hosting decision |
| 5 | Is tRPC the right API layer, or does it create friction with Supabase real-time, webhooks, or other integrations? | API design is hard to refactor later |
| 6 | At what row count does shared-schema RLS become a performance concern for this type of workload? | Multi-tenancy approach |
| 7 | What is the recommended order to build the four MVP features given the dependency (meal planner links to shopping lists)? | Build sequence |

---

## 5. Suggested Prompt for Claude.ai / ChatGPT Review

Paste the following along with this document:

---

*"I am planning to build a multi-tenant family management SaaS called Mum and Dad Planner. The document above outlines the architectural decisions, the MVP PRD, and the open questions. I would like your assessment of:*

*1. Whether the architectural decisions are sound for this type of product and scale*
*2. Your answers to the open questions in Section 4*
*3. Any significant risks or alternative approaches I have not considered*
*4. Whether the MVP scope in Section 3 is appropriately sized — too large, too small, or right*

*The product owner has no programming experience and is directing an AI-assisted build. Simplicity and maintainability are more important than using cutting-edge patterns. Please be direct about any decisions you would make differently."*

---

*End of document.*
