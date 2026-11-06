# 360-Degree Multidisciplinary Audit: HabitCorp / Cadence
**"The Boring Cousin of Habitica" — Architecture, Cognitive Ergonomics, Systems Integrity & Security**

**Date:** October 28–29, 2026  
**Audit Body:** Council of Senior Engineers, Product Architects, and Behavioral Coaches  
**Target Repository:** `c:\Users\gabri\Documents\task`  
**Evaluation Mode:** Full 360° Forensic Audit (R1 through R7)  
**Test Suite Status:** 86/86 Passing (0 Failures, 0 Regressions) | Production Build: Clean (1.78s)

---

## 1. Executive Summary & Council Scorecard

HabitCorp / Cadence ("The Boring Cousin of Habitica") was audited against seven rigorous behavioral, cognitive, systems, and security standards. 

Cadence establishes a uniquely compelling product foundation: it rejects the infantilizing, anxiety-inducing RPG gamification of Habitica (no gold grinding, no pet deaths, no punitive health drains), adopting a dignified, calm pastel light aesthetic (`bg-stone-50`, `bg-indigo-50`, `bg-emerald-50`) and high-leverage primitives uniting Habits, Periodicals/Dailies, Timeline Tasks, and an interactive Agenda with Ghost calendar overlays.

However, an exhaustive multidisciplinary investigation by the Council uncovered critical cross-domain disconnects, architectural bugs, and severe security vulnerabilities that must be addressed on the road to production maturity.

### Council Multi-Domain Scorecard

| Area | Domain | Verdict | Grade | Primary Critical Finding |
|:---|:---|:---:|:---:|:---|
| **R1** | **Behavioral Science & Habit Formation** | **NEEDS IMPROVEMENT** | C+ | Binary streak reset to 0 upon 1 missed day triggers the "what-the-hell effect"; `FocusPacingBar` is a dead proxy. |
| **R2** | **ADHD & Executive Function Usability** | **CONDITIONAL PASS** | B- | Monolithic 8-section modal causes initiation freeze; `setDifficultyFilter` is a dead variable in `App.tsx:85`; no spoon/energy tags. |
| **R3** | **Deep Work & Time-Management** | **CONDITIONAL PASS** | C+ | Scheduled habits vanish from backlog on subsequent days; external ghost events are erroneously mutable/deletable. |
| **R4** | **Product Strategy & Pragmatic UX** | **CONDITIONAL PASS** | B | Zero keyboard shortcuts or modal `Escape` handling (WCAG 2.1 SC 2.1.2 keyboard trap); modals un-wired from i18n dictionaries. |
| **R5** | **Systems Architecture & SQLite Concurrency** | **CONDITIONAL PASS** | B | Concurrency lock contention due to missing `busy_timeout`; zero transaction boundaries across multistep endpoints. |
| **R6** | **Application Security & Trust** | **FAIL / CRITICAL** | F | Magic Link token leaked in HTTP response body (CVSS 9.8 account takeover); blind SSRF in calendar ingestion; plaintext API keys in DB. |
| **R7** | **Agentic Integrations & DX** | **CONDITIONAL PASS** | C | OpenAPI 3.1 schema invalid (omits mandatory `responses` and `operationId`); 54% API surface undocumented; rollover race condition in scoring. |

---

## 2. In-Depth Expert Findings Across All 7 Domains

```
                       ┌──────────────────────────────────────────────┐
                       │   Cadence Core Architectural Findings        │
                       └──────────────────────┬───────────────────────┘
                                              │
         ┌───────────────────┬────────────────┼───────────────────┬───────────────────┐
         ▼                   ▼                ▼                   ▼                   ▼
   [Behavioral/ADHD]   [Time Management]  [Systems/DB]       [Application Sec]     [Agentic/DX]
    - Binary streak     - Vanishing habit  - Concurrency lock - Magic link token   - Invalid OAS 3.1
      reset triggers      blocks on day      due to missing     leak in response     (missing responses)
      "what-the-hell"     rollover           busy_timeout       (CVSS 9.8 ATO)     - 54% API blindspot
    - Missing quick-    - Mutable ghosts   - Zero transaction - Blind SSRF in      - Scoring rollover
      capture & dead      in UI/API          boundaries         calendar fetch       race condition
      difficulty filter - Decoupled        - Statement cache  - Plaintext keys     - Silent error
                          Pomodoro props     omissions          in SQLite DB         coercions
```

