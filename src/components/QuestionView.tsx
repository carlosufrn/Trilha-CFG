import { Flame, Info } from "lucide-react";
import { Data, Question, SOURCE_LABEL } from "@/lib/data";

const LETTERS = "ABCDE";

interface Props {
  q: Question;
  data: Data;
  selected: number | null;
  onSelect?: (i: number) => void;
  reveal: boolean; // mostrar gabarito
  hideMeta?: boolean; // modo prova: sem módulo/etiquetas
}

export default function QuestionView({ q, data, selected, onSelect, reveal, hideMeta }: Props) {
  return (
    <div className="space-y-4">
      {!hideMeta && (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {q.mod != null && <span className="chip bg-indigo-50 text-indigo-700">{data.moduleName(q.mod)}</span>}
        {q.topic && <span className="chip bg-slate-100 text-slate-600">{data.topicName(q.topic)}</span>}
        {q.hot && (
          <span className="chip bg-orange-50 text-orange-700">
            <Flame className="h-3 w-3 mr-1" /> Mais cai na prova
          </span>
        )}
        <span className="text-slate-400">
          {q.src === "s" ? `Simulado ${q.sim} · Q${q.num}` : SOURCE_LABEL[q.src]} · cód. {q.code}
        </span>
      </div>
      )}

      <p className="whitespace-pre-line leading-relaxed text-[15px] text-slate-900">{q.stem}</p>
      {q.img?.map((src) => (
        <img key={src} src={`/img/${src}`} alt="Tabela ou gráfico da questão" className="max-w-full rounded border border-slate-200" />
      ))}

      <div className="space-y-2">
        {q.opts.map((opt, i) => {
          const isSel = selected === i;
          const isAns = q.ans === i;
          let cls = "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40";
          if (reveal && isAns) cls = "border-emerald-500 bg-emerald-50";
          else if (reveal && isSel && !isAns) cls = "border-rose-500 bg-rose-50";
          else if (isSel) cls = "border-indigo-500 bg-indigo-50";
          return (
            <button
              key={i}
              disabled={!onSelect}
              onClick={() => onSelect?.(i)}
              className={`w-full text-left flex gap-3 rounded-lg border-2 px-3 py-2.5 transition ${cls} disabled:cursor-default`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  reveal && isAns ? "bg-emerald-500 text-white" : reveal && isSel ? "bg-rose-500 text-white" : isSel ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {LETTERS[i]}
              </span>
              <span className="whitespace-pre-line text-sm leading-relaxed">{opt}</span>
            </button>
          );
        })}
      </div>

      {reveal && q.note && (
        <div className="flex gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <Info className="h-4 w-4 shrink-0 mt-0.5" /> {q.note}
        </div>
      )}
    </div>
  );
}

export { LETTERS };
