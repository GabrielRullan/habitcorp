# Work-From-Home (WFH) User Stories & Routine Specifications

## Executive Summary
Cadence is engineered for high-agency remote knowledge workers who must balance intense deep work, distributed team collaboration, personal health habits, and family commitments in a single home environment. 

This document defines four comprehensive, realistic Work-From-Home (WFH) user stories. These stories serve as the authoritative behavioral specification for the WFH enhancements across database schema, REST API, client models, agenda time-blocking, and focus pacing widgets.

---

## Personas

### Primary Persona: Maya Lin
- **Role**: Staff Distributed Systems Architect & Parent of Two
- **Work Model**: 100% remote across 3 timezones
- **Daily Habits**: 8 active routines (Morning hydration, mobility workout, vitamins, agenda review, focus hydration, desk posture, lunch walk, evening shutdown)
- **Pain Points**:
  - Overwhelmed by monolithic habit lists that mix morning personal routines with workday focus habits and evening shutdown tasks.
  - Hard separation between habits and calendar: habits often get skipped because they are not time-blocked on the day's schedule grid.
  - Calendar surprises: spouse appointments or kid pickups (external commitments) collide with deep work blocks.
  - "Always on" blur: difficulty closing down the workday without a dedicated shutdown ritual.

### Secondary Persona: Alex Rivera
- **Role**: Senior Frontend Engineer & Tech Lead
- **Work Model**: Remote with high meeting load and asynchronous PR reviews
- **Daily Habits**: 6 active routines (Hydration counter, 25/5 Pomodoro pacing, posture check, Anki flashcards, walk, reflection log)
- **Pain Points**:
  - Screen fatigue and physical stiffness from sitting 6 hours straight.
  - Wants non-gamified, serene productivity tools matching a clean, soft pastel aesthetic.

---

## User Story 1: Morning Kickoff Routines

### 1.1 Story Statement
> **As a** WFH knowledge worker managing multiple morning health and planning rituals,  
> **I want to** filter my habits by `morning` time-of-day and time-block essential kickoff routines directly onto my morning Agenda grid,  
> **So that** I start my workday grounded, energized, and organized without feeling overwhelmed by afternoon or evening tasks.

### 1.2 Scenario & Workflow
1. **Wake-up & Filter (07:00)**:
   - Maya opens Cadence in her browser.
   - In the Habits column, instead of seeing all 8+ habits at once, she clicks the **Morning** filter pill.
   - Only morning-specific routines appear:
     - 💧 *Hydrate (500ml warm water & lemon)* (`type: habit`, `time_of_day: morning`, `counter_up: 0`)
     - 🧘 *Morning Mobility & Core (20m)* (`type: daily`, `time_of_day: morning`, `difficulty: medium`, streak: 12)
     - 💊 *Vitamins & Nutrient-Rich Breakfast* (`type: daily`, `time_of_day: morning`, `subtasks: ["Omega 3 + D3", "High protein breakfast", "Green tea"]`)
     - 📋 *Morning Agenda Review & Top 3 Priorities* (`type: daily`, `time_of_day: morning`, `scheduled_start: 08:30`, `scheduled_duration: 30`)
     - 🧠 *10m Mindfulness Breathing* (`type: habit`, `time_of_day: morning`)
2. **Hydration & Workout Logging (07:15 - 07:45)**:
   - Maya drinks water and clicks `+` on the *Hydrate* habit counter.
   - She finishes her mobility session and checks off *Morning Mobility & Core*, incrementing her streak from 12 to 13.
3. **Breakfast & Subtasks (08:00)**:
   - She completes breakfast and checks off the individual subtasks ("Omega 3 + D3", "High protein breakfast").
4. **Time-Blocking the Agenda Review (08:30)**:
   - Maya uses 1-click scheduling or drags *Morning Agenda Review* onto the 08:30 slot on the Agenda grid.
   - The card appears on the Agenda grid rendered with a distinct **🌱 Routine** badge, `morning` pill, and 30-minute block.
   - It sits cleanly beside her 09:00 *Engineering Standup* calendar meeting.

### 1.3 Data & Interface Contracts
- **Schema Mapping**:
  ```json
  {
    "id": "habit-morning-review",
    "title": "Morning Agenda Review & Top 3 Priorities",
    "type": "daily",
    "time_of_day": "morning",
    "difficulty": "easy",
    "frequency": "daily",
    "scheduled_date": "2026-10-28",
    "scheduled_start": "08:30",
    "scheduled_duration": 30,
    "streak": 14,
    "completed": 0
  }
  ```
- **Acceptance Criteria Verified**:
  - Filter by `time_of_day = 'morning'` returns only morning habits.
  - Recurring daily/habit maintains `type: 'daily'` when scheduled onto the agenda.
  - Visual routine indicators (seedling icon, `morning` badge, streak count) render on the agenda slot.

---

## User Story 2: Workday Pacing & Health Routines

### 1.1 Story Statement
> **As a** WFH developer focused on intense coding and system design,  
> **I want** integrated work/break pacing (Pomodoro 25m/5m or 50m/10m) and dedicated workday health tracking (posture stretches, hydration, lunch walk),  
> **So that** I sustain deep mental focus while preventing physical stiffness, eye strain, and dehydration throughout the day.

