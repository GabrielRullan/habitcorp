export type Language = 'en' | 'es' | 'ca';

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
  subtabAll: string;
  subtabDueToday: string;
  timeFilterAll: string;
  timeFilterMorning: string;
  timeFilterWorkday: string;
  timeFilterEvening: string;
  timeFilterAnytime: string;
  plusTodayBtn: string;
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
  itemTitleLabel: string;
  itemNotesLabel: string;
  itemDifficultyLabel: string;
  itemProjectLabel: string;
  itemTimeOfDayLabel: string;
  itemScheduleAgendaLabel: string;
  itemDueDateLabel: string;
  itemSubtasksLabel: string;
  saveBtn: string;

  // Projects Modal
  projectModalTitle: string;
  projectModalSub: string;
  projectNameLabel: string;
  projectColorLabel: string;
  projectCreateBtn: string;
  deleteProjectConfirm: string;

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
    subtabAll: 'All',
    subtabDueToday: 'Due Today',
    timeFilterAll: 'All Day',
    timeFilterMorning: 'Morning',
    timeFilterWorkday: 'Workday',
    timeFilterEvening: 'Evening',
    timeFilterAnytime: 'Anytime',
    plusTodayBtn: '+ Today',
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
    itemTitleLabel: 'Title',
    itemNotesLabel: 'Notes',
    itemDifficultyLabel: 'Difficulty / Energy',
    itemProjectLabel: 'Project',
    itemTimeOfDayLabel: 'Time of Day',
    itemScheduleAgendaLabel: 'Schedule on Agenda',
    itemDueDateLabel: 'Due Date',
    itemSubtasksLabel: 'Checklist / Subtasks',
    saveBtn: 'Save',

    projectModalTitle: 'Create New Project',
    projectModalSub: 'Group related habits and tasks under a unified theme.',
    projectNameLabel: 'Project Name',
    projectColorLabel: 'Theme Color',
    projectCreateBtn: 'Create Project',
    deleteProjectConfirm: 'Are you sure you want to delete this project? Tasks will remain as standalone items.',

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
    subtabAll: 'Todos',
    subtabDueToday: 'Para hoy',
    timeFilterAll: 'Todo el día',
    timeFilterMorning: 'Mañana',
    timeFilterWorkday: 'Jornada',
    timeFilterEvening: 'Tarde/Noche',
    timeFilterAnytime: 'Cualquier hora',
    plusTodayBtn: '+ Hoy',
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
    itemTitleLabel: 'Título',
    itemNotesLabel: 'Notas',
    itemDifficultyLabel: 'Dificultad / Energía',
    itemProjectLabel: 'Proyecto',
    itemTimeOfDayLabel: 'Momento del día',
    itemScheduleAgendaLabel: 'Programar en Agenda',
    itemDueDateLabel: 'Fecha límite',
    itemSubtasksLabel: 'Lista / Subtareas',
    saveBtn: 'Guardar',

    projectModalTitle: 'Crear nuevo proyecto',
    projectModalSub: 'Agrupa hábitos y tareas relacionados bajo una temática unificada.',
    projectNameLabel: 'Nombre del proyecto',
    projectColorLabel: 'Color temático',
    projectCreateBtn: 'Crear proyecto',
    deleteProjectConfirm: '¿Seguro que deseas eliminar este proyecto? Las tareas permanecerán como elementos independientes.',

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
    subtabAll: 'Tots',
    subtabDueToday: 'Per avui',
    timeFilterAll: 'Tot el dia',
    timeFilterMorning: 'Matí',
    timeFilterWorkday: 'Jornada laboral',
    timeFilterEvening: 'Vespre',
    timeFilterAnytime: 'Qualsevol hora',
    plusTodayBtn: '+ Avui',
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
    itemTitleLabel: 'Títol',
    itemNotesLabel: 'Notes',
    itemDifficultyLabel: 'Dificultat / Energia',
    itemProjectLabel: 'Projecte',
    itemTimeOfDayLabel: 'Moment del dia',
    itemScheduleAgendaLabel: "Programar a l'Agenda",
    itemDueDateLabel: 'Data límit',
    itemSubtasksLabel: 'Llista / Subtasques',
    saveBtn: 'Desar',

    projectModalTitle: 'Crear nou projecte',
    projectModalSub: 'Agrupa hàbits i tasques relacionats sota una temàtica unificada.',
    projectNameLabel: 'Nom del projecte',
    projectColorLabel: 'Color temàtic',
    projectCreateBtn: 'Crear projecte',
    deleteProjectConfirm: 'Segur que vols eliminar aquest projecte? Les tasques romandran com a elements independents.',

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
  },
};
