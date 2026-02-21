import { ClientesModule } from "@/components/cadastros/clientes-module";

export default function CadastrosClientesPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900">Clientes</h1>
        <p className="text-sm text-zinc-500">
          Gestão de clientes com foco em listagem e ação rápida.
        </p>
      </div>
      <ClientesModule />
    </section>
  );
}