### 2.2 Scenario & Workflow
1. **Workday Filtering (09:30)**:
   - Maya switches the Habits filter to **Workday / Focus**.
   - The list displays active workday routines:
     - 💧 *Desk Hydration Counter* (`type: habit`, `time_of_day: workday`)
     - 🧍 *Ergonomic Posture & Eye Rest* (`type: habit`, `time_of_day: workday`, `notes: 20-20-20 rule`)
     - 🌳 *Midday Lunch & 30m Nature Walk* (`type: daily`, `time_of_day: workday`, `scheduled_start: 12:30`, `scheduled_duration: 60`)
2. **Starting a Deep Work Pacing Session (10:00)**:
   - Maya selects her high-priority task: *Draft Distributed Consensus Architecture RFC*.
   - In the header's **Focus Pacing** bar, she chooses the **50m Focus / 10m Break** preset.
   - She clicks **Start Focus**. A serene pastel countdown timer displays `50:00 remaining`.
   - With 1 click, she blocks this focus session onto her Agenda grid at 10:00 - 10:50.
3. **Break & Health Prompt (10:50)**:
   - The focus timer chimes softly and transitions into `10:00 Break`.
   - The break banner gently displays health cues:
     - *"Time to stretch your neck and shoulders."*
     - *"Drink a glass of water."*
   - Maya stands up, stretches, drinks water, and clicks `+` on the *Desk Hydration Counter* (incrementing `counter_up`).
4. **Lunch Walk Time-Block (12:30)**:
   - Maya's pre-scheduled *Midday Lunch & 30m Nature Walk* appears on the 12:30 agenda slot.
   - She steps away from her desk, takes a walk, returns refreshed, and checks it off.

### 2.3 Data & Interface Contracts
- **Focus Session State**:
  ```typescript
  interface FocusSessionState {
    mode: 'work' | 'break';
    workMinutes: 50;
    breakMinutes: 10;
    secondsRemaining: number;
    isRunning: boolean;
    linkedRoutineTitle?: "Draft Distributed Consensus Architecture RFC";
  }
  ```
- **Task Schema**:
  ```json
  {
    "id": "task-lunch-walk",
    "title": "Midday Lunch & 30m Nature Walk",
    "type": "daily",
    "time_of_day": "workday",
    "scheduled_date": "2026-10-28",
    "scheduled_start": "12:30",
    "scheduled_duration": 60,
    "completed": 1
  }
  ```
- **Acceptance Criteria Verified**:
  - Workday habits cleanly isolated via `time_of_day = 'workday'`.
  - Non-gamified pacing widget supports 25/5 and 50/10 intervals.
  - Pacing session can be time-blocked onto the Agenda grid.
  - Counter habits record multiple increments throughout the workday.

---

## User Story 3: Juggling Ghost Commitments & Dynamic Rescheduling

### 3.1 Story Statement
> **As a** remote professional coordinating household and family schedules,  
> **I want** external family calendar events ("Ghost Commitments") overlaid onto my Agenda time-grid,  
> **So that** I instantly spot conflicts with my focus blocks or habits and can reschedule my work flexibly without losing streaks or breaking commitments.

### 3.2 Scenario & Workflow
1. **Ghost Calendar Overlay Visibility (13:30)**:
   - Maya has a synced Ghost calendar for her spouse Marcus (`relation: 'Spouse'`, `color: '#ec4899'`).
   - On today's Agenda grid, a pink dashed-border event appears at 15:00 - 16:00:
     - `👻 Marcus: Urgent Orthodontist Appointment (Need Kids Pickup)`
2. **Conflict Identification (13:35)**:
   - Maya had originally planned an afternoon deep work block at 15:00: *Code Review: Raft Consensus Primitives*.
   - Seeing Marcus's ghost block directly on her agenda grid, she realizes she must leave the home office at 15:15 to handle school pickup.
3. **Non-Destructive Rescheduling (13:40)**:
   - Rather than canceling or deleting her focus work, Maya drags the task from 15:00 to 16:15 (or adjusts its `scheduled_start` via modal).
   - The task moves smoothly without altering its project link, subtasks, or priority.
4. **Coexistence on the Time Grid**:
   - The Agenda grid cleanly renders both the ghost event (`is_ghost: 1`, pink dashed border, ghost icon) and Maya's rescheduled task in the subsequent slot.
   - Maya can toggle ghost visibility on/off anytime using the `👻 Ghosts (1)` filter button in the Agenda header.

### 3.3 Data & Interface Contracts
- **Agenda API Response (`GET /api/v1/agenda`)**:
  ```json
  {
    "meetings": [
      {
        "id": "meeting-ghost-1",
        "title": "Urgent Orthodontist Appointment (Need Kids Pickup)",
        "start_time": "2026-10-28T15:00:00.000Z",
        "end_time": "2026-10-28T16:00:00.000Z",
        "is_ghost": 1,
        "ghost_id": "ghost-marcus-1",
        "ghost_name": "Marcus (Spouse)",
        "color": "#ec4899"
      }
    ],
    "scheduled_tasks": [
      {
        "id": "task-raft-review",
        "title": "Code Review: Raft Consensus Primitives",
        "type": "todo",
        "scheduled_date": "2026-10-28",
        "scheduled_start": "16:15",
        "scheduled_duration": 45
      }
    ]
  }
  ```
