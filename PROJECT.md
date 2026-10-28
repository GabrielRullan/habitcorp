# Project: Cadence WFH Enhancements

## Architecture
Cadence is a modern task, habit, and agenda manager tailored for high-agency knowledge workers. It uses:
- **Frontend**: React 19 SPA, TypeScript, Tailwind CSS v4, Lucide React icons, Vite 6 build system. Soft pastel light theme (`bg-stone-50`, `border-stone-200`, `text-indigo-700`, `bg-emerald-50`).
- **Backend**: Express 5.1 REST API, Node.js native `node:sqlite` (`DatabaseSync`) in WAL mode, multi-user isolation with Bearer/API key auth.
- **Persistence**: Single table `tasks` cleanly stores both one-off tasks (`todo`), periodicals (`daily`), and recurring habits (`habit`).
- **Integration**: Ghost calendars (spouse/family schedule overlay in pink dashed borders), Projects strip, Agent REST API with batch ingestion (`/api/v1/tasks/batch`).

Enhancements for Work-From-Home (WFH) users introduce:
1. `time_of_day` taxonomy (`morning`, `workday`, `evening`, `anytime`) across database schema, REST API, batch ingestion, client models, and habit filtering UI.
2. Direct Habit Time-Blocking on the Agenda time-grid via drag-and-drop and 1-click scheduling, displaying scheduled habits with distinct routine styling (`🌱 Routine`, streak counts, checklist progress) without converting them into one-off tasks.
3. Work & Break Focus Pacing session widget (25m/5m, 50m/10m) with live timer, pastel progress bar, hydration & stretch cues, and 1-click agenda time-blocking.
4. Comprehensive Vitest test suite and browser automation verifying all 4 WFH user stories without regressions.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | WFH User Stories Documentation | 4 concrete stories (Morning Kickoff, Workday Pacing/Health, Ghost Commitments, Shutdown Routine) | E2E Track | ORIGINAL_REQUEST §R1 |
| F2 | Database Schema Migration | Add `time_of_day` column to `tasks` table with safe `ALTER TABLE` migration | M1 | ORIGINAL_REQUEST §R2 |
| F3 | REST API `time_of_day` Support | Update `GET`, `POST`, `POST /batch`, `PATCH /tasks/:id` and OpenAPI spec | M1 | ORIGINAL_REQUEST §R2 |
| F4 | Habit Time-of-Day Filter & Modal UI | Time-of-day tabs/filters in Habits column and selection pills in `TaskModal.tsx` | M2 | ORIGINAL_REQUEST §R2 |
| F5 | Habit Agenda Time-Blocking | Drag-and-drop & 1-click scheduling for habits to Agenda grid without task conversion | M2 | ORIGINAL_REQUEST §R3 |
| F6 | Routine Grid Indicators | Distinct styling for scheduled routines in `AgendaView.tsx` with streak & checklist progress | M2 | ORIGINAL_REQUEST §R3 |
| F7 | Work & Break Focus Pacing Widget | Non-gamified pastel timer (25/5, 50/10) with hydration and stretch reminders | M3 | ORIGINAL_REQUEST §R4 |
| F8 | Focus Block Agenda 1-Click Scheduling | Schedule active or upcoming focus session directly onto today's Agenda time-grid | M3 | ORIGINAL_REQUEST §R4 |
| F9 | WFH Automated Vitest Suites | Comprehensive test suites testing all 4 user stories, API endpoints, and ghost interactions | E2E / Final | ORIGINAL_REQUEST §R5 |
| F10 | Browser Automation & Visual QA | Headless browser verification of WFH UI flows, drag-and-drop, and pastel styling | Final | ORIGINAL_REQUEST §R5 |

---

## Milestones

