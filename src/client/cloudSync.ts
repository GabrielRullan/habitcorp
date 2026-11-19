import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import { Task, Project, CalendarMeeting, Ghost, CalendarSource } from './types';

const DATABASE_ID = 'habitcorp-db';
export const DELETED_IDS_STORAGE_KEY = 'habitcorp_deleted_ids_v1';

/**
 * Known demo seed IDs that belong exclusively to `user_test_default`.
 * Any item in localStorage whose ID is NOT in this set is user-created data
 * and should be unified under `user_gabriel` for cross-device sync.
 */
export const DEMO_SEED_IDS = new Set<string>([
  'proj_chinese',
  'proj_japanese',
  'proj_health',
  'proj_corp',
  'proj_unicorn',
  'proj_family',
  'ghost_alex',
  'ghost_sam',
  'ghost_taylor',
  'ghost_jordan',
  'habit_weigh_in',
  'habit_chinese_anki',
  'habit_work_kickoff',
  'habit_deep_work',
  'habit_japanese_study',
  'habit_gym_sbs',
  'habit_evening_close',
  'task_cmc_review',
  'task_unicorn_p011',
  'task_chinese_sentence_mining',
  'task_unicorn_p012',
  'habit_job_offers',
  'task_api_review',
  'meet_school_run_today',
  'meet_dog_walk_today',
  'meet_corp_sync_today',
  'ghost_alex_pickup_today',
  'ghost_jordan_circus_today',
]);

export interface DeletedIdsRegistry {
  deletedTaskIds: string[];
  deletedProjectIds: string[];
  deletedMeetingIds: string[];
  deletedGhostIds: string[];
}

export interface CloudWorkspaceDoc {
  userId: string;
  projects: Project[];
  tasks: Task[];
  subtasks: any[];
  meetings: CalendarMeeting[];
  ghosts: Ghost[];
  calendars: CalendarSource[];
  deletedTaskIds: string[];
  deletedProjectIds: string[];
  deletedMeetingIds: string[];
  deletedGhostIds: string[];
  updatedAt: string;
}

export interface CloudSyncStatusDetail {
  status: 'idle' | 'syncing' | 'synced' | 'error';
  taskCount?: number;
  updatedAt?: string;
}

let firestoreInstance: Firestore | null = null;
let firestoreInitPromise: Promise<Firestore | null> | null = null;
let activeListenerUnsubscribe: Unsubscribe | null = null;
let activeListenerUserId: string | null = null;
let syncInProgress = false;
let pendingSyncArgs: {
  userId: string;
  getLocalDbFn: () => any;
  saveLocalDbFn: (db: any) => void;
  preferLocalOnTie: boolean;
} | null = null;
let lastPushedHash = '';

export function isCloudSyncEnvironment(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    const env = (import.meta as any)?.env;
    if (env?.MODE === 'test' || env?.VITEST) return false;
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') return false;
  } catch {}
  return true;
}

async function resolveFirebaseConfig(): Promise<Record<string, string> | null> {
  try {
    const env = (import.meta as any)?.env;
    if (env?.VITE_FIREBASE_API_KEY && env?.VITE_FIREBASE_PROJECT_ID) {
      return {
        apiKey: env.VITE_FIREBASE_API_KEY,
        projectId: env.VITE_FIREBASE_PROJECT_ID,
        appId: env.VITE_FIREBASE_APP_ID || '',
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      };
    }
  } catch {}

  try {
    const res = await fetch('/__/firebase/init.json');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const cfg = await res.json();
      if (cfg && cfg.apiKey && cfg.projectId) {
        return cfg;
      }
    }
  } catch {}

  return null;
}

async function getFirestoreDb(): Promise<Firestore | null> {
  if (!isCloudSyncEnvironment()) return null;
  if (firestoreInstance) return firestoreInstance;
  if (firestoreInitPromise) return firestoreInitPromise;

  firestoreInitPromise = (async () => {
    try {
      const existingApps = getApps();
      if (existingApps.length > 0) {
        firestoreInstance = getFirestore(existingApps[0], DATABASE_ID);
        return firestoreInstance;
      }
      const config = await resolveFirebaseConfig();
      if (!config) return null;
      const app: FirebaseApp = initializeApp(config);
      firestoreInstance = getFirestore(app, DATABASE_ID);
      return firestoreInstance;
    } catch (err) {
      console.warn('Firestore initialization skipped:', err);
      return null;
    } finally {
      firestoreInitPromise = null;
    }
  })();

  return firestoreInitPromise;
}

