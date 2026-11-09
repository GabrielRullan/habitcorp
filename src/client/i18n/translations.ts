export type Language = 'en' | 'es' | 'ca';
export type SupportedLang = Language;

export interface Translations {
  // Brand & Header
  brandName: string;
  tagline: string;
  viewHabitsTasks: string;
  viewTasksAgenda: string;
  viewAgendaGrid: string;
  searchPlaceholder: string;
  addBtn: string;
  pomodoroBtn: string;
  calendarsGhostsBtn: string;
  agentApiBtn: string;
  logInSignUp: string;
  switchAccount: string;
  logOut: string;

  // Projects
  projectsLabel: string;
  allProjects: string;
  newProjectBtn: string;

  // Pomodoro
  pomodoroTitle: string;
  pomodoroFocusRest: string;
  pomodoroCycle: string;
  pomodoroCompletedToday: string;
  modePomodoro: string;
  modeShortBreak: string;
  modeLongBreak: string;
  modeDeepFlow: string;
  startPomodoro: string;
  pausePomodoro: string;
  resumePomodoro: string;
  resetPomodoro: string;
  skipPomodoro: string;
  blockOnAgenda: string;
  focusOnTaskLabel: string;
  freeformFocusOption: string;
  hydrationPrompt: string;
  posturePrompt: string;
  eyeRestPrompt: string;

  // Habits Column
  habitsTitle: string;
  columnHabits: string;
  columnDailies: string;
  columnTasks: string;
  noDailiesMessage: string;
  itemTabDaily: string;
  subtabAll: string;
  subtabDueToday: string;
  timeFilterAll: string;
  timeFilterMorning: string;
  timeFilterWorkday: string;
  timeFilterEvening: string;
  timeFilterAnytime: string;
  plusTodayBtn: string;
  convertHabitToTodayTask: string;
  convertHabitToTodayTaskTooltip: string;
  habitConvertedToast: string;
  habitActionActive: string;
  habitActionDone: string;
  habitActionBadge: string;
  habitActionAlreadyExistsToast: string;
  habitActionCreatedToast: string;
  streakLabel: string;
  routineBadge: string;
  noHabitsMessage: string;

  // Tasks Column
  tasksTitle: string;
  subtabToDo: string;
  subtabWithoutTimeline: string;
  diffTrivial: string;
  diffEasy: string;
  diffMedium: string;
  diffHard: string;
  taskBtnToday: string;
  taskBtnAgenda: string;
  taskBtnClear: string;
  noTasksMessage: string;
  noTimeline: string;
  duePrefix: string;

  // Agenda View
  agendaDay: string;
  agendaWeek: string;
  agendaToday: string;
  agendaGhosts: string;
  agendaHidden: string;
  agendaNewEvent: string;
  agendaUnscheduled: string;
  agendaTasksRoutinesToday: string;
  agendaMore: string;
  agendaFocusedBadge: string;
  agendaOthersTransparent: string;
  agendaAddSlotTitle: string;
  agendaJoin: string;
  agendaEditEvent: string;
  agendaDeleteEvent: string;
  unscheduledDrawerTitle: string;
  unscheduledDrawerSubtitle: string;
  unscheduledDrawerTabAll: string;
  unscheduledDrawerTabRoutines: string;
  unscheduledDrawerTabTasks: string;
  unscheduledDrawerEmpty: string;

  // Meeting / Event Modal
  modalNewEventTitle: string;
  modalEditEventTitle: string;
  modalEditEventSub: string;
  modalNewEventSub: string;
  eventTitleLabel: string;
  eventDateLabel: string;
  eventStartTimeLabel: string;
  eventEndTimeLabel: string;
  eventDurationLabel: string;
  eventAllDayLabel: string;
  eventLocationLabel: string;
  eventMeetingUrlLabel: string;
  eventDescNotesLabel: string;
  eventHighlightColorLabel: string;
  eventFamilyGhostLabel: string;
  eventPastelOutlineBadge: string;
  eventGhostsAttached: (count: number) => string;
  eventAssignedGhostsLabel: string;
  eventSelectedCount: (count: number) => string;
  deleteEventBtn: string;
  confirmDeleteBtn: string;
  cancelBtn: string;
  saveChangesBtn: string;
  createEventBtn: string;
  noGhostsConfiguredNote: string;

  // Task Modal
  modalNewItemTitle: string;
  modalEditItemTitle: string;
  itemTypeTodo: string;
  itemTypeHabit: string;
  itemTypeDaily: string;
  itemTabHabit: string;
  itemTabTask: string;
  itemTitleLabel: string;
  itemTitlePlaceholderHabit: string;
  itemTitlePlaceholderTask: string;
  itemNotesLabel: string;
  itemNotesLabelOptional: string;
  itemNotesPlaceholder: string;
  itemDifficultyLabel: string;
  itemTaskSizeLabel: string;
  itemEstimatedDuration: string;
  diffTierTrivialLabel: string;
  diffTierTrivialHint: string;
  diffTierEasyLabel: string;
  diffTierEasyHint: string;
  diffTierMediumLabel: string;
  diffTierMediumHint: string;
  diffTierHardLabel: string;
  diffTierHardHint: string;
  itemProjectLabel: string;
  itemProjectHeader: string;
  itemNewProjectBtn: string;
  itemNewProjectPlaceholder: string;
  itemProjectCreating: string;
  itemCreateSelectProjectBtn: string;
  itemNoProjectOption: string;
  itemTimeOfDayLabel: string;
  itemTimeOfDaySub: string;
  itemTimeOfDayHintMorning: string;
  itemTimeOfDayHintWorkday: string;
  itemTimeOfDayHintEvening: string;
  itemTimeOfDayHintAnytime: string;
  timeOfDayMorning: string;
  timeOfDayWorkday: string;
  timeOfDayEvening: string;
  timeOfDayAnytime: string;
  periodicityTitle: string;
  periodEveryDay: string;
  periodWeekdays: string;
  periodSpecificDays: string;
  periodFlexibleCounter: string;
  weekdaysShort: { label: string; value: number }[];
  counterButtonsLabel: string;
  counterPositive: string;
  counterNegative: string;
  blockAgendaSlotLabel: string;
  routineSlotBadge: string;
  labelDate: string;
  labelStartTime: string;
  labelDuration: string;
  timelineTitle: string;
  timelineNone: string;
  timelineToday: string;
  timelineCustom: string;
  itemScheduleAgendaLabel: string;
  itemDueDateLabel: string;
  itemSubtasksLabel: string;
  checklistTitle: (count: number) => string;
  checklistPlaceholder: string;
  checklistAddBtn: string;
  saveBtn: string;
  deleteTaskBtn: string;
  deleteTaskConfirm: string;

  // Meeting Modal detailed
  eventTitlePlaceholder: string;
  eventLocationPlaceholder: string;
  eventPeriodicalBadge: string;
  recurrenceOneTime: string;
  recurrenceWeekly: string;
  recurrenceMonthly: string;
  repeatOnDaysLabel: string;
  repeatUntilLabel: string;
  clearBtn: string;

  // Projects Modal
  projectModalTitle: string;
  projectModalSub: string;
  projectNameLabel: string;
  projectColorLabel: string;
  projectCreateBtn: string;
  deleteProjectConfirm: string;

  // Zen Mode & Filters
  zenModeBtn: string;
  zenModeExpl: string;
  filtersBtn: string;
  filtersActive: string;

  // Calendar & Ghosts Modal
  calModalTitle: string;
  calModalSub: string;
  activeFeedsLabel: string;
  ghostContactsLabel: string;
  addFeedBtn: string;
  addGhostBtn: string;
  saveGhostChangesBtn: string;
  editBtn: string;
  syncBtn: string;

  // Auth
  authTitle: string;
  authSub: string;
  sendMagicLinkBtn: string;

  // Settings Modal & Tutorial Management
  settingsTitle: string;
  settingsSub: string;
  showTutorialsLabel: string;
  showTutorialsDesc: string;
  soundEffectsLabel: string;
  soundEffectsDesc: string;
  themeLabel: string;
  themeDesc: string;
  densityLabel: string;
  densityDesc: string;

  // Active / All Status Filter
  subtabActive: string;
  filterActive: string;
  filterAll: string;

  // Milestone 5: Modal Internationalization (R5)
  // Shared
  closeBtn: string;

  // Pomodoro & TimeTimer
  pomodoroSessionCompleted: string;
  pomodoroResetTooltip: string;
  pomodoroToggleVisualDiskTitle: string;
  pomodoroVisualDiskBtn: string;
  pomodoroSoundEnabled: string;
  pomodoroSoundMuted: string;
  pomodoroCloseBar: string;
  pomodoroVisualDiskTitle: string;
  pomodoroTimeUp: string;
  timeTimerFocusTitle: string;
  timeTimerStatusFocusing: string;
  timeTimerStatusDone: string;
  timeTimerStatusPaused: string;
  timeTimerStart: string;
  timeTimerPause: string;
  timeTimerResetTitle: string;
  timeTimerSoundEnabled: string;
  timeTimerSoundMuted: string;

  // Spotlight Modal
  spotlightFocusTunnel: string;
  spotlightToggleTimerTitle: string;
  spotlightHideTimer: string;
  spotlightShowTimer: string;
  spotlightExitTitle: string;
  spotlightSize: string;
  spotlightNextStep: string;
  spotlightGoblinPrompt: string;
  spotlightCompleting: string;
  spotlightMarkDone: string;
  spotlightSkipTooltip: string;
  spotlightSkipForNow: string;
  spotlightTaskProgress: (current?: number, total?: number) => string;
  spotlightEmptyTitle: string;
  spotlightEmptyDesc: string;
  spotlightBackToBoard: string;

  // Brain Dump Drawer
  brainDumpTitle: string;
  brainDumpSubtitle: string;
  brainDumpPlaceholder: string;
  brainDumpHelpText: string;
  brainDumpSaving: string;
  brainDumpSubmitBtn: string;

  // Calendar & Ghosts Modal
  calGhostAddSyncError: (error?: string) => string;
  calGhostAddedSynced: (count?: number) => string;
  calGhostAddedContact: string;
  calGhostAddError: string;
  calGhostSyncedEvents: (count?: number) => string;
  calGhostSyncError: string;
  calGhostUpdated: string;
  calGhostUpdateError: string;
  calFeedAddSyncNotice: (notice?: string) => string;
  calFeedAddedSynced: (count?: number) => string;
  calFeedAddedNoEvents: string;
  calFeedAddError: string;
  calFeedSyncedEvents: (count?: number) => string;
  calFeedSyncError: string;
  calFeedUpdated: string;
  calEventAddedToAgenda: string;
  calEventsImported: (count?: number) => string;
  calSyncNoticePrefix: string;
  calDismissTitle: string;

  calTabGhosts: string;
  calTabFeeds: string;
  calTabManual: string;
  calTabImport: string;

