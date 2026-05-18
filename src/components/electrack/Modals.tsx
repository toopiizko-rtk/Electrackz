import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, X, Camera, Pencil, ImagePlus, ScanLine, Bookmark, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose,
  Button, Input, Textarea, Label, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Tabs, TabsList, TabsTrigger, TabsContent, Chip, Progress, Separator,
} from "@/components/electrack/ui";
import {
  cn, fmtMoney, fmtDate, fmtShort, todayStr,
  STATUSES, WORK_CATS, WORK_UNITS, EXP_CATS, STATUS_BG,
  type Site, type WorkLog, type Expense,
} from "@/lib/electrack";
import { compressImage } from "@/lib/image";
import { supabase } from "@/lib/supabase-ext";
import { useWorkPresets, type WorkPreset } from "@/lib/use-presets";
import { ocrWorkLog, ocrExpense } from "@/lib/ocr.functions";

// ── Photo uploader (with compression) ────────────────────────────────────
function PhotoUploader({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    const uploaded: string[] = [];
    for (const f of files) {
      try {
        const blob = await compressImage(f);
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const { error } = await supabase.storage.from("work-photos").upload(path, blob, { contentType: "image/jpeg" });
        if (!error) {
          const { data } = supabase.storage.from("work-photos").getPublicUrl(path);
          uploaded.push(data.publicUrl);
        }
      } catch { /* skip failed file */ }
    }
    if (uploaded.length) onChange([...photos, ...uploaded]);
    setBusy(false);
    if (ref.current) ref.current.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>รูปหน้างาน ({photos.length})</Label>
        <Button type="button" variant="secondary" size="xs" onClick={() => ref.current?.click()} disabled={busy}>
          <ImagePlus className="h-3.5 w-3.5" /> {busy ? "กำลังอัป..." : "เพิ่มรูป"}
        </Button>
      </div>
      <input ref={ref} type="file" accept="image/*" multiple onChange={handle} className="hidden" />
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url, i) => (
            <div key={url + i} className="relative group">
              <img src={url} alt={`photo-${i}`} className="w-full h-24 object-cover rounded-lg border border-zinc-800" />
              <button
                type="button"
                onClick={() => onChange(photos.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AddSite ──────────────────────────────────────────────────────────────
export function AddSiteModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (d: Partial<Site>) => Promise<void> }) {
  const blank = { name: "", address: "", client: "", status: "กำลังทำ", income: "", dates: [] as string[] };
  const [f, setF] = useState(blank);
  const [di, setDi] = useState(todayStr());
  const set = (k: keyof typeof blank, v: any) => setF((p) => ({ ...p, [k]: v }));
  useEffect(() => { if (open) { setF(blank); setDi(todayStr()); } }, [open]);

  const addDate = () => { if (di && !f.dates.includes(di)) set("dates", [...f.dates, di].sort()); };
  const remDate = (d: string) => set("dates", f.dates.filter((x) => x !== d));

  const save = async () => {
    if (!f.name.trim()) return;
    await onSave({ ...f, income: Number(f.income) || 0 });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent onClose={onClose}>
        <DialogHeader><DialogTitle>🏗️ เพิ่มไซต์งาน</DialogTitle><DialogClose /></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>ชื่อไซต์ *</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>ที่อยู่</Label><Input value={f.address} onChange={(e) => set("address", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>ผู้ว่าจ้าง</Label><Input value={f.client} onChange={(e) => set("client", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>สถานะ</Label>
              <Select value={f.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>ราคาตกลง (฿)</Label><Input type="number" value={f.income} onChange={(e) => set("income", e.target.value)} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>วันที่เข้าไซต์</Label>
            <div className="flex gap-2">
              <Input type="date" value={di} onChange={(e) => setDi(e.target.value)} className="flex-1" />
              <Button variant="secondary" size="sm" onClick={addDate}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            {f.dates.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {f.dates.map((d) => (
                  <span key={d} className="flex items-center gap-1 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs px-2 py-1 rounded-full">
                    {fmtShort(d)}
                    <button onClick={() => remDate(d)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <Button className="w-full mt-2" onClick={save}>บันทึกไซต์</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── EditSite ─────────────────────────────────────────────────────────────
export function EditSiteModal({ open, onClose, site, onSave }: { open: boolean; onClose: () => void; site: Site | null; onSave: (d: Partial<Site>) => Promise<void> }) {
  const [f, setF] = useState<Partial<Site>>({});
  const [di, setDi] = useState(todayStr());
  useEffect(() => { if (site && open) { setF({ ...site }); setDi(todayStr()); } }, [site, open]);
  const set = (k: keyof Site, v: any) => setF((p) => ({ ...p, [k]: v }));
  if (!site) return null;
  const dates = (f.dates as string[]) || [];
  const addDate = () => { if (di && !dates.includes(di)) set("dates", [...dates, di].sort()); };
  const remDate = (d: string) => set("dates", dates.filter((x) => x !== d));
  const save = async () => { await onSave({ ...f, income: Number(f.income) || 0 }); };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent onClose={onClose}>
        <DialogHeader><DialogTitle>✏️ แก้ไขไซต์</DialogTitle><DialogClose /></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>ชื่อไซต์ *</Label><Input value={f.name || ""} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>ที่อยู่</Label><Input value={f.address || ""} onChange={(e) => set("address", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>ผู้ว่าจ้าง</Label><Input value={f.client || ""} onChange={(e) => set("client", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>สถานะ</Label>
              <Select value={f.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>ราคาตกลง (฿)</Label><Input type="number" value={f.income ?? ""} onChange={(e) => set("income", e.target.value as any)} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>วันที่เข้าไซต์</Label>
            <div className="flex gap-2">
              <Input type="date" value={di} onChange={(e) => setDi(e.target.value)} className="flex-1" />
              <Button variant="secondary" size="sm" onClick={addDate}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            {dates.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {dates.map((d) => (
                  <span key={d} className="flex items-center gap-1 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs px-2 py-1 rounded-full">
                    {fmtShort(d)}<button onClick={() => remDate(d)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <Button className="w-full mt-2" onClick={save}>บันทึก</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── AddLog / EditLog (combined, multi-row + presets + OCR) ──────────────
type LogItem = { category: string; detail: string; qty: string; unit: string; note: string };
const blankItem = (): LogItem => ({ category: "เดินสาย", detail: "", qty: "", unit: "m", note: "" });

export function LogModal({ open, onClose, sites, prefill, log, onSave }: {
  open: boolean; onClose: () => void; sites: Site[]; prefill?: { site_id?: string }; log?: WorkLog | null;
  onSave: (rows: Partial<WorkLog>[]) => Promise<void>;
}) {
  const editing = !!log;
  const [siteId, setSiteId] = useState<string | null>(null);
  const [date, setDate] = useState(todayStr());
  const [items, setItems] = useState<LogItem[]>([blankItem()]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [ocrBusy, setOcrBusy] = useState(false);
  const ocrRef = useRef<HTMLInputElement>(null);
  const { presets, savePreset } = useWorkPresets();

  useEffect(() => {
    if (!open) return;
    if (log) {
      setSiteId(log.site_id);
      setDate(log.date || todayStr());
      setItems([{ category: log.category, detail: log.detail, qty: String(log.qty ?? ""), unit: log.unit, note: log.note || "" }]);
      setPhotos(log.photos || []);
    } else {
      setSiteId(prefill?.site_id || sites[0]?.id || null);
      setDate(todayStr());
      setItems([blankItem()]);
      setPhotos([]);
    }
  }, [open, log, prefill, sites]);

  const updateItem = (i: number, patch: Partial<LogItem>) => setItems((p) => p.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const addRow = () => setItems((p) => [...p, blankItem()]);
  const removeRow = (i: number) => setItems((p) => (p.length > 1 ? p.filter((_, j) => j !== i) : p));

  const save = async () => {
    const valid = items.filter((it) => it.detail.trim() && Number(it.qty));
    if (!valid.length) return;
    // save reusable presets
    for (const it of valid) await savePreset(it.category, it.detail, it.unit);
    const rows: Partial<WorkLog>[] = valid.map((it) => ({
      site_id: siteId, date, category: it.category, detail: it.detail.trim(),
      qty: Number(it.qty), unit: it.unit, note: it.note, photos,
    }));
    await onSave(rows);
  };

  const runOcr = async (file: File) => {
    setOcrBusy(true);
    try {
      const blob = await compressImage(file, 1400, 0.8);
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(blob);
      });
      const { items: extracted } = await ocrWorkLog({ data: { imageDataUrl: dataUrl, categories: WORK_CATS, units: WORK_UNITS } });
      if (extracted?.length) {
        const next: LogItem[] = extracted.map((x) => ({
          category: WORK_CATS.includes(x.category) ? x.category : "อื่นๆ",
          detail: x.detail || "",
          qty: String(x.qty ?? ""),
          unit: WORK_UNITS.includes(x.unit) ? x.unit : "m",
          note: x.note || "",
        }));
        setItems(next);
      } else {
        alert("ไม่พบรายการในรูปภาพ ลองถ่ายใหม่ให้ชัดขึ้น");
      }
    } catch (e: any) {
      alert("OCR ผิดพลาด: " + (e?.message || "unknown"));
    } finally {
      setOcrBusy(false);
      if (ocrRef.current) ocrRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent onClose={onClose}>
        <DialogHeader><DialogTitle>{editing ? "✏️ แก้ไขบันทึกงาน" : "📋 บันทึกงานรายวัน"}</DialogTitle><DialogClose /></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>วันที่</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>ไซต์งาน</Label>
            <Select value={siteId ?? undefined} onValueChange={(v) => setSiteId(v)}>
              <SelectTrigger><SelectValue placeholder="-- เลือกไซต์งาน --" /></SelectTrigger>
              <SelectContent>{sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {!editing && (
            <>
              <input ref={ocrRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => e.target.files?.[0] && runOcr(e.target.files[0])} />
              <Button type="button" variant="secondary" size="sm" className="w-full" onClick={() => ocrRef.current?.click()} disabled={ocrBusy}>
                {ocrBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
                {ocrBusy ? "กำลังอ่านลายมือ..." : "สแกนลายมือจากกระดาษ"}
              </Button>
            </>
          )}

          {items.map((it, i) => (
            <LogItemRow
              key={i}
              item={it}
              presets={presets}
              showRemove={items.length > 1 || editing}
              onChange={(patch) => updateItem(i, patch)}
              onRemove={() => removeRow(i)}
            />
          ))}

          {!editing && (
            <button type="button" onClick={addRow}
              className="w-full py-3 rounded-xl border border-dashed border-yellow-400/40 text-yellow-400 text-sm font-semibold hover:bg-yellow-400/5 transition">
              + เพิ่มรายการงาน
            </button>
          )}

          <Separator />
          <PhotoUploader photos={photos} onChange={setPhotos} />
          <Button className="w-full" onClick={save}>{editing ? "บันทึกการแก้ไข" : `บันทึก (${items.filter((i) => i.detail.trim() && Number(i.qty)).length} รายการ)`}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LogItemRow({ item, presets, showRemove, onChange, onRemove }: {
  item: LogItem; presets: WorkPreset[]; showRemove: boolean;
  onChange: (p: Partial<LogItem>) => void; onRemove: () => void;
}) {
  const matching = useMemo(() => presets.filter((p) => p.category === item.category).slice(0, 8), [presets, item.category]);
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
      <div className="space-y-1.5"><Label>ประเภทงาน</Label>
        <Select value={item.category} onValueChange={(v) => onChange({ category: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{WORK_CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {matching.length > 0 && (
        <div className="space-y-1">
          <Label className="text-[10px] text-zinc-500 flex items-center gap-1"><Bookmark className="h-3 w-3" /> เลือกจากที่บันทึกไว้</Label>
          <div className="flex flex-wrap gap-1">
            {matching.map((p) => (
              <button key={p.id} type="button"
                onClick={() => onChange({ detail: p.detail, unit: p.unit })}
                className="text-[11px] px-2 py-1 rounded-md bg-zinc-800 hover:bg-yellow-400/10 hover:text-yellow-400 border border-zinc-700">
                {p.detail}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-1.5"><Label>รายละเอียด</Label>
        <Input value={item.detail} onChange={(e) => onChange({ detail: e.target.value })} placeholder="เช่น สายปลั๊ก 2.5mm²" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5"><Label>ปริมาณ</Label>
          <Input type="number" inputMode="decimal" value={item.qty} onChange={(e) => onChange({ qty: e.target.value })} />
        </div>
        <div className="space-y-1.5"><Label>หน่วย</Label>
          <Select value={item.unit} onValueChange={(v) => onChange({ unit: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{WORK_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      {showRemove && (
        <button type="button" onClick={onRemove} className="text-rose-400 hover:text-rose-300">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      <div className="space-y-1.5"><Label>หมายเหตุ/ปัญหาที่เจอ</Label>
        <Input value={item.note} onChange={(e) => onChange({ note: e.target.value })} placeholder="เช่น สายสั้นเกินไป" />
      </div>
    </div>
  );
}

// ── AddExpense (no AI for now) ───────────────────────────────────────────
export function ExpenseModal({ open, onClose, sites, prefill, expense, onSave }: {
  open: boolean; onClose: () => void; sites: Site[]; prefill?: { site_id?: string }; expense?: Expense | null;
  onSave: (d: Partial<Expense>) => Promise<void>;
}) {
  const blank = (): Partial<Expense> => ({
    site_id: prefill?.site_id || sites[0]?.id || null,
    date: todayStr(), category: "อุปกรณ์ไฟฟ้า", name: "", amount: 0, note: "",
  });
  const [f, setF] = useState<Partial<Expense>>(blank());
  useEffect(() => { if (open) setF(expense ? { ...expense } : blank()); }, [open, expense]);
  const set = (k: keyof Expense, v: any) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.amount) return;
    await onSave({ ...f, amount: Number(f.amount) });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent onClose={onClose}>
        <DialogHeader><DialogTitle>{expense ? "✏️ แก้ไขค่าใช้จ่าย" : "💸 บันทึกค่าใช้จ่าย"}</DialogTitle><DialogClose /></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>ไซต์งาน</Label>
              <Select value={f.site_id ?? undefined} onValueChange={(v) => set("site_id", v)}>
                <SelectTrigger><SelectValue placeholder="เลือกไซต์" /></SelectTrigger>
                <SelectContent>{sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>วันที่</Label><Input type="date" value={f.date || ""} onChange={(e) => set("date", e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>หมวดหมู่</Label>
            <div className="flex flex-wrap gap-1.5">
              {EXP_CATS.map((c) => <Chip key={c.label} active={f.category === c.label} onClick={() => set("category", c.label)}>{c.label}</Chip>)}
            </div>
          </div>
          <div className="space-y-1.5"><Label>รายการ</Label><Input value={f.name || ""} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>จำนวนเงิน (฿) *</Label><Input type="number" value={f.amount ?? ""} onChange={(e) => set("amount", e.target.value as any)} /></div>
          <div className="space-y-1.5"><Label>หมายเหตุ</Label><Textarea value={f.note || ""} onChange={(e) => set("note", e.target.value)} rows={2} /></div>
          <Button className="w-full" onClick={save}>บันทึก</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── AddDate quick modal — for the +Add Date button on site cards ─────────
export function AddDateModal({ open, onClose, site, onSave }: { open: boolean; onClose: () => void; site: Site | null; onSave: (dates: string[]) => Promise<void> }) {
  const [d, setD] = useState(todayStr());
  useEffect(() => { if (open) setD(todayStr()); }, [open]);
  if (!site) return null;
  const existing = site.dates || [];
  const add = async () => {
    if (!d || existing.includes(d)) { onClose(); return; }
    await onSave([...existing, d].sort());
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent onClose={onClose}>
        <DialogHeader><DialogTitle>📅 เพิ่มวันทำงาน — {site.name}</DialogTitle><DialogClose /></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>เลือกวันที่</Label><Input type="date" value={d} onChange={(e) => setD(e.target.value)} /></div>
          {existing.length > 0 && (
            <div>
              <Label>วันที่เพิ่มไว้แล้ว</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {existing.map((x) => <span key={x} className="bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs px-2 py-1 rounded-full">{fmtShort(x)}</span>)}
              </div>
            </div>
          )}
          <Button className="w-full" onClick={add}>เพิ่มและบันทึกลงปฏิทิน</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── SiteDetail ───────────────────────────────────────────────────────────
export function SiteDetailModal({
  open, onClose, site, logs, expenses, siteSummary, onSave, onAddLog, onEditLog, onAddExp, onEditExp, onDeleteLog, onDeleteExp, onExport,
}: {
  open: boolean; onClose: () => void; site: Site | null; logs: WorkLog[]; expenses: Expense[];
  siteSummary: (id: string) => { income: number; totalExp: number; profit: number };
  onSave: (d: Partial<Site>) => Promise<void>;
  onAddLog: () => void; onEditLog: (l: WorkLog) => void; onAddExp: () => void; onEditExp: (e: Expense) => void;
  onDeleteLog: (id: string) => void; onDeleteExp: (id: string) => void;
  onExport?: () => void;
}) {
  if (!site) return null;
  const { income, totalExp, profit } = siteSummary(site.id);
  const siteLogs = [...logs.filter((l) => l.site_id === site.id)].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const siteExps = [...expenses.filter((e) => e.site_id === site.id)].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const catColorMap = Object.fromEntries(EXP_CATS.map((c) => [c.label, c.color]));
  const pct = income > 0 ? Math.min(100, (totalExp / income) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <div className="flex-1">
            <DialogTitle>{site.name}</DialogTitle>
            <div className="flex gap-2 mt-1 text-xs text-zinc-500">
              {site.client && <span>👤 {site.client}</span>}
              {site.address && <span>📍 {site.address}</span>}
            </div>
          </div>
          {onExport && (
            <Button variant="secondary" size="sm" onClick={onExport} className="mr-8">
              📤 ส่งออก
            </Button>
          )}
          <DialogClose />
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "รายรับ", val: income, color: "text-emerald-400" },
            { label: "รายจ่าย", val: totalExp, color: "text-rose-400" },
            { label: "กำไร", val: profit, color: profit >= 0 ? "text-emerald-400" : "text-rose-400" },
          ].map((k) => (
            <div key={k.label} className="bg-zinc-800/60 rounded-xl p-3 text-center">
              <div className={cn("font-mono font-bold text-sm", k.color)}>฿{fmtMoney(k.val)}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{k.label}</div>
            </div>
          ))}
        </div>

        <div className="mb-4 space-y-1">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>ใช้ไป {Math.round(pct)}%</span><span>฿{fmtMoney(totalExp)} / ฿{fmtMoney(income)}</span>
          </div>
          <Progress value={pct} color={pct > 80 ? "bg-rose-400" : pct > 50 ? "bg-yellow-400" : "bg-emerald-400"} />
        </div>

        <div className="flex gap-2 mb-4">
          {STATUSES.map((st) => (
            <button key={st} onClick={() => onSave({ status: st })}
              className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                site.status === st ? STATUS_BG[st] : "border-zinc-700 text-zinc-500 hover:border-zinc-500")}>
              {st}
            </button>
          ))}
        </div>

        <Tabs defaultValue="logs">
          <TabsList className="w-full">
            <TabsTrigger value="logs">📋 งาน ({siteLogs.length})</TabsTrigger>
            <TabsTrigger value="exps">💸 ค่าใช้จ่าย ({siteExps.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="logs">
            <Button variant="secondary" size="sm" className="w-full mb-3" onClick={onAddLog}>
              <Plus className="h-3.5 w-3.5" /> เพิ่มบันทึกงาน
            </Button>
            {siteLogs.length === 0 && <p className="text-center text-zinc-600 text-sm py-6">ยังไม่มีบันทึกงาน</p>}
            {siteLogs.map((l) => (
              <div key={l.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 mb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-sky-400 uppercase">{l.category}</span>
                    <span className="text-[10px] text-zinc-500 ml-2">{fmtDate(l.date)}</span>
                    <p className="text-sm text-zinc-200 mt-0.5">{l.detail}</p>
                    {l.note && <p className="text-xs text-zinc-500 mt-1 italic">{l.note}</p>}
                    {l.photos && l.photos.length > 0 && (
                      <div className="grid grid-cols-4 gap-1.5 mt-2">
                        {l.photos.map((u, i) => (
                          <a key={i} href={u} target="_blank" rel="noreferrer">
                            <img src={u} className="w-full h-16 object-cover rounded-md border border-zinc-700" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono font-bold text-yellow-400 text-sm">{l.qty} {l.unit}</span>
                    <button onClick={() => onEditLog(l)} className="text-zinc-500 hover:text-yellow-400 p-1"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => onDeleteLog(l.id)} className="text-zinc-500 hover:text-rose-400 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="exps">
            <Button variant="secondary" size="sm" className="w-full mb-3" onClick={onAddExp}>
              <Plus className="h-3.5 w-3.5" /> เพิ่มค่าใช้จ่าย
            </Button>
            {siteExps.length === 0 && <p className="text-center text-zinc-600 text-sm py-6">ยังไม่มีรายการ</p>}
            {siteExps.map((e) => (
              <div key={e.id} className="flex items-center gap-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 mb-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: catColorMap[e.category] || "#94a3b8" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{e.name || e.category}</p>
                  <p className="text-xs text-zinc-500">{e.category} · {fmtDate(e.date)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-mono font-bold text-rose-400 text-sm">฿{fmtMoney(e.amount)}</span>
                  <button onClick={() => onEditExp(e)} className="text-zinc-500 hover:text-yellow-400 p-1"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => onDeleteExp(e.id)} className="text-zinc-500 hover:text-rose-400 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
