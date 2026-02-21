import Link from "next/link";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BadgeDollarSign,
  CircleAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RelatoriosPage() {
  const cards = [
    {
      title: "Receitas",
      description: "Detalhamento de entradas por período, cliente e classificação.",
      href: "/relatorios/receitas",
      icon: ArrowUpCircle,
      iconClassName: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Despesas",
      description: "Detalhamento de saídas.",
      href: "/relatorios/despesas",
      icon: ArrowDownCircle,
      iconClassName: "bg-rose-50 text-rose-600",
    },
    {
      title: "Balanço",
      description: "Fluxo de caixa consolidado.",
      href: "/relatorios/balanco",
      icon: BadgeDollarSign,
      iconClassName: "bg-blue-50 text-blue-600",
    },
    {
      title: "Inadimplência",
      description: "Lançamentos atrasados.",
      href: "/relatorios/inadimplencia",
      icon: CircleAlert,
      iconClassName: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900">Relatórios</h1>
        <p className="text-sm text-zinc-500">
          Selecione o tipo de relatório para visualizar ou exportar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="h-full transition-colors hover:border-zinc-300">
                <CardHeader className="space-y-3 pb-2">
                  <div className={`w-fit rounded-md p-2 ${card.iconClassName}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-500">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