---

### R1. Behavioral Science & Habit Formation Audit
- **Evaluated Against**: James Clear (*Atomic Habits*), BJ Fogg (*Tiny Habits* & $B=MAP$), Cochran & Tesser (Streak Loss Psychology), Deci & Ryan (Self-Determination Theory).
- **Clear Verdict**: **NEEDS IMPROVEMENT (Strong Foundations with Critical Behavioral Blockers)**

#### Core Findings:
1. **Critical Streak Loss Vulnerability (`src/server/rollover.ts:108-121`)**:
   Missing a single scheduled day unconditionally resets `streak = 0`. Under Cochran & Tesser's behavioral research, binary streak loss induces the **"what-the-hell effect"** (catastrophic abandonment after an initial lapse). This directly violates James Clear's 4th Law rule: *"Never miss twice."* Cadence lacks a 1-day grace period, compassionate streak recovery, or emergency streak freeze.
2. **Broken Focus Pacing Proxy (`src/client/components/FocusPacingBar.tsx:6-8`)**:
   `FocusPacingBar.tsx` is an empty pass-through proxy. The underlying `PomodoroTimer.tsx` is locked to 25m, completely ignores passed agenda-blocking and task-linking props, and has no restorative 5m break pacing or posture/hydration cues.
3. **Negative Counter Habit Erosion (`src/server/routes/api.ts:744`, `rollover.ts:149`)**:
   While bidirectional counters (`+` / `-`) exist in `src/server/db.ts:75-78`, negative counter logging (`-`) provides no friction prompt (e.g. asking for the trigger) and resets `counter_down` to 0 daily, destroying long-term harm-reduction trend data.
4. **Missing Habit Stacking Primitives (`src/server/db.ts:63-106`)**:
   No relational anchor model (`anchor_task_id`) exists. BJ Fogg's foundational habit stacking formula (*"After [CURRENT HABIT], I will [NEW HABIT]"*) cannot be modeled or scheduled with dynamic cascading time offsets.

---

### R2. ADHD & Executive Function Usability Audit
- **Evaluated Against**: Russell Barkley (Executive Function), Christine Miserandino (Spoon Theory), Cognitive Load Theory.
- **Clear Verdict**: **CONDITIONAL PASS — HIGH POTENTIAL WITH CRITICAL NEURODIVERGENT FRICTION POINTS**

#### Core Findings:
1. **The "Dead Variable" Difficulty Filter Bug (`src/client/App.tsx:85`)**:
   In `App.tsx:85`, `setDifficultyFilter` was omitted: `const [difficultyFilter] = useState<DifficultyTier | 'all'>('all');`. While filtering logic is partially wired at line 673, **zero UI controls exist to change the difficulty filter**. Users cannot filter tasks by cognitive capacity.
2. **Task Initiation Paralysis (`src/client/components/TaskModal.tsx:300-846`)**:
   Creating any task forces users through an 848-line full-screen modal with 8 distinct cognitive decision gates (Kind, Title, Project, Notes, Difficulty, Time of Day, Timeline, Checklist). There is zero inline quick-capture input or keyboard shortcut, causing working-memory loss and initiation freeze.
3. **Color Collapse of Trivial and Easy Tiers (`src/client/App.tsx:1350, 1842`, `AgendaView.tsx:235`)**:
   `trivial` and `easy` collapse into identical emerald green styling on board cards and default white/indigo styling on the Agenda grid, depriving neurodivergent users of clear visual discrimination for low-activation quick-wins.
4. **Complete Absence of Spoon Theory / Energy Filtering (`src/server/db.ts:63-106`)**:
   Difficulty (technical complexity) is conflated with executive/emotional energy drain. A trivial 2-minute phone call to a debt collector costs 4 spoons, whereas writing repetitive code costs 1 spoon. Cadence provides no spoon/energy tags.
5. **Time Blindness on the Agenda Grid (`src/client/components/AgendaView.tsx:485-533, 560-927`)**:
   The Agenda grid lacks a current-time "Now" indicator line. Furthermore, cards have uniform static padding; a 15-minute routine and a 2-hour deep work block render with identical slot heights, giving a deceptive visual illusion of available schedule space.