  calGhostsWhatIsTitle: string;
  calGhostsWhatIsDesc: string;
  calGhostsActiveHeading: (count?: number) => string;
  calGhostsEmpty: string;
  calGhostEditHeading: (name?: string) => string;
  calGhostNameLabel: string;
  calGhostNamePlaceholder: string;
  calGhostRelationLabel: string;
  calGhostRelationPlaceholder: string;
  calGhostColorLabel: string;
  calGhostColorTooltip: string;
  calGhostIcsUrlLabel: string;
  calGhostIcsUrlPlaceholder: string;
  calGhostEventsCount: (count?: number) => string;
  calGhostManualOnly: string;
  calGhostLastSynced: (time?: string) => string;
  calGhostNeverSynced: string;
  calGhostSyncTooltip: string;
  calGhostEditTooltip: string;
  calGhostDeleteTooltip: string;
  calGhostAddNewHeading: string;
  calGhostAddNamePlaceholder: string;
  calGhostAddRelationPlaceholder: string;
  calGhostAddIcsPlaceholder: string;
  calGhostAddingBtn: string;
  calGhostAddSubmitBtn: string;

  calFeedsHeading: (count?: number) => string;
  calFeedsEmpty: string;
  calFeedEditHeading: (name?: string) => string;
  calFeedNameLabel: string;
  calFeedNamePlaceholder: string;
  calFeedColorLabel: string;
  calFeedColorTooltip: string;
  calFeedIcsUrlLabel: string;
  calFeedIcsUrlPlaceholder: string;
  calFeedEventsCount: (count?: number) => string;
  calFeedLastSynced: (time?: string, date?: string) => string;
  calFeedNeverSynced: string;
  calFeedSyncTooltip: string;
  calFeedEditTooltip: string;
  calFeedDeleteTooltip: string;
  calGuideAccordionTitle: string;
  calGuideHideTips: string;
  calGuideShowTips: string;
  calGuideGoogleLabel: string;
  calGuideGoogleText: string;
  calGuideAppleLabel: string;
  calGuideAppleText: string;
  calGuideOutlookLabel: string;
  calGuideOutlookText: string;
  calGuideNoteText: string;
  calFeedAddNewHeading: string;
  calFeedAddNamePlaceholder: string;
  calFeedBadgeColorTooltip: string;
  calFeedAddUrlPlaceholder: string;
  calFeedAddingSyncingBtn: string;
  calFeedSubscribeSyncBtn: string;

  calManualTitleLabel: string;
  calManualTitlePlaceholder: string;
  calManualIsGhostCheckbox: string;
  calManualGhostCountBadge: (count?: number) => string;
  calManualSelectGhostsLabel: string;
  calManualCreatingBtn: string;
  calManualAddEventBtn: string;

  calRawImportDescription: string;
  calRawImportingBtn: string;
  calRawImportBtn: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    brandName: 'HabitCorp',
    tagline: 'The boring cousin of Habitica',
    viewHabitsTasks: 'Habits + Tasks',
    viewTasksAgenda: 'Tasks + Agenda',
    viewAgendaGrid: 'Agenda Grid',
    searchPlaceholder: 'Search...',
    addBtn: 'Add',
    pomodoroBtn: 'Pomodoro',
    calendarsGhostsBtn: 'Calendars & Ghosts',
    agentApiBtn: 'Agent API',
    logInSignUp: 'Log In / Sign Up',
    switchAccount: 'Switch Account (Magic Link)',
    logOut: 'Log Out',

    projectsLabel: 'Projects:',
    allProjects: 'All Projects',
    newProjectBtn: 'New Project',

    pomodoroTitle: 'Pomodoro Timer',
    pomodoroFocusRest: 'FOCUS & REST',
    pomodoroCycle: 'Cycle',
    pomodoroCompletedToday: 'pomodoros completed today',
    modePomodoro: 'Pomodoro',
    modeShortBreak: 'Short Break',
    modeLongBreak: 'Long Break',
    modeDeepFlow: 'Deep Flow',
    startPomodoro: 'Start Pomodoro',
    pausePomodoro: 'Pause',
    resumePomodoro: 'Resume',
    resetPomodoro: 'Reset',
    skipPomodoro: 'Skip',
    blockOnAgenda: 'Block on Agenda',
    focusOnTaskLabel: 'Focus on task:',
    freeformFocusOption: '— Freeform Focus Session —',
    hydrationPrompt: 'Hydration',
    posturePrompt: 'Posture & Stretch',
    eyeRestPrompt: '20-20-20 Eye Rest',

    habitsTitle: 'HABITS & ROUTINES',
    columnHabits: 'Habits (+/-)',
    columnDailies: 'Dailies',
    columnTasks: 'Tasks',
    noDailiesMessage: 'No dailies or routines found in this view.',
    itemTabDaily: '🔄 Daily / Routine',
    subtabAll: 'All',
    subtabDueToday: 'Due Today',
    timeFilterAll: 'All Day',
    timeFilterMorning: 'Morning',
    timeFilterWorkday: 'Workday',
    timeFilterEvening: 'Evening',
    timeFilterAnytime: 'Anytime',
    plusTodayBtn: '+ Today',
    convertHabitToTodayTask: "Today's Task",
    convertHabitToTodayTaskTooltip: "Create today's task for this habit (synchronized with habit)",
    habitConvertedToast: 'converted to task for today!',
    habitActionActive: '⚡ Task active',
    habitActionDone: '✓ Task done',
    habitActionBadge: 'Habit Task',
    habitActionAlreadyExistsToast: "This habit already has its task for today active in the tasks column.",
    habitActionCreatedToast: "Today's task created! Completing it will log your habit.",
    streakLabel: 'streak',
    routineBadge: 'Routine',
    noHabitsMessage: 'No habits or routines found in this view.',

    tasksTitle: 'TASKS',
    subtabToDo: 'To Do',
    subtabWithoutTimeline: 'Without Timeline',
    diffTrivial: 'Trivial',
    diffEasy: 'Easy',
    diffMedium: 'Medium',
    diffHard: 'Hard',
    taskBtnToday: 'Today',
    taskBtnAgenda: 'Agenda',
    taskBtnClear: 'Clear',
    noTasksMessage: 'No tasks found in this view.',
    noTimeline: 'No timeline',
    duePrefix: 'Due',

    agendaDay: 'Day',
    agendaWeek: 'Week',
    agendaToday: 'Today',
    agendaGhosts: 'Ghosts',
    agendaHidden: 'Hidden',
    agendaNewEvent: 'Event',
    agendaUnscheduled: 'Unscheduled',
    agendaTasksRoutinesToday: '📌 Tasks & Routines for Today:',
    agendaMore: 'more',
    agendaFocusedBadge: 'Focused',
    agendaOthersTransparent: '(others transparent)',
    agendaAddSlotTitle: 'Add task or meeting',
    agendaJoin: 'Join',
    agendaEditEvent: 'Edit event',
    agendaDeleteEvent: 'Delete event',
    unscheduledDrawerTitle: 'Unscheduled Tasks & Backlog',
    unscheduledDrawerSubtitle: 'Drag items directly onto the hourly calendar timeline or click to schedule.',
    unscheduledDrawerTabAll: 'All Items',
    unscheduledDrawerTabRoutines: 'Routines',
    unscheduledDrawerTabTasks: 'Tasks',
    unscheduledDrawerEmpty: 'No unscheduled tasks or routines in this view.',

    modalNewEventTitle: 'New Calendar Event',
    modalEditEventTitle: 'Edit Calendar Event',
    modalEditEventSub: 'Update event details, timing, or link on your agenda',
    modalNewEventSub: 'Add a scheduled event or sync block to your agenda',
    eventTitleLabel: 'Event Title',
    eventDateLabel: 'Date',
    eventStartTimeLabel: 'Start Time',
    eventEndTimeLabel: 'End Time',
    eventDurationLabel: 'Duration:',
    eventAllDayLabel: 'All-day event',
    eventLocationLabel: 'Location',
    eventMeetingUrlLabel: 'Meeting URL',
    eventDescNotesLabel: 'Description / Agenda Notes',
    eventHighlightColorLabel: 'Highlight Color',
    eventFamilyGhostLabel: 'Family / Ghost Calendar Event',
    eventPastelOutlineBadge: 'Pastel Outline',
    eventGhostsAttached: (count: number) => `${count} Ghosts Attached`,
    eventAssignedGhostsLabel: 'Assigned Ghosts / Contacts (select multiple):',
    eventSelectedCount: (count: number) => `${count} selected`,
    deleteEventBtn: 'Delete Event',
    confirmDeleteBtn: 'Confirm Delete',
    cancelBtn: 'Cancel',
    saveChangesBtn: 'Save Changes',
    createEventBtn: 'Create Event',
    noGhostsConfiguredNote: 'No ghost contacts configured yet. Configure them in Calendar & Feeds.',

    modalNewItemTitle: 'New Item',
    modalEditItemTitle: 'Edit Item',
    itemTypeTodo: 'Task / To-Do',
    itemTypeHabit: 'Habit (+ / -)',
    itemTypeDaily: 'Daily Routine',
    itemTabHabit: '🌱 Habit (Recurring)',
    itemTabTask: '✓ Task (To-Do)',
    itemTitleLabel: 'Title',
    itemTitlePlaceholderHabit: 'e.g. Daily 20m Anki flashcards or Drink 2L water',
    itemTitlePlaceholderTask: 'e.g. Complete chapter 4 exercise',
    itemNotesLabel: 'Notes',
    itemNotesLabelOptional: 'Notes (Optional)',
    itemNotesPlaceholder: 'Add details, links, or context...',
    itemDifficultyLabel: 'Difficulty / Energy',
    itemTaskSizeLabel: 'Task Size',
    itemEstimatedDuration: 'Estimated duration',
    diffTierTrivialLabel: 'Extra Small',
    diffTierTrivialHint: 'Quick win / Frictionless',
    diffTierEasyLabel: 'Small',
    diffTierEasyHint: 'Light effort / Routine flow',
    diffTierMediumLabel: 'Medium',
    diffTierMediumHint: 'Moderate effort / Focused work',
    diffTierHardLabel: 'Large',
    diffTierHardHint: 'Deep focus / High effort',
    itemProjectLabel: 'Project',
    itemProjectHeader: 'Project (Link Habits & Tasks)',
    itemNewProjectBtn: '+ New Project',
    itemNewProjectPlaceholder: 'Project name (e.g. Chinese learning)',
    itemProjectCreating: 'Creating...',
    itemCreateSelectProjectBtn: 'Create & Select Project',
    itemNoProjectOption: 'No Project (Standalone)',
    itemTimeOfDayLabel: 'Time of Day',
    itemTimeOfDaySub: 'WFH Routine Organization',
    itemTimeOfDayHintMorning: 'Kickoff & morning focus',
    itemTimeOfDayHintWorkday: 'Core working hours & pacing',
    itemTimeOfDayHintEvening: 'Shutdown & evening reflection',
    itemTimeOfDayHintAnytime: 'Flexible throughout day',
    timeOfDayMorning: 'Morning',
    timeOfDayWorkday: 'Workday',
    timeOfDayEvening: 'Evening',
    timeOfDayAnytime: 'Anytime',
    periodicityTitle: 'Periodicity / Recurrence',
    periodEveryDay: 'Every Day',
    periodWeekdays: 'Weekdays (Mon–Fri)',
    periodSpecificDays: 'Specific Days',
    periodFlexibleCounter: 'Flexible (+/- only)',
    weekdaysShort: [
      { label: 'Su', value: 0 },
      { label: 'Mo', value: 1 },
      { label: 'Tu', value: 2 },
      { label: 'We', value: 3 },
      { label: 'Th', value: 4 },
      { label: 'Fr', value: 5 },
      { label: 'Sa', value: 6 },
    ],
    counterButtonsLabel: 'Add +/- Counter Buttons:',
    counterPositive: '(+) Positive',
    counterNegative: '(-) Negative',
    blockAgendaSlotLabel: 'Block specific time on Agenda grid',
    routineSlotBadge: '🌱 Routine Slot',
    labelDate: 'Date',
    labelStartTime: 'Start Time',
    labelDuration: 'Duration',
    timelineTitle: 'Timeline / Due Date',
    timelineNone: 'Without Timeline',
    timelineToday: '📅 Task for Today',
    timelineCustom: 'Pick Due Date',
    itemScheduleAgendaLabel: 'Schedule on Agenda',
    itemDueDateLabel: 'Due Date',
    itemSubtasksLabel: 'Checklist / Subtasks',
    checklistTitle: (count: number) => `Checklist / Steps (${count})`,
    checklistPlaceholder: 'Add checklist step...',
    checklistAddBtn: 'Add',
    saveBtn: 'Save',
    deleteTaskBtn: 'Delete Task',
    deleteTaskConfirm: 'Are you sure you want to delete this task?',

