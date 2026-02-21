import { UsersModule } from "@/components/users/users-module";
import { requireGestorPageAccess } from "@/lib/users/page-helpers";

export default async function UsuariosPage() {
  await requireGestorPageAccess();

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
