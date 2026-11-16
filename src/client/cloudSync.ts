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

let firestoreInstance: Firestore | null = null;
let firestoreInitPromise: Promise<Firestore | null> | null = null;
let activeListenerUnsubscribe: Unsubscribe | null = null;
let activeListenerUserId: string | null = null;
let syncInProgress = false;
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
    (item) => item.user_id && item.user_id !== userId
  );
  const localUserItems = (localAll || []).filter(
    (item) => (!item.user_id || item.user_id === userId) && !deletedIdsSet.has(item.id)
  );
  const validRemoteItems = (remoteUserItems || []).filter(
    (item) => item && item.id && !deletedIdsSet.has(item.id)
  );

  const localMap = new Map<string, T>();
  for (const item of localUserItems) {
    localMap.set(item.id, { ...item, user_id: userId });
  }

  const remoteMap = new Map<string, T>();
  for (const item of validRemoteItems) {
    remoteMap.set(item.id, { ...item, user_id: userId });
  }

  let changedLocally = (localAll || []).some(
    (item) => (!item.user_id || item.user_id === userId) && deletedIdsSet.has(item.id)
  );
  let needsCloudPush = (remoteUserItems || []).some(
    (item) => item && deletedIdsSet.has(item.id)
  );

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

export async function syncClientDbWithCloud(
  userId: string = 'user_gabriel',
  getLocalDbFn: () => any,
  saveLocalDbFn: (db: any) => void,
  preferLocalOnTie: boolean = true
): Promise<boolean> {
  const firestore = await getFirestoreDb();
  if (!firestore || !userId || syncInProgress) return false;
  if (!/^[a-zA-Z0-9_-]{3,64}$/.test(userId)) return false;

  syncInProgress = true;
  try {
    const wsRef = doc(firestore, 'workspaces', userId);
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
      userId,
      deletedProjectsSet,
      preferLocalOnTie
    );
    const taskMerge = mergeCollectionById<Task>(
      localDb.tasks || [],
      remoteData.tasks || [],
      userId,
      deletedTasksSet,
      preferLocalOnTie
    );
    const meetMerge = mergeCollectionById<CalendarMeeting>(
      localDb.meetings || [],
      remoteData.meetings || [],
      userId,
      deletedMeetingsSet,
      preferLocalOnTie
    );
    const ghostMerge = mergeCollectionById<Ghost>(
      localDb.ghosts || [],
      remoteData.ghosts || [],
      userId,
      deletedGhostsSet,
      preferLocalOnTie
    );
    const calMerge = mergeCollectionById<CalendarSource>(
      localDb.calendars || [],
      remoteData.calendars || [],
      userId,
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

    const shouldPush =
      !snap.exists() ||
      projMerge.needsCloudPush ||
      taskMerge.needsCloudPush ||
      meetMerge.needsCloudPush ||
      ghostMerge.needsCloudPush ||
      calMerge.needsCloudPush;

    if (shouldPush) {
      const payload: CloudWorkspaceDoc = sanitizeForFirestore({
        userId,
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
        updatedAt: new Date().toISOString(),
      });
      const payloadHash = JSON.stringify({
        p: payload.projects.length,
        t: payload.tasks,
        m: payload.meetings.length,
        g: payload.ghosts.length,
        dt: payload.deletedTaskIds.length,
      });
      if (payloadHash !== lastPushedHash) {
        lastPushedHash = payloadHash;
        await setDoc(wsRef, payload);
      }
    }

    return anyChangedLocally;
  } catch (err) {
    console.warn('Cloud sync warning (continuing with local storage):', err);
    return false;
  } finally {
    syncInProgress = false;
  }
}

export function startRealtimeCloudSubscription(
  userId: string = 'user_gabriel',
  getLocalDbFn: () => any,
  saveLocalDbFn: (db: any) => void
) {
  if (!isCloudSyncEnvironment() || !userId) return;
  if (activeListenerUserId === userId && activeListenerUnsubscribe) return;

  activeListenerUserId = userId;

  getFirestoreDb()
    .then((firestore) => {
      if (!firestore || activeListenerUserId !== userId) return;
      if (activeListenerUnsubscribe) {
        activeListenerUnsubscribe();
        activeListenerUnsubscribe = null;
      }

      const wsRef = doc(firestore, 'workspaces', userId);
      activeListenerUnsubscribe = onSnapshot(
        wsRef,
        (snap) => {
          if (!snap.exists() || syncInProgress) return;
          syncClientDbWithCloud(userId, getLocalDbFn, saveLocalDbFn, false).catch(() => {});
        },
        (err) => {
          console.warn('Firestore realtime subscription warning:', err);
        }
      );
    })
    .catch(() => {});
}