export function getDeletedIdsRegistry(): DeletedIdsRegistry {
  const empty: DeletedIdsRegistry = {
    deletedTaskIds: [],
    deletedProjectIds: [],
    deletedMeetingIds: [],
    deletedGhostIds: [],
  };
  try {
    if (typeof localStorage === 'undefined') return empty;
    const raw = localStorage.getItem(DELETED_IDS_STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      deletedTaskIds: Array.isArray(parsed.deletedTaskIds) ? parsed.deletedTaskIds.slice(-4000) : [],
      deletedProjectIds: Array.isArray(parsed.deletedProjectIds) ? parsed.deletedProjectIds.slice(-400) : [],
      deletedMeetingIds: Array.isArray(parsed.deletedMeetingIds) ? parsed.deletedMeetingIds.slice(-4000) : [],
      deletedGhostIds: Array.isArray(parsed.deletedGhostIds) ? parsed.deletedGhostIds.slice(-150) : [],
    };
  } catch {
    return empty;
  }
}

export function saveDeletedIdsRegistry(reg: DeletedIdsRegistry) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        DELETED_IDS_STORAGE_KEY,
        JSON.stringify({
          deletedTaskIds: Array.from(new Set(reg.deletedTaskIds)).slice(-4000),
          deletedProjectIds: Array.from(new Set(reg.deletedProjectIds)).slice(-400),
          deletedMeetingIds: Array.from(new Set(reg.deletedMeetingIds)).slice(-4000),
          deletedGhostIds: Array.from(new Set(reg.deletedGhostIds)).slice(-150),
        })
      );
    }
  } catch {}
}

export function recordDeletedId(
  kind: 'task' | 'project' | 'meeting' | 'ghost',
  id: string
) {
  if (!id) return;
  const reg = getDeletedIdsRegistry();
  if (kind === 'task' && !reg.deletedTaskIds.includes(id)) reg.deletedTaskIds.push(id);
  if (kind === 'project' && !reg.deletedProjectIds.includes(id)) reg.deletedProjectIds.push(id);
  if (kind === 'meeting' && !reg.deletedMeetingIds.includes(id)) reg.deletedMeetingIds.push(id);
  if (kind === 'ghost' && !reg.deletedGhostIds.includes(id)) reg.deletedGhostIds.push(id);
  saveDeletedIdsRegistry(reg);
}

function getItemTimestamp(item: any): string {
  return (
    item?.updated_at ||
    item?.completed_at ||
    item?.last_completed_date ||
    item?.last_synced_at ||
    item?.created_at ||
    ''
  );
}

export function isItemOwnedByCanonicalUser(item: { id: string; user_id?: string }, userId: string): boolean {
  if (!item || !item.id) return false;
  if (!item.user_id || item.user_id === userId) return true;
  // If userId is user_gabriel, claim any user-created item (anything not in DEMO_SEED_IDS)
  if (userId === 'user_gabriel' && !DEMO_SEED_IDS.has(item.id)) return true;
  return false;
}

/**
 * Non-destructively merges local and remote arrays for a given userId,
 * respecting deleted tombstones and picking the newest version of each item.
 */
export function mergeCollectionById<T extends { id: string; user_id?: string }>(
  localAll: T[],
  remoteUserItems: T[],
  userId: string,
  deletedIdsSet: Set<string>,
  preferLocalOnTie: boolean
): { mergedAll: T[]; userItems: T[]; changedLocally: boolean; needsCloudPush: boolean } {
  const otherUsersItems = (localAll || []).filter(
    (item) => !isItemOwnedByCanonicalUser(item, userId)
  );
  const localUserItems = (localAll || []).filter(
    (item) => isItemOwnedByCanonicalUser(item, userId) && !deletedIdsSet.has(item.id)
  );
  const validRemoteItems = (remoteUserItems || []).filter(
    (item) => item && item.id && !deletedIdsSet.has(item.id)
  );

  // Check if any local item had a non-canonical user_id that is being unified
  let changedLocally = (localAll || []).some(
    (item) =>
      isItemOwnedByCanonicalUser(item, userId) &&
      (deletedIdsSet.has(item.id) || item.user_id !== userId)
  );
  let needsCloudPush = (remoteUserItems || []).some(
    (item) => item && deletedIdsSet.has(item.id)
  );

  const localMap = new Map<string, T>();
  for (const item of localUserItems) {
    localMap.set(item.id, { ...item, user_id: userId });
  }

  const remoteMap = new Map<string, T>();
  for (const item of validRemoteItems) {
    remoteMap.set(item.id, { ...item, user_id: userId });
  }

  const mergedUserMap = new Map<string, T>();

  // 1. Process all local items
  for (const [id, localItem] of localMap.entries()) {
    const remoteItem = remoteMap.get(id);
    if (!remoteItem) {
      mergedUserMap.set(id, localItem);
      needsCloudPush = true;
    } else {
      const localTs = getItemTimestamp(localItem);
      const remoteTs = getItemTimestamp(remoteItem);
      if (remoteTs > localTs) {
        mergedUserMap.set(id, remoteItem);
        changedLocally = true;
      } else if (localTs > remoteTs) {
        mergedUserMap.set(id, localItem);
        needsCloudPush = true;
      } else {
        const chosen = preferLocalOnTie ? localItem : remoteItem;
        mergedUserMap.set(id, chosen);
        if (JSON.stringify(localItem) !== JSON.stringify(remoteItem)) {
          if (preferLocalOnTie) needsCloudPush = true;
          else changedLocally = true;
        }
      }
    }
  }

  // 2. Process remote items not present locally
  for (const [id, remoteItem] of remoteMap.entries()) {
    if (!mergedUserMap.has(id)) {
      mergedUserMap.set(id, remoteItem);
      changedLocally = true;
    }
  }

  const userItems = Array.from(mergedUserMap.values());
  const mergedAll = [...otherUsersItems, ...userItems];

  return { mergedAll, userItems, changedLocally, needsCloudPush };
}

function sanitizeForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function notifyCloudSyncUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('habitcorp:cloud-sync'));
  }
}

function notifyCloudSyncStatus(detail: CloudSyncStatusDetail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('habitcorp:cloud-sync-status', { detail }));
  }
}

export async function syncClientDbWithCloud(
  userId: string = 'user_gabriel',
  getLocalDbFn: () => any,
  saveLocalDbFn: (db: any) => void,
  preferLocalOnTie: boolean = true,
  forcePush: boolean = false
): Promise<boolean> {
  // Always canonicalize cloud workspace to user_gabriel so desktop and mobile always meet on the same document
  const canonicalUserId = 'user_gabriel';

  if (syncInProgress) {
    pendingSyncArgs = {
      userId: canonicalUserId,
      getLocalDbFn,
      saveLocalDbFn,
      preferLocalOnTie: (pendingSyncArgs?.preferLocalOnTie ?? false) || preferLocalOnTie,
    };
    return false;
  }

  const firestore = await getFirestoreDb();
  if (!firestore) return false;

  if (syncInProgress) {
    pendingSyncArgs = {
      userId: canonicalUserId,
      getLocalDbFn,
      saveLocalDbFn,
      preferLocalOnTie: (pendingSyncArgs?.preferLocalOnTie ?? false) || preferLocalOnTie,
    };
    return false;
  }

  syncInProgress = true;
  notifyCloudSyncStatus({ status: 'syncing' });

  try {
    const wsRef = doc(firestore, 'workspaces', canonicalUserId);
    const snap = await getDoc(wsRef);
    const localDb = getLocalDbFn();
    const localDeleted = getDeletedIdsRegistry();

    const remoteData: Partial<CloudWorkspaceDoc> = snap.exists()
      ? (snap.data() as Partial<CloudWorkspaceDoc>)
      : {};

    const mergedDeleted: DeletedIdsRegistry = {
      deletedTaskIds: Array.from(
        new Set([...localDeleted.deletedTaskIds, ...(remoteData.deletedTaskIds || [])])
      ).slice(-4000),
      deletedProjectIds: Array.from(
        new Set([...localDeleted.deletedProjectIds, ...(remoteData.deletedProjectIds || [])])
      ).slice(-400),
      deletedMeetingIds: Array.from(
        new Set([...localDeleted.deletedMeetingIds, ...(remoteData.deletedMeetingIds || [])])
      ).slice(-4000),
      deletedGhostIds: Array.from(
        new Set([...localDeleted.deletedGhostIds, ...(remoteData.deletedGhostIds || [])])
      ).slice(-150),
    };
    saveDeletedIdsRegistry(mergedDeleted);

    const deletedTasksSet = new Set(mergedDeleted.deletedTaskIds);
    const deletedProjectsSet = new Set(mergedDeleted.deletedProjectIds);
    const deletedMeetingsSet = new Set(mergedDeleted.deletedMeetingIds);
    const deletedGhostsSet = new Set(mergedDeleted.deletedGhostIds);

    const projMerge = mergeCollectionById<Project>(
      localDb.projects || [],
      remoteData.projects || [],
      canonicalUserId,
      deletedProjectsSet,
      preferLocalOnTie
    );
    const taskMerge = mergeCollectionById<Task>(
      localDb.tasks || [],
      remoteData.tasks || [],
      canonicalUserId,
      deletedTasksSet,
      preferLocalOnTie
    );
    const meetMerge = mergeCollectionById<CalendarMeeting>(
      localDb.meetings || [],
      remoteData.meetings || [],
      canonicalUserId,
      deletedMeetingsSet,
      preferLocalOnTie
    );
    const ghostMerge = mergeCollectionById<Ghost>(
      localDb.ghosts || [],
      remoteData.ghosts || [],
      canonicalUserId,
      deletedGhostsSet,
      preferLocalOnTie
    );
    const calMerge = mergeCollectionById<CalendarSource>(
      localDb.calendars || [],
      remoteData.calendars || [],
      canonicalUserId,
      new Set(),
      preferLocalOnTie
    );

    const anyChangedLocally =
      projMerge.changedLocally ||
      taskMerge.changedLocally ||
      meetMerge.changedLocally ||
      ghostMerge.changedLocally ||
      calMerge.changedLocally;

    if (anyChangedLocally) {
      localDb.projects = projMerge.mergedAll;
      localDb.tasks = taskMerge.mergedAll;
      localDb.meetings = meetMerge.mergedAll;
      localDb.ghosts = ghostMerge.mergedAll;
      localDb.calendars = calMerge.mergedAll;
      saveLocalDbFn(localDb);
      notifyCloudSyncUpdated();
    }

    const remoteTasksLen = Array.isArray(remoteData.tasks) ? remoteData.tasks.length : 0;
    const remoteProjsLen = Array.isArray(remoteData.projects) ? remoteData.projects.length : 0;

    const shouldPush =
      forcePush ||
      !snap.exists() ||
      (taskMerge.userItems.length > remoteTasksLen) ||
      (projMerge.userItems.length > remoteProjsLen) ||
      projMerge.needsCloudPush ||
      taskMerge.needsCloudPush ||
      meetMerge.needsCloudPush ||
      ghostMerge.needsCloudPush ||
      calMerge.needsCloudPush;

    const nowIso = new Date().toISOString();

    if (shouldPush) {
      const payload: CloudWorkspaceDoc = sanitizeForFirestore({
        userId: canonicalUserId,
        projects: projMerge.userItems.slice(0, 500),
        tasks: taskMerge.userItems.slice(0, 5000),
        subtasks: (localDb.subtasks || []).slice(0, 10000),
        meetings: meetMerge.userItems.slice(0, 5000),
        ghosts: ghostMerge.userItems.slice(0, 200),
        calendars: calMerge.userItems.slice(0, 200),
        deletedTaskIds: mergedDeleted.deletedTaskIds.slice(-4000),
        deletedProjectIds: mergedDeleted.deletedProjectIds.slice(-400),
        deletedMeetingIds: mergedDeleted.deletedMeetingIds.slice(-4000),
        deletedGhostIds: mergedDeleted.deletedGhostIds.slice(-150),
        updatedAt: nowIso,
      });
      const payloadHash = JSON.stringify({
        p: payload.projects,
        t: payload.tasks,
        m: payload.meetings,
        g: payload.ghosts,
        dt: payload.deletedTaskIds.length,
      });
      if (forcePush || payloadHash !== lastPushedHash) {
        lastPushedHash = payloadHash;
        await setDoc(wsRef, payload);
      }
    }

    notifyCloudSyncStatus({
      status: 'synced',
      taskCount: taskMerge.userItems.length,
      updatedAt: remoteData.updatedAt || nowIso,
    });

    return anyChangedLocally;
  } catch (err) {
    console.warn('Cloud sync warning (continuing with local storage):', err);
    notifyCloudSyncStatus({ status: 'error' });
    return false;
  } finally {
    syncInProgress = false;
    if (pendingSyncArgs) {
      const next = pendingSyncArgs;
      pendingSyncArgs = null;
      syncClientDbWithCloud(
        next.userId,
        next.getLocalDbFn,
        next.saveLocalDbFn,
        next.preferLocalOnTie
      ).catch(() => {});
    }
  }
}

export function startRealtimeCloudSubscription(
  userId: string = 'user_gabriel',
  getLocalDbFn: () => any,
  saveLocalDbFn: (db: any) => void
) {
  const canonicalUserId = 'user_gabriel';
  if (!isCloudSyncEnvironment()) return;
  if (activeListenerUserId === canonicalUserId && activeListenerUnsubscribe) return;

  activeListenerUserId = canonicalUserId;

  getFirestoreDb()
    .then((firestore) => {
      if (!firestore || activeListenerUserId !== canonicalUserId) return;
      if (activeListenerUnsubscribe) {
        activeListenerUnsubscribe();
        activeListenerUnsubscribe = null;
      }

      const wsRef = doc(firestore, 'workspaces', canonicalUserId);
      activeListenerUnsubscribe = onSnapshot(
        wsRef,
        (snap) => {
          if (!snap.exists() || syncInProgress) return;
          syncClientDbWithCloud(canonicalUserId, getLocalDbFn, saveLocalDbFn, false).catch(() => {});
        },
        (err) => {
          console.warn('Firestore realtime subscription warning:', err);
        }
      );
    })
    .catch(() => {});
}
