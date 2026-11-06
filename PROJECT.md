# Project: Cadence UI Production Refinement

## Architecture
Cadence is an ADHD-friendly, non-gamified task, habit, and agenda manager tailored for high-agency knowledge workers.
- **Frontend**: React 19 SPA, TypeScript, Tailwind CSS v4, Lucide React icons, Vite 6 build system.
- **State & Layout**: `src/client/App.tsx` is the primary desktop shell orchestrating views (`habits_tasks`, `tasks_agenda`, `agenda`), modals, and filter states.
- **Internationalization**: `I18nContext.tsx` provides custom translation context with strongly-typed `translations.ts` supporting Catalan (`ca`), Spanish (`es`), and English (`en`). Key parity is strictly tested in `tests/i18n.test.ts`.
- **Backend & Agent API**: Express 5.1 REST API, SQLite (`DatabaseSync`), Bearer/API key auth, OpenAPI 3.1 schema.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Top Header Cleanup | Remove login, language selector, tools (Pomodoro, Calendar, Spotlight, Brain Dump, Shutdown, Chimes, Tutorial, Theme) from `<header>` | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Desktop Navigation Sidebar | Create collapsible/icon-rail `<Sidebar />` with action triggers, tools, system color selector, language picker, and auth | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Goblin Brain Sidebar Launcher | Add Goblin Brain trigger to sidebar opening `GoblinBrainModal` with `task=null` for global initiation | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Agent REST API Sidebar Trigger | Move Agent REST API trigger button from header to sidebar | M1 | ORIGINAL_REQUEST §R1 |
| 5 | System Color Selector in Sidebar | Relocate Theme / System color selector exclusively to sidebar | M1 | ORIGINAL_REQUEST §R1 |
| 6 | Settings Modal & Tutorial Toggle | Add `SettingsModal` with persistent toggle `showTutorials` to show/hide tutorials dynamically and guard `'?'` shortcut | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Left Panel Filter Clean & "Actiu/Tot" | Remove redundant project filter from left filter panel; add segmented "actiu/tot" (Active/All) filter hiding completed items when active | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Spoon System XS–L Restriction | Restrict all spoon sizing options throughout UI strictly to XS, S, M, L (5-15m, 15-30m, 30-60m, 60m+) | M3 | ORIGINAL_REQUEST §R3 |
| 9 | Agent Guidance Sizing & Spoons | Add internal instruction to Agent REST API system prompt, OpenAPI spec, and docs directing agents never to offer spoons and to use XS–L only | M3 | ORIGINAL_REQUEST §R3 |
| 10 | Zen Mode Completed Items Hide | Fix Zen mode so that enabling it hides completed habits and completed tasks from view in lists and cards | M4 | ORIGINAL_REQUEST §R4 |
| 11 | Pomodoro & Time Timer i18n | Translate Pomodoro timer, analog time timer disk, notifications, and tooltips into ca, es, en | M5 | ORIGINAL_REQUEST §R5 |
| 12 | Spotlight Modal i18n | Wire `useTranslation` into `SpotlightModal.tsx` and translate focus mode, timer, step navigation, and prompts into ca, es, en | M5 | ORIGINAL_REQUEST §R5 |
| 13 | Brain Dump Modal i18n | Wire `useTranslation` into `BrainDumpDrawer.tsx` and translate title, description, actions, and buttons into ca, es, en | M5 | ORIGINAL_REQUEST §R5 |
| 14 | Calendars & Ghosts Modal i18n | Translate all tabs (Ghosts, Feeds, Manual Meeting, Raw Import), accordion, buttons, and notifications into ca, es, en | M5 | ORIGINAL_REQUEST §R5 |
| 15 | Automated Verification & Build | Verify full Vitest suite (`npm test`), production build (`npm run build`), and browser UI interaction | Final | ORIGINAL_REQUEST Acceptance Criteria |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Header & Sidebar Reorganization | Remove login, lang picker, tools from top header; implement `<Sidebar />` with Goblin Brain, Agent API, and exclusive System Color Selector | none | **DONE** (Sidebar.tsx, GoblinBrainModal dual-mode, 248 tests passed) |
| M2 | Settings & Filter Adjustments | Implement `SettingsModal` with tutorial toggle; remove left project filter and add segmented "Actiu / Tot" filter | M1 | **DONE** (SettingsModal.tsx, left strip Actiu/Tot, i18n parity, 314 tests passed) |
| M3 | Spoon System & Agent Guidance | Restrict spoon sizing to XS through L across UI; add internal agent instructions to system prompt and API spec | none | **DONE** (difficulty.ts, QuickTaskBar.tsx, AgentApiModal.tsx, OpenAPI spec, 431 tests passed) |
| M4 | Zen Mode Fix | Hide completed habits and completed tasks in Zen mode across all lists and card renderers with persistence and keyboard shortcut | none | **DONE** (App.tsx 4-tier suppression, Sidebar toggle, tests/zen_mode.test.ts, 551 tests passed) |
| M5 | Modal Internationalization | Translate Pomodoro, Spotlight, Brain Dump, and Calendar modals in ca, es, en with 100% key parity in `translations.ts` | none | **DONE** (Pomodoro, TimeTimer, Spotlight, BrainDump, CalendarModal, translations.ts, tests/modal_i18n.test.ts, 613 tests passed) |
| Final | Final Verification & Quality Gate | Pass 100% Vitest tests (`npm test`), verify production build (`npm run build`), and perform overarching forensic audit | M1, M2, M3, M4, M5 | **DONE** (613/613 tests passed, clean build in 2.55s, Forensic Audit CLEAN) |

