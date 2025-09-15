import React, { useEffect, useMemo, useRef, useState } from "react";

// === Minimal helper icons (inline SVG to avoid external deps) ===
const Icon = {
  Plus: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  ),
  Trash: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m1 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 4v8m6-8v8" />
    </svg>
  ),
  Search: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m20 20-3.5-3.5" />
    </svg>
  ),
  Calendar: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  Upload: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 12V3m0 0 4 4m-4-4-4 4" />
    </svg>
  ),
  Download: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 3v12m0 0 4-4m-4 4-4-4" />
    </svg>
  ),
  X: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18 18 6" />
    </svg>
  )
};

// === Types ===
type Priority = "low" | "medium" | "high";
type SubTask = { id: string; title: string; done: boolean };
type Task = {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  tags: string[];
  priority: Priority;
  completed: boolean;
  createdAt: number;
  subtasks: SubTask[];
};

const STORAGE_KEY = "gamberini_todo_v1";

const red = { base: "#F54129", dim: "#c73522", glow: "#ff6b57" };

const classes = {
  app: "min-h-screen w-full bg-black text-zinc-100 antialiased",
  container: "mx-auto max-w-7xl p-4 md:p-8",
  glass: "backdrop-blur-md bg-white/5 border border-white/10",
  btn: "inline-flex items-center gap-2 rounded-2xl px-4 py-2 transition active:scale-[.98]",
  field: "rounded-xl bg-white/5 border border-white/10 px-4 py-3 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--red)] focus:bg-white/[.06]",
};

// Helpers
function uid(prefix = "id") { return `${prefix}_${Math.random().toString(36).slice(2, 9)}`; }
function save(tasks: Task[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function load(): Task[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Task[]; }
  catch { return []; }
}
function useLocalTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => load());
  useEffect(() => save(tasks), [tasks]);
  return { tasks, setTasks } as const;
}
// function priorityBadge(p: Priority) {
//   const tone = p === "high" ? red.base : p === "medium" ? red.dim : "#444";
//   const label = p === "high" ? "Alta" : p === "medium" ? "Média" : "Baixa";
//   return <span className="ml-2 inline-flex items-center rounded-full text-xs px-2 py-0.5" style={{ background: `${tone}22`, color: tone, border: `1px solid ${tone}55` }}>{label}</span>;
// }

function priorityBadge(p: Priority) {
  const label = p === "high" ? "Alta" : p === "medium" ? "Média" : "Baixa";
  const cls =
    "priority-badge " +
    (p === "high"
      ? "priority-badge--high"
      : p === "medium"
        ? "priority-badge--medium"
        : "priority-badge--low");
  return <span className={cls}>{label}</span>;
}

