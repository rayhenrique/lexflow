import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { AccessDeniedToast } from "@/components/layout/access-denied-toast";

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <AccessDeniedToast />
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Resumo financeiro por área de atuação.
        </p>
      </div>
      <DashboardOverview />
    </section>
  );
}
