import { useMemo, useState } from "react";
import {
  Zap, Home, Building2, Calendar as CalIcon, ClipboardList, BarChart3,
  Plus, Trash2, Pencil, CalendarPlus,
} from "lucide-react";
import {
  Button, Card, CardContent, Chip, Progress, Skeleton,
} from "@/components/electrack/ui";
import {
  AddSiteModal, EditSiteModal, LogModal, ExpenseModal, SiteDetailModal, AddDateModal,
} from "@/components/electrack/Modals";
import { ExportShareModal } from "@/components/electrack/ExportShareModal";
import { useSites, useWorkLogs, useExpenses } from "@/lib/use-electrack";
import {
  cn, fmtMoney, fmtDate, fmtShort, todayStr,
  TH_DAYS, TH_MONTHS_FULL, EXP_CATS, STATUSES, STATUS_BG, STATUS_COLOR,
  type Site, type WorkLog, type Expense,
} from "@/lib/electrack";


type Modal =
  | { type: "addSite" }
  | { type: "editSite"; data: Site }
  | { type: "addLog"; data?: { site_id?: string } }
  | { type: "editLog"; data: WorkLog }
  | { type: "addExp"; data?: { site_id?: string } }
  | { type: "editExp"; data: Expense }
  | { type: "siteDetail"; data: Site }
  | { type: "addDate"; data: Site }
  | { type: "export"; data: Site }
  | null;

