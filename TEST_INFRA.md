# Test Infrastructure & 4-Tier Verification Methodology

## Overview
This document defines the automated test infrastructure and quality assurance methodology for the Cadence Work-From-Home (WFH) enhancements. The testing framework guarantees zero regressions across existing features (Projects, Ghosts, Agent REST API, Drag-and-Drop) while rigorously testing new WFH capabilities across four progressive tiers.

---

## Test Architecture & Framework

- **Test Runner**: Vitest 3.x (`npm test` / `npx vitest run`)
- **API Test Client**: Supertest 7.x executing against the native Express 5.1 application
- **Database Isolation**: In-memory SQLite instances (`node:sqlite` `DatabaseSync(':memory:')`) initialized per test case via `resetDbForTesting(memDb)` to guarantee 100% test independence and state isolation
- **Authentication**: Dynamic registration and API key issuance (`tk_<hex>`) via `/api/v1/auth/register` with complete multi-user isolation
- **Code Organization**:
  - `tests/api.test.ts`: Existing core suite (multi-user auth, task CRUD, projects, ghosts, basic agenda)
  - `tests/wfh_stories.test.ts`: Comprehensive WFH test suite covering all 4 user stories and 4 verification tiers

---

## 4-Tier Testing Methodology

```
┌─────────────────────────────────────────────────────────────┐
│  Tier 4: Real-World WFH User Journey Scenarios              │
│  - Full lifecycle execution of Stories 1-4                  │
├─────────────────────────────────────────────────────────────┤
│  Tier 3: Pairwise Combinations & Feature Interactions       │
│  - Type × TimeOfDay, Agenda × Ghost, Batch × Projects       │
├─────────────────────────────────────────────────────────────┤
│  Tier 2: Boundary, Edge Cases & Adversarial Stress          │
│  - Invalid enums, boundary hours, extreme durations, SQLi   │
├─────────────────────────────────────────────────────────────┤
│  Tier 1: Comprehensive Feature Coverage (>= 5 per feature)  │
│  - Taxonomy, Agenda blocking, Pacing counters, Ghosts       │
└─────────────────────────────────────────────────────────────┘
```

---

### Tier 1: Core Feature Verification (>= 5 Cases Per Feature)

Tier 1 verifies that each distinct WFH capability fulfills its primary contract and expected observable behavior.

#### 1. Habit `time_of_day` Taxonomy & Schema Persistence
- **T1.1.1**: Create habit with `time_of_day: 'morning'` -> verify persistence and returned field.
- **T1.1.2**: Create habit with `time_of_day: 'workday'` -> verify persistence and returned field.
- **T1.1.3**: Create habit with `time_of_day: 'evening'` -> verify persistence and returned field.
- **T1.1.4**: Create habit with default (omitted `time_of_day`) -> verify default `'anytime'`.
- **T1.1.5**: Update existing task's `time_of_day` via `PATCH /api/v1/tasks/:id` -> verify updated value.

#### 2. REST API `time_of_day` Query Filtering
- **T1.2.1**: Filter `GET /api/v1/tasks?time_of_day=morning` returns only morning habits/tasks.
- **T1.2.2**: Filter `GET /api/v1/tasks?time_of_day=workday` returns only workday habits/tasks.
- **T1.2.3**: Filter `GET /api/v1/tasks?time_of_day=evening` returns only evening habits/tasks.
- **T1.2.4**: Filter `GET /api/v1/tasks?time_of_day=anytime` returns only anytime habits/tasks.
- **T1.2.5**: Filter with combined query parameters (e.g., `?type=habit&time_of_day=morning`) respects both constraints.

