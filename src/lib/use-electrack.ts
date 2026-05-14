import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase-ext";
import type { Site, WorkLog, Expense } from "./electrack";

function useTable<T extends { id: string }>(table: "sites" | "work_logs" | "expenses", orderCol = "created_at") {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const dataRef = useRef<T[]>([]);
  dataRef.current = data;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from(table).select("*").order(orderCol, { ascending: false });
    setData(((rows ?? []) as unknown) as T[]);
    setLoading(false);
  }, [table, orderCol]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime sync
  useEffect(() => {
    const ch = supabase
      .channel(`rt:${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, (payload: any) => {
        setData((prev) => {
          if (payload.eventType === "INSERT") {
            if (prev.some((r) => r.id === payload.new.id)) return prev;
            return [payload.new as T, ...prev];
          }
          if (payload.eventType === "UPDATE") {
            return prev.map((r) => (r.id === payload.new.id ? (payload.new as T) : r));
          }
          if (payload.eventType === "DELETE") {
            return prev.filter((r) => r.id !== payload.old.id);
          }
          return prev;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [table]);

  return { data, setData, loading, refetch: fetchAll };
}

export function useSites() {
  const { data: sites, setData, loading, refetch } = useTable<Site>("sites");
  const addSite = async (payload: Partial<Site>) => {
    const { data } = await supabase.from("sites").insert([payload as any]).select().single();
    if (data) setData((p) => p.some((s) => s.id === (data as Site).id) ? p : [data as Site, ...p]);
  };
  const updateSite = async (id: string, payload: Partial<Site>) => {
    const { data } = await supabase.from("sites").update(payload as any).eq("id", id).select().single();
    if (data) setData((p) => p.map((s) => (s.id === id ? (data as Site) : s)));
  };
  const deleteSite = async (id: string) => {
    await supabase.from("sites").delete().eq("id", id);
    setData((p) => p.filter((s) => s.id !== id));
  };
  // Calendar sync helper — make sure date is in site.dates
  const ensureDate = async (siteId: string, date: string) => {
    const site = sites.find((s) => s.id === siteId);
    if (!site || !date) return;
    const dates = site.dates || [];
    if (dates.includes(date)) return;
    const next = [...dates, date].sort();
    await updateSite(siteId, { dates: next });
  };
  return { sites, loading, refetch, addSite, updateSite, deleteSite, ensureDate };
}

export function useWorkLogs() {
  const { data: logs, setData, loading, refetch } = useTable<WorkLog>("work_logs", "date");
  const addLog = async (payload: Partial<WorkLog>) => {
    const { data } = await supabase.from("work_logs").insert([payload as any]).select().single();
    if (data) setData((p) => p.some((l) => l.id === (data as WorkLog).id) ? p : [data as WorkLog, ...p]);
  };
  const updateLog = async (id: string, payload: Partial<WorkLog>) => {
    const { data } = await supabase.from("work_logs").update(payload as any).eq("id", id).select().single();
    if (data) setData((p) => p.map((l) => (l.id === id ? (data as WorkLog) : l)));
  };
  const deleteLog = async (id: string) => {
    await supabase.from("work_logs").delete().eq("id", id);
    setData((p) => p.filter((l) => l.id !== id));
  };
  return { logs, loading, refetch, addLog, updateLog, deleteLog };
}

export function useExpenses() {
  const { data: expenses, setData, loading, refetch } = useTable<Expense>("expenses", "date");
  const addExpense = async (payload: Partial<Expense>) => {
    const { data } = await supabase.from("expenses").insert([payload as any]).select().single();
    if (data) setData((p) => p.some((e) => e.id === (data as Expense).id) ? p : [data as Expense, ...p]);
  };
  const updateExpense = async (id: string, payload: Partial<Expense>) => {
    const { data } = await supabase.from("expenses").update(payload as any).eq("id", id).select().single();
    if (data) setData((p) => p.map((e) => (e.id === id ? (data as Expense) : e)));
  };
  const deleteExpense = async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
    setData((p) => p.filter((e) => e.id !== id));
  };
  return { expenses, loading, refetch, addExpense, updateExpense, deleteExpense };
}
