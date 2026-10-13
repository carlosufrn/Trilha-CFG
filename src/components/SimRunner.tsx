import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, Clock, Flag } from "lucide-react";
import { Data, EXAM } from "@/lib/data";
import { recordAnswer, saveSim, SimResult } from "@/lib/store";
import QuestionView from "./QuestionView";
import SimReport from "./SimReport";

interface Props {
  data: Data;
  simId: string;
  title: string;
  qids: string[];
  onExit: () => void;
  onFinish?: () => void;
}

const DRAFT = "cfg-sim-em-andamento";

interface Draft {
  simId: string;
  title: string;
  qids: string[];
  answers: Record<string, number | null>;
  marked: string[];
  startedAt: number;
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraft(d: Draft | null) {
  try {
    if (d) localStorage.setItem(DRAFT, JSON.stringify(d));
    else localStorage.removeItem(DRAFT);
  } catch {
    /* armazenamento indisponível */
  }
}

/** Modo prova: cronômetro de 2h30, sem gabarito até entregar. */
export default function SimRunner({ data, simId, title, qids: initialQids, onExit, onFinish }: Props) {
  const resume = useMemo(() => {
    const d = loadDraft();
    return d && d.simId === simId ? d : null;
  }, [simId]);
  const [qids] = useState(resume?.qids ?? initialQids);
  const [answers, setAnswers] = useState<Record<string, number | null>>(resume?.answers ?? {});
  const [marked, setMarked] = useState<Set<string>>(new Set(resume?.marked ?? []));
  const [startedAt] = useState(resume?.startedAt ?? Date.now());
  const [i, setI] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [result, setResult] = useState<SimResult | null>(null);

  const limit = EXAM.minutes * 60 * 1000;
  const remaining = Math.max(0, limit - (now - startedAt));

  useEffect(() => {
    if (result) return;
    saveDraft({ simId, title, qids, answers, marked: [...marked], startedAt });
  }, [answers, marked, result]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!result && remaining === 0) finish();
  }, [remaining]);

  const finish = () => {
    let correct = 0;
    for (const id of qids) {
      const a = answers[id];
      const ok = a != null && a === data.byId.get(id)!.ans;
      if (ok) correct++;
      if (a != null) recordAnswer(id, ok);
    }
    const r: SimResult = {
      id: simId, title, date: Date.now(), qids, answers, correct, total: qids.length,
      seconds: Math.round((Math.min(Date.now(), startedAt + limit) - startedAt) / 1000),
    };
    saveSim(r);
    saveDraft(null);
    setResult(r);
    onFinish?.();
  };

  if (result) return <SimReport data={data} r={result} onExit={onExit} />;

  const q = data.byId.get(qids[i])!;
  const answered = qids.filter((id) => answers[id] != null).length;
  const hh = Math.floor(remaining / 3600000);
  const mm = Math.floor((remaining % 3600000) / 60000);
  const ss = Math.floor((remaining % 60000) / 1000);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button className="btn-ghost px-2" onClick={onExit} title="O simulado fica salvo e pode ser retomado">
          <ArrowLeft className="h-4 w-4" /> Pausar
        </button>
        <div className={`flex items-center gap-1.5 font-mono text-sm font-semibold ${remaining < 15 * 60000 ? "text-rose-600" : "text-slate-700"}`}>
          <Clock className="h-4 w-4" /> {hh}:{String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            const left = qids.length - answered;
            if (confirm(left ? `Ainda há ${left} questões sem resposta. Entregar mesmo assim?` : "Entregar o simulado?")) finish();
          }}
        >
          <Flag className="h-4 w-4" /> Entregar
        </button>
      </div>

      <div className="card p-3">
        <div className="flex flex-wrap gap-1">
          {qids.map((id, k) => (
            <button
              key={id}
              onClick={() => setI(k)}
              className={`relative h-7 w-7 rounded text-[11px] font-semibold ${k === i ? "ring-2 ring-indigo-500" : ""} ${answers[id] != null ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}
            >
              {k + 1}
              {marked.has(id) && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400" />}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">{answered}/{qids.length} respondidas · bolinha amarela = marcada para revisar</p>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-500">Questão {i + 1}</span>
          <button
            className={`btn-ghost px-2 py-1 text-xs ${marked.has(q.id) ? "text-amber-600" : ""}`}
            onClick={() => setMarked((m) => { const n = new Set(m); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; })}
          >
            <Bookmark className="h-4 w-4" /> {marked.has(q.id) ? "Marcada" : "Marcar para revisar"}
          </button>
        </div>
        <QuestionView hideMeta q={q} data={data} selected={answers[q.id] ?? null} onSelect={(k) => setAnswers((a) => ({ ...a, [q.id]: k }))} reveal={false} />
      </div>

      <div className="flex justify-between">
        <button className="btn-secondary" disabled={i === 0} onClick={() => setI(i - 1)}><ArrowLeft className="h-4 w-4" /> Anterior</button>
        <button className="btn-secondary" disabled={i === qids.length - 1} onClick={() => setI(i + 1)}>Próxima <ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