---

### R3. Deep Work & Professional Time-Management Audit
- **Evaluated Against**: Cal Newport (*Deep Work*, *The Time-Block Planner*), Peter Drucker (*The Effective Executive*), Sophie Leroy (*Attention Residue*).
- **Clear Verdict**: **CONDITIONAL PASS WITH CRITICAL ARCHITECTURAL GAPS (Grade: C+)**

#### Core Findings:
1. **The Disappearing Scheduled Habit Bug (`src/client/components/AgendaView.tsx:175, 185`, `src/server/db.ts:96`)**:
   Because `scheduled_date` is a single static column on `tasks`, scheduling a habit on Day 1 sets `scheduled_date = '2026-10-28'`. When Day 2 arrives, `AgendaView.tsx:175, 185` explicitly excludes any task where `scheduled_date` is non-null from the unscheduled drawer and quick-placement strip. Consequently, **recurring habits vanish from the user's view on subsequent days**.
2. **Ghost Calendar Mutability Vulnerability (`src/client/components/AgendaView.tsx:583, 614, 626`, `src/server/routes/api.ts:1248, 1257`)**:
   Synced external commitments (spouse/child/work calendars) are rendered as draggable, editable, and deletable, and the API allows unrestricted updates. However, the next automated iCal sync in `src/server/ics.ts:175` wipes all local edits, creating data loss and confusion. Ghost feeds must be enforced strictly read-only.
3. **Decoupled Pomodoro Pacing (`src/client/components/PomodoroTimer.tsx:43-150`)**:
   `App.tsx:953-958` passes `onBlockOnAgenda`, `tasks`, and `onScoreTask` into `<PomodoroTimer />`, but the component drops them entirely. The timer cannot link to a focused task or block completed focus intervals on the agenda.
4. **Zero Boundary Protection & Schedule Over-commitment Detection**:
   Deep work blocks can be silently overlapped or fragmented by incoming calendar syncs without collision warnings. Users can schedule 20+ hours into an 8-hour workday without capacity warnings, and back-to-back zero-buffer scheduling is neither flagged nor padded.

---

### R4. Product Strategy & Pragmatic UX Architecture Audit
- **Evaluated Against**: "Boring Cousin of Habitica" Positioning, WCAG 2.1/2.2 Accessibility Standards, Information Architecture, Internationalization Parity.
- **Clear Verdict**: **CONDITIONAL PASS (Solid Foundation with Critical UX/Ergonomic & Localization Gaps)**

#### Core Findings:
1. **Keyboard Traps & Complete Absence of Hotkeys (WCAG 2.1 SC 2.1.2)**:
   Modals (`TaskModal`, `MeetingModal`, `CalendarModal`, `AgentApiModal`, `AuthModal`) do not listen for `Escape` (`Esc`), trapping keyboard-only users. There are zero global hotkeys (`c` quick-capture, `j`/`k` list navigation, `Space` toggle, `?` shortcut guide).
2. **"Dictionary Parity Without View Wiring" Defect**:
   While `src/client/i18n/translations.ts` contains rich Catalan (`ca`) and Spanish (`es`) dictionaries, primary modal dialogs (`TaskModal.tsx`, `AgentApiModal.tsx`, `CalendarModal.tsx`, `AuthModal.tsx`) **do not import `useTranslation` at all**, rendering 100% hardcoded English.
3. **Information Architecture (IA) Visibility Flaw (`src/client/App.tsx:74, 1062-1096`)**:
   In the default `tasks_agenda` view mode, the Habits column is completely hidden from the viewport. WFH users are forced to toggle view modes back and forth to see both their daily habits and their time-blocked agenda.
4. **Mobile Responsiveness & Touch Target Violations**:
   `AgendaView.tsx` enforces `min-w-[500px]`, causing horizontal viewport blowout on smartphones. Critical touch targets—such as hourly slot add buttons (~14px), habit counter buttons (~24px), and subtask checkboxes (~12px)—violate WCAG 44x44px touch ergonomics.
5. **Brand Identity Fragmentation**:
   Contradictory branding across `HabitCorp`, `Cadence`, `FocusFlow`, and legacy banana emoji artifacts (`BananaIcon.tsx`, `README.md:1`) dilutes the product identity.

