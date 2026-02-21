import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BalancoReportModule } from "@/components/reports/balanco-report-module";

export default function RelatoriosBalancoPage() {
  return (
    <section className="space-y-6">
      <Link
        href="/relatorios"
        className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900 print:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>
      <div className="space-y-1 print:hidden">
        <h1 className="text-2xl font-semibold text-zinc-900">Relatório de Balanço</h1>
        <p className="text-sm text-zinc-500">
          Visualize o fluxo consolidado de recebimentos e pagamentos por mês.
        </p>
      </div>
      <BalancoReportModule />
    </section>
  );
}
