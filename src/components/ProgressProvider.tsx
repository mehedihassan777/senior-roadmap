"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getDay, taskId } from "@/lib/roadmap";

/**
 * Local-first store.
 * Everything is written to localStorage immediately (works offline, before any DB is set up).
 * Each item carries a timestamp `t` (ms). sync() posts local changes to /api/sync (Neon),
 * the server keeps the newest write per item and returns the full DB state, and we apply
 * anything the DB has that is newer than what we hold locally.
 */
interface Store {
  tasks: Record<string, { c: boolean; t: number }>;
  notes: Record<number, { n: string; t: number }>;
  start: { v: string; t: number } | null;
  lastSync: number | null;
}

interface SyncResponse {
  tasks: { id: string; c: boolean; t: number }[];
  notes: { day: number; n: string; t: number }[];
  start: { v: string; t: number } | null;
}

const EMPTY: Store = { tasks: {}, notes: {}, start: null, lastSync: null };
const STORE_KEY = "senior-roadmap:v2";
const PASS_KEY = "senior-roadmap:passcode";

export type SyncStatus = "idle" | "syncing" | "synced" | "error" | "unconfigured";

interface ProgressState {
  ready: boolean;
  /** true once a sync passcode is saved on this device */
  syncEnabled: boolean;
  syncStatus: SyncStatus;
  syncMessage: string | null;
  lastSyncedAt: number | null;
  /** local changes not yet pushed to the database */
  pendingChanges: number;
  sync: () => Promise<void>;
  dismissSyncMessage: () => void;
  passcodePromptOpen: boolean;
  closePasscodePrompt: () => void;
  submitPasscode: (passcode: string) => void;
  completed: Record<string, true>;
  notes: Record<number, string>;
  startDate: string | null;
  toggleTask: (day: number, idx: number) => void;
  setDayDone: (day: number, done: boolean) => void;
  saveNote: (day: number, note: string) => void;
  setStartDate: (date: string) => void;
}

