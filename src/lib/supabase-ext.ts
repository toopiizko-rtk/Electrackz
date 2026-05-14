// External Supabase client (user-provided project)
// Publishable key is safe to ship in client code.
import { createClient } from "@supabase/supabase-js";

const URL = "https://zsbuqgdazgkdiskelsdl.supabase.co";
const KEY = "sb_publishable_6FgQh4vKtWiUYULLsbryJg_AM_cJtyL";

export const supabase = createClient(URL, KEY, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const STORAGE_BUCKET = "work-photos";
