import { ReceitasModule } from "@/components/financeiro/receitas-module";

export default function FinanceiroReceitasPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-zinc-900">Receitas</h1>
          <p className="text-sm text-zinc-500">
            Tabela de lançamentos de receitas por área de atuação.
          </p>
        </div>
      </div>
      <ReceitasModule />
    </section>
  );
}