- **Acceptance Criteria Verified**:
  - Ghost events overlay seamlessly on the Agenda grid with distinct styling (`#ec4899` pink dashed borders).
  - Tasks and habits can be rescheduled via `PATCH /api/v1/tasks/:id` without resetting completion, recurrence, or streak state.
  - Ghost calendar toggle allows remote workers to hide or show external commitments on demand.

---

## User Story 4: End-of-Day Shutdown Routine

### 4.1 Story Statement
> **As a** WFH knowledge worker ending my workday in the same physical space where I live,  
> **I want** a dedicated Evening Shutdown routine to clear pending communications, review habit reflections, and set tomorrow's top priorities,  
> **So that** I create a hard boundary between work and home life and avoid evening work anxiety.

### 4.2 Scenario & Workflow
1. **Triggering Evening Mode (17:00)**:
   - Maya finishes her engineering tasks and clicks the **Evening / Shutdown** filter tab in the Habits column.
   - Only evening-relevant habits appear:
     - 📥 *Workday Shutdown Checklist* (`type: daily`, `time_of_day: evening`, `subtasks: ["Slack status to Away", "Inbox zero sweep", "Log git commits", "Close work tabs"]`)
     - 🎯 *Plan Tomorrow's 3 Must-Win Tasks* (`type: daily`, `time_of_day: evening`, streak: 19)
     - 📖 *Habit Reflection & Gratitude Log* (`type: daily`, `time_of_day: evening`, `notes: "Logged today's focus score and deep work metrics"`)
     - 🚶 *Evening Family Walk & Screen Disconnect* (`type: daily`, `time_of_day: evening`)
2. **Checking off Subtasks (17:15)**:
   - Maya sets her Slack status to Away, clears remaining inbox items, and checks off all 4 subtasks on the *Workday Shutdown Checklist*.
   - She clicks complete on the daily item, advancing her shutdown streak to 20.
3. **Planning Tomorrow & Reflection (17:25)**:
   - She opens *Plan Tomorrow's 3 Must-Win Tasks*, creates three tasks for tomorrow (`scheduled_date: 2026-10-29`), and marks the habit complete.
   - She logs a reflection note in *Habit Reflection & Gratitude Log*.
4. **Clean Slate for Midnight Rollover**:
   - All evening routines for today are marked complete.
   - When the midnight rollover runs (`runUserRollover`), completed dailies reset to uncompleted while their streak counts are preserved.

### 4.3 Data & Interface Contracts
- **Schema Mapping**:
  ```json
  {
    "id": "daily-shutdown",
    "title": "Workday Shutdown Checklist",
    "type": "daily",
    "time_of_day": "evening",
    "difficulty": "medium",
    "frequency": "daily",
    "streak": 20,
    "completed": 1,
    "subtasks": [
      { "title": "Slack status to Away", "completed": 1 },
      { "title": "Inbox zero sweep", "completed": 1 },
      { "title": "Log git commits", "completed": 1 },
      { "title": "Close work tabs", "completed": 1 }
    ]
  }
  ```
- **Acceptance Criteria Verified**:
  - Filter `time_of_day = 'evening'` isolates shutdown rituals.
  - Subtasks within dailies can be independently checked off and persisted.
  - Midnight rollover maintains streak counters without resetting best streak.

---

## Traceability Matrix

| User Story | Time-of-Day Taxonomy | Features Covered | Database Schema & API | UI Component | Test Tier Verification |
|------------|----------------------|------------------|-----------------------|--------------|------------------------|
| **Story 1: Morning Kickoff** | `morning` | F1, F2, F3, F4, F5, F6 | `tasks.time_of_day`, `tasks.scheduled_start`, `GET /tasks?time_of_day=morning` | `App.tsx` (Habits column), `AgendaView.tsx` | Tier 1 (T1.1), Tier 4 (T4.1) |
| **Story 2: Workday Pacing** | `workday` | F1, F2, F3, F4, F7, F8 | `tasks.counter_up`, `POST /tasks/batch`, Focus Session State | `FocusPacingBar.tsx`, `App.tsx` | Tier 1 (T1.2, T1.4), Tier 4 (T4.2) |
| **Story 3: Ghost Commitments** | `workday` / `anytime` | F1, F3, F5, F9 | `calendar_events.is_ghost`, `PATCH /tasks/:id`, `GET /agenda` | `AgendaView.tsx` (Ghost overlay, drag/drop) | Tier 1 (T1.5), Tier 3 (T3.2), Tier 4 (T4.3) |
| **Story 4: Evening Shutdown** | `evening` | F1, F2, F3, F4, F9 | `tasks.time_of_day`, `subtasks`, `POST /tasks/:id/score`, rollover | `App.tsx` (Habits filter), `TaskModal.tsx` | Tier 1 (T1.3), Tier 4 (T4.4) |
