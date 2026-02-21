"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { Download, AlertCircle } from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { fetchReportsData } from "@/lib/reports/fetch-reports-data";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const monthLabelFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR");

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function ReportsModule() {
  const supabase = createSupabaseBrowserClient();
  const { selectedWorkspaceId } = useWorkspace();

  const { data, error, isLoading } = useSWR(
    ["reports-module", selectedWorkspaceId],
    async ([, workspaceId]) => fetchReportsData(supabase, workspaceId),
  );

  const monthlyFlowRows = useMemo(() => {
    if (!data) {
      return [];
    }

    const monthMap = new Map<string, { receitas: number; despesas: number; date: Date }>();
    for (const revenue of data.revenues) {
      if (revenue.status !== "pago") continue;
      const occurredOn = new Date(`${revenue.occurred_on}T00:00:00`);
      const key = `${occurredOn.getFullYear()}-${String(occurredOn.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthMap.get(key) ?? { receitas: 0, despesas: 0, date: new Date(occurredOn.getFullYear(), occurredOn.getMonth(), 1) };
      entry.receitas += Number(revenue.amount);
      monthMap.set(key, entry);
    }

    for (const expense of data.expenses) {
      if (expense.status !== "pago") continue;
      const occurredOn = new Date(`${expense.occurred_on}T00:00:00`);
      const key = `${occurredOn.getFullYear()}-${String(occurredOn.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthMap.get(key) ?? { receitas: 0, despesas: 0, date: new Date(occurredOn.getFullYear(), occurredOn.getMonth(), 1) };
      entry.despesas += Number(expense.amount);
      monthMap.set(key, entry);
    }

    return Array.from(monthMap.entries())
      .map(([, value]) => ({
        label: monthLabelFormatter.format(value.date),
        receitas: value.receitas,
        despesas: value.despesas,
        saldo: value.receitas - value.despesas,
        orderDate: value.date.getTime(),
      }))
      .sort((a, b) => b.orderDate - a.orderDate);
  }, [data]);

  const overdueRows = useMemo(() => {
    if (!data) {
      return [];
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    return data.revenues
      .filter((item) => item.status === "pendente")
      .filter((item) => new Date(`${item.occurred_on}T00:00:00`).getTime() < todayStart)
      .sort((a, b) => a.occurred_on.localeCompare(b.occurred_on));
  }, [data]);

  const expensesByClassificationRows = useMemo(() => {
    if (!data) {
      return [];
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const map = new Map<string, number>();

    for (const expense of data.expenses) {
      const occurredOn = new Date(`${expense.occurred_on}T00:00:00`);
      if (
        occurredOn.getFullYear() !== currentYear ||
        occurredOn.getMonth() !== currentMonth
      ) {
        continue;
      }
      const key = expense.classification_id;
      map.set(key, (map.get(key) ?? 0) + Number(expense.amount));
    }

    return Array.from(map.entries())
      .map(([classificationId, total]) => ({
        classificationId,
        name: data.expenseClassificationsMap[classificationId] ?? "Sem classificação",
        total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  if (isLoading) {
    return <ReportsLoading />;
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar relatórios</AlertTitle>
        <AlertDescription>
          {error?.message ?? "Não foi possível carregar os dados de relatórios."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <Tabs defaultValue="fluxo" className="w-full">
          <TabsList>
            <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="inadimplencia">Inadimplência</TabsTrigger>
            <TabsTrigger value="classificacao">Por Classificação</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="fluxo" className="mt-0">
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-zinc-200 bg-zinc-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-zinc-600">Mês</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-600">Entradas</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-600">Saídas</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-600">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyFlowRows.length === 0 ? (
                        <tr>
                          <td className="px-3 py-8 text-center text-zinc-500" colSpan={4}>
                            Nenhuma movimentação financeira registrada para este período.
                          </td>
                        </tr>
                      ) : (
                        monthlyFlowRows.map((row) => (
                          <tr key={row.label} className="border-b border-zinc-200 last:border-b-0">
                            <td className="px-3 py-2 text-zinc-700 capitalize">{row.label}</td>
                            <td className="px-3 py-2 text-zinc-700">{formatCurrency(row.receitas)}</td>
                            <td className="px-3 py-2 text-zinc-700">{formatCurrency(row.despesas)}</td>
                            <td
                              className={`px-3 py-2 font-medium ${
                                row.saldo >= 0 ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {formatCurrency(row.saldo)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inadimplencia" className="mt-0">
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-zinc-200 bg-zinc-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-zinc-600">Vencimento</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-600">Descrição</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-600">Cliente</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-600">Valor</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdueRows.length === 0 ? (
                        <tr>
                          <td className="px-3 py-8 text-center text-zinc-500" colSpan={5}>
                            Nenhuma receita em atraso na área selecionada.
                          </td>
                        </tr>
                      ) : (
                        overdueRows.map((row) => (
                          <tr key={row.id} className="border-b border-zinc-200 last:border-b-0">
                            <td className="px-3 py-2 text-zinc-700">
                              {dateFormatter.format(new Date(`${row.occurred_on}T00:00:00`))}
                            </td>
                            <td className="px-3 py-2 text-zinc-700">{row.description}</td>
                            <td className="px-3 py-2 text-zinc-700">
                              {row.client_id ? (data.clientsMap[row.client_id] ?? "-") : "-"}
                            </td>
                            <td className="px-3 py-2 text-zinc-700">{formatCurrency(Number(row.amount))}</td>
                            <td className="px-3 py-2 text-zinc-700">
                              <Badge className="border-rose-200 bg-rose-50 text-rose-700">
                                Atrasado
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="classificacao" className="mt-0">
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                {expensesByClassificationRows.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-zinc-500">
                    Nenhuma despesa registrada para o mês atual na área selecionada.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200">
                    {expensesByClassificationRows.map((row) => (
                      <div
                        key={row.classificationId}
                        className="flex items-center justify-between gap-4 px-4 py-3"
                      >
                        <p className="text-sm text-zinc-700">{row.name}</p>
                        <p className="text-sm font-medium text-zinc-900">
                          {formatCurrency(row.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <Button type="button" variant="outline" className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>
    </div>
  );
}

function ReportsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