    eventTitlePlaceholder: 'e.g. Architecture Alignment, School Run, Dentist...',
    eventLocationPlaceholder: 'e.g. Room 3B, Home, Gym...',
    eventPeriodicalBadge: 'Periodical Event',
    recurrenceOneTime: 'One-time',
    recurrenceWeekly: 'Weekly',
    recurrenceMonthly: 'Monthly',
    repeatOnDaysLabel: 'Repeat on Days',
    repeatUntilLabel: 'Repeat Until (optional):',
    clearBtn: 'Clear',

    projectModalTitle: 'Create New Project',
    projectModalSub: 'Group related habits and tasks under a unified theme.',
    projectNameLabel: 'Project Name',
    projectColorLabel: 'Theme Color',
    projectCreateBtn: 'Create Project',
    deleteProjectConfirm: 'Are you sure you want to delete this project? Tasks will remain as standalone items.',

    zenModeBtn: 'Zen Mode',
    zenModeExpl: 'Zen Mode automatically hides completed tasks and sensory noise to relieve ADHD cognitive overload. You only see what is actionable right now, guilt-free.',
    filtersBtn: 'Filters',
    filtersActive: 'Filters Active',

    calModalTitle: 'Calendars & Ghosts',
    calModalSub: 'Sync external calendar subscriptions (ICS) and manage family ghost calendars.',
    activeFeedsLabel: 'Active Feeds',
    ghostContactsLabel: 'Ghost Contacts (Family & Work)',
    addFeedBtn: 'Add Calendar Feed',
    addGhostBtn: 'Add Ghost Contact',
    saveGhostChangesBtn: 'Save Changes',
    editBtn: 'Edit',
    syncBtn: 'Sync',

    authTitle: 'Passwordless Sign In',
    authSub: 'Enter your email to receive a Magic Link or create a new account.',
    sendMagicLinkBtn: 'Send Magic Link',

    // Settings Modal & Tutorial Management
    settingsTitle: 'Settings',
    settingsSub: 'Manage application preferences, tutorials, audio cues, and display',
    showTutorialsLabel: 'Interactive Tutorials & Guides',
    showTutorialsDesc: 'Display the tutorial button and allow "?" shortcut',
    soundEffectsLabel: 'Celebration Audio Feedback',
    soundEffectsDesc: 'Play audio chimes when completing habits and tasks',
    themeLabel: 'System Color Theme',
    themeDesc: 'Choose between light, dark, or system mode',
    densityLabel: 'Visual Density Mode',
    densityDesc: 'Toggle between spacious view and compact ADHD-friendly view',

    // Active / All Status Filter
    subtabActive: 'Active',
    filterActive: 'Active',
    filterAll: 'All',

    // Milestone 5: Modal Internationalization (R5)
    // Shared
    closeBtn: 'Close',

    // Pomodoro
    pomodoroSessionCompleted: 'Session completed!',
    pomodoroResetTooltip: 'Reset to 25m',
    pomodoroToggleVisualDiskTitle: 'Show / hide visual disk (Time Timer)',
    pomodoroVisualDiskBtn: 'Visual Disk',
    pomodoroSoundEnabled: 'Chime sound enabled',
    pomodoroSoundMuted: 'Chime sound muted',
    pomodoroCloseBar: 'Close Pomodoro bar',
    pomodoroVisualDiskTitle: 'Analog Visual Disk (Time Timer)',
    pomodoroTimeUp: 'Time is up!',

    // Time Timer Disk
    timeTimerFocusTitle: 'Focus',
    timeTimerStatusFocusing: 'Focusing',
    timeTimerStatusDone: 'Done!',
    timeTimerStatusPaused: 'Paused',
    timeTimerStart: 'Start',
    timeTimerPause: 'Pause',
    timeTimerResetTitle: 'Reset timer',
    timeTimerSoundEnabled: 'Sound enabled',
    timeTimerSoundMuted: 'Sound muted',

    // Spotlight Modal
    spotlightFocusTunnel: 'Single-Task Focus Tunnel',
    spotlightToggleTimerTitle: 'Toggle Analog Time-Timer Disk',
    spotlightHideTimer: 'Hide Timer',
    spotlightShowTimer: 'Analog Timer',
    spotlightExitTitle: 'Exit Spotlight (Esc)',
    spotlightSize: 'Size',
    spotlightNextStep: 'Next Step:',
    spotlightGoblinPrompt: 'Stuck? Break this down with Goblin Brain',
    spotlightCompleting: 'Completing...',
    spotlightMarkDone: 'Mark Done',
    spotlightSkipTooltip: 'Skip to next task for now (no penalty)',
    spotlightSkipForNow: 'Skip for now',
    spotlightTaskProgress: (current: number = 0, total: number = 0) => `Task ${current} of ${total || current} • Press Esc to exit`,
    spotlightEmptyTitle: 'Your Focus Tunnel is Clear!',
    spotlightEmptyDesc: 'No pending tasks to spotlight right now. Take a deep breath or check your backlog.',
    spotlightBackToBoard: 'Back to Board',

    // Brain Dump Drawer
    brainDumpTitle: 'Brain Dump (Working Memory Offloader)',
    brainDumpSubtitle: 'Dump intrusive thoughts here so your head is clear. No dates or tags required.',
    brainDumpPlaceholder: "Type thoughts (one per line):\n• Buy printer paper\n• Reply to Sarah's email\n• Clean coffee machine",
    brainDumpHelpText: 'Each line becomes a backlog task. Press Cmd+Enter to dump.',
    brainDumpSaving: 'Offloading...',
    brainDumpSubmitBtn: 'Dump & Clear Brain',

    // Calendar & Ghosts Modal
    calGhostAddSyncError: (error: string = '') => `Ghost added, but calendar sync had an issue: ${error}`,
    calGhostAddedSynced: (count: number = 0) => `Ghost added and synced ${count} event${count === 1 ? '' : 's'}!`,
    calGhostAddedContact: 'Ghost contact added!',
    calGhostAddError: 'Error adding ghost',
    calGhostSyncedEvents: (count: number = 0) => `Ghost calendar synced! ${count} event${count === 1 ? '' : 's'} updated.`,
    calGhostSyncError: 'Error syncing ghost calendar',
    calGhostUpdated: 'Ghost contact updated!',
    calGhostUpdateError: 'Error updating ghost',
    calFeedAddSyncNotice: (notice: string = '') => `Calendar added, but sync notice: ${notice}`,
    calFeedAddedSynced: (count: number = 0) => `Calendar feed added! Synced ${count} event${count === 1 ? '' : 's'}.`,
    calFeedAddedNoEvents: 'Calendar feed added. No events in current agenda window.',
    calFeedAddError: 'Error adding calendar feed',
    calFeedSyncedEvents: (count: number = 0) => `Calendar synced! ${count} event${count === 1 ? '' : 's'} updated.`,
    calFeedSyncError: 'Error syncing calendar feed',
    calFeedUpdated: 'Calendar feed updated!',
    calEventAddedToAgenda: 'Event added to agenda!',
    calEventsImported: (count: number = 0) => `Imported ${count} calendar event${count === 1 ? '' : 's'}!`,
    calSyncNoticePrefix: 'Sync Notice: ',
    calDismissTitle: 'Dismiss',

    calTabGhosts: '👻 Ghosts (Family / Spouse)',
    calTabFeeds: 'My Calendar Feeds',
    calTabManual: 'Add Meeting',
    calTabImport: 'Raw .ics Upload',

    calGhostsWhatIsTitle: 'What are Ghosts?',
    calGhostsWhatIsDesc: 'External people whose schedules impact you (like your spouse, kids, or roommates). Connect their .ics calendar feeds or log their appointments so their commitments show up clearly on your agenda, with a one-click toggle to show or hide them anytime.',
    calGhostsActiveHeading: (count: number = 0) => `Active Ghosts (${count})`,
    calGhostsEmpty: 'No ghosts configured yet. Add your spouse, children, or roommates below!',
    calGhostEditHeading: (name: string = '') => `Edit Ghost: ${name}`,
    calGhostNameLabel: 'Name',
    calGhostNamePlaceholder: 'Name',
    calGhostRelationLabel: 'Relation',
    calGhostRelationPlaceholder: 'Relation',
    calGhostColorLabel: 'Color',
    calGhostColorTooltip: 'Ghost badge color',
    calGhostIcsUrlLabel: 'ICS Calendar URL',
    calGhostIcsUrlPlaceholder: 'Optional .ics URL',
    calGhostEventsCount: (count: number = 0) => `${count} event${count === 1 ? '' : 's'}`,
    calGhostManualOnly: 'Manual events only',
    calGhostLastSynced: (time: string = '') => `Last synced: ${time}`,
    calGhostNeverSynced: 'Never synced',
    calGhostSyncTooltip: 'Sync Ghost Calendar',
    calGhostEditTooltip: 'Edit Ghost',
    calGhostDeleteTooltip: 'Delete Ghost',
    calGhostAddNewHeading: 'Add New Ghost',
    calGhostAddNamePlaceholder: 'Name (e.g. Sarah or Leo)',
    calGhostAddRelationPlaceholder: 'Relation (e.g. Spouse, Child)',
    calGhostAddIcsPlaceholder: 'Optional .ics URL (e.g. Google Calendar secret iCal link)',
    calGhostAddingBtn: 'Adding...',
    calGhostAddSubmitBtn: 'Add Ghost',

