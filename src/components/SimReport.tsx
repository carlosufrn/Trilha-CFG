import { useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Data, EXAM } from "@/lib/data";
import { SimResult } from "@/lib/store";
import QuestionView from "./QuestionView";

export default function SimReport({ data, r, onExit }: { data: Data; r: SimResult; onExit: () => void }) {
  const [filter, setFilter] = useState<"erradas" | "todas">("erradas");
  const pct = Math.round((r.correct / r.total) * 100);
  const passed = pct >= EXAM.passPct;
  const byMod = new Map<number | null, { ok: number; n: number }>();
  for (const id of r.qids) {
    const q = data.byId.get(id)!;
    const e = byMod.get(q.mod) ?? { ok: 0, n: 0 };
    e.n++;
    if (r.answers[id] === q.ans) e.ok++;
    byMod.set(q.mod, e);
  }
  const shown = r.qids.filter((id) => filter === "todas" || r.answers[id] !== data.byId.get(id)!.ans);

  return (
    <div className="space-y-5">
      <button className="btn-ghost px-2" onClick={onExit}><ArrowLeft className="h-4 w-4" /> Voltar</button>
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold">{r.title}</h2>
        <div className="flex flex-wrap items-center gap-4">
          <span className={`text-5xl font-bold ${passed ? "text-emerald-600" : "text-rose-600"}`}>{pct}%</span>
          <div className="text-sm text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              {passed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-rose-600" />}
              {passed ? "Aprovado" : "Abaixo da nota de corte"} (mínimo {EXAM.passPct}% = {Math.ceil((r.total * EXAM.passPct) / 100)} acertos)
            </div>
            <div>{r.correct} de {r.total} acertos · tempo: {Math.floor(r.seconds / 3600)}h{String(Math.floor((r.seconds % 3600) / 60)).padStart(2, "0")}</div>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500"><th className="py-1">Módulo</th><th className="text-right">Acertos</th><th className="w-1/3"></th></tr>
          </thead>
          <tbody>
            {[...byMod.entries()].sort((a, b) => (a[0] ?? 99) - (b[0] ?? 99)).map(([m, e]) => {
              const p = (e.ok / e.n) * 100;
              return (
                <tr key={String(m)} className="border-t border-slate-100">
                  <td className="py-1.5 pr-2">{data.moduleName(m)}</td>
                  <td className="text-right whitespace-nowrap">{e.ok}/{e.n}</td>
                  <td className="pl-3">
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full ${p >= 70 ? "bg-emerald-500" : "bg-rose-400"}`} style={{ width: `${p}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <h3 className="font-semibold mr-auto">Correção</h3>
        {(["erradas", "todas"] as const).map((f) => (
          <button key={f} className={f === filter ? "btn-primary py-1" : "btn-secondary py-1"} onClick={() => setFilter(f)}>
            {f === "erradas" ? "Só erradas/em branco" : "Todas"}
          </button>
        ))}
      </div>
      {shown.map((id) => (
        <div key={id} className="card p-5">
          <div className="mb-2 text-sm font-semibold text-slate-500">
            Questão {r.qids.indexOf(id) + 1} {r.answers[id] == null && <span className="text-amber-600">(em branco)</span>}
          </div>
          <QuestionView q={data.byId.get(id)!} data={data} selected={r.answers[id] ?? null} reveal />
        </div>
      ))}
    </div>
  );
}
