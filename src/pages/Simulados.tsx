import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardList, Play, Shuffle } from "lucide-react";
import { Data, EXAM, moduleWeight, shuffle } from "@/lib/data";
import { setDayDone, SimResult, useStore } from "@/lib/store";
import SimRunner, { loadDraft } from "@/components/SimRunner";
import SimReport from "@/components/SimReport";

interface Running {
  simId: string;
  title: string;
  qids: string[];
  day?: string;
}

export default function Simulados({ data }: { data: Data }) {
  const st = useStore();
  const [params, setParams] = useSearchParams();
  const official = useMemo(() => {
    const m = new Map<number, string[]>();
    data.questions
      .filter((q) => q.src === "s")
      .sort((a, b) => a.sim! - b.sim! || a.num! - b.num!)
      .forEach((q) => m.set(q.sim!, [...(m.get(q.sim!) ?? []), q.id]));
    return m;
  }, [data]);

  const startOfficial = (n: number, day?: string): Running => ({ simId: `oficial-${n}`, title: `Simulado ${n}`, qids: official.get(n)!, day });

  const [running, setRunning] = useState<Running | null>(() => {
    const n = Number(params.get("iniciar"));
    if (n && official.has(n)) return startOfficial(n, params.get("dia") ?? undefined);
    return null;
  });
  const [viewing, setViewing] = useState<SimResult | null>(null);
  const draft = loadDraft();

  const exit = () => {
    setRunning(null);
    setParams({});
  };

  if (running) {
    return (
      <SimRunner
        data={data}
        simId={running.simId}
        title={running.title}
        qids={running.qids}
        onExit={exit}
        onFinish={() => running.day && setDayDone(running.day, true)}
      />
    );
  }
  if (viewing) return <SimReport data={data} r={viewing} onExit={() => setViewing(null)} />;

  const custom = (): Running => {
    // 60 questões distribuídas conforme o peso de cada módulo na prova, priorizando as inéditas
    const chosen: string[] = [];
    for (const m of data.meta.modules) {
      const n = Math.round((moduleWeight(m) / 100) * EXAM.questions);
      const pool = data.questions.filter((q) => q.mod === m.id && q.src !== "s");
      const fresh = shuffle(pool.filter((q) => !st.attempts[q.id]));
      const seen = shuffle(pool.filter((q) => st.attempts[q.id]));
      chosen.push(...[...fresh, ...seen].slice(0, n).map((q) => q.id));
    }
    return { simId: `pers-${Date.now()}`, title: "Simulado personalizado", qids: shuffle(chosen) };
  };

  const best = (id: string) => {
    const rs = st.sims.filter((s) => s.id === id);
    return rs.length ? Math.max(...rs.map((r) => Math.round((r.correct / r.total) * 100))) : null;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Simulados</h1>
        <p className="text-sm text-slate-600">
          Formato da prova: {EXAM.questions} questões, {EXAM.minutes / 60}h30, aprovação com {EXAM.passPct}%. O gabarito só aparece ao entregar.
        </p>
      </div>

      {draft && (
        <div className="card p-4 flex items-center justify-between gap-3 border-indigo-300">
          <div className="text-sm">
            <div className="font-semibold">{draft.title} em andamento</div>
            <div className="text-slate-500">{Object.values(draft.answers).filter((a) => a != null).length}/{draft.qids.length} respondidas</div>
          </div>
          <button className="btn-primary" onClick={() => setRunning({ simId: draft.simId, title: draft.title, qids: draft.qids })}>Continuar</button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {[...official.keys()].map((n) => {
          const b = best(`oficial-${n}`);
          return (
            <div key={n} className="card p-4 flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-indigo-500" />
              <div className="flex-1">
                <div className="font-semibold">Simulado {n}</div>
                <div className="text-xs text-slate-500">
                  {b == null ? "Não realizado" : <>Melhor nota: <span className={b >= 70 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>{b}%</span></>}
                </div>
              </div>
              <button className="btn-secondary" onClick={() => setRunning(startOfficial(n))}><Play className="h-4 w-4" /></button>
            </div>
          );
        })}
        <div className="card p-4 flex items-center gap-3 sm:col-span-2 bg-indigo-50/40">
          <Shuffle className="h-8 w-8 text-indigo-500" />
          <div className="flex-1">
            <div className="font-semibold">Simulado personalizado</div>
            <div className="text-xs text-slate-500">60 questões inéditas sorteadas do banco, na proporção oficial de cada módulo</div>
          </div>
          <button className="btn-primary" onClick={() => setRunning(custom())}><Play className="h-4 w-4" /> Gerar</button>
        </div>
      </div>

      {st.sims.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">Histórico</h2>
          <div className="card divide-y divide-slate-100">
            {[...st.sims].reverse().map((r) => {
              const p = Math.round((r.correct / r.total) * 100);
              return (
                <button key={r.date} onClick={() => setViewing(r)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50">
                  <span className="flex-1 text-sm">{r.title}</span>
                  <span className="text-xs text-slate-500">{new Date(r.date).toLocaleDateString("pt-BR")}</span>
                  <span className={`w-12 text-right font-semibold ${p >= 70 ? "text-emerald-600" : "text-rose-600"}`}>{p}%</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
