import { Data, moduleWeight, Question } from "./data";
import { Settings, State, todayISO } from "./store";

export type DayKind = "estudo" | "revisao-semanal" | "revisao-modulo" | "simulado" | "correcao" | "vespera";

export interface PlanDay {
  date: string;
  idx: number;
  kind: DayKind;
  title: string;
  topics: { id: string; frac: number }[];
  mods: number[];
  sim?: number;
  nq: number;
}

export interface Plan {
  days: PlanDay[];
  examDate: string;
  phases: { name: string; from: string; to: string; desc: string }[];
}

const DAY = 86400000;

function parse(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number) {
  return todayISO(new Date(parse(iso).getTime() + n * DAY));
}

export function daysBetween(a: string, b: string) {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / DAY);
}

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit" }) {
  return parse(iso).toLocaleDateString("pt-BR", opts);
}

/** Distribui itens com pesos sobre `n` dias contínuos; cada dia recebe os itens cujo intervalo o sobrepõe. */
function spread<T>(items: { key: T; w: number }[], n: number) {
  const total = items.reduce((s, i) => s + i.w, 0);
  const out: { key: T; frac: number }[][] = Array.from({ length: n }, () => []);
  let cum = 0;
  for (const it of items) {
    const a = (cum / total) * n;
    cum += it.w;
    const b = (cum / total) * n;
    for (let d = Math.floor(a); d < Math.min(n, Math.ceil(b)); d++) {
      const ov = Math.min(b, d + 1) - Math.max(a, d);
      if (ov > 0.15 || (ov > 0 && b - a < 0.3)) out[d].push({ key: it.key, frac: ov });
    }
  }
  return out;
}

export function buildPlan(data: Data, s: Settings): Plan {
  const examDate = s.examDate ?? addDays(s.startDate, 60);
  const dates: string[] = [];
  for (let d = s.startDate; d < examDate; d = addDays(d, 1)) {
    if (!s.restDays.includes(parse(d).getDay())) dates.push(d);
  }
  const N = dates.length;
  const nqStudy = Math.max(10, Math.round(s.minutes / 4));
  const nqReview = Math.max(15, Math.round(s.minutes / 3));
  const days: PlanDay[] = [];
  if (N === 0) return { days, examDate, phases: [] };

  const { modules, topics } = data.meta;
  const hasEve = N >= 10;
  let F = N >= 24 ? Math.min(12, Math.round(N * 0.2)) : Math.min(6, Math.floor(N / 4));
  const rest = N - F - (hasEve ? 1 : 0);
  const p1 = Math.max(1, Math.round(rest * (N >= 24 ? 0.78 : 1)));
  const p2 = rest - p1;

  // Fase 1 — teoria + questões por tópico, com revisão semanal a cada 7º dia
  const p1Kinds = Array.from({ length: p1 }, (_, i) => (p1 >= 14 && i % 7 === 6 ? "revisao-semanal" : "estudo"));
  const studyCount = p1Kinds.filter((k) => k === "estudo").length;
  const modTopics = new Map<number, typeof topics>();
  topics.forEach((t) => modTopics.set(t.mod, [...(modTopics.get(t.mod) ?? []), t]));
  const tItems = topics.map((t) => {
    const m = modules.find((x) => x.id === t.mod)!;
    const sib = modTopics.get(t.mod)!;
    const nMod = sib.reduce((a, b) => a + b.n, 0);
    return { key: t.id, w: moduleWeight(m) * (0.35 / sib.length + 0.65 * (t.n / nMod)), cap: Math.max(0.5, t.n / nqStudy) };
  });
  // Um tópico não recebe mais dias do que tem questões para preencher; o excedente vai para os demais.
  for (let iter = 0; iter < 10; iter++) {
    const W = tItems.reduce((s, t) => s + t.w, 0);
    const over = tItems.filter((t) => (t.w / W) * studyCount > t.cap + 1e-9);
    if (!over.length) break;
    over.forEach((t) => (t.w = (t.cap / studyCount) * W));
  }
  const tDays = spread(tItems, studyCount);
  let si = 0;
  p1Kinds.forEach((k, i) => {
    const date = dates[i];
    if (k === "estudo") {
      const tp = tDays[si++];
      const mods = [...new Set(tp.map((x) => topics.find((t) => t.id === x.key)!.mod))];
      days.push({
        date, idx: i, kind: "estudo", nq: nqStudy, mods,
        topics: tp.map((x) => ({ id: x.key, frac: x.frac })),
        title: tp.map((x) => `${x.key} ${topics.find((t) => t.id === x.key)!.name}`).join(" + "),
      });
    } else {
      days.push({ date, idx: i, kind: "revisao-semanal", nq: nqReview, mods: [], topics: [], title: "Revisão da semana: erros + questões dos tópicos estudados" });
    }
  });

  // Fase 2 — revisão por módulo (erros + mais cobradas)
  const mDays = spread(modules.map((m) => ({ key: m.id, w: moduleWeight(m) })), p2);
  mDays.forEach((ms, j) => {
    const mods = ms.map((x) => x.key);
    days.push({
      date: dates[p1 + j], idx: p1 + j, kind: "revisao-modulo", nq: nqReview, mods, topics: [],
      title: "Revisão: " + mods.map((m) => modules.find((x) => x.id === m)!.name).join(" + "),
    });
  });

  // Fase 3 — simulados completos alternados com correção
  const nSims = Math.min(6, Math.ceil(F / 2));
  for (let j = 0; j < F; j++) {
    const date = dates[p1 + p2 + j];
    const sim = Math.floor(j / 2) + 1;
    if (j % 2 === 0 && sim <= nSims) {
      days.push({ date, idx: p1 + p2 + j, kind: "simulado", sim, nq: 60, mods: [], topics: [], title: `Simulado ${sim} (60 questões · 2h30)` });
    } else {
      days.push({ date, idx: p1 + p2 + j, kind: "correcao", nq: nqReview, mods: [], topics: [], title: "Correção do simulado + treino dos módulos mais fracos" });
    }
  }
  if (hasEve) {
    days.push({ date: dates[N - 1], idx: N - 1, kind: "vespera", nq: 20, mods: [], topics: [], title: "Véspera: revisão leve das mais cobradas e fórmulas" });
  }

  const phases = [
    { name: "Fase 1 · Base", from: dates[0], to: dates[p1 - 1], desc: "Teoria do tópico do dia + questões do banco. A cada 7 dias, revisão dos erros da semana." },
    ...(p2 > 0 ? [{ name: "Fase 2 · Revisão", from: dates[p1], to: dates[p1 + p2 - 1], desc: "Revisão por módulo, priorizando seus erros e as questões que mais caem." }] : []),
    ...(F > 0 || hasEve
      ? [{ name: F > 0 ? "Fase 3 · Simulados" : "Reta final", from: dates[p1 + p2], to: dates[N - 1], desc: "Simulados completos cronometrados alternados com correção e reforço. Na véspera, só revisão leve." }]
      : []),
  ];
  return { days, examDate, phases };
}

