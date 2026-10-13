import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { BarChart3, BookOpen, CalendarDays, ClipboardList, Dumbbell, Home, RotateCcw, Settings } from "lucide-react";
import { useData } from "./lib/data";
import Hoje from "./pages/Hoje";
import Plano from "./pages/Plano";
import Praticar from "./pages/Praticar";
import Simulados from "./pages/Simulados";
import Erros from "./pages/Erros";
import Conteudo from "./pages/Conteudo";
import Desempenho from "./pages/Desempenho";
import Config from "./pages/Config";

const NAV = [
  { to: "/", label: "Hoje", icon: Home },
  { to: "/plano", label: "Plano", icon: CalendarDays },
  { to: "/praticar", label: "Praticar", icon: Dumbbell },
  { to: "/simulados", label: "Simulados", icon: ClipboardList },
  { to: "/erros", label: "Erros", icon: RotateCcw },
  { to: "/conteudo", label: "Conteúdo", icon: BookOpen },
  { to: "/desempenho", label: "Desempenho", icon: BarChart3 },
  { to: "/config", label: "Ajustes", icon: Settings },
];

export default function App() {
  const data = useData();
  return (
    <BrowserRouter>
      <div className="min-h-screen md:flex">
        <aside className="hidden md:flex md:w-56 shrink-0 flex-col border-r border-slate-200 bg-white p-4 gap-1 sticky top-0 h-screen">
          <div className="mb-4 px-2">
            <div className="text-lg font-bold text-indigo-700">CFG Estudos</div>
            <div className="text-xs text-slate-500">Certificação ANBIMA</div>
          </div>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </aside>

        <main className="flex-1 min-w-0 px-4 py-5 md:px-8 md:py-8 pb-24 md:pb-8">
          <div className="mx-auto max-w-3xl">
            {!data ? (
              <div className="py-20 text-center text-slate-500">Carregando questões…</div>
            ) : (
              <Routes>
                <Route path="/" element={<Hoje data={data} />} />
                <Route path="/plano" element={<Plano data={data} />} />
                <Route path="/praticar" element={<Praticar data={data} />} />
                <Route path="/simulados" element={<Simulados data={data} />} />
                <Route path="/erros" element={<Erros data={data} />} />
                <Route path="/conteudo" element={<Conteudo data={data} />} />
                <Route path="/desempenho" element={<Desempenho data={data} />} />
                <Route path="/config" element={<Config data={data} />} />
                <Route path="*" element={<Hoje data={data} />} />
              </Routes>
            )}
          </div>
        </main>

        <nav className="md:hidden fixed bottom-0 inset-x-0 z-10 border-t border-slate-200 bg-white grid grid-cols-5">
          {NAV.filter((n) => ["/", "/plano", "/praticar", "/simulados", "/desempenho"].includes(n.to)).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] ${isActive ? "text-indigo-700" : "text-slate-500"}`}
            >
              <Icon className="h-5 w-5" /> {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </BrowserRouter>
  );
}
