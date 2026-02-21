import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRole, UserRecord, Workspace } from "@/lib/types";

interface ProfileRow {
  user_id: string;
  name?: string | null;
  email?: string | null;
  role: AppRole;
  default_workspace_id: string | null;
  created_at: string;
}

interface MembershipRow {
  user_id: string;
  workspace_id: string;
}

export async function fetchUsersData(supabase: SupabaseClient) {
  const profilesWithEmail = await supabase
    .from("profiles")
    .select("user_id, name, email, role, default_workspace_id, created_at")
    .order("created_at", { ascending: false });

  let profilesData: ProfileRow[] = [];

  if (profilesWithEmail.error?.code === "42703") {
    const fallback = await supabase
      .from("profiles")
      .select("user_id, name, role, default_workspace_id, created_at")
      .order("created_at", { ascending: false });

    if (fallback.error) {
      throw new Error(fallback.error.message);
    }

    profilesData = (fallback.data ?? []).map((row) => ({
      ...row,
      name: row.name ?? null,
      email: null,
    }));
  } else if (profilesWithEmail.error) {
    throw new Error(profilesWithEmail.error.message);
  } else {
    profilesData = (profilesWithEmail.data ?? []) as ProfileRow[];
  }

  const [workspacesResult, membershipsResult] = await Promise.all([
    supabase
      .from("workspaces")
      .select("id, name, slug, is_matrix")
      .order("is_matrix", { ascending: false })
      .order("name", { ascending: true }),
    supabase.from("workspace_memberships").select("user_id, workspace_id"),
  ]);

  if (workspacesResult.error) {
    throw new Error(workspacesResult.error.message);
  }

  if (membershipsResult.error) {
    throw new Error(membershipsResult.error.message);
  }

  const workspaces = (workspacesResult.data ?? []) as Workspace[];
  const memberships = (membershipsResult.data ?? []) as MembershipRow[];
  const membershipsByUser = new Map<string, string[]>();

  for (const membership of memberships) {
    const existing = membershipsByUser.get(membership.user_id) ?? [];
    existing.push(membership.workspace_id);
    membershipsByUser.set(membership.user_id, existing);
  }

  const users: UserRecord[] = profilesData.map((profile) => ({
    ...profile,
    name: profile.name ?? null,
    email: profile.email ?? null,
    workspace_ids: membershipsByUser.get(profile.user_id) ?? [],
  }));

  return { users, workspaces };
}

async function parseJsonResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? "Operação não concluída.");
  }

  return payload;
}

export async function createUserRecord(payload: {
  name: string;
  email: string;
  password: string;
  role: AppRole;
  defaultWorkspaceId: string | null;
  workspaceIds: string[];
}) {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  await parseJsonResponse(response);
}

export async function updateUserRecord(
  userId: string,
  payload: {
    name: string;
    email: string;
    role: AppRole;
    defaultWorkspaceId: string | null;
    workspaceIds: string[];
    password?: string;
  },
) {
  const response = await fetch(`/api/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  await parseJsonResponse(response);
}

export async function deleteUserRecord(userId: string) {
  const response = await fetch(`/api/users/${userId}`, {
    method: "DELETE",
  });

  await parseJsonResponse(response);
}
