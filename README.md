# 🍌 HabitCorp — The Boring Cousin of Habitica

HabitCorp is an opinionated, calm, and non-gamified habit tracker, task manager, and time-blocking agenda. It takes the structured 4-tier task taxonomy and difficulty tiers of Habitica and strips away all RPG gamification (no HP, MP, gold, bosses, or pets) while adding an interactive **Daily / Weekly Time-Grid Agenda**, a dedicated **Pomodoro Timer**, **Ghost Calendars (for partners & children)**, and a first-class **Agent REST API**.

---

## Key Features

1. **4 Distinct Task Categories (Habitica-Style Taxonomy)**:
   - **Habits**: Ongoing routines with positive (`+`), negative (`-`), or both buttons and frequency counters that reset automatically (`daily`, `weekly`, `monthly`).
   - **Periodical Dailies**: Scheduled recurring checklists (`daily`, `weekly` weekday selection, `every_n_days`, or `monthly`) with streak consistency counters (`🔥 5d`) and automatic day rollover.
   - **Timeline Tasks**: One-off tasks with due dates, urgency grouping, and 1-click "Task for Today" movement.
   - **Backlog Tasks**: Tasks with no timeline, easily filtered and prioritized by energy level.
2. **🍅 Pomodoro & Focus Timer**:
   - Classic Pomodoro (25m), Short Break (5m), Long Break (15m), and Deep Flow (50m).
   - 4-cycle interval tracking (`🍅 🍅 ⚪ ⚪`), web audio bell chimes, tab title countdown, and micro-break health cues.
   - 1-click **Block on Agenda** to directly reserve focus blocks onto your schedule.
   - Active task binding with 1-click task completion.
3. **Calendar Meetings & Time-Blocking Agenda**:
   - Schedule any habit, periodical daily, or backlog task onto an hourly **Daily / 7-Day Weekly Time Grid** (`06:00–22:00`) to mark exactly when it will be done.
   - Subscribe to external `.ics` feeds or schedule meetings manually.
4. **👻 "Ghosts" (Partners, Children & Family Logistics)**:
   - Add family members or teammates whose schedules impact yours.
   - Ghost events appear with distinct dashed pastel borders and badges.
   - Quick one-click toggle to show or hide ghost commitments.
5. **📁 Unified Projects**:
   - Organize habits, tasks, and calendar events under common projects (e.g. `Language Learning`, `Health & Fitness`, `Work`).
6. **🤖 Agent-First REST API & OpenAPI 3.1 Spec**:
   - Every user gets a private, revocable API key (`X-API-Key: tk_...`).
   - Built-in machine-readable OpenAPI spec at `/api/v1/openapi.json`.
   - Single-click **"Copy Agent Prompt"** in the web UI lets you connect any LLM agent (Claude, Gemini, Antigravity, ChatGPT, or Cursor) in seconds.
7. **Lightweight & Self-Hostable**:
   - Powered by Node.js and native `node:sqlite` in WAL mode.
   - Single portable database file. Zero external database servers required.

---

## Quick Start

### 1. Local Development
```bash
# Install dependencies
npm install

# Run backend server + Vite frontend with live reload
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Single-Port Production Run
```bash
npm run build
npm start
```
The server will run on [http://localhost:3456](http://localhost:3456) serving both the API and the static React SPA.

### 3. Docker Self-Hosting
```bash
docker compose up -d
```

---

## Agent REST API Quick Reference

Authenticate via header: `X-API-Key: <your_key>` or `Authorization: Bearer <your_key>`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/tasks` | Query tasks (filter by `type`, `difficulty`, `completed`, `due_today`, etc.) |
| `POST` | `/api/v1/tasks` | Create task, habit, or daily (supports inline `subtasks: ["Step 1", "Step 2"]`) |
| `POST` | `/api/v1/tasks/batch` | Batch create multiple tasks in one call |
| `POST` | `/api/v1/tasks/:id/score` | Score habit (`direction: "up" \| "down"`) or toggle daily/todo |
| `GET` | `/api/v1/agenda?start=YYYY-MM-DD` | Returns combined meetings and time-blocked tasks |
| `POST` | `/api/v1/meetings` | Create a calendar meeting |
| `GET` | `/api/v1/openapi.json` | Full OpenAPI 3.1 machine-readable specification |
