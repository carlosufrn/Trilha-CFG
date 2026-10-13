import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { Data, Source, SOURCE_LABEL, shuffle } from "@/lib/data";
import { useStore } from "@/lib/store";
import Quiz from "@/components/Quiz";

type Status = "todas" | "novas" | "erradas" | "acertadas";

export default function Praticar({ data }: { data: Data }) {
  const st = useStore();
  const [mod, setMod] = useState<number | "">("");
  const [topic, setTopic] = useState("");
  const [sources, setSources] = useState<Source[]>(["b", "t"]);
  const [status, setStatus] = useState<Status>("novas");
  const [hotOnly, setHotOnly] = useState(false);
  const [qty, setQty] = useState(20);
  const [running, setRunning] = useState<string[] | null>(null);

  const pool = useMemo(
    () =>
      data.questions.filter((q) => {
        if (!sources.includes(q.src)) return false;
        if (mod !== "" && q.mod !== mod) return false;
        if (topic && q.topic !== topic) return false;
        if (hotOnly && !q.hot) return false;
        const a = st.attempts[q.id];
        if (status === "novas") return !a;
        if (status === "erradas") return a && !a.last;
        if (status === "acertadas") return a && a.last;
        return true;
      }),
    [data, mod, topic, sources, status, hotOnly, st.attempts],
  );

  if (running) {
    return <Quiz data={data} qids={running} title="Treino livre" onExit={() => setRunning(null)} />;
  }

  const topics = data.meta.topics.filter((t) => mod === "" || t.mod === mod);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Treino livre</h1>
        <p className="text-sm text-slate-600">Monte uma lista de questões com correção imediata.</p>
      </div>
      <div className="card p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">Módulo</span>
            <select className="input" value={mod} onChange={(e) => { setMod(e.target.value === "" ? "" : Number(e.target.value)); setTopic(""); }}>
              <option value="">Todos os módulos</option>
              {data.meta.modules.map((m) => <option key={m.id} value={m.id}>{data.moduleName(m.id)} ({m.min}–{m.max}%)</option>)}
            </select>
          </label>
          <label>
            <span className="label">Tópico</span>
            <select className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">Todos os tópicos</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.id} {t.name}</option>)}
            </select>
          </label>
        </div>
        <div>
          <span className="label">Fonte</span>
          <div className="flex flex-wrap gap-3 text-sm">
            {(Object.keys(SOURCE_LABEL) as Source[]).map((s) => (
              <label key={s} className="flex items-center gap-1.5">
                <input type="checkbox" checked={sources.includes(s)} onChange={() => setSources((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]))} />
                {SOURCE_LABEL[s]}
              </label>
            ))}
          </div>
          {sources.includes("s") && <p className="mt-1 text-xs text-amber-700">Dica: deixe os simulados para o final, assim eles medem seu nível de verdade.</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">Situação</span>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
              <option value="novas">Só as que nunca fiz</option>
              <option value="erradas">Só as que errei</option>
              <option value="acertadas">Só as que acertei</option>
              <option value="todas">Todas</option>
            </select>
          </label>
          <label>
            <span className="label">Quantidade</span>
            <select className="input" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
              {[10, 20, 30, 50, 100].map((n) => <option key={n} value={n}>{n} questões</option>)}
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={hotOnly} onChange={(e) => setHotOnly(e.target.checked)} /> Só as que mais caem na prova
        </label>
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="text-sm text-slate-600">{pool.length.toLocaleString("pt-BR")} questões disponíveis</span>
          <button className="btn-primary" disabled={!pool.length} onClick={() => setRunning(shuffle(pool).slice(0, qty).map((q) => q.id))}>
            <Play className="h-4 w-4" /> Começar
          </button>
        </div>
      </div>
    </div>
  );
}
