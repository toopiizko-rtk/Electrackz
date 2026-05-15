// External Supabase client (user-provided project)
// Publishable key is safe to ship in client code.
import { createClient } from "@supabase/supabase-js";

const URL = "https://wnrnqfyldomposxbwner.supabase.co";
const KEY = "sb_publishable_4y_kyIxg6p5SWCB8Pwyoxw_NxtxAMVR";

export const supabase = createClient(URL, KEY, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const STORAGE_BUCKET = "work-photos";
