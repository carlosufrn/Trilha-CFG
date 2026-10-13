import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BookOpen, Flame, RotateCcw, Target } from "lucide-react";
import { Data } from "@/lib/data";
import { buildPlan, daysBetween, fmtDate, readiness } from "@/lib/plan";
import { todayISO, useStore } from "@/lib/store";
import DayPanel from "@/components/DayPanel";
import SetupForm from "@/components/SetupForm";

export default function Hoje({ data }: { data: Data }) {
  const st = useStore();
  const plan = useMemo(() => buildPlan(data, st.settings), [data, st.settings]);
  const today = todayISO();

  if (!st.settings.examDate) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Bem-vindo à sua preparação para a CFG</h1>
          <p className="mt-1 text-slate-600">
            São {data.questions.length.toLocaleString("pt-BR")} questões com gabarito. Informe a data da prova e quanto tempo você tem por dia — o app monta um plano diário de teoria + questões, com revisões e simulados no final.
          </p>
        </div>
        <div className="card p-5"><SetupForm settings={st.settings} /></div>
      </div>
    );
  }

  const todayDay = plan.days.find((d) => d.date === today);
  const nextDay = plan.days.find((d) => d.date > today);
  const late = plan.days.filter((d) => d.date < today && !st.daysDone[d.date]);
  const left = daysBetween(today, plan.examDate);
  const r = readiness(data, st);
  const wrongCount = Object.values(st.attempts).filter((a) => !a.last).length;
  const streak = (() => {
    let n = 0;
    for (let d = new Date(); ; d.setDate(d.getDate() - 1)) {
      const k = todayISO(d);
      if (st.log[k]?.n) n++;
      else if (k !== today) break;
      if (n > 999) break;
    }
    return n;
  })();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-indigo-700">{left > 0 ? left : 0}</div>
          <div className="text-xs text-slate-500">dias para a prova<br />({fmtDate(plan.examDate)})</div>
        </div>
        <div className="card p-3 text-center">
          <div className={`text-2xl font-bold ${r.pct == null ? "text-slate-400" : r.pct >= 70 ? "text-emerald-600" : "text-rose-600"}`}>
            {r.pct == null ? "—" : `${Math.round(r.pct)}%`}
          </div>
          <div className="text-xs text-slate-500">acerto ponderado<br />(meta: 70%)</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-2xl font-bold text-orange-500 flex items-center justify-center gap-1"><Flame className="h-5 w-5" />{streak}</div>
          <div className="text-xs text-slate-500">dias seguidos<br />praticando</div>
        </div>
      </div>

      {late.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Você tem {late.length} dia(s) do plano não concluído(s).{" "}
          <Link to="/plano" className="font-semibold underline">Ver no plano</Link>
        </div>
      )}

      {todayDay ? (
        <DayPanel day={todayDay} plan={plan} data={data} />
      ) : left <= 0 ? (
        <div className="card p-6 text-center">
          <Target className="mx-auto h-8 w-8 text-indigo-600" />
          <p className="mt-2 font-semibold">Dia de prova (ou já passou). Boa sorte!</p>
          <p className="text-sm text-slate-500">Atualize a data em Ajustes se for refazer.</p>
        </div>
      ) : (
        <div className="card p-5 space-y-2">
          <p className="font-semibold">Hoje é dia de descanso no seu plano. 😌</p>
          {nextDay && <p className="text-sm text-slate-600">Próximo: {fmtDate(nextDay.date, { weekday: "long", day: "2-digit", month: "2-digit" })} — {nextDay.title}</p>}
          <p className="text-sm text-slate-500">Quer adiantar? Use o treino livre ou revise seus erros.</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/praticar" className="card p-4 hover:border-indigo-300">
          <Target className="h-5 w-5 text-indigo-600" />
          <div className="mt-1 font-semibold text-sm">Treino livre</div>
          <div className="text-xs text-slate-500">Escolha módulo, tópico e quantidade</div>
        </Link>
        <Link to="/erros" className="card p-4 hover:border-indigo-300">
          <RotateCcw className="h-5 w-5 text-rose-500" />
          <div className="mt-1 font-semibold text-sm">Revisar erros</div>
          <div className="text-xs text-slate-500">{wrongCount} questões para refazer</div>
        </Link>
        <Link to="/conteudo" className="card p-4 hover:border-indigo-300">
          <BookOpen className="h-5 w-5 text-emerald-600" />
          <div className="mt-1 font-semibold text-sm">Conteúdo</div>
          <div className="text-xs text-slate-500">Resumos e o programa oficial</div>
        </Link>
      </div>
    </div>
  );
}