---

### R5. Systems Architecture & SQLite Concurrency Audit
- **Evaluated Against**: Node.js 22 native `node:sqlite` (`DatabaseSync`), SQLite WAL Concurrency, ACID Boundaries, Recurrence Engine Correctness.
- **Clear Verdict**: **CONDITIONAL PASS (Empirical Concurrency Lock Contention Remediated)**

#### Core Findings:
1. **Concurrency Lock Contention & Missing `busy_timeout` (`src/server/db.ts:26-30`)**:
   SQLite defaults to `busy_timeout = 0ms`. In parallel execution (e.g. multi-process test runners or concurrent worker requests), lock acquisition immediately threw `SQLITE_BUSY: database is locked`. *(Remediated in Iteration 2: added `PRAGMA busy_timeout = 5000;` and `PRAGMA synchronous = NORMAL;`)*.
2. **Total Absence of Transaction Boundaries (`src/server/`)**:
   Across the server, there was **not a single transaction boundary** (`BEGIN IMMEDIATE`, `COMMIT`, `ROLLBACK`). Multistep operations—such as `POST /tasks/batch`, subtask replacement in `PATCH /tasks/:id`, user rollover, and ICS calendar imports (which delete hundreds of events and re-insert)—run in autocommit mode, creating severe data corruption risks on partial failure.
3. **Query Compilation Overhead (Missing Statement Caching)**:
   Static SQL statements in `authMiddleware` (`src/server/auth.ts:59`) and loops in `POST /tasks/batch` (`src/server/routes/api.ts:400-470`) compile queries via `db.prepare()` on every request, wasting CPU cycles and generating garbage collection pressure.
4. **Recurrence Engine Flaws (`src/server/rollover.ts:50-54`, `ics.ts:98`)**:
   Monthly recurrence (`createdDay === targetDay`) skips February and 30-day months when scheduled on days 29, 30, and 31. Recurring meeting expansion slices raw UTC strings, causing wall-clock drift across Daylight Saving Time (DST) shifts. ICS recurring events are artificially capped at 6 weeks.
5. **Client Split-Brain & Zero Optimistic Rollback (`src/client/apiHelper.ts:28`, `App.tsx`)**:
   Failed network requests silently fall back to `localStorage` without a reconciliation/outbox sync engine. Concurrently, `App.tsx` optimistic updates omit rollback logic in `catch` blocks, causing client-server state drift upon network drops.

---

### R6. Application Security & Trust Audit
- **Evaluated Against**: OWASP Top 10 API Security Risks (2023), CWE/SANS Top 25, NIST SP 800-63B Authentication Guidelines.
- **Clear Verdict**: **FAIL / CRITICAL VULNERABILITIES DETECTED (CVSS 9.8 ATO & CVSS 8.6 SSRF)**

#### Core Findings:
1. **P0 Critical (CVSS 9.8) — Instant Account Takeover via Magic Link Leakage (`src/server/routes/api.ts:170-175`)**:
   `POST /api/v1/auth/magic-link` generates a cryptographic authentication token, but **returns the token and full login URL directly in the HTTP JSON response body**. Any unauthenticated caller can supply any target email address and receive instant account access without email access or user interaction.
2. **P0 Critical (CVSS 8.6) — Severe Blind SSRF in Calendar Ingestion (`src/server/routes/api.ts:1297, 1322, 1429, 1500`, `ics.ts`)**:
   Blind native `fetch()` on user-supplied `.ics` calendar and ghost URLs without IP filtering. Vulnerable to RFC 1918 private network scanning, loopback access, and cloud metadata harvesting (`http://169.254.169.254/latest/meta-data/`). Lacks DNS rebinding defenses, request timeouts (slowloris DoS), and body size limits (unbounded buffering crashes memory via OOM).
3. **P0 High (CVSS 8.2) — Plaintext API Key & Token Storage in Database (`src/server/db.ts:49, 149`, `auth.ts:59`)**:
   User API keys (`tk_...`) and magic link tokens (`ml_...`) are stored in plaintext in SQLite. Token verification is a raw equality match. Any database backup leak compromises all credentials permanently. Furthermore, magic link verification has a TOCTOU race condition allowing multiple consumption.