// === Main App ===
export default function App() {
  useEffect(() => { 
    // base color (used em vários lugares) e a versão com alpha para o glow
    document.documentElement.style.setProperty("--red", red.base);
    document.documentElement.style.setProperty("--red-glow", red.glow);
  }, []);
  const { tasks, setTasks } = useLocalTasks();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "today" | "overdue">("all");
  const [tagFilter] = useState<string | null>(null);
  const newTitleRef = useRef<HTMLInputElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const todayISO = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (filter === "active" && t.completed) return false;
      if (filter === "completed" && !t.completed) return false;
      if (filter === "today" && t.due !== todayISO) return false;
      if (filter === "overdue" && (!t.due || t.due >= todayISO || t.completed)) return false;
      if (tagFilter && !t.tags.includes(tagFilter)) return false;
      if (query && !(`${t.title} ${t.notes ?? ""} ${t.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()))) return false;
      return true;
    });
  }, [tasks, filter, tagFilter, query, todayISO]);

  const stats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter(t => t.completed).length,
    overdue: tasks.filter(t => !t.completed && t.due && t.due < todayISO).length,
    today: tasks.filter(t => t.due === todayISO).length,
  }), [tasks, todayISO]);

  const [draft, setDraft] = useState({ title: "", due: "", tags: "", priority: "medium" as Priority, notes: "" });

  function parseTags(str: string) {
    return Array.from(new Set(str.split(/[,#\s]+/g).map(s => s.trim()).filter(Boolean)));
  }
  function handleAdd() {
    const title = draft.title.trim();
    if (!title) return;
    const next: Task = {
      id: uid("task"), title, due: draft.due || undefined,
      tags: parseTags(draft.tags), priority: draft.priority,
      notes: draft.notes.trim() || undefined, completed: false,
      createdAt: Date.now(), subtasks: []
    };
    setTasks(prev => [next, ...prev]);
    setDraft({ title: "", due: "", tags: "", priority: draft.priority, notes: "" });
    newTitleRef.current?.focus();
  }
  function toggle(id: string) { setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)); }
  function remove(id: string) { setTasks(prev => prev.filter(t => t.id !== id)); }
  function clearCompleted() { setTasks(prev => prev.filter(t => !t.completed)); }
  function exportJson() {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `gamberini-todo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  }
  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try { const data = JSON.parse(String(reader.result)); if (Array.isArray(data)) setTasks(data); }
      catch (err) { console.error("Failed to import JSON:", err); }
    };
    reader.readAsText(file);
  }

  return (
    <div className={classes.app}>
      <div className={classes.container}>
        {/* Header */}
        <header className={`${classes.glass} rounded-3xl p-5 md:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-glow`}>
          <h1 className="text-3xl font-extrabold">Gamberini To-Do</h1>
          <div className="flex flex-1 items-center gap-3 md:max-w-xl">
            <div className={`flex items-center gap-2 flex-1 ${classes.field}`}>
              <Icon.Search className="h-4 w-4 opacity-70" />
              <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tasks" className="bg-transparent flex-1 outline-none" />
            </div>
            <button onClick={exportJson} className={`${classes.btn} ${classes.glass}`} title="Export JSON"><Icon.Download className="h-5 w-5" /></button>
            <label className={`${classes.btn} ${classes.glass} cursor-pointer`} title="Import JSON">
              <Icon.Upload className="h-5 w-5" />
              <input type="file" accept="application/json" className="hidden" title="Import JSON" aria-label="Import JSON" onChange={e => { const f = e.target.files?.[0]; if (f) importJson(f); }} />
            </label>
          </div>
        </header>

        {/* Layout */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[260px,1fr,300px] gap-6">
        
            
          {/* Sidebar */}
          <aside className={`${classes.glass} rounded-3xl p-5 h-fit sticky top-6`}>
           
            <div className="mb-6 pb-6">
              <h2 className="text-sm uppercase text-zinc-400 mb-3">Overview</h2>
              <StatCard label="Total" value={stats.total} />
              <StatCard label="Done" value={stats.done} />
              <StatCard label="Overdue" value={stats.overdue} danger />
            </div>
            <div className="mt-6 pt-6 border-t border-white/10">
              <h2 className="text-sm uppercase text-zinc-400 mb-3">Filters</h2>
              <button onClick={() => setFilter("all")} className={classes.btn}>All ({stats.total})</button>
              <button onClick={() => setFilter("active")} className={classes.btn}>Active</button>
              <button onClick={() => setFilter("completed")} className={classes.btn}>Completed</button>
              <button onClick={() => setFilter("today")} className={classes.btn}>Today</button>
              <button onClick={() => setFilter("overdue")} className={classes.btn}>Overdue</button>
              </div>
            <div className="mt-6 pt-6 border-t border-white/10">
              <button onClick={clearCompleted} className={`${classes.btn} ms-5 w-full justify-center bg-white/5 border border-white/10 hover:bg-white/10`}>
                <Icon.Trash className="h-4 w-4" /> Clear completed
              </button>
            </div>
          </aside>
        

          {/* Main */}
          <main className="flex flex-col gap-4">

            {/* Composer */}
            <section className={`${classes.glass} rounded-3xl p-4 md:p-5`}>
              <div className="flex flex-col md:flex-row gap-3">
                <input ref={newTitleRef} value={draft.title} onChange={e => setDraft(s => ({ ...s, title: e.target.value }))} placeholder="New task title" className={`${classes.field} flex-1`} />
                <div className="flex gap-3">
                  <input type="date" value={draft.due} onChange={e => setDraft(s => ({ ...s, due: e.target.value }))} className={`${classes.field}`} title="Due date" placeholder="Due date" aria-label="Due date" />
                  <input value={draft.tags} onChange={e => setDraft(s => ({ ...s, tags: e.target.value }))} placeholder="#tags" className={`${classes.field}`} />
                  <select value={draft.priority} onChange={e => setDraft(s => ({ ...s, priority: e.target.value as Priority }))} className={`${classes.field}`} aria-label="Priority" title="Priority">
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                  <button onClick={handleAdd} className={`${classes.btn}`}><Icon.Plus className="h-5 w-5" /> Add</button>
                </div>
              </div>
              <textarea value={draft.notes} onChange={e => setDraft(s => ({ ...s, notes: e.target.value }))} placeholder="Notes (optional)" className={`${classes.field} mt-3 w-full`} rows={2} />
            </section>

            {/* Task list */}
            <section className="grid gap-3">
              {filtered.length === 0 && <div className={`${classes.glass} rounded-3xl p-8 text-center text-zinc-400`}>No tasks</div>}
              {filtered.map(task => {
                const overdue = !task.completed && task.due && task.due < todayISO;
                return (
                  <article key={task.id} className={`${classes.glass} rounded-3xl p-4 md:p-5`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={task.completed} onChange={() => toggle(task.id)} title={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`} aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`} className="mt-1 h-5 w-5 accent-[var(--red)]" />
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-semibold ${task.completed ? "line-through text-zinc-500" : ""}`}>{task.title}{priorityBadge(task.priority)}</h3>
                        {task.notes && <p className="mt-1 text-zinc-300">{task.notes}</p>}
                        {task.due && <p className={`text-xs mt-1 ${overdue ? "text-red-400" : "text-zinc-400"}`}><Icon.Calendar className="inline h-3 w-3" /> {task.due}</p>}
                      </div>
                      <button onClick={() => remove(task.id)} title={`Delete "${task.title}"`} aria-label={`Delete "${task.title}"`} className={`${classes.btn} bg-white/5 border border-white/10 hover:bg-white/10`}><Icon.Trash className="h-4 w-4" /></button>
                    </div>
                  </article>
                );
              })}
            </section>
          {/* Right panel */}
          {/* <aside className={`${classes.glass} rounded-3xl p-5 h-fit sticky top-6`}>
            <h2 className="text-sm uppercase text-zinc-400 mb-3">Overview</h2>
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Done" value={stats.done} />
            <StatCard label="Overdue" value={stats.overdue} danger />
          </aside> */}

          </main>

        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-2xl p-4 border border-white/10 bg-white/5 text-center mt-2">
      <div className={`text-2xl font-bold ${danger ? "text-red-400" : ""}`}>{value}</div>
      <div className="text-xs text-zinc-400 mt-1">{label}</div>
    </div>
  );
}
