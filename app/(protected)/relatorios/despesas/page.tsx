import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DespesasReportModule } from "@/components/reports/despesas-report-module";

export default function RelatoriosDespesasPage() {
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
        <h1 className="text-2xl font-semibold text-zinc-900">Relatório de Despesas</h1>
        <p className="text-sm text-zinc-500">
          Aplique filtros e visualize o detalhamento de despesas antes de exportar.
        </p>
      </div>
      <DespesasReportModule />
    </section>
  );
}
