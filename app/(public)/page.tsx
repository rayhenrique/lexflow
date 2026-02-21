import Link from "next/link";
import { ArrowRight, MessageCircle, ShieldCheck, Zap, Scale } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";

const highlights = [
  {
    title: "Segurança por área",
    description: "Isolamento de dados por Workspace com RLS nativo no PostgreSQL.",
    icon: ShieldCheck,
  },
  {
    title: "Operação rápida",
    description: "Lançamentos e leitura financeira em interface limpa, sem ruído.",
    icon: Zap,
  },
  {
    title: "Visão Matriz",
    description: "Gestão consolidada e filtro instantâneo por área de atuação.",
    icon: Scale,
  },
];

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(24,24,27,0.06),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(24,24,27,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.03)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-12 md:px-8 md:py-14 lg:px-12 lg:py-16">
        <section className="space-y-6">
          <Logo />
          <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Micro-ERP Financeiro Jurídico
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-4xl md:text-5xl lg:text-6xl">
            Controle financeiro por área de atuação, com segurança de dados em
            nível de banco.
          </h1>
          <p className="max-w-2xl text-base leading-snug text-zinc-500 md:text-lg lg:text-xl">
            O LexFlow centraliza receitas, despesas e fluxo de caixa do escritório
            com visão Matriz para o gestor e isolamento para associados.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="w-full sm:w-auto" asChild>
              <Link href="/login">
                Entrar no sistema
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button className="w-full sm:w-auto" variant="outline" asChild>
              <a
                href="https://wa.me/5582996304742?text=Preciso%20de%20suporte%20no%20sistema%20LexFlow."
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Pedir Suporte
              </a>
            </Button>
          </div>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title}>
                <CardHeader className="space-y-3 pb-2">
                  <div className="w-fit rounded-md border border-zinc-200 bg-zinc-50 p-2">
                    <Icon className="h-5 w-5 text-zinc-900" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-zinc-500">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="mt-10">
          <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-zinc-200/50 bg-zinc-50/50 p-1 shadow-2xl shadow-zinc-900/10 ring-1 ring-zinc-200/50 backdrop-blur-sm sm:p-2 md:p-4">
            <div className="aspect-video w-full rounded-lg border border-zinc-200 bg-white p-3 sm:p-4 md:p-6">
              <div className="flex h-full flex-col gap-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-lg font-semibold text-zinc-900">Dashboard</p>
                    <p className="text-xs text-zinc-500">Resumo financeiro por área de atuação</p>
                  </div>
                  <div className="hidden items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 sm:flex">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Online
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Saldo Atual</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-600">R$ 78.420</p>
                  </div>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Receitas</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-600">R$ 124.900</p>
                  </div>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Despesas</p>
                    <p className="mt-1 text-lg font-semibold text-rose-600">R$ 46.480</p>
                  </div>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">A Receber</p>
                    <p className="mt-1 text-lg font-semibold text-amber-600">R$ 31.200</p>
                  </div>
                </div>

                <div className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-12">
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 lg:col-span-8">
                    <p className="mb-3 text-xs text-zinc-500">Fluxo de Caixa</p>
                    <div className="flex h-[120px] items-end gap-2">
                      {[38, 54, 42, 70, 58, 84, 64].map((height, index) => (
                        <div
                          key={height}
                          className="w-full rounded-t bg-emerald-500/80 animate-pulse"
                          style={{
                            height: `${height}%`,
                            animationDelay: `${index * 140}ms`,
                            animationDuration: "2.4s",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 lg:col-span-4">
                    <p className="mb-3 text-xs text-zinc-500">Próximos vencimentos</p>
                    <div className="space-y-2">
                      {[
                        "Honorários - Família",
                        "Taxa cartório - Cível",
                        "Internet escritório",
                      ].map((item) => (
                        <div
                          key={item}
                          className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-[11px] text-zinc-600"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
