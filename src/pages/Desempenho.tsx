import { Data, moduleWeight } from "@/lib/data";
import { moduleStats, readiness } from "@/lib/plan";
import { todayISO, useStore } from "@/lib/store";

export default function Desempenho({ data }: { data: Data }) {
  const st = useStore();
  const stats = moduleStats(data, st);
  const r = readiness(data, st);
  const attempts = Object.values(st.attempts);
  const total = attempts.length;
  const ok = attempts.filter((a) => a.last).length;
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const k = todayISO(d);
    return { k, ...(st.log[k] ?? { n: 0, ok: 0 }) };
  });
  const maxN = Math.max(10, ...last30.map((d) => d.n));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Desempenho</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { v: total.toLocaleString("pt-BR"), l: "questões feitas" },
          { v: total ? `${Math.round((ok / total) * 100)}%` : "—", l: "acerto (última tentativa)" },
          { v: r.pct == null ? "—" : `${Math.round(r.pct)}%`, l: "acerto ponderado pela prova" },
          { v: `${Math.round(r.coverage)}%`, l: "da prova com dados suficientes" },
        ].map((x) => (
          <div key={x.l} className="card p-3">
            <div className="text-xl font-bold text-slate-800">{x.v}</div>
            <div className="text-xs text-slate-500">{x.l}</div>
          </div>
        ))}
      </div>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">Por módulo</h2>
        <p className="text-xs text-slate-500">A linha marca 70% (nota de corte). Foque nos módulos de maior peso que estão abaixo dela.</p>
        <div className="space-y-3">
          {stats.map((s) => (
            <div key={s.mod.id}>
              <div className="flex justify-between gap-2 text-sm">
                <span className="truncate">
                  {data.moduleName(s.mod.id)} <span className="text-xs text-slate-400">· peso {s.mod.min}–{s.mod.max}%</span>
                </span>
                <span className="whitespace-nowrap font-medium">
                  {s.pct == null ? <span className="text-slate-400">—</span> : <span className={s.pct >= 70 ? "text-emerald-600" : "text-rose-600"}>{Math.round(s.pct)}%</span>}
                  <span className="ml-2 text-xs font-normal text-slate-400">{s.seen}/{s.total}</span>
                </span>
              </div>
              <div className="relative mt-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full ${s.pct == null ? "" : s.pct >= 70 ? "bg-emerald-500" : "bg-rose-400"}`}
                  style={{ width: `${s.pct ?? 0}%`, opacity: Math.min(1, 0.35 + s.n / 40) }}
                />
                <div className="absolute top-0 bottom-0 w-0.5 bg-slate-500" style={{ left: "70%" }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">Últimos 30 dias</h2>
        <div className="flex h-28 items-end gap-[3px]">
          {last30.map((d) => (
            <div key={d.k} className="flex-1 flex flex-col justify-end h-full" title={`${d.k}: ${d.n} questões, ${d.ok} acertos`}>
              <div className="bg-indigo-200 rounded-t-sm" style={{ height: `${((d.n - d.ok) / maxN) * 100}%` }} />
              <div className="bg-indigo-600" style={{ height: `${(d.ok / maxN) * 100}%` }} />
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">Escuro = acertos · claro = erros</p>
      </section>

      {st.sims.length > 0 && (
        <section className="card p-5 space-y-2">
          <h2 className="font-semibold">Evolução nos simulados</h2>
          <div className="flex h-32 items-end gap-2">
            {st.sims.map((s) => {
              const p = (s.correct / s.total) * 100;
              return (
                <div key={s.date} className="flex-1 flex flex-col items-center justify-end gap-1 h-full" title={s.title}>
                  <span className="text-[10px] text-slate-500">{Math.round(p)}%</span>
                  <div className={`w-full max-w-10 rounded-t ${p >= 70 ? "bg-emerald-500" : "bg-rose-400"}`} style={{ height: `${p}%` }} />
                </div>
              );
            })}
          </div>
        </section>
      )}
      <p className="text-xs text-slate-400">Pesos usados: {data.meta.modules.map((m) => `M${m.id} ${moduleWeight(m)}%`).join(" · ")}</p>
    </div>
  );
}