const Ctx = createContext<ProgressState | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<Store>(EMPTY);
  const [passcode, setPasscode] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("unconfigured");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [passcodePromptOpen, setPromptOpen] = useState(false);

  const storeRef = useRef(store);
  const passRef = useRef<string | null>(null);
  const syncing = useRef(false);
  const queued = useRef(false);
  const syncRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    storeRef.current = store;
  }, [store]);
  useEffect(() => {
    passRef.current = passcode;
  }, [passcode]);

  /* ---------------- hydrate from localStorage ---------------- */
  useEffect(() => {
    let saved: Store = EMPTY;
    let pass: string | null = null;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) saved = { ...EMPTY, ...JSON.parse(raw) };
      pass = localStorage.getItem(PASS_KEY);
    } catch {
      /* corrupt storage: start clean */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off hydration, can't run during SSR
    setStore(saved);
    setPasscode(pass);
    setSyncStatus(pass ? "idle" : "unconfigured");
    setReady(true);
  }, []);

  /* ---------------- persist locally on every change ---------------- */
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch {
      /* storage full / blocked */
    }
  }, [ready, store]);

  /* ---------------- sync ---------------- */
  const sync = useCallback(async () => {
    const pass = passRef.current;
    if (!pass) {
      setSyncStatus("unconfigured");
      setPromptOpen(true);
      return;
    }
    if (syncing.current) {
      queued.current = true;
      return;
    }
    syncing.current = true;
    setSyncStatus("syncing");
    setSyncMessage(null);
    const startedAt = Date.now();
    try {
      const local = storeRef.current;
      const since = local.lastSync ?? 0;
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json", "x-sync-passcode": pass },
        body: JSON.stringify({
          tasks: Object.entries(local.tasks)
            .filter(([, v]) => v.t > since)
            .map(([id, v]) => ({ id, c: v.c, t: v.t })),
          notes: Object.entries(local.notes)
            .filter(([, v]) => v.t > since)
            .map(([day, v]) => ({ day: Number(day), n: v.n, t: v.t })),
          start: local.start && local.start.t > since ? local.start : null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<SyncResponse> & { error?: string; message?: string };

      if (res.status === 401) {
        localStorage.removeItem(PASS_KEY);
        setPasscode(null);
        setSyncStatus("unconfigured");
        setSyncMessage("Wrong passcode. Enter the SYNC_PASSCODE you set on the server.");
        setPromptOpen(true);
        return;
      }
      if (!res.ok) throw new Error(data.message ?? `Server returned ${res.status}`);

      /* apply DB-newer items, re-checking against edits made while we were syncing */
      setStore((prev) => {
        const tasks = { ...prev.tasks };
        for (const r of data.tasks ?? []) if (!tasks[r.id] || r.t > tasks[r.id].t) tasks[r.id] = { c: r.c, t: r.t };
        const notes = { ...prev.notes };
        for (const r of data.notes ?? []) if (!notes[r.day] || r.t > notes[r.day].t) notes[r.day] = { n: r.n, t: r.t };
        const start = data.start && (!prev.start || data.start.t > prev.start.t) ? data.start : prev.start;
        return { tasks, notes, start, lastSync: startedAt };
      });
      setSyncStatus("synced");
    } catch (e) {
      setSyncStatus("error");
      setSyncMessage(
        `Sync failed: ${e instanceof Error ? e.message : String(e)}. Your changes are safe in this browser and will sync later.`,
      );
    } finally {
      syncing.current = false;
      if (queued.current) {
        queued.current = false;
        void syncRef.current?.();
      }
    }
  }, []);

  useEffect(() => {
    syncRef.current = sync;
  }, [sync]);

  /* first sync, then on tab focus / back online / every minute while visible */
  useEffect(() => {
    if (!ready || !passcode) return;
    const first = setTimeout(() => void sync(), 0);
    const onVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    const poll = setInterval(onVisible, 60_000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    return () => {
      clearTimeout(first);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, [ready, passcode, sync]);

  /* pending = local items newer than the last successful sync */
  const pendingChanges = useMemo(() => {
    const since = store.lastSync ?? 0;
    return (
      Object.values(store.tasks).filter((x) => x.t > since).length +
      Object.values(store.notes).filter((x) => x.t > since).length +
      (store.start && store.start.t > since ? 1 : 0)
    );
  }, [store]);

  /* auto-push shortly after local edits */
  useEffect(() => {
    if (!ready || !passcode || pendingChanges === 0 || syncing.current) return;
    const t = setTimeout(() => void sync(), 1500);
    return () => clearTimeout(t);
  }, [ready, passcode, pendingChanges, store, sync]);

  const submitPasscode = useCallback((p: string) => {
    const v = p.trim();
    if (!v) return;
    try {
      localStorage.setItem(PASS_KEY, v);
    } catch {
      /* private mode: keep in memory only */
    }
    passRef.current = v;
    setStore((prev) => ({ ...prev, lastSync: null }));
    setPasscode(v);
    setPromptOpen(false);
    setSyncMessage(null);
    setSyncStatus("idle");
  }, []);

  /* ---------------- mutations (always local first) ---------------- */
  const toggleTask = useCallback((day: number, idx: number) => {
    const id = taskId(day, idx);
    setStore((prev) => ({
      ...prev,
      tasks: { ...prev.tasks, [id]: { c: !prev.tasks[id]?.c, t: Date.now() } },
    }));
  }, []);

  const setDayDone = useCallback((day: number, done: boolean) => {
    const d = getDay(day);
    if (!d) return;
    const t = Date.now();
    setStore((prev) => {
      const tasks = { ...prev.tasks };
      d.tasks.forEach((_, i) => {
        tasks[taskId(day, i)] = { c: done, t };
      });
      return { ...prev, tasks };
    });
  }, []);

  const saveNote = useCallback((day: number, note: string) => {
    setStore((prev) => ({ ...prev, notes: { ...prev.notes, [day]: { n: note, t: Date.now() } } }));
  }, []);

  const setStartDate = useCallback((date: string) => {
    setStore((prev) => ({ ...prev, start: { v: date, t: Date.now() } }));
  }, []);

  const completed = useMemo(() => {
    const c: Record<string, true> = {};
    for (const [id, v] of Object.entries(store.tasks)) if (v.c) c[id] = true;
    return c;
  }, [store.tasks]);

  const notes = useMemo(() => {
    const n: Record<number, string> = {};
    for (const [d, v] of Object.entries(store.notes)) n[Number(d)] = v.n;
    return n;
  }, [store.notes]);

  const value = useMemo<ProgressState>(
    () => ({
      ready,
      syncEnabled: passcode !== null,
      syncStatus,
      syncMessage,
      lastSyncedAt: store.lastSync,
      pendingChanges,
      sync,
      dismissSyncMessage: () => setSyncMessage(null),
      passcodePromptOpen,
      closePasscodePrompt: () => setPromptOpen(false),
      submitPasscode,
      completed,
      notes,
      startDate: store.start?.v ?? null,
      toggleTask,
      setDayDone,
      saveNote,
      setStartDate,
    }),
    [
      ready,
      passcode,
      syncStatus,
      syncMessage,
      store.lastSync,
      store.start,
      pendingChanges,
      sync,
      passcodePromptOpen,
      submitPasscode,
        completed,
      notes,
      toggleTask,
      setDayDone,
      saveNote,
      setStartDate,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProgress must be used inside <ProgressProvider>");
  return v;
}
