import { AreasModule } from "@/components/admin/areas-module";
import { requireGestorPageAccess } from "@/lib/users/page-helpers";

export default async function AdministracaoAreasPage() {
  await requireGestorPageAccess();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900">Áreas de Atuação</h1>
        <p className="text-sm text-zinc-500">
          Gerencie o cadastro das áreas usadas para segmentar usuários e lançamentos.
        </p>
      </div>
      <AreasModule />
    </section>
  );
}
