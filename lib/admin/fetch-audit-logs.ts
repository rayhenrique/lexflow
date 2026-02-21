import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkspaceScope } from "@/lib/types";

export type AuditAction = "INSERT" | "UPDATE" | "DELETE";

interface AuditLogRow {
  id: string;
  workspace_id: string | null;
  table_name: string;
  record_id: string;
  action: AuditAction;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  user_id: string | null;
  created_at: string;
}

interface ProfileRow {
  user_id: string;
  name: string | null;
  email: string | null;
}

export interface AuditLogItem extends AuditLogRow {
  user_display: string;
}

export async function fetchAuditLogs(
  supabase: SupabaseClient,
  params: {
    workspaceId: WorkspaceScope;
    tableName: string;
    action: "all" | AuditAction;
    page: number;
    pageSize: number;
  },
) {
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = supabase
    .from("audit_logs")
    .select(
      "id, workspace_id, table_name, record_id, action, old_data, new_data, user_id, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.workspaceId !== "all") {
    query = query.eq("workspace_id", params.workspaceId);
  }

  if (params.tableName !== "all") {
    query = query.eq("table_name", params.tableName);
  }

  if (params.action !== "all") {
    query = query.eq("action", params.action);
  }

  const { data, count, error } = await query.returns<AuditLogRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const logs = data ?? [];
  const userIds = Array.from(
    new Set(logs.map((log) => log.user_id).filter((userId): userId is string => Boolean(userId))),
  );

  let profilesById = new Map<string, ProfileRow>();

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, name, email")
      .in("user_id", userIds)
      .returns<ProfileRow[]>();

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    profilesById = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
  }

  const items: AuditLogItem[] = logs.map((log) => {
    const profile = log.user_id ? profilesById.get(log.user_id) : null;
    const userDisplay = profile?.name?.trim() || profile?.email?.trim() || log.user_id || "Sistema";

    return {
      ...log,
      user_display: userDisplay,
    };
  });

  return {
    items,
    total: count ?? 0,
  };
}
