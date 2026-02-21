import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole, Workspace, WorkspaceScope } from "@/lib/types";

interface ProfileRow {
  name: string | null;
  role: AppRole;
  default_workspace_id: string | null;
}

interface MembershipRow {
  workspace_id: string;
}

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, default_workspace_id")
    .eq("user_id", user.id)
    .maybeSingle<ProfileRow>();

  const role: AppRole = profile?.role === "gestor" ? "gestor" : "associado";

  let workspaces: Workspace[] = [];

  if (role === "gestor") {
    const { data } = await supabase
      .from("workspaces")
      .select("id, name, slug, is_matrix")
      .order("is_matrix", { ascending: false })
      .order("name", { ascending: true });

    workspaces = (data ?? []) as Workspace[];
  } else {
    const { data: memberships } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("user_id", user.id)
      .returns<MembershipRow[]>();

    const workspaceIds = (memberships ?? []).map((membership) => membership.workspace_id);

    if (workspaceIds.length > 0) {
      const { data } = await supabase
        .from("workspaces")
        .select("id, name, slug, is_matrix")
        .in("id", workspaceIds)
        .order("name", { ascending: true });

      workspaces = (data ?? []) as Workspace[];
    }
  }

  const initialWorkspaceId: WorkspaceScope =
    role === "gestor"
      ? "all"
      : profile?.default_workspace_id && workspaces.some((item) => item.id === profile.default_workspace_id)
        ? profile.default_workspace_id
        : (workspaces[0]?.id ?? "all");

  return (
    <AppShell
      role={role}
      workspaces={workspaces}
      initialWorkspaceId={initialWorkspaceId}
      userName={profile?.name ?? null}
      userEmail={user.email ?? null}
    >
      {children}
    </AppShell>
  );
}
