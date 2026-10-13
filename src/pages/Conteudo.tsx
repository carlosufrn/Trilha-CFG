import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Flame } from "lucide-react";
import { Data } from "@/lib/data";
import { RESUMOS } from "@/data/resumos";

export default function Conteudo({ data }: { data: Data }) {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Conteúdo da CFG</h1>
        <p className="text-sm text-slate-600">
          Pontos-chave de cada tópico e o que a ANBIMA espera que você saiba (Orientações de Estudo oficiais). Prova: 60 questões, 2h30, mínimo de 70%.
        </p>
      </div>
      <nav className="flex flex-wrap gap-1.5">
        {data.meta.modules.map((m) => (
          <a key={m.id} href={`#m${m.id}`} className="chip bg-white border border-slate-200 text-slate-600 hover:border-indigo-300">
            M{m.id}
          </a>
        ))}
      </nav>
      {data.meta.modules.map((m) => {
        const topics = data.meta.topics.filter((t) => t.mod === m.id);
        const hot = data.questions.filter((q) => q.mod === m.id && q.src === "t").length;
        return (
          <section key={m.id} id={`m${m.id}`} className="card p-5 space-y-4 scroll-mt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">{data.moduleName(m.id)}</h2>
              <span className={`chip ${m.max >= 17 ? "bg-rose-50 text-rose-700" : m.max >= 12 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                {m.min}–{m.max}% da prova (~{Math.round((m.min / 100) * 60)}–{Math.round((m.max / 100) * 60)} questões)
              </span>
            </div>
            {hot > 0 && (
              <p className="flex items-center gap-1 text-xs text-orange-700">
                <Flame className="h-3 w-3" /> {hot} questões deste módulo estão entre as que mais caíram
              </p>
            )}
            {topics.map((t) => (
              <details key={t.id} className="rounded-lg border border-slate-200 p-3">
                <summary className="cursor-pointer text-sm font-semibold">
                  {t.id} {t.name} <span className="font-normal text-slate-400">· {t.n} questões</span>
                </summary>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                  {(RESUMOS[t.id] ?? []).map((b, k) => <li key={k}>{b}</li>)}
                </ul>
              </details>
            ))}
            <details className="rounded-lg bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">O que a ANBIMA exige (objetivos oficiais)</summary>
              <div className="mt-2 space-y-3">
                {(data.meta.syllabus[String(m.id)] ?? []).map((s, k) => (
                  <div key={k}>
                    <div className="text-sm font-semibold text-slate-700">{s.h}</div>
                    <ul className="mt-1 list-[lower-alpha] space-y-1 pl-5 text-sm text-slate-600">
                      {s.items.map((it, j) => <li key={j}>{it}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          </section>
        );
      })}
    </div>
  );
}
