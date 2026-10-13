import { useRef } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { Data } from "@/lib/data";
import { exportBackup, importBackup, resetAll, useStore } from "@/lib/store";
import SetupForm from "@/components/SetupForm";

export default function Config({ data }: { data: Data }) {
  const st = useStore();
  const file = useRef<HTMLInputElement>(null);

  const download = () => {
    const blob = new Blob([exportBackup()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cfg-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Ajustes</h1>
      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">Plano de estudos</h2>
        <SetupForm settings={st.settings} />
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">Backup do progresso</h2>
        <p className="text-sm text-slate-600">
          Seu progresso fica salvo neste navegador. Para levar para outro computador ou celular (ou por segurança), baixe um backup e importe no outro aparelho.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={download}>
            <Download className="h-4 w-4" /> Baixar backup
          </button>
          <button className="btn-secondary" onClick={() => file.current?.click()}>
            <Upload className="h-4 w-4" /> Importar backup
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                importBackup(await f.text());
                alert("Backup importado com sucesso!");
              } catch (err) {
                alert((err as Error).message);
              }
              e.target.value = "";
            }}
          />
        </div>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold text-rose-700">Zerar tudo</h2>
        <p className="text-sm text-slate-600">Apaga histórico de questões, simulados e plano deste navegador.</p>
        <button
          className="btn bg-rose-600 text-white hover:bg-rose-700"
          onClick={() => confirm("Tem certeza? Isso apaga todo o seu progresso neste navegador.") && resetAll()}
        >
          <Trash2 className="h-4 w-4" /> Zerar progresso
        </button>
      </section>

      <p className="text-xs text-slate-400">
        Banco: {data.questions.filter((q) => q.src === "b").length} questões de exercícios · {data.questions.filter((q) => q.src === "t").length} que mais caíram ·{" "}
        {data.questions.filter((q) => q.src === "s").length} de simulados. Material de uso pessoal.
      </p>
    </div>
  );
}
