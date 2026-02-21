import { BackupModule } from "@/components/admin/backup-module";
import { requireGestorPageAccess } from "@/lib/users/page-helpers";

export default async function AdministracaoBackupPage() {
  await requireGestorPageAccess();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900">Backup e Restauração</h1>
        <p className="text-sm text-zinc-500">
          Exporte e restaure os dados administrativos do escritório.
        </p>
      </div>
      <BackupModule />
    </section>
  );
}