4. **P1 High (CVSS 7.5) — Stored XSS via `javascript:` URI in Meeting Links (`src/client/components/AgendaView.tsx:747`, `MeetingModal.tsx:494`)**:
   `m.meeting_url` is rendered directly into `<a href={...}>` without protocol sanitization. Malicious calendar feeds can inject `javascript:...` links, executing arbitrary code to exfiltrate the user's plaintext API key from browser `localStorage`.
5. **P1 Medium (CVSS 6.8) — Multi-Tenant IDOR and Hardcoded Credentials (`src/server/db.ts:238-257`)**:
   Hardcoded developer passwords and keys (`falcon.badger.otter`, `tk_test_developer_key`, `tk_gabriel_rullan_key`) are committed in `initSchema`. Tasks accept `project_id` without verifying tenant ownership.
6. **P2 Medium — Missing Web Security Baseline (`src/server/index.ts:14`)**:
   Wildcard CORS (`cors()`), zero rate limiting across auth and API endpoints, and completely missing security headers (`helmet`, CSP, HSTS, X-Content-Type-Options).

---

### R7. Agentic Integrations & DX Audit
- **Evaluated Against**: OpenAPI Specification v3.1.0, RFC 7807 (Problem Details), Autonomous LLM Tool-Calling Runtimes (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro).
- **Clear Verdict**: **CONDITIONAL PASS — FUNCTIONAL RUNTIME, CRITICAL SCHEMA & AGENTIC GAPS**

#### Core Findings:
1. **Fatal OAS 3.1 Schema Invalidation (`src/server/routes/api.ts:1660-1832`)**:
   Every operation in `/api/v1/openapi.json` completely omits the mandatory `responses` object (violating OAS 3.1 §4.8.10) and `operationId`. Standard agent tool-calling generators (LangChain, AutoGen, Cursor, Spectral) fail or crash on parsing.
2. **54% API Surface Blindspot (`src/server/routes/api.ts`)**:
   Out of 22 active authenticated endpoints, only 10 operations across 6 route templates are documented in the OpenAPI spec. Autonomous agents are completely blind to project management (`/projects`), subtask operations (`/subtasks`), editing/deleting calendar events (`PATCH/DELETE /meetings/:id`), and ghost calendar integrations (`/ghosts`).
3. **Critical Rollover Race Condition in Task Scoring (`src/server/routes/api.ts:725-780`)**:
   `POST /tasks/:id/score` omits `runUserRollover(userId)`. If an autonomous agent marks a daily done on a new day without first calling `GET /tasks` or `GET /agenda`, yesterday's completed status causes the endpoint to toggle completion off and **decrement the user's streak**.
4. **Batch Non-Atomicity & Silent Data Dropping (`src/server/routes/api.ts:400-475`)**:
   `POST /tasks/batch` lacks transaction wrapping, silently drops items lacking a `title`, silently coerces invalid enums to defaults, and returns no correlation IDs or per-item status errors.
5. **Monolithic Error Strings**:
   All errors return `{ error: string }` instead of machine-readable RFC 7807 payloads (`code`, `field`, `allowed_values`), preventing autonomous LLMs from self-correcting faulty parameters in a single retry loop.

---

## 3. Prioritized Action Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PRIORITIZED ACTION ROADMAP                            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
     ┌─────────────────────────────────┼─────────────────────────────────┐
     ▼                                 ▼                                 ▼
┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────┐
│   P0: Immediate Critical  │ │   P1: High-Leverage Arch  │ │   P2: Polish & Long-Term  │
│   (Security & Blockers)   │ │   (UX & Behavioral Scale) │ │   (Ergonomics & Voice)    │
├───────────────────────────┤ ├───────────────────────────┤ ├───────────────────────────┤
│ • Remove Magic Link leak  │ │ • Implement 2-day streak  │ │ • WCAG 44px mobile touch  │
│ • SSRF-safe fetch wrapper │ │   grace period & freeze   │   targets & viewports       │
│ • SHA-256 API key hashing │ │ • Rewire modal i18n hooks │ │ • Global hotkeys (c, j/k, │
│ • Unlock difficultyFilter │ │ • Add transaction blocks  │   Space, ?) & shortcut modal│
│ • Dynamicize habit dates  │ │ • Fix vanishing habits    │ │ • Unify brand identity    │
│ • Fix OpenAPI responses   │ │ • Enforce read-only ghost │ │ • Spoon theory / energy   │
│ • Wrap scoring in rollover│ │ • Machine-readable errors │ │ • Rate limiting & CSP     │
└───────────────────────────┘ └───────────────────────────┘ └───────────────────────────┘
```

### P0: Immediate Critical Fixes (Security Blockers & Operational Flaws)
1. **P0.1 [Security] Eliminate Magic Link Token Leakage**:
   - In `src/server/routes/api.ts:170-175`, remove `token` and `url` from the JSON response. Return generic `{ message: 'Sign-in link sent if email exists.' }`.
2. **P0.2 [Security] Implement SSRF-Safe Fetch for Calendar & Ghost Ingestion**:
   - Create `src/server/services/safeFetch.ts` enforcing DNS resolution check, private CIDR filtering (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`, `::1`), 8s timeout, and 5MB payload streaming cap.
3. **P0.3 [Security] Hash Stored API Keys & Magic Link Tokens**:
   - Migrate `users.api_key` and `magic_links.token` to store `sha256(token)`. Update `authMiddleware` to lookup hashes via constant-time comparison.
4. **P0.4 [UX/ADHD] Unlock Difficulty Filter in Main View**:
   - In `src/client/App.tsx:85`, destructure `[difficultyFilter, setDifficultyFilter] = useState(...)` and render a pastel filter pill bar directly beside project tags.
5. **P0.5 [Agentic/DX] Fix Invalid OpenAPI 3.1 Specification**:
   - In `src/server/routes/api.ts:1660-1834`, add mandatory `responses: { '200': { ... } }` and semantic `operationId` to every operation object. Document all 22 active endpoints.
6. **P0.6 [Agentic/DX] Trigger Rollover in Task Scoring**:
   - In `src/server/routes/api.ts:725-780`, call `runUserRollover(userId)` before evaluating task completion status to eliminate the streak-loss race condition.

### P1: High-Leverage Architectural and UX Enhancements
1. **P1.1 [Behavioral] Implement James Clear "Never Miss Twice" Grace Period & Streak Freeze**:
   - In `src/server/rollover.ts:108-121`, replace the binary reset with a 1-day grace period (`missed_days <= 1`) and support an emergency freeze flag to mitigate the "what-the-hell effect".
2. **P1.2 [UX/i18n] Wire `useTranslation` into All Modal Dialogs**:
   - In `TaskModal.tsx`, `AgentApiModal.tsx`, `CalendarModal.tsx`, and `AuthModal.tsx`, import `useTranslation()` and replace hardcoded English strings with existing keys in `translations.ts`.
3. **P1.3 [Systems] Wrap Multistep Operations in Atomic Transactions**:
   - In `src/server/routes/api.ts` (batch tasks, subtask replacements, calendar imports), execute operations within `BEGIN IMMEDIATE` / `COMMIT` / `ROLLBACK` blocks.
4. **P1.4 [Deep Work] Fix Disappearing Recurring Habits on Agenda**:
   - Decouple time-blocking allocation from static `tasks.scheduled_date`. Advance recurring habit schedules across midnight rollover or query relative to active view date.
5. **P1.5 [Deep Work/Security] Enforce Read-Only Enforcement for External Ghost Events**:
   - In `AgendaView.tsx` and `src/server/routes/api.ts:1248, 1257`, reject drag-and-drop, PATCH, and DELETE operations for events where `is_ghost === 1`.
6. **P1.6 [Security] Sanitize Meeting Links Against Stored XSS**:
   - In `AgendaView.tsx:747` and `MeetingModal.tsx:494`, validate meeting URLs to strictly permit `https://` and `http://` protocols, blocking `javascript:` URIs.
7. **P1.7 [Agentic/DX] RFC 7807 Structured Error Payloads & Atomic Batching**:
   - Return `{ code: 'INVALID_ENUM', field: 'difficulty', message: '...', allowed: [...] }` to enable autonomous LLM parameter self-correction. Wrap `POST /tasks/batch` in a single transaction returning per-item status.

