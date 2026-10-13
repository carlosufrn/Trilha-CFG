import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Data, shuffle } from "@/lib/data";
import { useStore } from "@/lib/store";
import Quiz from "@/components/Quiz";

export default function Erros({ data }: { data: Data }) {
  const st = useStore();
  const [running, setRunning] = useState<string[] | null>(null);
  if (running) return <Quiz data={data} qids={running} title="Revisão de erros" onExit={() => setRunning(null)} />;

  const wrong = data.questions.filter((q) => st.attempts[q.id] && !st.attempts[q.id].last);
  const byMod = data.meta.modules
    .map((m) => ({ m, qs: wrong.filter((q) => q.mod === m.id) }))
    .filter((x) => x.qs.length);
  const noMod = wrong.filter((q) => q.mod == null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Revisar erros</h1>
        <p className="text-sm text-slate-600">
          Questões cuja última tentativa foi errada. Ao acertar, ela sai da lista. Refazer os erros é a forma mais eficiente de subir a nota.
        </p>
      </div>
      {wrong.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">Nenhum erro pendente. 👏</div>
      ) : (
        <>
          <button className="btn-primary" onClick={() => setRunning(shuffle(wrong).slice(0, 30).map((q) => q.id))}>
            <RotateCcw className="h-4 w-4" /> Refazer {Math.min(30, wrong.length)} erros aleatórios (de {wrong.length})
          </button>
          <div className="card divide-y divide-slate-100">
            {[...byMod.map((x) => ({ label: data.moduleName(x.m.id), qs: x.qs })), ...(noMod.length ? [{ label: "Simulados (sem módulo)", qs: noMod }] : [])].map((x) => (
              <div key={x.label} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm">{x.label}</span>
                <button className="btn-secondary py-1" onClick={() => setRunning(shuffle(x.qs).slice(0, 30).map((q) => q.id))}>
                  {x.qs.length} erro{x.qs.length > 1 ? "s" : ""} · refazer
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
