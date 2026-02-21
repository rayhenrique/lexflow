import { CategoriasModule } from "@/components/cadastros/categorias-module";

export default function CadastrosCategoriasPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900">Categorias</h1>
        <p className="text-sm text-zinc-500">
          Classificações de receitas e despesas em visualização por abas.
        </p>
      </div>
      <CategoriasModule />
    </section>
  );
}