export default function ElecTrackApp() {
  const [tab, setTab] = useState<"dash" | "sites" | "cal" | "logs" | "summary">("dash");
  const [modal, setModal] = useState<Modal>(null);
  const { sites, loading: sl, addSite, updateSite, deleteSite, ensureDate } = useSites();
  const { logs, loading: ll, addLog, updateLog, deleteLog } = useWorkLogs();
  const { expenses, loading: el, addExpense, updateExpense, deleteExpense } = useExpenses();
  const loading = sl || ll || el;

  const siteSummary = (siteId: string) => {
    const income = Number(sites.find((s) => s.id === siteId)?.income || 0);
    const totalExp = expenses.filter((e) => e.site_id === siteId).reduce((a, e) => a + Number(e.amount || 0), 0);
    return { income, totalExp, profit: income - totalExp };
  };

  const today = todayStr();
  const now = new Date();
  const totalIncome = sites.reduce((a, s) => a + Number(s.income || 0), 0);
  const totalExp = expenses.reduce((a, e) => a + Number(e.amount || 0), 0);
  const totalProfit = totalIncome - totalExp;
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthExp = expenses.filter((e) => e.date?.startsWith(monthPrefix)).reduce((a, e) => a + Number(e.amount || 0), 0);
  const monthIncome = sites.filter((s) => (s.dates || []).some((d) => d.startsWith(monthPrefix))).reduce((a, s) => a + Number(s.income || 0), 0);

  const open = (m: Modal) => setModal(m);
  const close = () => setModal(null);

  const navItems = [
    { id: "dash", label: "หน้าหลัก", icon: Home },
    { id: "sites", label: "ไซต์", icon: Building2 },
    { id: "cal", label: "ปฏิทิน", icon: CalIcon },
    { id: "logs", label: "บันทึก", icon: ClipboardList },
    { id: "summary", label: "สรุป", icon: BarChart3 },
  ] as const;

  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800/60 px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2.5 flex-1 max-w-7xl mx-auto w-full">
          <div className="w-8 h-8 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/30">
            <Zap className="h-4 w-4 text-zinc-900" />
          </div>
          <div>
            <h1 className="font-black text-lg leading-none">Elec<span className="text-yellow-400">Track</span></h1>
            <p className="text-[10px] text-zinc-500 font-mono leading-none mt-0.5">{TH_DAYS[now.getDay()]} {now.getDate()} {TH_MONTHS_FULL[now.getMonth()]}</p>
          </div>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 ml-auto">
            {navItems.map((n) => (
              <button key={n.id} onClick={() => setTab(n.id)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition",
                  tab === n.id ? "bg-yellow-400/10 text-yellow-400" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800")}>
                <n.icon className="h-4 w-4" /> {n.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="pb-[80px] md:pb-6 max-w-7xl mx-auto">
        {tab === "dash" && <DashPage {...{ sites, logs, expenses, today, now, totalIncome, totalExp, totalProfit, monthIncome, monthExp, siteSummary, open, loading }} />}
        {tab === "sites" && <SitesPage {...{ sites, open, deleteSite }} />}
        {tab === "cal" && <CalPage {...{ sites, today, open }} />}
        {tab === "logs" && <LogsPage {...{ logs, sites, open, deleteLog }} />}
        {tab === "summary" && <SummaryPage {...{ sites, expenses, logs, siteSummary, totalIncome, totalExp, totalProfit }} />}
      </main>

      {/* Mobile bottom nav — NO center + button (per requirements) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur border-t border-zinc-800/60 grid grid-cols-5 pb-safe">
        {navItems.map((n) => (
          <button key={n.id} onClick={() => setTab(n.id)}
            className={cn("flex flex-col items-center gap-1 py-3 text-[10px] font-semibold relative",
              tab === n.id ? "text-yellow-400" : "text-zinc-600 hover:text-zinc-400")}>
            {tab === n.id && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-yellow-400 rounded-b-full" />}
            <n.icon className="h-5 w-5" strokeWidth={tab === n.id ? 2.5 : 2} />
            {n.label}
          </button>
        ))}
      </nav>

      {/* MODALS */}
      <AddSiteModal open={modal?.type === "addSite"} onClose={close} onSave={async (d) => { await addSite(d); close(); }} />
      <EditSiteModal open={modal?.type === "editSite"} onClose={close} site={modal?.type === "editSite" ? modal.data : null}
        onSave={async (d) => { if (modal?.type === "editSite") { await updateSite(modal.data.id, d); close(); } }} />
      <LogModal open={modal?.type === "addLog" || modal?.type === "editLog"} onClose={close}
        sites={sites} prefill={modal?.type === "addLog" ? modal.data : undefined}
        log={modal?.type === "editLog" ? modal.data : null}
        onSave={async (rows) => {
          if (modal?.type === "editLog" && rows[0]) {
            await updateLog(modal.data.id, rows[0]);
            if (rows[0].site_id && rows[0].date) await ensureDate(rows[0].site_id, rows[0].date);
          } else {
            for (const r of rows) {
              await addLog(r);
              if (r.site_id && r.date) await ensureDate(r.site_id, r.date);
            }
          }
          close();
        }} />
      <ExpenseModal open={modal?.type === "addExp" || modal?.type === "editExp"} onClose={close}
        sites={sites} prefill={modal?.type === "addExp" ? modal.data : undefined}
        expense={modal?.type === "editExp" ? modal.data : null}
        onSave={async (d) => {
          if (modal?.type === "editExp") await updateExpense(modal.data.id, d);
          else await addExpense(d);
          close();
        }} />
      <AddDateModal open={modal?.type === "addDate"} onClose={close} site={modal?.type === "addDate" ? modal.data : null}
        onSave={async (dates) => { if (modal?.type === "addDate") await updateSite(modal.data.id, { dates }); }} />
      <ExportShareModal open={modal?.type === "export"} onClose={close}
        site={modal?.type === "export" ? modal.data : null} logs={logs} expenses={expenses} />
      <SiteDetailModal open={modal?.type === "siteDetail"} onClose={close}
        site={modal?.type === "siteDetail" ? modal.data : null}
        logs={logs} expenses={expenses} siteSummary={siteSummary}
        onSave={async (d) => { if (modal?.type === "siteDetail") await updateSite(modal.data.id, d); }}
        onAddLog={() => modal?.type === "siteDetail" && open({ type: "addLog", data: { site_id: modal.data.id } })}
        onEditLog={(l) => open({ type: "editLog", data: l })}
        onAddExp={() => modal?.type === "siteDetail" && open({ type: "addExp", data: { site_id: modal.data.id } })}
        onEditExp={(e) => open({ type: "editExp", data: e })}
        onDeleteLog={deleteLog}
        onDeleteExp={deleteExpense}
        onExport={() => modal?.type === "siteDetail" && open({ type: "export", data: modal.data })}
      />
    </div>
  );
}

// ── DASH ──────────────────────────────────────────────────────────────────
function DashPage({ sites, logs, expenses, today, now, totalProfit, monthIncome, monthExp, siteSummary, open, loading }: any) {
  const todaySites = sites.filter((s: Site) => (s.dates || []).includes(today));
  const activeSites = sites.filter((s: Site) => s.status === "กำลังทำ");
  const margin = monthIncome > 0 ? Math.round(((monthIncome - monthExp) / monthIncome) * 100) : 0;
  if (loading) return <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-center pt-2 pb-1">
        <img src={electrackLogo} alt="ElecTrack" className="h-28 w-28 object-contain drop-shadow-[0_0_30px_rgba(245,197,24,0.35)]" />
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/60 p-5">
        <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest font-mono mb-1">วันนี้ {TH_DAYS[now.getDay()]}</p>
        <h2 className="text-2xl font-black mb-3">{now.getDate()} {TH_MONTHS_FULL[now.getMonth()]} {now.getFullYear()}</h2>
        {todaySites.length === 0
          ? <p className="text-sm text-zinc-600 text-center py-2">ไม่มีไซต์งานวันนี้</p>
          : <div className="space-y-2">{todaySites.map((s: Site) => (
              <button key={s.id} onClick={() => open({ type: "siteDetail", data: s })}
                className="w-full flex items-center gap-3 bg-zinc-900/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-left hover:border-yellow-400/30">
                <div className="w-2 h-2 rounded-full" style={{ background: s.status === "เสร็จแล้ว" ? "#29d97a" : "#f5c518" }} />
                <span className="font-semibold text-sm flex-1">{s.name}</span>
                <span className={cn("text-xs font-semibold", STATUS_COLOR[s.status])}>{s.status}</span>
              </button>
            ))}</div>}
      </div>

      <div>
        <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mb-2">เดือนนี้</p>
        <div className="grid grid-cols-2 gap-2">
          <Card><CardContent className="pt-4"><p className="text-xs text-zinc-500 uppercase mb-1">รายรับ</p><p className="text-xl font-black font-mono text-emerald-400">฿{fmtMoney(monthIncome)}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-zinc-500 uppercase mb-1">รายจ่าย</p><p className="text-xl font-black font-mono text-rose-400">฿{fmtMoney(monthExp)}</p></CardContent></Card>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[
            { label: "กำไร", val: `฿${fmtMoney(totalProfit)}`, color: totalProfit >= 0 ? "text-emerald-400" : "text-rose-400" },
            { label: "Margin", val: `${margin}%`, color: margin >= 50 ? "text-emerald-400" : margin >= 20 ? "text-yellow-400" : "text-rose-400" },
            { label: "Active", val: `${activeSites.length}`, color: "text-yellow-400" },
          ].map((k) => (
            <Card key={k.label}><CardContent className="pt-3 pb-3 px-3"><p className="text-[10px] text-zinc-500 uppercase">{k.label}</p><p className={cn("text-base font-black font-mono mt-0.5", k.color)}>{k.val}</p></CardContent></Card>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => open({ type: "addLog" })}><ClipboardList className="h-4 w-4" /> บันทึกงาน</Button>
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => open({ type: "addExp" })}><Plus className="h-4 w-4" /> ค่าใช้จ่าย</Button>
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => open({ type: "addSite" })}><Building2 className="h-4 w-4" /> ไซต์</Button>
      </div>
    </div>
  );
}

// ── SITES — with +Add Date next to site name ─────────────────────────────
function SitesPage({ sites, open, deleteSite }: any) {
  const [filter, setFilter] = useState<string>("ทั้งหมด");
  const filtered = filter === "ทั้งหมด" ? sites : sites.filter((s: Site) => s.status === filter);
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-lg">ไซต์งาน <span className="text-zinc-600 text-base font-normal">({sites.length})</span></h2>
        <Button size="sm" onClick={() => open({ type: "addSite" })}><Plus className="h-4 w-4" /> เพิ่ม</Button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {["ทั้งหมด", ...STATUSES].map((f) => <Chip key={f} active={filter === f} onClick={() => setFilter(f)} className="shrink-0">{f}</Chip>)}
      </div>
      {filtered.length === 0 && <div className="text-center py-16 text-zinc-600"><Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="text-sm">ยังไม่มีไซต์งาน</p></div>}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s: Site) => (
          <Card key={s.id} className="cursor-pointer hover:border-zinc-600" onClick={() => open({ type: "siteDetail", data: s })}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-1 self-stretch rounded-full mt-1" style={{ background: s.status === "กำลังทำ" ? "#f5c518" : s.status === "เสร็จแล้ว" ? "#29d97a" : "#4db8ff" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-sm truncate">{s.name}</h3>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", STATUS_BG[s.status])}>{s.status}</span>
                    {/* +Add Date button — moved here per requirements */}
                    <button
                      onClick={(e) => { e.stopPropagation(); open({ type: "addDate", data: s }); }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-yellow-400 border border-yellow-400/40 hover:bg-yellow-400/10 px-2 py-0.5 rounded-full transition"
                    >
                      <CalendarPlus className="h-3 w-3" /> Add Date
                    </button>
                  </div>
                  {s.client && <p className="text-xs text-zinc-500">👤 {s.client}</p>}
                  {s.address && <p className="text-xs text-zinc-500">📍 {s.address}</p>}
                  {s.income > 0 && <p className="text-xs text-emerald-400 font-semibold mt-1">฿ {fmtMoney(s.income)}</p>}
                  {s.dates?.length > 0 && <p className="text-xs text-zinc-600 mt-1">📅 {s.dates.map(fmtShort).join(" · ")}</p>}
                </div>
                <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => open({ type: "editSite", data: s })}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-rose-400" onClick={() => { if (confirm("ลบไซต์นี้?")) deleteSite(s.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── CALENDAR ──────────────────────────────────────────────────────────────
function CalPage({ sites, today, open }: any) {
  const now = new Date();
  const [cal, setCal] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const prev = () => setCal((p) => p.m === 0 ? { y: p.y - 1, m: 11 } : { y: p.y, m: p.m - 1 });
  const next = () => setCal((p) => p.m === 11 ? { y: p.y + 1, m: 0 } : { y: p.y, m: p.m + 1 });
  const first = new Date(cal.y, cal.m, 1).getDay();
  const days = new Date(cal.y, cal.m + 1, 0).getDate();
  const cells: ({ d: number; ds: string; ss: Site[] } | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) {
    const ds = `${cal.y}-${String(cal.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ d, ds, ss: sites.filter((s: Site) => (s.dates || []).includes(ds)) });
  }
  const prefix = `${cal.y}-${String(cal.m + 1).padStart(2, "0")}`;
  const monthSites = sites.filter((s: Site) => (s.dates || []).some((d: string) => d.startsWith(prefix)));

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      <Card><CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={prev}>‹</Button>
          <h2 className="font-bold text-base">{TH_MONTHS_FULL[cal.m]} {cal.y}</h2>
          <Button variant="ghost" size="icon" onClick={next}>›</Button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["อา","จ","อ","พ","พฤ","ศ","ส"].map((d) => <div key={d} className="text-center text-[10px] font-bold text-zinc-600 py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c) return <div key={i} />;
            const isT = c.ds === today;
            const done = c.ss.length > 0 && c.ss.every((s) => s.status === "เสร็จแล้ว");
            return (
              <button key={i} onClick={() => c.ss.length > 0 && open({ type: "siteDetail", data: c.ss[0] })}
                className={cn("aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-medium relative",
                  isT && "ring-2 ring-yellow-400 text-yellow-400 font-bold",
                  c.ss.length > 0 && (done ? "bg-emerald-400/15 text-emerald-400" : "bg-yellow-400/15 text-yellow-400"),
                  !isT && c.ss.length === 0 && "text-zinc-500 hover:bg-zinc-800")}>
                {c.d}
                {c.ss.length > 0 && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-current" />}
              </button>
            );
          })}
        </div>
      </CardContent></Card>

      {monthSites.length > 0 && (
        <>
          <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">ไซต์ในเดือนนี้</p>
          {monthSites.map((s: Site) => (
            <Card key={s.id} className="cursor-pointer" onClick={() => open({ type: "siteDetail", data: s })}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{s.name}</p>
                  <p className="text-xs text-zinc-500">{(s.dates || []).filter((d) => d.startsWith(prefix)).map(fmtDate).join(" · ")}</p>
                </div>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", STATUS_BG[s.status])}>{s.status}</span>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

// ── LOGS ──────────────────────────────────────────────────────────────────
function LogsPage({ logs, sites, open, deleteLog }: any) {
  const [fs, setFs] = useState<string>("all");
  const filtered = fs === "all" ? logs : logs.filter((l: WorkLog) => l.site_id === fs);
  const sorted = [...filtered].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-lg">บันทึกงาน <span className="text-zinc-600 text-base font-normal">({sorted.length})</span></h2>
        <Button size="sm" onClick={() => open({ type: "addLog" })}><Plus className="h-4 w-4" /></Button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        <Chip active={fs === "all"} onClick={() => setFs("all")} className="shrink-0">ทุกไซต์</Chip>
        {sites.map((s: Site) => <Chip key={s.id} active={fs === s.id} onClick={() => setFs(s.id)} className="shrink-0">{s.name}</Chip>)}
      </div>
      {sorted.length === 0 && <div className="text-center py-16 text-zinc-600"><ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="text-sm">ยังไม่มีบันทึก</p></div>}
      <div className="grid gap-2 md:grid-cols-2">
        {sorted.map((l: WorkLog) => {
          const site = sites.find((s: Site) => s.id === l.site_id);
          return (
            <Card key={l.id}><CardContent className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-sky-400 uppercase">{l.category}</span>
                    {site && <span className="text-[10px] text-zinc-600">📍 {site.name}</span>}
                    <span className="text-[10px] text-zinc-500 ml-auto">{fmtDate(l.date)}</span>
                  </div>
                  <p className="text-sm">{l.detail}</p>
                  {l.note && <p className="text-xs text-zinc-500 mt-1 italic">{l.note}</p>}
                  {l.photos && l.photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-1.5 mt-2">
                      {l.photos.map((u, i) => <a key={i} href={u} target="_blank" rel="noreferrer"><img src={u} className="w-full h-14 object-cover rounded-md border border-zinc-700" /></a>)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-mono font-bold text-yellow-400 text-sm">{l.qty} {l.unit}</span>
                  <button onClick={() => open({ type: "editLog", data: l })} className="text-zinc-500 hover:text-yellow-400 p-1"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => deleteLog(l.id)} className="text-zinc-500 hover:text-rose-400 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </CardContent></Card>
          );
        })}
      </div>
    </div>
  );
}

// ── SUMMARY ───────────────────────────────────────────────────────────────
function SummaryPage({ sites, expenses, logs, siteSummary, totalIncome, totalExp, totalProfit }: any) {
  const catBreakdown = useMemo(() => EXP_CATS.map((c) => ({
    ...c, total: expenses.filter((e: Expense) => e.category === c.label).reduce((a: number, e: Expense) => a + Number(e.amount || 0), 0),
  })).filter((c) => c.total > 0), [expenses]);
  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <div className={cn("rounded-2xl border p-5", totalProfit >= 0 ? "bg-gradient-to-br from-emerald-950/50 to-zinc-900 border-emerald-800/30" : "bg-gradient-to-br from-rose-950/50 to-zinc-900 border-rose-800/30")}>
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">กำไรสุทธิทั้งหมด</p>
        <p className={cn("text-4xl font-black font-mono", totalProfit >= 0 ? "text-emerald-400" : "text-rose-400")}>฿{fmtMoney(totalProfit)}</p>
        <p className="text-xs text-zinc-500 mt-2">รายรับ ฿{fmtMoney(totalIncome)} — รายจ่าย ฿{fmtMoney(totalExp)}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "ไซต์ทั้งหมด", val: sites.length, color: "text-yellow-400" },
          { label: "รายจ่าย", val: expenses.length, color: "text-sky-400" },
          { label: "บันทึก", val: logs.length, color: "text-sky-400" },
        ].map((k) => (
          <Card key={k.label}><CardContent className="p-3 text-center"><p className={cn("text-2xl font-black font-mono", k.color)}>{k.val}</p><p className="text-[10px] text-zinc-500">{k.label}</p></CardContent></Card>
        ))}
      </div>
      {catBreakdown.length > 0 && (
        <Card><CardContent className="p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-3">ค่าใช้จ่ายตามหมวด</p>
          {catBreakdown.map((c) => (
            <div key={c.label} className="mb-2.5">
              <div className="flex justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: c.color }} /><span className="text-zinc-300">{c.label}</span></div>
                <span className="font-mono font-semibold">฿{fmtMoney(c.total)}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${totalExp > 0 ? (c.total / totalExp) * 100 : 0}%`, background: c.color }} /></div>
            </div>
          ))}
        </CardContent></Card>
      )}
      <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">สรุปต่อไซต์</p>
      <div className="grid gap-2 md:grid-cols-2">
        {[...sites].sort((a: Site, b: Site) => siteSummary(b.id).profit - siteSummary(a.id).profit).map((s: Site) => {
          const { income, totalExp: exp, profit } = siteSummary(s.id);
          return (
            <Card key={s.id}><CardContent className="p-4">
              <h3 className="font-bold text-sm">{s.name}</h3>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center"><p className="font-mono font-bold text-emerald-400 text-xs">฿{fmtMoney(income)}</p><p className="text-[10px] text-zinc-500">รายรับ</p></div>
                <div className="text-center"><p className="font-mono font-bold text-rose-400 text-xs">฿{fmtMoney(exp)}</p><p className="text-[10px] text-zinc-500">รายจ่าย</p></div>
                <div className="text-center"><p className={cn("font-mono font-bold text-xs", profit >= 0 ? "text-emerald-400" : "text-rose-400")}>฿{fmtMoney(profit)}</p><p className="text-[10px] text-zinc-500">กำไร</p></div>
              </div>
            </CardContent></Card>
          );
        })}
      </div>
    </div>
  );
}