---

## Interface Contracts

### 1. Sidebar Contract (`src/client/components/Sidebar.tsx`)
```typescript
export interface SidebarProps {
  onOpenGoblin: () => void;
  onOpenAgentApi: () => void;
  onOpenPomodoro: () => void;
  onOpenCalendars: () => void;
  onOpenSpotlight: () => void;
  onOpenBrainDump: () => void;
  onOpenShutdown: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  showTutorials: boolean;
  onOpenTutorial: () => void;
  onOpenSettings: () => void;
  theme: 'light' | 'dark' | 'system';
  onCycleTheme: () => void;
  auth: { username: string; apiKey?: string } | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  zenMode?: boolean;
  onToggleZenMode?: () => void;
}
```

### 2. Settings Modal Contract (`src/client/components/SettingsModal.tsx`)
```typescript
export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showTutorials: boolean;
  onToggleTutorials: (show: boolean) => void;
  theme: 'light' | 'dark' | 'system';
  onCycleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}
```

### 3. Filter State Contract (`src/client/App.tsx`)
```typescript
// Active / All filter state:
const [activeFilter, setActiveFilter] = useState<'active' | 'all'>('active');

// Filtering logic in filteredTasks:
if (activeFilter === 'active' && Boolean(t.completed)) return false;

// Zen mode state:
const [zenMode, setZenMode] = useState<boolean>(() => {
  try { return localStorage.getItem('habitcorp_zen_mode') === 'true'; } catch { return false; }
});
// When zenMode === true: always hide completed items in baseHabitsList, allTasksList, and card renderers.
```

### 4. Agent REST API System Prompt Contract (`src/client/components/AgentApiModal.tsx`)
```text
INTERNAL AGENT INSTRUCTIONS:
- Task sizing must strictly adhere to: XS (trivial, 5-15m), S (easy, 15-30m), M (medium, 30-60m), or L (hard, 60m+).
- Never offer or mention spoons to the user under any circumstances. Present effort solely through standard sizing (XS, S, M, L) and time durations.
```

---

## Code Layout & Exclusive File Ownership

- **Milestone 1 (Header & Sidebar Reorganization)**:
  - Exclusive: `src/client/components/Sidebar.tsx` (new)
  - Shared edit: `src/client/App.tsx` (header cleanup & sidebar mount)
- **Milestone 2 (Settings & Filter Adjustments)**:
  - Exclusive: `src/client/components/SettingsModal.tsx` (new)
  - Shared edit: `src/client/App.tsx` (filter strip controls & activeFilter state)
- **Milestone 3 (Spoon Simplification & Agent Guidance)**:
  - Exclusive: `src/client/components/QuickTaskBar.tsx`, `src/client/utils/difficulty.ts`, `src/client/components/AgentApiModal.tsx`, `src/server/routes/api.ts`
- **Milestone 4 (Zen Mode Fix)**:
  - Exclusive: `tests/zen_mode.test.ts` (new)
  - Shared edit: `src/client/App.tsx` (zen mode state and item filter suppression)
- **Milestone 5 (Modal Internationalization)**:
  - Exclusive: `src/client/components/PomodoroTimer.tsx`, `src/client/components/TimeTimerDisk.tsx`, `src/client/components/SpotlightModal.tsx`, `src/client/components/BrainDumpDrawer.tsx`, `src/client/components/CalendarModal.tsx`, `src/client/i18n/translations.ts`
