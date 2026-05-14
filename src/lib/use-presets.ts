import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type WorkPreset = {
  id: string;
  category: string;
  detail: string;
  unit: string;
  use_count: number;
};

export function useWorkPresets() {
  const [presets, setPresets] = useState<WorkPreset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("work_presets" as any)
      .select("*")
      .order("use_count", { ascending: false });
    setPresets((data ?? []) as unknown as WorkPreset[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const savePreset = async (category: string, detail: string, unit: string) => {
    const trimmed = detail.trim();
    if (!trimmed) return;
    const existing = presets.find((p) => p.category === category && p.detail === trimmed);
    if (existing) {
      const { data } = await supabase
        .from("work_presets" as any)
        .update({ use_count: existing.use_count + 1, unit } as any)
        .eq("id", existing.id)
        .select()
        .single();
      if (data) setPresets((p) => p.map((x) => (x.id === existing.id ? (data as unknown as WorkPreset) : x)));
    } else {
      const { data } = await supabase
        .from("work_presets" as any)
        .insert([{ category, detail: trimmed, unit, use_count: 1 } as any])
        .select()
        .single();
      if (data) setPresets((p) => [data as unknown as WorkPreset, ...p]);
    }
  };

  const deletePreset = async (id: string) => {
    await supabase.from("work_presets" as any).delete().eq("id", id);
    setPresets((p) => p.filter((x) => x.id !== id));
  };

  return { presets, loading, savePreset, deletePreset, refetch: fetchAll };
}
