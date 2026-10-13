import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, CheckCircle2, Circle, ClipboardList, Dumbbell } from "lucide-react";
import { Data } from "@/lib/data";
import { Plan, PlanDay, fmtDate, pickDayQuestions } from "@/lib/plan";
import { setDayDone, setDayQs, useStore } from "@/lib/store";
import { RESUMOS } from "@/data/resumos";
import Quiz from "./Quiz";

const KIND_LABEL: Record<PlanDay["kind"], { label: string; cls: string }> = {
  estudo: { label: "Estudo", cls: "bg-indigo-50 text-indigo-700" },
  "revisao-semanal": { label: "Revisão semanal", cls: "bg-amber-50 text-amber-700" },
  "revisao-modulo": { label: "Revisão", cls: "bg-amber-50 text-amber-700" },
  simulado: { label: "Simulado", cls: "bg-rose-50 text-rose-700" },
  correcao: { label: "Correção", cls: "bg-violet-50 text-violet-700" },
  vespera: { label: "Véspera", cls: "bg-emerald-50 text-emerald-700" },
};

export function KindChip({ kind }: { kind: PlanDay["kind"] }) {
  const k = KIND_LABEL[kind];
  return <span className={`chip ${k.cls}`}>{k.label}</span>;
}

export default function DayPanel({ day, plan, data }: { day: PlanDay; plan: Plan; data: Data }) {
  const st = useStore();
  const nav = useNavigate();
  const [quiz, setQuiz] = useState<string[] | null>(null);
  const done = !!st.daysDone[day.date];
  const saved = st.dayQs[day.date];
  const answered = saved ? saved.filter((id) => st.attempts[id]).length : 0;

  const startQuiz = () => {
    let qids = saved;
    if (!qids || qids.length === 0) {
      qids = pickDayQuestions(day, data, st, plan);
      setDayQs(day.date, qids);
    }
    setQuiz(qids);
  };

  if (quiz) {
    return (
      <Quiz
        data={data}
        qids={quiz}
        title={`Questões do dia ${fmtDate(day.date)}`}
        onExit={() => setQuiz(null)}
        onComplete={() => setDayDone(day.date, true)}
      />
    );
  }

  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <KindChip kind={day.kind} /> Dia {day.idx + 1} de {plan.days.length} · {fmtDate(day.date, { weekday: "long", day: "2-digit", month: "long" })}
          </div>
          <h2 className="text-lg font-semibold leading-snug">{day.title}</h2>
        </div>
        <button
          onClick={() => setDayDone(day.date, !done)}
          className={`shrink-0 btn px-2 py-1 text-xs ${done ? "text-emerald-700 bg-emerald-50" : "text-slate-500 hover:bg-slate-100"}`}
          title="Marcar dia como concluído"
        >
          {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />} {done ? "Concluído" : "Marcar feito"}
        </button>
      </div>

      {day.kind === "estudo" && (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <BookOpen className="h-4 w-4" /> 1. Teoria (≈ metade do tempo)
          </h3>
          {day.topics.map((t) => (
            <details key={t.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3" open={day.topics.length === 1}>
              <summary className="cursor-pointer text-sm font-semibold">{data.topicName(t.id)}</summary>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                {(RESUMOS[t.id] ?? []).map((b, k) => <li key={k}>{b}</li>)}
              </ul>
            </details>
          ))}
          <Link to={`/conteudo#m${day.mods[0]}`} className="inline-block text-sm text-indigo-600 hover:underline">
            Ver o que a ANBIMA exige neste módulo →
          </Link>
        </section>
      )}

      {day.kind === "simulado" ? (
        <section className="space-y-3">
          <p className="text-sm text-slate-600">
            Reserve 2h30 sem interrupções, como na prova real. Sem consulta; use apenas a calculadora (HP 12C). A nota de corte é 70% (42 acertos).
          </p>
          <button className="btn-primary" onClick={() => nav(`/simulados?iniciar=${day.sim}&dia=${day.date}`)}>
            <ClipboardList className="h-4 w-4" /> Iniciar Simulado {day.sim}
          </button>
        </section>
      ) : (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Dumbbell className="h-4 w-4" /> {day.kind === "estudo" ? "2. " : ""}Questões do dia
          </h3>
          <p className="text-sm text-slate-600">
            {day.kind === "estudo" && `${day.nq} questões do(s) tópico(s) do dia, priorizando as que mais caem na prova.`}
            {day.kind === "revisao-semanal" && "Refaça o que errou nos últimos dias e reforce os tópicos da semana."}
            {day.kind === "revisao-modulo" && "Seus erros neste módulo + questões mais cobradas que você ainda não fez."}
            {day.kind === "correcao" && "Releia a correção do último simulado e treine os módulos em que foi pior."}
            {day.kind === "vespera" && "Dia leve: só as questões que mais caem. Durma bem e revise as fórmulas."}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-primary" onClick={startQuiz}>
              {saved && answered > 0 ? `Continuar (${answered}/${saved.length})` : "Começar questões"}
            </button>
            {day.kind === "correcao" && st.sims.length > 0 && (
              <Link to="/simulados" className="btn-secondary">Ver correção do simulado</Link>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
