import { DespesasModule } from "@/components/financeiro/despesas-module";

export default function FinanceiroDespesasPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-zinc-900">Despesas</h1>
          <p className="text-sm text-zinc-500">
            Tabela de lançamentos de despesas por área de atuação.
          </p>
        </div>
      </div>
      <DespesasModule />
    </section>
  );
}
