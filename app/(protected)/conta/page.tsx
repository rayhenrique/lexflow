import { redirect } from "next/navigation";
import { AccountSettingsForm } from "@/components/account/account-settings-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ProfileRow {
  name: string | null;
  role: "gestor" | "associado";
  default_workspace_id: string | null;
}

interface MembershipRow {
  workspace_id: string;
  workspaces: {
    id: string;
    name: string;
  } | null;
}

export default async function ContaPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, role, default_workspace_id")
      .eq("user_id", user.id)
      .maybeSingle<ProfileRow>(),
    supabase
      .from("workspace_memberships")
      .select("workspace_id, workspaces(id, name)")
      .eq("user_id", user.id)
      .returns<MembershipRow[]>(),
  ]);

  const defaultWorkspace = (memberships ?? []).find(
    (membership) => membership.workspace_id === profile?.default_workspace_id,
  );
  const safeMemberships = memberships ?? [];

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900">Conta</h1>
        <p className="text-sm text-zinc-500">
          Informações do usuário autenticado e permissões de acesso.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Nome" value={profile?.name?.trim() || "Sem nome"} />
            <Field label="Email" value={user.email ?? "Sem email"} />
            <Field label="User ID" value={user.id} mono />
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Perfil
              </p>
              <Badge variant={profile?.role === "gestor" ? "gestor" : "associado"}>
                {profile?.role ?? "associado"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissões</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field
              label="Área padrão"
              value={defaultWorkspace?.workspaces?.name ?? "Sem área padrão"}
            />
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Áreas vinculadas
              </p>
              <div className="flex flex-wrap gap-2">
                {safeMemberships.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nenhuma área vinculada.</p>
                ) : (
                  safeMemberships.map((membership) => (
                    <Badge key={membership.workspace_id} variant="default">
                      {membership.workspaces?.name ?? membership.workspace_id}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações da Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountSettingsForm
            userId={user.id}
            initialName={profile?.name?.trim() || ""}
          />
        </CardContent>
      </Card>
    </section>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p
        className={[
          "rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700",
          mono ? "font-mono" : "",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}