#### 3. Batch Habit & Task Ingestion
- **T1.3.1**: Batch create 5+ WFH routines across all 4 `time_of_day` values in a single request -> verify `created_count = 5`.
- **T1.3.2**: Batch create tasks with embedded subtask arrays -> verify subtasks are persisted and linked.
- **T1.3.3**: Batch create habits with specific difficulty tiers (`trivial`, `easy`, `medium`, `hard`) -> verify weights.
- **T1.3.4**: Batch create habits with project assignments -> verify project linking.
- **T1.3.5**: Batch create respects multi-user isolation (User B cannot see User A's batch created items).

#### 4. Direct Habit Agenda Time-Blocking
- **T1.4.1**: Schedule a recurring daily habit onto Agenda grid (`scheduled_date`, `scheduled_start: '08:30'`, `scheduled_duration: 30`) -> verify `type` remains `'daily'`.
- **T1.4.2**: Schedule a habit with counters onto Agenda grid -> verify `type` remains `'habit'`.
- **T1.4.3**: Query `GET /api/v1/agenda` for scheduled date -> verify scheduled habits appear in `scheduled_tasks` array.
- **T1.4.4**: Unschedule a habit (set `scheduled_date: null`) via `PATCH` -> verify habit removed from agenda while preserving streak.
- **T1.4.5**: Re-schedule habit to a different time slot -> verify updated `scheduled_start`.

#### 5. Routine Scoring, Counters & Checklist Progress
- **T1.5.1**: Score habit counter up multiple times -> verify `counter_up` increments monotonically.
- **T1.5.2**: Score daily habit complete -> verify `completed: 1` and `streak: 1`.
- **T1.5.3**: Check off subtasks within a daily routine -> verify subtask `completed: 1` and order preserved.
- **T1.5.4**: Retrieve daily routine with subtasks via `GET /api/v1/tasks/:id` -> verify subtasks array populated.
- **T1.5.5**: Score daily habit down/uncomplete -> verify `completed: 0`.

---

### Tier 2: Boundary, Edge Cases & Adversarial Stress (>= 5 Cases Per Feature)

Tier 2 exposes the system to extreme, malformed, and adversarial inputs to guarantee resilience.

#### 1. Enums & Boundary Validation
- **T2.1.1**: Create task with invalid `time_of_day` (e.g. `'midnight'`, `'afternoon'`, `123`) -> fallback gracefully to `'anytime'` or return 400.
- **T2.1.2**: Create habit with empty title or whitespace-only title -> reject with HTTP 400.
- **T2.1.3**: Schedule habit with boundary start times (`00:00` and `23:59`) -> properly persist and retrieve.
- **T2.1.4**: Schedule habit with extreme durations (0 minutes, 1440 minutes) -> handle gracefully without crash.
- **T2.1.5**: Update task with null/empty payload -> handle gracefully.

#### 2. SQL Injection & Escaping Resilience
- **T2.2.1**: Query `GET /api/v1/tasks?time_of_day=' OR 1=1 --` -> safe parameterized query, zero leaked records.
- **T2.2.2**: Query `GET /api/v1/tasks?search="><script>alert(1)</script>` -> safe handling, no SQL error.
- **T2.2.3**: Habit title containing quotes, backslashes, and emojis (`🌱 Morning Routine: "Focus" & 'Hydration' \ / 💡`) -> exact character preservation.
- **T2.2.4**: Subtask title with unicode special characters -> safe persistence and retrieval.
- **T2.2.5**: Ghost name with special characters (`Spouse & Co. <Primary>`) -> preserved verbatim.

#### 3. Multi-User Isolation & Cascade Integrity
- **T2.3.1**: User A filters `time_of_day=morning` -> absolutely zero User B morning habits returned.
- **T2.3.2**: User B attempts to `PATCH` User A's habit `time_of_day` -> rejected with HTTP 404.
- **T2.3.3**: User B attempts to query User A's agenda -> returns only User B's agenda.
- **T2.3.4**: Delete Ghost calendar -> all linked ghost meetings cascade deleted from agenda.
- **T2.3.5**: Delete project -> all linked habits have `project_id` set to null without deleting the habits.

---

### Tier 3: Pairwise Combinations & Feature Interactions

Tier 3 tests orthogonal features interacting in composite workflows.

| Interaction Test | Dimension A | Dimension B | Expected Result |
|------------------|-------------|-------------|-----------------|
| **T3.1: Type × Time-of-Day** | `habit`, `daily`, `todo` | `morning`, `workday`, `evening`, `anytime` | All 12 combinations persist correctly and filter accurately |
| **T3.2: Routine × Ghost Collision** | Scheduled habit at 14:00 - 15:00 | Ghost meeting at 14:00 - 15:00 | Both coexist on `GET /agenda` time-grid without overwriting or error |
| **T3.3: Batch × Project × Taxonomy** | Batch payload with 4 tasks | Assigned to Project X with distinct `time_of_day` | All 4 link to Project X, project task count increments by 4, taxonomy preserved |
| **T3.4: Subtasks × Agenda Blocking** | Daily with 3 subtasks | Scheduled onto Agenda grid at 09:00 | `scheduled_tasks` entry includes populated `subtasks` array with checklist state |
| **T3.5: Counter Scoring × Rescheduling** | Habit with `counter_up: 5` | Rescheduled to new date/time | `counter_up` remains 5 after `PATCH` of `scheduled_start` |

---

### Tier 4: Real-World WFH Application Scenarios

Tier 4 executes complete end-to-end user journeys mirroring the 4 WFH User Stories in `docs/wfh-user-stories.md`.

#### Scenario 4.1: Morning Kickoff Routine (User Story 1)
1. Batch create 5 morning habits (Hydration, Mobility, Vitamins, Agenda Review, Mindfulness).
2. Filter by `time_of_day=morning` and verify all 5 are present.
3. Score hydration counter up.
4. Complete mobility daily habit and verify streak increments to 1.
5. Check off vitamins subtasks.
6. Time-block *Morning Agenda Review* onto today's agenda grid at `08:30` (duration 30m).
7. Query `GET /api/v1/agenda` and verify the routine appears alongside meetings.

#### Scenario 4.2: Workday Focus Pacing & Health Routines (User Story 2)
1. Ingest workday routines (Desk Hydration counter, Ergonomic stretch, 50m Focus block task, Midday Lunch walk).
2. Filter by `time_of_day=workday`.
3. Time-block 50m Focus Session at `10:00` and Lunch Walk at `12:30`.
4. Increment hydration counter during focus break intervals.
5. Mark Lunch Walk complete upon return.
6. Verify agenda reflects completed lunch walk and active focus block.

#### Scenario 4.3: Ghost Calendar Conflict & Dynamic Rescheduling (User Story 3)
1. Create a Ghost calendar for spouse Marcus (`relation: Spouse`, `color: #ec4899`).
2. Add external ghost appointment: `Marcus Orthodontist (Kids Pickup)` at `15:00 - 16:00`.
3. Create user afternoon focus task: *Raft Consensus Review* scheduled at `15:00`.
4. Query `/agenda`: verify ghost meeting and user task both present at `15:00` (collision detected).
5. User reschedules focus task to `16:15` via `PATCH /api/v1/tasks/:id`.
6. Query `/agenda`: verify ghost remains at `15:00` and task is now at `16:15`.
7. Verify ghost toggle filter logic (`ghosts` list in agenda payload).

#### Scenario 4.4: Evening Shutdown & Rollover Readiness (User Story 4)
1. Ingest evening routines (Shutdown checklist with 4 subtasks, Tomorrow planning daily, Reflection log).
2. Filter by `time_of_day=evening`.
3. Sequentially complete all 4 shutdown subtasks ("Slack away", "Inbox zero", "Log commits", "Close tabs").
4. Complete shutdown daily item -> streak increments.
5. Create 3 priority tasks for tomorrow (`scheduled_date = tomorrow`).
6. Update reflection log notes.
7. Verify all evening routines ready for midnight rollover.

---

## Verification Commands & Execution Matrix

| Objective | Command | Frequency | Target / Pass Criteria |
|-----------|---------|-----------|------------------------|
| **Full Vitest Suite** | `npm test` | On every change | 100% pass across all test files |
| **WFH Integration Suite** | `npx vitest run tests/wfh_stories.test.ts` | Targeted verification | All 4 tiers pass cleanly |
| **Existing Suite Regression** | `npx vitest run tests/api.test.ts` | Regression check | All 8 tests pass in < 1s |
| **Production Build** | `npm run build` | Final release | Clean bundle in `dist/client` |