/** Escolhe as questões do dia (determinístico enquanto a lista não é salva). */
export function pickDayQuestions(day: PlanDay, data: Data, st: State, plan: Plan): string[] {
  const att = st.attempts;
  const unseen = (q: Question) => !att[q.id];
  const wrong = (q: Question) => att[q.id] && !att[q.id].last;
  const pool = data.questions.filter((q) => q.src !== "s"); // simulados ficam reservados para a Fase 3
  const take = (cands: Question[], n: number, chosen: Set<string>) => {
    const ordered = [...cands].sort((a, b) => Number(b.hot) - Number(a.hot) || seeded(day.date + a.id) - seeded(day.date + b.id));
    for (const q of ordered) {
      if (chosen.size >= n) break;
      chosen.add(q.id);
    }
  };
  const chosen = new Set<string>();

  if (day.kind === "estudo") {
    const fracTotal = day.topics.reduce((s, t) => s + t.frac, 0) || 1;
    for (const t of day.topics) {
      const quota = chosen.size + Math.max(3, Math.round((day.nq * t.frac) / fracTotal));
      const inTopic = pool.filter((q) => q.topic === t.id);
      take(inTopic.filter(unseen), Math.min(day.nq, quota), chosen);
      take(inTopic, Math.min(day.nq, quota), chosen);
    }
  } else if (day.kind === "revisao-semanal") {
    const weekAgo = Date.now() - 8 * DAY;
    const recentTopics = new Set(plan.days.filter((d) => d.date < day.date && d.date >= addDays(day.date, -7)).flatMap((d) => d.topics.map((t) => t.id)));
    take(pool.filter((q) => wrong(q) && att[q.id].ts >= weekAgo), Math.ceil(day.nq * 0.6), chosen);
    take(pool.filter((q) => q.topic && recentTopics.has(q.topic) && unseen(q)), day.nq, chosen);
    take(pool.filter(wrong), day.nq, chosen);
  } else if (day.kind === "revisao-modulo") {
    const inMods = pool.filter((q) => q.mod != null && day.mods.includes(q.mod));
    take(inMods.filter(wrong), Math.ceil(day.nq * 0.5), chosen);
    take(inMods.filter((q) => q.hot && unseen(q)), day.nq, chosen);
    take(inMods.filter(unseen), day.nq, chosen);
    take(inMods, day.nq, chosen);
  } else if (day.kind === "correcao") {
    const weak = weakModules(data, st).slice(0, 3);
    take(pool.filter((q) => wrong(q)), Math.ceil(day.nq * 0.5), chosen);
    take(pool.filter((q) => q.mod != null && weak.includes(q.mod) && unseen(q)), day.nq, chosen);
    take(pool.filter((q) => q.hot), day.nq, chosen);
  } else if (day.kind === "vespera") {
    take(pool.filter((q) => q.src === "t" && wrong(q)), 10, chosen);
    take(pool.filter((q) => q.src === "t"), day.nq, chosen);
  }
  return [...chosen];
}

function seeded(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

export function moduleStats(data: Data, st: State) {
  return data.meta.modules.map((m) => {
    let n = 0, ok = 0, seen = 0;
    const total = data.questions.filter((q) => q.mod === m.id).length;
    for (const q of data.questions) {
      if (q.mod !== m.id) continue;
      const a = st.attempts[q.id];
      if (!a) continue;
      seen++;
      n++;
      ok += a.last ? 1 : 0;
    }
    return { mod: m, total, seen, n, ok, pct: n ? (ok / n) * 100 : null };
  });
}

export function weakModules(data: Data, st: State) {
  return moduleStats(data, st)
    .map((s) => ({ id: s.mod.id, score: (s.pct ?? 50) - moduleWeight(s.mod) }))
    .sort((a, b) => a.score - b.score)
    .map((x) => x.id);
}

/** Estimativa ponderada pelo peso dos módulos na prova. */
export function readiness(data: Data, st: State) {
  const stats = moduleStats(data, st);
  let w = 0, acc = 0, covered = 0;
  for (const s of stats) {
    const mw = moduleWeight(s.mod);
    w += mw;
    if (s.pct != null && s.n >= 5) {
      acc += mw * s.pct;
      covered += mw;
    }
  }
  return { pct: covered ? acc / covered : null, coverage: (covered / w) * 100 };
}