| # | Track / Name | Scope | Dependencies | Status |
|---|--------------|-------|-------------|--------|
| E2E | E2E Testing Track | Design & implement WFH user stories documentation (`docs/wfh-user-stories.md`), test infra, test suites `tests/wfh_stories.test.ts`, publish `TEST_READY.md` | none | **DONE** |
| M1 | Backend Schema & REST API | `src/server/db.ts`, `src/server/routes/api.ts`: add `time_of_day` migration, query filtering, batch creation, OpenAPI 3.1 update | none | **DONE** |
| M2 | Habit Time-of-Day & Agenda Time-Blocking | `src/client/types.ts`, `src/client/App.tsx`, `src/client/components/TaskModal.tsx`, `src/client/components/AgendaView.tsx`: time-of-day habit grouping, habit drag-and-drop, 1-click schedule, routine badges | M1 | **DONE** |
| M3 | Work & Break Pacing (Focus Blocks) | `src/client/components/FocusPacingBar.tsx`, integration into `App.tsx`: timer presets (25/5, 50/10), reminder cues, 1-click block on agenda | M2 | **DONE** |
| Final | Final Milestone & Victory Verification | Phase 1: 100% E2E test pass across all tiers. Phase 2: Puppeteer visual testing, production build verification, no regressions | E2E, M1, M2, M3 | **DONE** |

---

## Interface Contracts

### 1. Database Schema (`src/server/db.ts`)
```sql
ALTER TABLE tasks ADD COLUMN time_of_day TEXT NOT NULL DEFAULT 'anytime' CHECK (time_of_day IN ('morning', 'workday', 'evening', 'anytime'));
```

### 2. TypeScript Types (`src/client/types.ts`)
```typescript
export type TimeOfDay = 'morning' | 'workday' | 'evening' | 'anytime';

export interface Task {
  // Existing fields...
  time_of_day?: TimeOfDay;
}

export interface FocusSessionState {
  mode: 'work' | 'break';
  workMinutes: number;
  breakMinutes: number;
  secondsRemaining: number;
  isRunning: boolean;
  linkedRoutineTitle?: string;
}
```

### 3. REST API Endpoints (`src/server/routes/api.ts`)
- `GET /api/v1/tasks?time_of_day=morning|workday|evening|anytime`
- `POST /api/v1/tasks`: Payload accepts `time_of_day?: TimeOfDay` (default `'anytime'`)
- `POST /api/v1/tasks/batch`: Each task item accepts `time_of_day?: TimeOfDay`
- `PATCH /api/v1/tasks/:id`: Payload accepts `time_of_day?: TimeOfDay`

### 4. Agenda Habit Time-Blocking Contract
- Habits scheduled on the Agenda keep `type: 'habit' | 'daily'`.
- Fields `scheduled_date: 'YYYY-MM-DD'`, `scheduled_start: 'HH:MM'`, and `scheduled_duration: number` represent the allocated agenda time block.
- In `AgendaView.tsx`, cards with `type === 'habit' || type === 'daily'` render with:
  - Routine icon (`🌱` or `☀️` or `🌙`)
  - "Routine" badge with `time_of_day` pill
  - Habit streak count (`🔥 Xd streak`) or counters (`+/-`)
  - Checklist subtasks progress if subtasks are present.

---

## Code Layout & Exclusive File Ownership

To prevent merge conflicts and concurrent file writes across milestones:
- **E2E Testing Track**:
  - `docs/wfh-user-stories.md`
  - `tests/wfh_stories.test.ts`
  - `TEST_INFRA.md`
  - `TEST_READY.md`
- **Milestone 1 (Backend)**:
  - `src/server/db.ts`
  - `src/server/routes/api.ts`
- **Milestone 2 (Habit Time-of-Day & Agenda Time-Blocking)**:
  - `src/client/types.ts`
  - `src/client/components/TaskModal.tsx`
  - `src/client/components/AgendaView.tsx`
  - `src/client/App.tsx` (Habits column & drag handlers)
- **Milestone 3 (Work & Break Pacing)**:
  - `src/client/components/FocusPacingBar.tsx` (new component)
  - `src/client/App.tsx` (header integration)
- **Final Milestone**:
  - Comprehensive test execution, browser verification via Puppeteer MCP, and `npm run build`.
