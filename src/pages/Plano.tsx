import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Circle, Pencil } from "lucide-react";
import { Data } from "@/lib/data";
import { buildPlan, fmtDate } from "@/lib/plan";
import { todayISO, useStore } from "@/lib/store";
import DayPanel, { KindChip } from "@/components/DayPanel";
import SetupForm from "@/components/SetupForm";

export default function Plano({ data }: { data: Data }) {
  const st = useStore();
  const plan = useMemo(() => buildPlan(data, st.settings), [data, st.settings]);
  const [editing, setEditing] = useState(!st.settings.examDate);
  const [open, setOpen] = useState<string | null>(null);
  const today = todayISO();
  const doneCount = plan.days.filter((d) => st.daysDone[d.date]).length;

  const openDay = plan.days.find((d) => d.date === open);
  if (openDay) {
    return (
      <div className="space-y-4">
        <button className="btn-ghost px-2" onClick={() => setOpen(null)}><ArrowLeft className="h-4 w-4" /> Voltar ao plano</button>
        <DayPanel day={openDay} plan={plan} data={data} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Plano de estudos</h1>
          <p className="text-sm text-slate-600">
            {plan.days.length} dias de estudo até {fmtDate(plan.examDate, { day: "2-digit", month: "long", year: "numeric" })} · {st.settings.minutes} min/dia · {doneCount} concluídos
          </p>
        </div>
        <button className="btn-secondary shrink-0" onClick={() => setEditing(!editing)}><Pencil className="h-4 w-4" /> Ajustar</button>
      </div>

      {editing && (
        <div className="card p-5">
          <SetupForm settings={st.settings} onSaved={() => setEditing(false)} />
          <p className="mt-3 text-xs text-slate-500">Seu histórico de questões é mantido ao mudar o plano.</p>
        </div>
      )}

      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-emerald-500" style={{ width: `${(doneCount / Math.max(1, plan.days.length)) * 100}%` }} />
      </div>

      {plan.phases.map((ph) => (
        <section key={ph.name} className="space-y-2">
          <div>
            <h2 className="font-semibold">{ph.name} <span className="font-normal text-sm text-slate-500">· {fmtDate(ph.from)} a {fmtDate(ph.to)}</span></h2>
            <p className="text-sm text-slate-500">{ph.desc}</p>
          </div>
          <div className="card divide-y divide-slate-100">
            {plan.days.filter((d) => d.date >= ph.from && d.date <= ph.to).map((d) => {
              const done = st.daysDone[d.date];
              const isToday = d.date === today;
              const late = d.date < today && !done;
              return (
                <button
                  key={d.date}
                  onClick={() => setOpen(d.date)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 ${isToday ? "bg-indigo-50/60" : ""}`}
                >
                  {done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" /> : <Circle className={`h-5 w-5 shrink-0 ${late ? "text-amber-400" : "text-slate-300"}`} />}
                  <span className={`w-20 shrink-0 text-xs ${isToday ? "font-bold text-indigo-700" : "text-slate-500"}`}>
                    {isToday ? "HOJE" : fmtDate(d.date, { weekday: "short", day: "2-digit", month: "2-digit" })}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-sm">{d.title}</span>
                  <span className="hidden sm:inline"><KindChip kind={d.kind} /></span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      {plan.days.length > 0 && (
        <p className="text-center text-sm text-slate-500">🎯 {fmtDate(plan.examDate, { weekday: "long", day: "2-digit", month: "long" })}: dia da prova</p>
      )}
    </div>
  );
}
