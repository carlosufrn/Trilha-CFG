import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, X } from "lucide-react";
import { Data } from "@/lib/data";
import { recordAnswer } from "@/lib/store";
import QuestionView, { LETTERS } from "./QuestionView";

interface Props {
  data: Data;
  qids: string[];
  title: string;
  onExit: () => void;
  onComplete?: (correct: number, total: number) => void;
}

/** Modo treino: responde, confere o gabarito na hora e segue. */
export default function Quiz({ data, qids: initial, title, onExit, onComplete }: Props) {
  const [qids, setQids] = useState(initial);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    top.current?.scrollIntoView({ block: "start" });
  }, [i, done]);

  const q = data.byId.get(qids[i]);
  const confirmed = q ? answers[q.id] !== undefined : false;
  const correctCount = qids.filter((id) => answers[id] === data.byId.get(id)?.ans).length;
  const answeredCount = Object.keys(answers).length;

  const confirm = () => {
    if (!q || selected == null || confirmed) return;
    setAnswers((a) => ({ ...a, [q.id]: selected }));
    recordAnswer(q.id, selected === q.ans);
  };
  const next = () => {
    if (i + 1 < qids.length) {
      setI(i + 1);
      setSelected(answers[qids[i + 1]] ?? null);
    } else {
      setDone(true);
      onComplete?.(correctCount, qids.length);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || !q) return;
      const k = e.key.toUpperCase();
      const idx = LETTERS.indexOf(k);
      if (!confirmed && idx >= 0 && idx < q.opts.length) setSelected(idx);
      else if (!confirmed && k >= "1" && k <= "5" && Number(k) <= q.opts.length) setSelected(Number(k) - 1);
      else if (e.key === "Enter") confirmed ? next() : confirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (qids.length === 0) {
    return (
      <div className="card p-8 text-center space-y-4">
        <p className="text-slate-600">Nenhuma questão encontrada com esses critérios.</p>
        <button className="btn-secondary" onClick={onExit}>Voltar</button>
      </div>
    );
  }

  if (done) {
    const wrong = qids.filter((id) => answers[id] !== undefined && answers[id] !== data.byId.get(id)!.ans);
    const pct = Math.round((correctCount / Math.max(1, answeredCount)) * 100);
    return (
      <div ref={top} className="card p-6 space-y-5 scroll-mt-4">
        <h2 className="text-lg font-semibold">{title} — resultado</h2>
        <div className="flex items-end gap-3">
          <span className={`text-4xl font-bold ${pct >= 70 ? "text-emerald-600" : "text-rose-600"}`}>{pct}%</span>
          <span className="text-slate-500 pb-1">{correctCount} de {answeredCount} acertos · meta da prova: 70%</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {qids.map((id, k) => {
            const a = answers[id];
            const ok = a === data.byId.get(id)!.ans;
            return (
              <button
                key={id}
                onClick={() => { setDone(false); setI(k); setSelected(a ?? null); }}
                className={`h-8 w-8 rounded text-xs font-semibold ${a === undefined ? "bg-slate-100 text-slate-400" : ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
              >
                {k + 1}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {wrong.length > 0 && (
            <button
              className="btn-primary"
              onClick={() => { setQids(wrong); setAnswers({}); setI(0); setSelected(null); setDone(false); }}
            >
              <RotateCcw className="h-4 w-4" /> Refazer as {wrong.length} erradas
            </button>
          )}
          <button className="btn-secondary" onClick={onExit}>Concluir</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={top} className="space-y-4 scroll-mt-4">
      <div className="flex items-center justify-between gap-3">
        <button className="btn-ghost px-2" onClick={onExit}><ArrowLeft className="h-4 w-4" /> Sair</button>
        <div className="text-sm text-slate-500 truncate">{title}</div>
        <div className="text-sm font-medium whitespace-nowrap">
          {i + 1}/{qids.length} · <span className="text-emerald-600">{correctCount} ✓</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-indigo-500 transition-all" style={{ width: `${((i + (confirmed ? 1 : 0)) / qids.length) * 100}%` }} />
      </div>
      <div className="card p-5">
        {q && <QuestionView q={q} data={data} selected={selected} onSelect={confirmed ? undefined : setSelected} reveal={confirmed} />}
        {confirmed && q && (
          <div className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-sm font-medium ${answers[q.id] === q.ans ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {answers[q.id] === q.ans ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {answers[q.id] === q.ans ? "Correto!" : `Resposta correta: ${LETTERS[q.ans]}`}
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <button className="btn-secondary" disabled={i === 0} onClick={() => { setI(i - 1); setSelected(answers[qids[i - 1]] ?? null); }}>
          <ArrowLeft className="h-4 w-4" /> Anterior
        </button>
        {!confirmed ? (
          <button className="btn-primary" disabled={selected == null} onClick={confirm}>Confirmar resposta</button>
        ) : (
          <button className="btn-primary" onClick={next}>
            {i + 1 < qids.length ? "Próxima" : "Ver resultado"} <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="hidden md:block text-center text-xs text-slate-400">Atalhos: A–D para escolher · Enter para confirmar/avançar</p>
    </div>
  );
}
