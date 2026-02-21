import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireGestor() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" as const };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role !== "gestor") {
    return { error: "forbidden" as const };
  }

  return { userId: user.id };
}
