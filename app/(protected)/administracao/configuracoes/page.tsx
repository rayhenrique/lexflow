import { ConfiguracoesModule } from "@/components/admin/configuracoes-module";
import { requireGestorPageAccess } from "@/lib/users/page-helpers";

export default async function AdministracaoConfiguracoesPage() {
  await requireGestorPageAccess();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900">Configurações</h1>
        <p className="text-sm text-zinc-500">
          Configure os dados oficiais do escritório para relatórios e documentos.
        </p>
      </div>
      <ConfiguracoesModule />
    </section>
  );
}
