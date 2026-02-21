import { AuditoriaModule } from "@/components/admin/auditoria-module";
import { requireGestorPageAccess } from "@/lib/users/page-helpers";

export default async function AdministracaoAuditoriaPage() {
  await requireGestorPageAccess();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900">Auditoria</h1>
        <p className="text-sm text-zinc-500">
          Histórico de alterações críticas no sistema.
        </p>
      </div>
      <AuditoriaModule />
    </section>
  );
}
