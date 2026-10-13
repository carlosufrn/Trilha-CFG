import { useEffect, useState } from "react";

export type Source = "b" | "t" | "s"; // banco de exercícios | mais caíram | simulados

export interface Question {
  id: string;
  src: Source;
  code: string;
  stem: string;
  opts: string[];
  ans: number;
  mod: number | null;
  topic: string | null;
  hot: boolean;
  img?: string[];
  note?: string;
  sim?: number;
  num?: number;
}

export interface Module {
  id: number;
  name: string;
  min: number;
  max: number;
}

export interface Topic {
  id: string;
  name: string;
  mod: number;
  n: number;
}

export interface SyllabusSection {
  h: string;
  items: string[];
}

export interface Meta {
  modules: Module[];
  topics: Topic[];
  syllabus: Record<string, SyllabusSection[]>;
}

export const SOURCE_LABEL: Record<Source, string> = {
  b: "Banco de exercícios",
  t: "Mais caíram na prova",
  s: "Simulados",
};

export const EXAM = { questions: 60, minutes: 150, passPct: 70 };

export interface Data {
  questions: Question[];
  byId: Map<string, Question>;
  meta: Meta;
  moduleName: (id: number | null) => string;
  topicName: (id: string | null) => string;
}

let cache: Promise<Data> | null = null;

function load(): Promise<Data> {
  if (!cache) {
    cache = Promise.all([
      fetch("/data/questions.json").then((r) => r.json()),
      fetch("/data/meta.json").then((r) => r.json()),
    ]).then(([questions, meta]: [Question[], Meta]) => {
      const byId = new Map(questions.map((q) => [q.id, q]));
      const mods = new Map(meta.modules.map((m) => [m.id, m.name]));
      const tops = new Map(meta.topics.map((t) => [t.id, t.name]));
      return {
        questions,
        byId,
        meta,
        moduleName: (id) => (id == null ? "Sem módulo" : `M${String(id).padStart(2, "0")} · ${mods.get(id) ?? ""}`),
        topicName: (id) => (id == null ? "" : `${id} ${tops.get(id) ?? ""}`),
      };
    });
  }
  return cache;
}

export function useData(): Data | null {
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => {
    load().then(setData);
  }, []);
  return data;
}

/** Peso médio do módulo na prova (ex.: 13–17% → 15). */
export function moduleWeight(m: Module) {
  return (m.min + m.max) / 2;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