    calFeedsHeading: (count: number = 0) => `My Calendar Feeds (${count})`,
    calFeedsEmpty: 'No personal calendar feeds configured yet.',
    calFeedEditHeading: (name: string = '') => `Edit Feed: ${name}`,
    calFeedNameLabel: 'Feed Name',
    calFeedNamePlaceholder: 'Feed Name',
    calFeedColorLabel: 'Color',
    calFeedColorTooltip: 'Feed color',
    calFeedIcsUrlLabel: 'ICS Feed URL',
    calFeedIcsUrlPlaceholder: 'https://.../calendar.ics',
    calFeedEventsCount: (count: number = 0) => `${count} event${count === 1 ? '' : 's'}`,
    calFeedLastSynced: (time: string = '', date?: string) => `Last synced: ${time}${date ? ` (${date})` : ''}`,
    calFeedNeverSynced: 'Never synced',
    calFeedSyncTooltip: 'Sync Now',
    calFeedEditTooltip: 'Edit Feed',
    calFeedDeleteTooltip: 'Delete Feed',
    calGuideAccordionTitle: 'How to get your iCal (.ics) link',
    calGuideHideTips: 'Hide tips ▲',
    calGuideShowTips: 'Show tips ▼',
    calGuideGoogleLabel: 'Google Calendar:',
    calGuideGoogleText: 'Settings ⚙️ → under Settings for my calendars, click your calendar → scroll to Integrate calendar → copy the Secret address in iCal format (ends in .ics).',
    calGuideAppleLabel: 'Apple iCloud:',
    calGuideAppleText: 'Open Calendar app on Mac or iPhone → click Share icon next to calendar → enable Public Calendar → tap Copy Link (starts with webcal://, supported automatically).',
    calGuideOutlookLabel: 'Outlook / Office 365:',
    calGuideOutlookText: 'Settings ⚙️ → Calendar → Shared calendars → Publish a calendar → copy the ICS link.',
    calGuideNoteText: '💡 Note: Browser page links (such as calendar.google.com/calendar/u/0/r) cannot be synced. Only direct iCalendar feeds (.ics or webcal://) work.',
    calFeedAddNewHeading: 'Add My Calendar Feed',
    calFeedAddNamePlaceholder: 'Feed Name (e.g. Work Calendar)',
    calFeedBadgeColorTooltip: 'Calendar badge color',
    calFeedAddUrlPlaceholder: 'https://calendar.google.com/calendar/ical/.../basic.ics',
    calFeedAddingSyncingBtn: 'Adding & Syncing...',
    calFeedSubscribeSyncBtn: 'Subscribe & Sync',

    calManualTitleLabel: 'Event / Meeting Title',
    calManualTitlePlaceholder: 'e.g. Soccer Practice or Product Sync',
    calManualIsGhostCheckbox: '👻 This is a Ghost Event (Spouse / Children / Family)',
    calManualGhostCountBadge: (count: number = 0) => `${count} ${count === 1 ? 'Ghost' : 'Ghosts'}`,
    calManualSelectGhostsLabel: 'Select one or more ghosts for this event:',
    calManualCreatingBtn: 'Creating...',
    calManualAddEventBtn: 'Add Event to Agenda',

