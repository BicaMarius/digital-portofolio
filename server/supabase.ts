import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const CV_BUCKET = process.env.SUPABASE_CV_BUCKET ?? "portfolio-cv";

let cachedClient: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  cachedClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const getSupabaseClient = (): SupabaseClient => {
  if (!cachedClient) {
    throw new Error(
      "Supabase environment variables are not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return cachedClient;
};