### P2: Polish, Ergonomics, and Long-Term Refinements
1. **P2.1 [UX/Ergonomics] Keyboard Velocity & WCAG Focus Trap Prevention**:
   - Add `Escape` key listeners on all modal dialogs. Add global shortcuts (`c` quick capture, `j`/`k` navigation, `Space` toggle, `?` shortcut overlay).
2. **P2.2 [UX/Mobile] Mobile Viewport Responsiveness & WCAG Touch Targets**:
   - Remove `min-w-[500px]` from `AgendaView.tsx`. Enforce minimum 44x44px touch targets on slot action buttons, habit counters, and checkboxes.
3. **P2.3 [ADHD] Inline Quick-Capture & Spoon Theory Support**:
   - Add a 1-click inline input at the top of the Tasks column (`[ + Add task... (Press Enter) ]`). Add an `energy_level` field (`1_spoon`, `2_spoons`, `3_spoons`, `4_spoons`) in schema and filters.
4. **P2.4 [Deep Work] True Work/Break Pacing Session Widget**:
   - Upgrade `PomodoroTimer.tsx` to unpack passed `onBlockOnAgenda`, `tasks`, and `onScoreTask` props, and support 25m/5m and 50m/10m cycles with hydration/posture cues.
5. **P2.5 [Security] Security Headers & Rate Limiting**:
   - Add `helmet({ contentSecurityPolicy: ... })` and `express-rate-limit` on `/auth/*` endpoints in `src/server/index.ts`.
6. **P2.6 [Product Strategy] Brand Identity Consolidation**:
   - Unify naming under **Cadence ("The Boring Cousin of Habitica")**, retire `focusflow-task-manager` and legacy banana artifacts.

---

## 4. Verification & Regression Attestation

The council verified all findings against the actual running codebase. All remediations applied during the audit (SQLite `PRAGMA busy_timeout = 5000;`, `PRAGMA synchronous = NORMAL;`, and dynamic rollover date testing in `tests/wfh_stories.test.ts`) were independently audited:

- **Vitest Test Suite (`npm test`)**:
  - Total Test Files: 6 passed (100%)
  - Total Tests: 86 passed (100%)
  - Tests Failed: 0 (0%)
  - Tests Skipped: 0 (0%)
  - Duration: 2.14s
- **Production Bundle Build (`npm run build`)**:
  - Vite v6.4.5: 1,642 modules transformed
  - Output Assets: `dist/client/index.html` (0.59 kB), `dist/client/assets/*.css` (55.60 kB), `dist/client/assets/*.js` (437.98 kB)
  - Exit Code: 0 (Built in 1.78s with zero warnings or errors)
- **Integrity Forensics**:
  - Hardcoded outputs / mock simulators: 0 found (CLEAN)
  - Test skips or assertion bypasses: 0 found (CLEAN)
  - Citation line accuracy: 100% verified against source code

---

## 5. Master Deliverables Index

All individual domain reports and supporting evidence chains are persisted in the repository:
1. **Master Deliverable**: `docs/cadence-360-audit.md` (and `.agents/teamwork/orchestrator_4/cadence-360-audit.md`)
2. **Track R1 Report**: `.agents/teamwork/teamwork_preview_explorer_r1_1/audit_r1_behavioral_science.md`
3. **Track R2 Report**: `.agents/teamwork/teamwork_preview_explorer_r2_1/audit_r2_adhd_executive_function.md`
4. **Track R3 Report**: `.agents/teamwork/teamwork_preview_explorer_r3_1/audit_r3_deep_work_time_management.md`
5. **Track R4 Report**: `.agents/teamwork/teamwork_preview_explorer_r4_1/audit_r4_product_strategy_ux.md`
6. **Track R5 Report**: `.agents/teamwork/teamwork_preview_explorer_r5_1/audit_r5_systems_sqlite.md`
7. **Track R6 Report**: `.agents/teamwork/orchestrator_4/audit_r6_security_trust.md`
8. **Track R7 Report**: `.agents/teamwork/teamwork_preview_explorer_r7_1/audit_r7_agentic_integrations_dx.md`
9. **Reviewer Handoff (Iteration 2)**: `.agents/teamwork/teamwork_preview_reviewer_audit_2/handoff.md` (APPROVE)
10. **Forensic Auditor Handoff (Iteration 2)**: `.agents/teamwork/teamwork_preview_auditor_audit_2/handoff.md` (CLEAN)