    calRawImportDescription: 'Paste raw .ics calendar content here to import one-time events without configuring a recurring URL feed.',
    calRawImportingBtn: 'Importing...',
    calRawImportBtn: 'Import .ics Content',
  },

  es: {
    brandName: 'HabitCorp',
    tagline: 'El primo aburrido de Habitica',
    viewHabitsTasks: 'Hábitos + Tareas',
    viewTasksAgenda: 'Tareas + Agenda',
    viewAgendaGrid: 'Cuadrícula de Agenda',
    searchPlaceholder: 'Buscar...',
    addBtn: 'Añadir',
    pomodoroBtn: 'Pomodoro',
    calendarsGhostsBtn: 'Calendarios y Fantasmas',
    agentApiBtn: 'API de Agente',
    logInSignUp: 'Iniciar sesión / Registro',
    switchAccount: 'Cambiar de cuenta (Magic Link)',
    logOut: 'Cerrar sesión',

    projectsLabel: 'Proyectos:',
    allProjects: 'Todos los proyectos',
    newProjectBtn: 'Nuevo proyecto',

    pomodoroTitle: 'Temporizador Pomodoro',
    pomodoroFocusRest: 'ENFOQUE Y DESCANSO',
    pomodoroCycle: 'Ciclo',
    pomodoroCompletedToday: 'pomodoros completados hoy',
    modePomodoro: 'Pomodoro',
    modeShortBreak: 'Pausa corta',
    modeLongBreak: 'Pausa larga',
    modeDeepFlow: 'Flujo profundo',
    startPomodoro: 'Iniciar Pomodoro',
    pausePomodoro: 'Pausar',
    resumePomodoro: 'Reanudar',
    resetPomodoro: 'Reiniciar',
    skipPomodoro: 'Saltar',
    blockOnAgenda: 'Bloquear en Agenda',
    focusOnTaskLabel: 'Enfocar en tarea:',
    freeformFocusOption: '— Sesión libre de enfoque —',
    hydrationPrompt: 'Hidratación',
    posturePrompt: 'Postura y estiramiento',
    eyeRestPrompt: 'Descanso visual 20-20-20',

    habitsTitle: 'HÁBITOS Y RUTINAS',
    columnHabits: 'Hábitos (+/-)',
    columnDailies: 'Rutinas',
    columnTasks: 'Tareas',
    noDailiesMessage: 'No se encontraron rutinas ni diarias en esta vista.',
    itemTabDaily: '🔄 Rutina / Diaria',
    subtabAll: 'Todos',
    subtabDueToday: 'Para hoy',
    timeFilterAll: 'Todo el día',
    timeFilterMorning: 'Mañana',
    timeFilterWorkday: 'Jornada',
    timeFilterEvening: 'Tarde/Noche',
    timeFilterAnytime: 'Cualquier hora',
    plusTodayBtn: '+ Hoy',
    convertHabitToTodayTask: 'Tarea hoy',
    convertHabitToTodayTaskTooltip: 'Crear la tarea de hoy para este hábito (sincronizada con el hábito)',
    habitConvertedToast: '¡convertido en tarea para hoy!',
    habitActionActive: '⚡ Tarea activa',
    habitActionDone: '✓ Tarea hecha',
    habitActionBadge: 'Tarea de hábito',
    habitActionAlreadyExistsToast: 'Este hábito ya tiene su tarea de hoy activa en la columna de tareas.',
    habitActionCreatedToast: '¡Tarea de hoy creada! Al completarla se registrará tu hábito.',
    streakLabel: 'racha',
    routineBadge: 'Rutina',
    noHabitsMessage: 'No se encontraron hábitos ni rutinas en esta vista.',

    tasksTitle: 'TAREAS',
    subtabToDo: 'Por hacer',
    subtabWithoutTimeline: 'Sin fecha',
    diffTrivial: 'Trivial',
    diffEasy: 'Fácil',
    diffMedium: 'Medio',
    diffHard: 'Difícil',
    taskBtnToday: 'Hoy',
    taskBtnAgenda: 'Agenda',
    taskBtnClear: 'Quitar',
    noTasksMessage: 'No se encontraron tareas en esta vista.',
    noTimeline: 'Sin fecha',
    duePrefix: 'Vence',

    agendaDay: 'Día',
    agendaWeek: 'Semana',
    agendaToday: 'Hoy',
    agendaGhosts: 'Fantasmas',
    agendaHidden: 'Ocultos',
    agendaNewEvent: 'Evento',
    agendaUnscheduled: 'Sin programar',
    agendaTasksRoutinesToday: '📌 Tareas y rutinas para hoy:',
    agendaMore: 'más',
    agendaFocusedBadge: 'Enfocado',
    agendaOthersTransparent: '(otros transparentes)',
    agendaAddSlotTitle: 'Añadir tarea o reunión',
    agendaJoin: 'Unirse',
    agendaEditEvent: 'Editar evento',
    agendaDeleteEvent: 'Eliminar evento',
    unscheduledDrawerTitle: 'Tareas sin programar y Backlog',
    unscheduledDrawerSubtitle: 'Arrastra elementos directamente a la línea horaria o pulsa para programar.',
    unscheduledDrawerTabAll: 'Todos los elementos',
    unscheduledDrawerTabRoutines: 'Rutinas',
    unscheduledDrawerTabTasks: 'Tareas',
    unscheduledDrawerEmpty: 'No hay tareas ni rutinas sin programar en esta vista.',

    modalNewEventTitle: 'Nuevo evento de calendario',
    modalEditEventTitle: 'Editar evento de calendario',
    modalEditEventSub: 'Actualiza detalles del evento, horario o enlace en tu agenda',
    modalNewEventSub: 'Añade un evento programado o bloque de sincronización a tu agenda',
    eventTitleLabel: 'Título del evento',
    eventDateLabel: 'Fecha',
    eventStartTimeLabel: 'Hora de inicio',
    eventEndTimeLabel: 'Hora de fin',
    eventDurationLabel: 'Duración:',
    eventAllDayLabel: 'Evento de todo el día',
    eventLocationLabel: 'Ubicación',
    eventMeetingUrlLabel: 'URL de la reunión',
    eventDescNotesLabel: 'Descripción / Notas de agenda',
    eventHighlightColorLabel: 'Color de resaltado',
    eventFamilyGhostLabel: 'Evento de Calendario Familiar / Fantasma',
    eventPastelOutlineBadge: 'Contorno pastel',
    eventGhostsAttached: (count: number) => `${count} Fantasmas asignados`,
    eventAssignedGhostsLabel: 'Fantasmas / Contactos asignados (selecciona varios):',
    eventSelectedCount: (count: number) => `${count} seleccionados`,
    deleteEventBtn: 'Eliminar evento',
    confirmDeleteBtn: 'Confirmar eliminación',
    cancelBtn: 'Cancelar',
    saveChangesBtn: 'Guardar cambios',
    createEventBtn: 'Crear evento',
    noGhostsConfiguredNote: 'No hay contactos fantasma configurados. Configúralos en Calendarios y Fuentes.',

    modalNewItemTitle: 'Nuevo elemento',
    modalEditItemTitle: 'Editar elemento',
    itemTypeTodo: 'Tarea / Por hacer',
    itemTypeHabit: 'Hábito (+ / -)',
    itemTypeDaily: 'Rutina Diaria',
    itemTabHabit: '🌱 Hábito (Recurrente)',
    itemTabTask: '✓ Tarea (Por hacer)',
    itemTitleLabel: 'Título',
    itemTitlePlaceholderHabit: 'p. ej. 20 min diarios de Anki o Beber 2L de agua',
    itemTitlePlaceholderTask: 'p. ej. Completar ejercicio del capítulo 4',
    itemNotesLabel: 'Notas',
    itemNotesLabelOptional: 'Notas (Opcional)',
    itemNotesPlaceholder: 'Añade detalles, enlaces o contexto...',
    itemDifficultyLabel: 'Dificultad / Energía',
    itemTaskSizeLabel: 'Tamaño de la tarea',
    itemEstimatedDuration: 'Duración estimada',
    diffTierTrivialLabel: 'Extra pequeña',
    diffTierTrivialHint: 'Victoria rápida / Sin fricción',
    diffTierEasyLabel: 'Pequeña',
    diffTierEasyHint: 'Esfuerzo ligero / Flujo rutinario',
    diffTierMediumLabel: 'Mediana',
    diffTierMediumHint: 'Esfuerzo moderado / Trabajo concentrado',
    diffTierHardLabel: 'Grande',
    diffTierHardHint: 'Concentración profunda / Gran esfuerzo',
    itemProjectLabel: 'Proyecto',
    itemProjectHeader: 'Proyecto (Vincula hábitos y tareas)',
    itemNewProjectBtn: '+ Nuevo proyecto',
    itemNewProjectPlaceholder: 'Nombre del proyecto (p. ej. Aprender chino)',
    itemProjectCreating: 'Creando...',
    itemCreateSelectProjectBtn: 'Crear y seleccionar proyecto',
    itemNoProjectOption: 'Sin proyecto (Independiente)',
    itemTimeOfDayLabel: 'Momento del día',
    itemTimeOfDaySub: 'Organización de la rutina',
    itemTimeOfDayHintMorning: 'Inicio y concentración matinal',
    itemTimeOfDayHintWorkday: 'Horas centrales de trabajo y ritmo',
    itemTimeOfDayHintEvening: 'Cierre y reflexión vespertina',
    itemTimeOfDayHintAnytime: 'Flexible durante el día',
    timeOfDayMorning: 'Mañana',
    timeOfDayWorkday: 'Jornada',
    timeOfDayEvening: 'Tarde/Noche',
    timeOfDayAnytime: 'Cualquier hora',
    periodicityTitle: 'Periodicidad / Recurrencia',
    periodEveryDay: 'Todos los días',
    periodWeekdays: 'Entre semana (Lun–Vie)',
    periodSpecificDays: 'Días específicos',
    periodFlexibleCounter: 'Flexible (solo +/-)',
    weekdaysShort: [
      { label: 'Do', value: 0 },
      { label: 'Lu', value: 1 },
      { label: 'Ma', value: 2 },
      { label: 'Mi', value: 3 },
      { label: 'Ju', value: 4 },
      { label: 'Vi', value: 5 },
      { label: 'Sá', value: 6 },
    ],
    counterButtonsLabel: 'Añadir botones de contador +/-:',
    counterPositive: '(+) Positivo',
    counterNegative: '(-) Negativo',
    blockAgendaSlotLabel: 'Bloquear tiempo específico en la Agenda',
    routineSlotBadge: '🌱 Bloque de rutina',
    labelDate: 'Fecha',
    labelStartTime: 'Hora de inicio',
    labelDuration: 'Duración',
    timelineTitle: 'Línea temporal / Fecha límite',
    timelineNone: 'Sin fecha',
    timelineToday: '📅 Tarea para hoy',
    timelineCustom: 'Elegir fecha límite',
    itemScheduleAgendaLabel: 'Programar en Agenda',
    itemDueDateLabel: 'Fecha límite',
    itemSubtasksLabel: 'Lista / Subtareas',
    checklistTitle: (count: number) => `Lista de verificación / Pasos (${count})`,
    checklistPlaceholder: 'Añade un paso a la lista...',
    checklistAddBtn: 'Añadir',
    saveBtn: 'Guardar',
    deleteTaskBtn: 'Eliminar tarea',
    deleteTaskConfirm: '¿Seguro que deseas eliminar esta tarea?',

    eventTitlePlaceholder: 'p. ej. Reunión de equipo, Dentista, Gimnasio...',
    eventLocationPlaceholder: 'p. ej. Sala 3B, En casa, Gimnasio...',
    eventPeriodicalBadge: 'Evento periódico',
    recurrenceOneTime: 'Puntual',
    recurrenceWeekly: 'Semanal',
    recurrenceMonthly: 'Mensual',
    repeatOnDaysLabel: 'Repetir los días',
    repeatUntilLabel: 'Repetir hasta (opcional):',
    clearBtn: 'Borrar',

    projectModalTitle: 'Crear nuevo proyecto',
    projectModalSub: 'Agrupa hábitos y tareas relacionados bajo una temática unificada.',
    projectNameLabel: 'Nombre del proyecto',
    projectColorLabel: 'Color temático',
    projectCreateBtn: 'Crear proyecto',
    deleteProjectConfirm: '¿Seguro que deseas eliminar este proyecto? Las tareas permanecerán como elementos independientes.',

    zenModeBtn: 'Modo Zen',
    zenModeExpl: 'El Modo Zen oculta automáticamente las tareas completadas y reduce el ruido sensorial para aliviar la sobrecarga cognitiva del TDAH. Solo muestra lo que tienes pendiente ahora, sin culpa ni distracciones.',
    filtersBtn: 'Filtros',
    filtersActive: 'Filtros Activos',

    calModalTitle: 'Calendarios y Fantasmas',
    calModalSub: 'Sincroniza calendarios externos (ICS) y gestiona contactos fantasma familiares.',
    activeFeedsLabel: 'Fuentes activas',
    ghostContactsLabel: 'Contactos fantasma (Familia y Trabajo)',
    addFeedBtn: 'Añadir fuente de calendario',
    addGhostBtn: 'Añadir contacto fantasma',
    saveGhostChangesBtn: 'Guardar cambios',
    editBtn: 'Editar',
    syncBtn: 'Sincronizar',

    authTitle: 'Acceso sin contraseña',
    authSub: 'Introduce tu correo para recibir un Magic Link o crear una cuenta nueva.',
    sendMagicLinkBtn: 'Enviar Magic Link',

    // Settings Modal & Tutorial Management
    settingsTitle: 'Configuración',
    settingsSub: 'Gestiona las preferencias de la aplicación, tutoriales, sonidos y pantalla',
    showTutorialsLabel: 'Tutoriales interactivos y guías',
    showTutorialsDesc: 'Mostrar el botón de tutorial y habilitar el atajo "?"',
    soundEffectsLabel: 'Sonidos de celebración',
    soundEffectsDesc: 'Reproducir sonidos al completar hábitos y tareas',
    themeLabel: 'Tema de color',
    themeDesc: 'Elige entre modo claro, oscuro o del sistema',
    densityLabel: 'Densidad visual',
    densityDesc: 'Alternar entre vista espaciosa y vista compacta para TDAH',

    // Active / All Status Filter
    subtabActive: 'Activo',
    filterActive: 'Activo',
    filterAll: 'Todo',

    // Milestone 5: Modal Internationalization (R5)
    // Shared
    closeBtn: 'Cerrar',

    // Pomodoro
    pomodoroSessionCompleted: '¡Sesión completada!',
    pomodoroResetTooltip: 'Reiniciar a 25m',
    pomodoroToggleVisualDiskTitle: 'Mostrar / ocultar disco visual (Time Timer)',
    pomodoroVisualDiskBtn: 'Disco Visual',
    pomodoroSoundEnabled: 'Sonido de aviso activado',
    pomodoroSoundMuted: 'Sonido de aviso silenciado',
    pomodoroCloseBar: 'Cerrar barra de Pomodoro',
    pomodoroVisualDiskTitle: 'Disco Visual Analógico (Time Timer)',
    pomodoroTimeUp: '¡Tiempo agotado!',

    // Time Timer Disk
    timeTimerFocusTitle: 'Enfoque',
    timeTimerStatusFocusing: 'Enfocando',
    timeTimerStatusDone: '¡Hecho!',
    timeTimerStatusPaused: 'En pausa',
    timeTimerStart: 'Iniciar',
    timeTimerPause: 'Pausar',
    timeTimerResetTitle: 'Reiniciar temporizador',
    timeTimerSoundEnabled: 'Sonido activado',
    timeTimerSoundMuted: 'Sonido silenciado',

    // Spotlight Modal
    spotlightFocusTunnel: 'Túnel de Enfoque Monotarea',
    spotlightToggleTimerTitle: 'Alternar disco Time-Timer analógico',
    spotlightHideTimer: 'Ocultar temporizador',
    spotlightShowTimer: 'Temporizador analógico',
    spotlightExitTitle: 'Salir de Spotlight (Esc)',
    spotlightSize: 'Tamaño',
    spotlightNextStep: 'Siguiente paso:',
    spotlightGoblinPrompt: '¿Bloqueado? Divide esto con Goblin Brain',
    spotlightCompleting: 'Completando...',
    spotlightMarkDone: 'Marcar como hecho',
    spotlightSkipTooltip: 'Saltar a la siguiente tarea por ahora (sin penalización)',
    spotlightSkipForNow: 'Saltar por ahora',
    spotlightTaskProgress: (current: number = 0, total: number = 0) => `Tarea ${current} de ${total || current} • Pulsa Esc para salir`,
    spotlightEmptyTitle: '¡Tu túnel de enfoque está despejado!',
    spotlightEmptyDesc: 'No hay tareas pendientes para enfocar ahora. Respira hondo o revisa tu lista pendiente.',
    spotlightBackToBoard: 'Volver al Tablero',

    // Brain Dump Drawer
    brainDumpTitle: 'Vaciado Mental (Descarga de Memoria de Trabajo)',
    brainDumpSubtitle: 'Vuelca pensamientos intrusivos aquí para despejar tu mente. Sin fechas ni etiquetas.',
    brainDumpPlaceholder: "Escribe pensamientos (uno por línea):\n• Comprar papel para impresora\n• Responder al correo de Sara\n• Limpiar cafetera",
    brainDumpHelpText: 'Cada línea se convierte en una tarea de la bandeja de entrada. Pulsa Cmd+Enter para volcar.',
    brainDumpSaving: 'Descargando...',
    brainDumpSubmitBtn: 'Volcar y despejar mente',

    // Calendar & Ghosts Modal
    calGhostAddSyncError: (error: string = '') => `Contacto fantasma añadido, pero la sincronización tuvo un problema: ${error}`,
    calGhostAddedSynced: (count: number = 0) => `¡Contacto fantasma añadido y ${count} evento${count === 1 ? '' : 's'} sincronizado${count === 1 ? '' : 's'}!`,
    calGhostAddedContact: '¡Contacto fantasma añadido!',
    calGhostAddError: 'Error al añadir contacto fantasma',
    calGhostSyncedEvents: (count: number = 0) => `¡Calendario fantasma sincronizado! ${count} evento${count === 1 ? '' : 's'} actualizado${count === 1 ? '' : 's'}.`,
    calGhostSyncError: 'Error al sincronizar el calendario fantasma',
    calGhostUpdated: '¡Contacto fantasma actualizado!',
    calGhostUpdateError: 'Error al actualizar contacto fantasma',
    calFeedAddSyncNotice: (notice: string = '') => `Calendario añadido, pero con aviso de sincronización: ${notice}`,
    calFeedAddedSynced: (count: number = 0) => `¡Calendario añadido! Sincronizado${count === 1 ? '' : 's'} ${count} evento${count === 1 ? '' : 's'}.`,
    calFeedAddedNoEvents: 'Calendario añadido. No hay eventos en el periodo actual de la agenda.',
    calFeedAddError: 'Error al añadir el calendario',
    calFeedSyncedEvents: (count: number = 0) => `¡Calendario sincronizado! ${count} evento${count === 1 ? '' : 's'} actualizado${count === 1 ? '' : 's'}.`,
    calFeedSyncError: 'Error al sincronizar el calendario',
    calFeedUpdated: '¡Calendario actualizado!',
    calEventAddedToAgenda: '¡Evento añadido a la agenda!',
    calEventsImported: (count: number = 0) => `¡${count} evento${count === 1 ? '' : 's'} de calendario importado${count === 1 ? '' : 's'}!`,
    calSyncNoticePrefix: 'Aviso de sincronización: ',
    calDismissTitle: 'Descartar',

    calTabGhosts: '👻 Fantasmas (Familia / Pareja)',
    calTabFeeds: 'Mis Calendarios',
    calTabManual: 'Añadir Reunión',
    calTabImport: 'Subir .ics en bruto',

    calGhostsWhatIsTitle: '¿Qué son los Fantasmas?',
    calGhostsWhatIsDesc: 'Personas de tu entorno cuyos horarios te afectan (pareja, hijos o compañeros). Conecta sus calendarios .ics o registra sus citas para ver sus compromisos claramente en tu agenda, con un botón para mostrarlos u ocultarlos en cualquier momento.',
    calGhostsActiveHeading: (count: number = 0) => `Fantasmas Activos (${count})`,
    calGhostsEmpty: 'No hay contactos fantasma configurados. ¡Añade a tu pareja, hijos o compañeros abajo!',
    calGhostEditHeading: (name: string = '') => `Editar Fantasma: ${name}`,
    calGhostNameLabel: 'Nombre',
    calGhostNamePlaceholder: 'Nombre',
    calGhostRelationLabel: 'Relación',
    calGhostRelationPlaceholder: 'Relación',
    calGhostColorLabel: 'Color',
    calGhostColorTooltip: 'Color del distintivo del fantasma',
    calGhostIcsUrlLabel: 'URL de calendario ICS',
    calGhostIcsUrlPlaceholder: 'URL .ics opcional',
    calGhostEventsCount: (count: number = 0) => `${count} evento${count === 1 ? '' : 's'}`,
    calGhostManualOnly: 'Solo eventos manuales',
    calGhostLastSynced: (time: string = '') => `Última sincronización: ${time}`,
    calGhostNeverSynced: 'Nunca sincronizado',
    calGhostSyncTooltip: 'Sincronizar calendario fantasma',
    calGhostEditTooltip: 'Editar fantasma',
    calGhostDeleteTooltip: 'Eliminar fantasma',
    calGhostAddNewHeading: 'Añadir Nuevo Fantasma',
    calGhostAddNamePlaceholder: 'Nombre (ej. Sara o Leo)',
    calGhostAddRelationPlaceholder: 'Relación (ej. Pareja, Hijo/a)',
    calGhostAddIcsPlaceholder: 'URL .ics opcional (ej. enlace iCal secreto de Google Calendar)',
    calGhostAddingBtn: 'Añadiendo...',
    calGhostAddSubmitBtn: 'Añadir Fantasma',

    calFeedsHeading: (count: number = 0) => `Mis Calendarios (${count})`,
    calFeedsEmpty: 'No hay calendarios personales configurados todavía.',
    calFeedEditHeading: (name: string = '') => `Editar Calendario: ${name}`,
    calFeedNameLabel: 'Nombre del calendario',
    calFeedNamePlaceholder: 'Nombre del calendario',
    calFeedColorLabel: 'Color',
    calFeedColorTooltip: 'Color del calendario',
    calFeedIcsUrlLabel: 'URL del feed ICS',
    calFeedIcsUrlPlaceholder: 'https://.../calendar.ics',
    calFeedEventsCount: (count: number = 0) => `${count} evento${count === 1 ? '' : 's'}`,
    calFeedLastSynced: (time: string = '', date?: string) => `Última sincronización: ${time}${date ? ` (${date})` : ''}`,
    calFeedNeverSynced: 'Nunca sincronizado',
    calFeedSyncTooltip: 'Sincronizar ahora',
    calFeedEditTooltip: 'Editar calendario',
    calFeedDeleteTooltip: 'Eliminar calendario',
    calGuideAccordionTitle: 'Cómo obtener tu enlace iCal (.ics)',
    calGuideHideTips: 'Ocultar consejos ▲',
    calGuideShowTips: 'Mostrar consejos ▼',
    calGuideGoogleLabel: 'Google Calendar:',
    calGuideGoogleText: 'Ajustes ⚙️ → en Ajustes de mis calendarios, haz clic en tu calendario → baja hasta Integrar calendario → copia la Dirección secreta en formato iCal (termina en .ics).',
    calGuideAppleLabel: 'Apple iCloud:',
    calGuideAppleText: 'Abre la app Calendario en Mac o iPhone → toca el icono Compartir junto al calendario → activa Calendario público → pulsa Copiar enlace (empieza por webcal://, compatible automáticamente).',
    calGuideOutlookLabel: 'Outlook / Office 365:',
    calGuideOutlookText: 'Ajustes ⚙️ → Calendario → Calendarios compartidos → Publicar un calendario → copia el enlace ICS.',
    calGuideNoteText: '💡 Nota: Los enlaces de página de navegador (como calendar.google.com/calendar/u/0/r) no se pueden sincronizar. Solo funcionan las fuentes directas de iCalendar (.ics o webcal://).',
    calFeedAddNewHeading: 'Añadir Mi Calendario',
    calFeedAddNamePlaceholder: 'Nombre del calendario (ej. Trabajo)',
    calFeedBadgeColorTooltip: 'Color del distintivo del calendario',
    calFeedAddUrlPlaceholder: 'https://calendar.google.com/calendar/ical/.../basic.ics',
    calFeedAddingSyncingBtn: 'Añadiendo y sincronizando...',
    calFeedSubscribeSyncBtn: 'Suscribir y sincronizar',

    calManualTitleLabel: 'Título del evento / reunión',
    calManualTitlePlaceholder: 'ej. Entrenamiento de fútbol o Sincronización de producto',
    calManualIsGhostCheckbox: '👻 Este es un Evento Fantasma (Pareja / Hijos / Familia)',
    calManualGhostCountBadge: (count: number = 0) => `${count} ${count === 1 ? 'Fantasma' : 'Fantasmas'}`,
    calManualSelectGhostsLabel: 'Selecciona uno o más fantasmas para este evento:',
    calManualCreatingBtn: 'Creando...',
    calManualAddEventBtn: 'Añadir evento a la agenda',

    calRawImportDescription: 'Pega aquí el contenido .ics en bruto del calendario para importar eventos puntuales sin configurar un feed recurrente.',
    calRawImportingBtn: 'Importando...',
    calRawImportBtn: 'Importar contenido .ics',
  },

  ca: {
    brandName: 'HabitCorp',
    tagline: "El cosí avorrit d'Habitica",
    viewHabitsTasks: 'Hàbits + Tasques',
    viewTasksAgenda: 'Tasques + Agenda',
    viewAgendaGrid: "Graella d'Agenda",
    searchPlaceholder: 'Cercar...',
    addBtn: 'Afegir',
    pomodoroBtn: 'Pomodoro',
    calendarsGhostsBtn: 'Calendaris i Fantasmes',
    agentApiBtn: "API d'Agent",
    logInSignUp: 'Iniciar sessió / Registre',
    switchAccount: 'Canviar de compte (Magic Link)',
    logOut: 'Tancar sessió',

    projectsLabel: 'Projectes:',
    allProjects: 'Tots els projectes',
    newProjectBtn: 'Nou projecte',

    pomodoroTitle: 'Temporitzador Pomodoro',
    pomodoroFocusRest: 'CONCENTRACIÓ I DESCANS',
    pomodoroCycle: 'Cicle',
    pomodoroCompletedToday: 'pomodoros completats avui',
    modePomodoro: 'Pomodoro',
    modeShortBreak: 'Pausa curta',
    modeLongBreak: 'Pausa llarga',
    modeDeepFlow: 'Flux profund',
    startPomodoro: 'Iniciar Pomodoro',
    pausePomodoro: 'Pausar',
    resumePomodoro: 'Reprendre',
    resetPomodoro: 'Reiniciar',
    skipPomodoro: 'Saltar',
    blockOnAgenda: "Bloquejar a l'Agenda",
    focusOnTaskLabel: 'Concentrar-se en la tasca:',
    freeformFocusOption: '— Sessió lliure de concentració —',
    hydrationPrompt: 'Hidratació',
    posturePrompt: 'Postura i estiraments',
    eyeRestPrompt: 'Descans visual 20-20-20',

    habitsTitle: 'HÀBITS I RUTINES',
    columnHabits: 'Hàbits (+/-)',
    columnDailies: 'Rutines',
    columnTasks: 'Tasques',
    noDailiesMessage: "No s'han trobat rutines en aquesta vista.",
    itemTabDaily: '🔄 Rutina / Diària',
    subtabAll: 'Tots',
    subtabDueToday: 'Per avui',
    timeFilterAll: 'Tot el dia',
    timeFilterMorning: 'Matí',
    timeFilterWorkday: 'Jornada laboral',
    timeFilterEvening: 'Vespre',
    timeFilterAnytime: 'Qualsevol hora',
    plusTodayBtn: '+ Avui',
    convertHabitToTodayTask: 'Tasca avui',
    convertHabitToTodayTaskTooltip: "Crear la tasca d'avui per aquest hàbit (sincronitzada amb l'hàbit)",
    habitConvertedToast: "convertit en tasca per avui!",
    habitActionActive: '⚡ Tasca activa',
    habitActionDone: '✓ Tasca feta',
    habitActionBadge: "Tasca d'hàbit",
    habitActionAlreadyExistsToast: "Aquest hàbit ja té la seva tasca d'avui activa a la columna de tasques.",
    habitActionCreatedToast: "Tasca d'avui creada! En completar-la es registrarà el teu hàbit.",
    streakLabel: 'ratxa',
    routineBadge: 'Rutina',
    noHabitsMessage: "No s'han trobat hàbits ni rutines en aquesta vista.",

    tasksTitle: 'TASQUES',
    subtabToDo: 'Per fer',
    subtabWithoutTimeline: 'Sense data',
    diffTrivial: 'Trivial',
    diffEasy: 'Fàcil',
    diffMedium: 'Mitjà',
    diffHard: 'Difícil',
    taskBtnToday: 'Avui',
    taskBtnAgenda: 'Agenda',
    taskBtnClear: 'Treure',
    noTasksMessage: "No s'han trobat tasques en aquesta vista.",
    noTimeline: 'Sense calendari',
    duePrefix: 'Venç',

    agendaDay: 'Dia',
    agendaWeek: 'Setmana',
    agendaToday: 'Avui',
    agendaGhosts: 'Fantasmes',
    agendaHidden: 'Ocults',
    agendaNewEvent: 'Esdeveniment',
    agendaUnscheduled: 'Sense programar',
    agendaTasksRoutinesToday: '📌 Tasques i rutines per avui:',
    agendaMore: 'més',
    agendaFocusedBadge: 'Centrat',
    agendaOthersTransparent: '(altres transparents)',
    agendaAddSlotTitle: 'Afegir tasca o reunió',
    agendaJoin: "Unir-se",
    agendaEditEvent: "Editar esdeveniment",
    agendaDeleteEvent: "Eliminar esdeveniment",
    unscheduledDrawerTitle: 'Tasques sense programar i Pendent',
    unscheduledDrawerSubtitle: 'Arrossega elements directament a la línia horària del calendari o clica per programar.',
    unscheduledDrawerTabAll: 'Tots els elements',
    unscheduledDrawerTabRoutines: 'Rutines',
    unscheduledDrawerTabTasks: 'Tasques',
    unscheduledDrawerEmpty: "No hi ha tasques ni rutines sense programar en aquesta vista.",

    modalNewEventTitle: "Nou esdeveniment de calendari",
    modalEditEventTitle: "Editar esdeveniment de calendari",
    modalEditEventSub: "Actualitza detalls de l'esdeveniment, horari o enllaç a l'agenda",
    modalNewEventSub: "Afegeix un esdeveniment programat o bloc de sincronització a l'agenda",
    eventTitleLabel: "Títol de l'esdeveniment",
    eventDateLabel: 'Data',
    eventStartTimeLabel: "Hora d'inici",
    eventEndTimeLabel: 'Hora de finalització',
    eventDurationLabel: 'Durada:',
    eventAllDayLabel: 'Esdeveniment de tot el dia',
    eventLocationLabel: 'Ubicació',
    eventMeetingUrlLabel: 'URL de la reunió',
    eventDescNotesLabel: "Descripció / Notes d'agenda",
    eventHighlightColorLabel: 'Color de ressaltat',
    eventFamilyGhostLabel: 'Esdeveniment de Calendari Familiar / Fantasma',
    eventPastelOutlineBadge: 'Contorn pastel',
    eventGhostsAttached: (count: number) => `${count} Fantasmes assignats`,
    eventAssignedGhostsLabel: "Fantasmes / Contactes assignats (selecciona'n diversos):",
    eventSelectedCount: (count: number) => `${count} seleccionats`,
    deleteEventBtn: 'Eliminar esdeveniment',
    confirmDeleteBtn: 'Confirmar eliminació',
    cancelBtn: 'Cancel·lar',
    saveChangesBtn: 'Desar canvis',
    createEventBtn: 'Crear esdeveniment',
    noGhostsConfiguredNote: "Encara no hi ha contactes fantasma configurats. Configura'ls a Calendaris i Fonts.",

    modalNewItemTitle: 'Nou element',
    modalEditItemTitle: 'Editar element',
    itemTypeTodo: 'Tasca / Per fer',
    itemTypeHabit: 'Hàbit (+ / -)',
    itemTypeDaily: 'Rutina Diària',
    itemTabHabit: '🌱 Hàbit (Recurrent)',
    itemTabTask: '✓ Tasca (Per fer)',
    itemTitleLabel: 'Títol',
    itemTitlePlaceholderHabit: "p. ex. 20 min diaris d'Anki o Beure 2L d'aigua",
    itemTitlePlaceholderTask: 'p. ex. Completar exercici del capítol 4',
    itemNotesLabel: 'Notes',
    itemNotesLabelOptional: 'Notes (Opcional)',
    itemNotesPlaceholder: 'Afegeix detalls, enllaços o context...',
    itemDifficultyLabel: 'Dificultat / Energia',
    itemTaskSizeLabel: 'Mida de la tasca',
    itemEstimatedDuration: 'Durada estimada',
    diffTierTrivialLabel: 'Molt petita',
    diffTierTrivialHint: 'Victòria ràpida / Sense fricció',
    diffTierEasyLabel: 'Petita',
    diffTierEasyHint: 'Esforç lleuger / Flux rutinari',
    diffTierMediumLabel: 'Mitjana',
    diffTierMediumHint: 'Esforç moderat / Feina concentrada',
    diffTierHardLabel: 'Gran',
    diffTierHardHint: 'Concentració profunda / Gran esforç',
    itemProjectLabel: 'Projecte',
    itemProjectHeader: 'Projecte (Vincula hàbits i tasques)',
    itemNewProjectBtn: '+ Nou projecte',
    itemNewProjectPlaceholder: 'Nom del projecte (p. ex. Aprendre xinès)',
    itemProjectCreating: 'Creant...',
    itemCreateSelectProjectBtn: 'Crear i seleccionar projecte',
    itemNoProjectOption: 'Sense projecte (Independent)',
    itemTimeOfDayLabel: 'Moment del dia',
    itemTimeOfDaySub: 'Organització de la rutina',
    itemTimeOfDayHintMorning: 'Inici i concentració matinal',
    itemTimeOfDayHintWorkday: 'Hores centrals de feina i ritme',
    itemTimeOfDayHintEvening: 'Tancament i reflexió del vespre',
    itemTimeOfDayHintAnytime: 'Flexible durant tot el dia',
    timeOfDayMorning: 'Matí',
    timeOfDayWorkday: 'Jornada laboral',
    timeOfDayEvening: 'Vespre',
    timeOfDayAnytime: 'Qualsevol hora',
    periodicityTitle: 'Periodicitat / Recurrència',
    periodEveryDay: 'Tots els dies',
    periodWeekdays: 'Entre setmana (Dl–Dv)',
    periodSpecificDays: 'Dies específics',
    periodFlexibleCounter: 'Flexible (només +/-)',
    weekdaysShort: [
      { label: 'Dg', value: 0 },
      { label: 'Dl', value: 1 },
      { label: 'Dm', value: 2 },
      { label: 'Dc', value: 3 },
      { label: 'Dj', value: 4 },
      { label: 'Dv', value: 5 },
      { label: 'Ds', value: 6 },
    ],
    counterButtonsLabel: 'Afegir botons de comptador +/-:',
    counterPositive: '(+) Positiu',
    counterNegative: '(-) Negatiu',
    blockAgendaSlotLabel: "Bloquejar temps específic a l'Agenda",
    routineSlotBadge: '🌱 Bloc de rutina',
    labelDate: 'Data',
    labelStartTime: "Hora d'inici",
    labelDuration: 'Durada',
    timelineTitle: 'Calendari / Data límit',
    timelineNone: 'Sense data',
    timelineToday: '📅 Tasca per avui',
    timelineCustom: 'Triar data límit',
    itemScheduleAgendaLabel: "Programar a l'Agenda",
    itemDueDateLabel: 'Data límit',
    itemSubtasksLabel: 'Llista / Subtasques',
    checklistTitle: (count: number) => `Llista de comprovació / Passos (${count})`,
    checklistPlaceholder: 'Afegeix un pas a la llista...',
    checklistAddBtn: 'Afegir',
    saveBtn: 'Desar',
    deleteTaskBtn: 'Eliminar tasca',
    deleteTaskConfirm: 'Segur que vols eliminar aquesta tasca?',

    eventTitlePlaceholder: "p. ex. Reunió d'equip, Dentista, Gimnàs...",
    eventLocationPlaceholder: 'p. ex. Sala 3B, A casa, Gimnàs...',
    eventPeriodicalBadge: 'Esdeveniment periòdic',
    recurrenceOneTime: 'Puntual',
    recurrenceWeekly: 'Setmanal',
    recurrenceMonthly: 'Mensual',
    repeatOnDaysLabel: 'Repetir els dies',
    repeatUntilLabel: 'Repetir fins a (opcional):',
    clearBtn: 'Netejar',

    projectModalTitle: 'Crear nou projecte',
    projectModalSub: 'Agrupa hàbits i tasques relacionats sota una temàtica unificada.',
    projectNameLabel: 'Nom del projecte',
    projectColorLabel: 'Color temàtic',
    projectCreateBtn: 'Crear projecte',
    deleteProjectConfirm: 'Segur que vols eliminar aquest projecte? Les tasques romandran com a elements independents.',

    zenModeBtn: 'Mode Zen',
    zenModeExpl: 'El Mode Zen amaga automàticament les tasques completades i redueix el soroll sensorial per alleujar la sobrecàrrega cognitiva del TDAH. Només mostra el que tens pendent ara, sense culpa ni distraccions.',
    filtersBtn: 'Filtres',
    filtersActive: 'Filtres Actius',

    calModalTitle: 'Calendaris i Fantasmes',
    calModalSub: 'Sincronitza subscripcions a calendaris externs (ICS) i gestiona calendaris fantasma familiars.',
    activeFeedsLabel: 'Fonts actives',
    ghostContactsLabel: 'Contactes fantasma (Família i Feina)',
    addFeedBtn: 'Afegir font de calendari',
    addGhostBtn: 'Afegir contacte fantasma',
    saveGhostChangesBtn: 'Desar canvis',
    editBtn: 'Editar',
    syncBtn: 'Sincronitzar',

    authTitle: 'Accés sense contrasenya',
    authSub: 'Introdueix el teu correu per rebre un Magic Link o crear un compte nou.',
    sendMagicLinkBtn: 'Enviar Magic Link',

    // Settings Modal & Tutorial Management
    settingsTitle: 'Configuració',
    settingsSub: "Gestiona les preferències de l'aplicació, tutorials, sons i visualització",
    showTutorialsLabel: 'Tutorials interactius i guies',
    showTutorialsDesc: 'Mostrar el botó de tutorial i habilitar la drecera "?"',
    soundEffectsLabel: 'Sons de celebració',
    soundEffectsDesc: 'Reprodueix sons en completar hàbits i tasques',
    themeLabel: 'Tema de color',
    themeDesc: 'Tria entre mode clar, fosc o del sistema',
    densityLabel: 'Densitat visual',
    densityDesc: 'Alterna entre vista espaiosa i vista compacta adaptada al TDAH',

    // Active / All Status Filter
    subtabActive: 'Actiu',
    filterActive: 'Actiu',
    filterAll: 'Tot',

    // Milestone 5: Modal Internationalization (R5)
    // Shared
    closeBtn: 'Tancar',

    // Pomodoro
    pomodoroSessionCompleted: 'Sessió completada!',
    pomodoroResetTooltip: 'Restablir a 25m',
    pomodoroToggleVisualDiskTitle: 'Mostra / amaga el disc visual (Time Timer)',
    pomodoroVisualDiskBtn: 'Disc Visual',
    pomodoroSoundEnabled: "So d'avís activat",
    pomodoroSoundMuted: "So d'avís silenciat",
    pomodoroCloseBar: 'Tancar la barra de Pomodoro',
    pomodoroVisualDiskTitle: 'Disc Visual Analògic (Time Timer)',
    pomodoroTimeUp: 'Temps exhaurit!',

    // Time Timer Disk
    timeTimerFocusTitle: 'Concentració',
    timeTimerStatusFocusing: 'Concentrant-se',
    timeTimerStatusDone: 'Fet!',
    timeTimerStatusPaused: 'En pausa',
    timeTimerStart: 'Iniciar',
    timeTimerPause: 'Pausar',
    timeTimerResetTitle: 'Restablir temporitzador',
    timeTimerSoundEnabled: 'So activat',
    timeTimerSoundMuted: 'So silenciat',

    // Spotlight Modal
    spotlightFocusTunnel: 'Túnel de Concentració Monotasca',
    spotlightToggleTimerTitle: 'Commuta el disc analògic Time-Timer',
    spotlightHideTimer: 'Amaga el temporitzador',
    spotlightShowTimer: 'Temporizador analògic',
    spotlightExitTitle: 'Sortir de Spotlight (Esc)',
    spotlightSize: 'Mida',
    spotlightNextStep: 'Següent pas:',
    spotlightGoblinPrompt: 'Bloquejat? Desglossa-ho amb Goblin Brain',
    spotlightCompleting: 'Completant...',
    spotlightMarkDone: 'Marca com a fet',
    spotlightSkipTooltip: 'Salta a la següent tasca per ara (sense penalització)',
    spotlightSkipForNow: 'Saltar per ara',
    spotlightTaskProgress: (current: number = 0, total: number = 0) => `Tasca ${current} de ${total || current} • Prem Esc per sortir`,
    spotlightEmptyTitle: 'El teu túnel de concentració està buit!',
    spotlightEmptyDesc: 'No hi ha tasques pendents per concentrar-se ara mateix. Respira profundament o consulta el teu backlog.',
    spotlightBackToBoard: 'Tornar al Tauler',

    // Brain Dump Drawer
    brainDumpTitle: 'Buidatge Mental (Descàrrega de Memòria de Treball)',
    brainDumpSubtitle: 'Aboqueu pensaments intrusius aquí per aclarir la ment. Sense dates ni etiquetes.',
    brainDumpPlaceholder: "Escriviu pensaments (un per línia):\n• Comprar paper de la impressora\n• Respondre al correu de la Sara\n• Netejar la cafetera",
    brainDumpHelpText: 'Cada línia esdevé una tasca del calaix de sastre. Premeu Cmd+Enter per bolcar.',
    brainDumpSaving: 'Descarregant...',
    brainDumpSubmitBtn: 'Bolcar i aclarir la ment',

    // Calendar & Ghosts Modal
    calGhostAddSyncError: (error: string = '') => `Contacte fantasma afegit, però la sincronització ha fallat: ${error}`,
    calGhostAddedSynced: (count: number = 0) => `Contacte fantasma afegit i ${count} esdeveniment${count === 1 ? '' : 's'} sincronitzat${count === 1 ? '' : 's'}!`,
    calGhostAddedContact: 'Contacte fantasma afegit!',
    calGhostAddError: 'Error en afegir el contacte fantasma',
    calGhostSyncedEvents: (count: number = 0) => `Calendari fantasma sincronitzat! ${count} esdeveniment${count === 1 ? '' : 's'} actualitzat${count === 1 ? '' : 's'}.`,
    calGhostSyncError: 'Error en sincronitzar el calendari fantasma',
    calGhostUpdated: 'Contacte fantasma actualitzat!',
    calGhostUpdateError: 'Error en actualitzar el contacte fantasma',
    calFeedAddSyncNotice: (notice: string = '') => `Calendari afegit, però avís de sincronització: ${notice}`,
    calFeedAddedSynced: (count: number = 0) => `Font de calendari afegida! Sincronitzat${count === 1 ? '' : 's'} ${count} esdeveniment${count === 1 ? '' : 's'}.`,
    calFeedAddedNoEvents: "Font de calendari afegida. Cap esdeveniment a la finestra actual de l'agenda.",
    calFeedAddError: 'Error en afegir la font de calendari',
    calFeedSyncedEvents: (count: number = 0) => `Calendari sincronitzat! ${count} esdeveniment${count === 1 ? '' : 's'} actualitzat${count === 1 ? '' : 's'}.`,
    calFeedSyncError: 'Error en sincronitzar la font de calendari',
    calFeedUpdated: 'Font de calendari actualitzada!',
    calEventAddedToAgenda: "Esdeveniment afegit a l'agenda!",
    calEventsImported: (count: number = 0) => `S'han importat ${count} esdeveniment${count === 1 ? '' : 's'} de calendari!`,
    calSyncNoticePrefix: 'Avís de sincronització: ',
    calDismissTitle: 'Descarta',

    calTabGhosts: '👻 Fantasmes (Família / Parella)',
    calTabFeeds: 'Els Meus Calendaris',
    calTabManual: 'Afegir reunió',
    calTabImport: 'Pujar .ics en brut',

    calGhostsWhatIsTitle: 'Què són els Fantasmes?',
    calGhostsWhatIsDesc: 'Persones del vostre entorn que influeixen en els vostres horaris (parella, fills o companys). Connecteu els seus calendaris .ics o registreu les seves cites per visualitzar els seus compromisos a la graella, amb un botó per mostrar-los o amagar-los en tot moment.',
    calGhostsActiveHeading: (count: number = 0) => `Fantasmes Actius (${count})`,
    calGhostsEmpty: 'Encara no teniu cap contacte fantasma configurat. Afegiu la vostra parella, fills o companys a sota!',
    calGhostEditHeading: (name: string = '') => `Editar Fantasma: ${name}`,
    calGhostNameLabel: 'Nom',
    calGhostNamePlaceholder: 'Nom',
    calGhostRelationLabel: 'Relació',
    calGhostRelationPlaceholder: 'Relació',
    calGhostColorLabel: 'Color',
    calGhostColorTooltip: 'Color del distintiu del fantasma',
    calGhostIcsUrlLabel: 'URL del calendari ICS',
    calGhostIcsUrlPlaceholder: 'URL .ics opcional',
    calGhostEventsCount: (count: number = 0) => `${count} esdeveniment${count === 1 ? '' : 's'}`,
    calGhostManualOnly: 'Només esdeveniments manuals',
    calGhostLastSynced: (time: string = '') => `Darrera sincronització: ${time}`,
    calGhostNeverSynced: 'Mai sincronitzat',
    calGhostSyncTooltip: 'Sincronitzar calendari fantasma',
    calGhostEditTooltip: 'Editar fantasma',
    calGhostDeleteTooltip: 'Eliminar fantasma',
    calGhostAddNewHeading: 'Afegir Nou Fantasma',
    calGhostAddNamePlaceholder: 'Nom (p. ex. Sara o Leo)',
    calGhostAddRelationPlaceholder: 'Relació (p. ex. Parella, Fill/a)',
    calGhostAddIcsPlaceholder: 'URL .ics opcional (p. ex. enllaç iCal secret de Google Calendar)',
    calGhostAddingBtn: 'Afegint...',
    calGhostAddSubmitBtn: 'Afegir Fantasma',

    calFeedsHeading: (count: number = 0) => `Els Meus Calendaris (${count})`,
    calFeedsEmpty: 'Encara no hi ha fonts de calendari personals configurades.',
    calFeedEditHeading: (name: string = '') => `Editar Font: ${name}`,
    calFeedNameLabel: 'Nom de la font',
    calFeedNamePlaceholder: 'Nom de la font',
    calFeedColorLabel: 'Color',
    calFeedColorTooltip: 'Color de la font',
    calFeedIcsUrlLabel: 'URL de la font ICS',
    calFeedIcsUrlPlaceholder: 'https://.../calendar.ics',
    calFeedEventsCount: (count: number = 0) => `${count} esdeveniment${count === 1 ? '' : 's'}`,
    calFeedLastSynced: (time: string = '', date?: string) => `Darrera sincronització: ${time}${date ? ` (${date})` : ''}`,
    calFeedNeverSynced: 'Mai sincronitzat',
    calFeedSyncTooltip: 'Sincronitzar ara',
    calFeedEditTooltip: 'Editar font de calendari',
    calFeedDeleteTooltip: 'Eliminar font de calendari',
    calGuideAccordionTitle: 'Com obtenir el vostre enllaç iCal (.ics)',
    calGuideHideTips: 'Amagar consells ▲',
    calGuideShowTips: 'Mostrar consells ▼',
    calGuideGoogleLabel: 'Google Calendar:',
    calGuideGoogleText: "Configuració ⚙️ → sota Configuració dels meus calendaris, feu clic al vostre calendari → aneu a Integrar calendari → copieu l'Adreça secreta en format iCal (acaba en .ics).",
    calGuideAppleLabel: 'Apple iCloud:',
    calGuideAppleText: "Obriu l'aplicació Calendari al Mac o iPhone → feu clic a la icona Compartir al costat del calendari → activeu Calendari públic → premeu Copiar enllaç (comença per webcal://, compatible automàticament).",
    calGuideOutlookLabel: 'Outlook / Office 365:',
    calGuideOutlookText: 'Configuració ⚙️ → Calendari → Calendaris compartits → Publicar un calendari → copieu l\'enllaç ICS.',
    calGuideNoteText: "💡 Nota: Els enllaços de pàgina web de navegador (com ara calendar.google.com/calendar/u/0/r) no es poden sincronitzar. Només funcionen les fonts directes d'iCalendar (.ics o webcal://).",
    calFeedAddNewHeading: 'Afegir el Meu Calendari',
    calFeedAddNamePlaceholder: 'Nom de la font (p. ex. Feina)',
    calFeedBadgeColorTooltip: 'Color del distintiu del calendari',
    calFeedAddUrlPlaceholder: 'https://calendar.google.com/calendar/ical/.../basic.ics',
    calFeedAddingSyncingBtn: 'Afegint i sincronitzant...',
    calFeedSubscribeSyncBtn: 'Subscriure i sincronitzar',

    calManualTitleLabel: "Títol de l'esdeveniment / reunió",
    calManualTitlePlaceholder: 'p. ex. Entrenament de futbol o Sincronització de producte',
    calManualIsGhostCheckbox: '👻 Aquest és un Esdeveniment Fantasma (Parella / Fills / Família)',
    calManualGhostCountBadge: (count: number = 0) => `${count} ${count === 1 ? 'Fantasma' : 'Fantasmes'}`,
    calManualSelectGhostsLabel: 'Seleccioneu un o més fantasmes per a aquest esdeveniment:',
    calManualCreatingBtn: 'Creant...',
    calManualAddEventBtn: "Afegir esdeveniment a l'agenda",

    calRawImportDescription: "Enganxeu aquí el contingut .ics en brut del calendari per importar esdeveniments puntuals sense configurar una font recurrent.",
    calRawImportingBtn: 'Important...',
    calRawImportBtn: 'Importar contingut .ics',
  },
};
