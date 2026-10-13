import { useSyncExternalStore } from "react";

export interface Attempt {
  n: number; // vezes respondida
  ok: number; // vezes acertada
  last: boolean; // acertou na última vez?
  ts: number;
}

export interface Settings {
  examDate: string | null; // AAAA-MM-DD
  startDate: string; // AAAA-MM-DD
  minutes: number; // minutos de estudo por dia
  restDays: number[]; // 0 = domingo ... 6 = sábado
}

export interface SimResult {
  id: string;
  title: string;
  date: number;
  qids: string[];
  answers: Record<string, number | null>;
  correct: number;
  total: number;
  seconds: number;
}

export interface State {
  v: 1;
  attempts: Record<string, Attempt>;
  settings: Settings;
  daysDone: Record<string, boolean>;
  dayQs: Record<string, string[]>; // questões sorteadas para cada dia do plano
  sims: SimResult[];
  log: Record<string, { n: number; ok: number }>;
}

const KEY = "cfg-estudos-v1";

export function todayISO(d = new Date()) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

function initial(): State {
  return {
    v: 1,
    attempts: {},
    settings: { examDate: null, startDate: todayISO(), minutes: 60, restDays: [] },
    daysDone: {},
    dayQs: {},
    sims: [],
    log: {},
  };
}

function read(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial(), ...JSON.parse(raw) };
  } catch {
    /* armazenamento indisponível */
  }
  return initial();
}

let state: State = read();
const listeners = new Set<() => void>();

function commit(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* armazenamento indisponível */
  }
  listeners.forEach((l) => l());
}

export function useStore(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export function getState() {
  return state;
}

export function recordAnswer(qid: string, correct: boolean) {
  const prev = state.attempts[qid] ?? { n: 0, ok: 0, last: false, ts: 0 };
  const day = todayISO();
  const lg = state.log[day] ?? { n: 0, ok: 0 };
  commit({
    ...state,
    attempts: { ...state.attempts, [qid]: { n: prev.n + 1, ok: prev.ok + (correct ? 1 : 0), last: correct, ts: Date.now() } },
    log: { ...state.log, [day]: { n: lg.n + 1, ok: lg.ok + (correct ? 1 : 0) } },
  });
}

export function updateSettings(patch: Partial<Settings>) {
  commit({ ...state, settings: { ...state.settings, ...patch } });
}

export function setDayDone(date: string, done: boolean) {
  commit({ ...state, daysDone: { ...state.daysDone, [date]: done } });
}

export function setDayQs(date: string, qids: string[]) {
  commit({ ...state, dayQs: { ...state.dayQs, [date]: qids } });
}

export function saveSim(r: SimResult) {
  commit({ ...state, sims: [...state.sims, r] });
}

export function exportBackup() {
  return JSON.stringify(state);
}

export function importBackup(json: string) {
  const parsed = JSON.parse(json);
  if (parsed?.v !== 1 || typeof parsed.attempts !== "object") throw new Error("Arquivo de backup inválido");
  commit({ ...initial(), ...parsed });
}

export function resetAll() {
  commit(initial());
}
