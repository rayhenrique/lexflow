import { redirect } from "next/navigation";
import { UsersModule } from "@/components/users/users-module";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function UsuariosPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role !== "gestor") {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Usuários</h1>
        </div>
        <Alert variant="destructive">
          <AlertTitle>Acesso negado</AlertTitle>
          <AlertDescription>
            Apenas gestores podem acessar este módulo.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900">Usuários</h1>
        <p className="text-sm text-zinc-500">
          Gerencie perfil de acesso e áreas vinculadas de cada usuário.
        </p>
      </div>
      <UsersModule />
    </section>
  );
}
