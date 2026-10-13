import { useState } from "react";
import { addDays } from "@/lib/plan";
import { Settings, todayISO, updateSettings } from "@/lib/store";

const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function SetupForm({ settings, onSaved }: { settings: Settings; onSaved?: () => void }) {
  const [examDate, setExamDate] = useState(settings.examDate ?? addDays(todayISO(), 60));
  const [startDate, setStartDate] = useState(settings.startDate);
  const [minutes, setMinutes] = useState(settings.minutes);
  const [restDays, setRestDays] = useState<number[]>(settings.restDays);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        updateSettings({ examDate, startDate, minutes, restDays });
        onSaved?.();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Data da prova</span>
          <input type="date" className="input" value={examDate} min={addDays(startDate, 7)} onChange={(e) => setExamDate(e.target.value)} required />
        </label>
        <label>
          <span className="label">Início dos estudos</span>
          <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </label>
      </div>
      <label className="block">
        <span className="label">Tempo de estudo por dia</span>
        <select className="input" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
          {[30, 45, 60, 90, 120].map((m) => (
            <option key={m} value={m}>{m >= 60 ? `${m / 60}h${m % 60 ? String(m % 60) : ""}` : `${m} min`} por dia (~{Math.max(10, Math.round(m / 4))} questões)</option>
          ))}
        </select>
      </label>
      <div>
        <span className="label">Dias de folga (sem estudo)</span>
        <div className="flex flex-wrap gap-1.5">
          {WEEK.map((w, i) => (
            <button
              type="button"
              key={w}
              onClick={() => setRestDays((r) => (r.includes(i) ? r.filter((x) => x !== i) : [...r, i]))}
              className={`rounded-lg px-3 py-1.5 text-sm border ${restDays.includes(i) ? "bg-slate-700 text-white border-slate-700" : "bg-white border-slate-300 text-slate-600"}`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      <button className="btn-primary w-full sm:w-auto">Salvar e gerar plano</button>
    </form>
  );
}
