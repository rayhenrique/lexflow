const maybeSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const maybeSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!maybeSupabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined.");
}

if (!maybeSupabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is not defined.",
  );
}

const supabaseUrl: string = maybeSupabaseUrl;
const supabaseAnonKey: string = maybeSupabaseAnonKey;

export { supabaseAnonKey, supabaseUrl };
