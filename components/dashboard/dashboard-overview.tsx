"use client";

import { useMemo, useState, type ReactNode } from "react";
import useSWR from "swr";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  BanknoteArrowDown,
  Wallet,
} from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  type DashboardPeriodicity,
  fetchDashboardOverview,
} from "@/lib/dashboard/fetch-dashboard-overview";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { APP_START_YEAR } from "@/lib/constants";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

const PERIODICITY_LABELS: Record<DashboardPeriodicity, string> = {
  mensal: "Mensal",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
  quadrimestral: "Quadrimestral",
  semestral: "Semestral",
  anual: "Anual",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR");
export function DashboardOverview() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedPeriodicity, setSelectedPeriodicity] = useState<DashboardPeriodicity>("mensal");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { selectedWorkspaceId } = useWorkspace();
  const yearOptions = useMemo(() => {
    const startYear = Math.min(APP_START_YEAR, currentYear);
    const years = Array.from(
      { length: currentYear - startYear + 1 },
      (_, index) => startYear + index,
    );
    return years.sort((a, b) => b - a);
  }, [currentYear]);

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    ["dashboard-overview", selectedWorkspaceId, selectedYear, selectedPeriodicity],
    async ([, workspaceId, year, periodicity]) =>
      fetchDashboardOverview(supabase, workspaceId, year, periodicity),
    {
      revalidateOnFocus: true,
      dedupingInterval: 1000,
      onSuccess: () => setLastUpdatedAt(new Date()),
    },
  );

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await mutate();
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const isRefreshing = isManualRefreshing || isValidating;

  if (!data && error) {
    return (
      <div className="space-y-6">
        <DashboardFilterBar
          selectedYear={selectedYear}
          yearOptions={yearOptions}
          selectedPeriodicity={selectedPeriodicity}
          lastUpdatedAt={lastUpdatedAt}
          isRefreshing={isRefreshing}
          onYearChange={setSelectedYear}
          onPeriodicityChange={setSelectedPeriodicity}
          onRefresh={handleRefresh}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dashboard</AlertTitle>
          <AlertDescription>
            {error.message ?? "Não foi possível buscar os dados do dashboard."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <DashboardFilterBar
          selectedYear={selectedYear}
          yearOptions={yearOptions}
          selectedPeriodicity={selectedPeriodicity}
          lastUpdatedAt={lastUpdatedAt}
          isRefreshing={isRefreshing}
          onYearChange={setSelectedYear}
          onPeriodicityChange={setSelectedPeriodicity}
          onRefresh={handleRefresh}
        />
        <DashboardLoading />
      </div>
    );
  }

  const { kpis, monthlyFlow, upcoming } = data;
  const chartData = monthlyFlow.map((item) => ({
    ...item,
    receitas: Number(item.receitas ?? 0),
    despesas: Number(item.despesas ?? 0),
  }));
  const hasChartData =
    chartData.length > 0 &&
    chartData.some((item) => item.receitas > 0 || item.despesas > 0);

  return (
    <div className="space-y-6">
      <DashboardFilterBar
        selectedYear={selectedYear}
        yearOptions={yearOptions}
        selectedPeriodicity={selectedPeriodicity}
        lastUpdatedAt={lastUpdatedAt}
        isRefreshing={isRefreshing}
        onYearChange={setSelectedYear}
        onPeriodicityChange={setSelectedPeriodicity}
        onRefresh={handleRefresh}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Saldo Atual"
          value={formatCurrency(kpis.saldoAtual)}
          icon={<Wallet className="h-5 w-5" />}
          valueClassName={kpis.saldoAtual >= 0 ? "text-emerald-600" : "text-rose-600"}
          iconClassName="text-zinc-500"
        />
        <KpiCard
          title="Receitas"
          value={formatCurrency(kpis.receitasPagas)}
          icon={<ArrowUpCircle className="h-5 w-5" />}
          valueClassName="text-emerald-600"
          iconClassName="text-emerald-600"
        />
        <KpiCard
          title="Despesas"
          value={formatCurrency(kpis.despesasPagas)}
          icon={<ArrowDownCircle className="h-5 w-5" />}
          valueClassName="text-rose-600"
          iconClassName="text-rose-600"
        />
        <KpiCard
          title="A Receber"
          value={formatCurrency(kpis.aReceber)}
          icon={<BanknoteArrowDown className="h-5 w-5" />}
          valueClassName="text-amber-600"
          iconClassName="text-amber-500"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Fluxo de Caixa ({PERIODICITY_LABELS[selectedPeriodicity]} - {selectedYear})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasChartData ? (
            <div className="h-80 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={chartData} barCategoryGap={18}>
                  <XAxis
                    dataKey="periodLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#71717a", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#71717a", fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(Number(value ?? 0))}
                  />
                  <Tooltip
                    cursor={{ fill: "#fafafa" }}
                    contentStyle={{
                      border: "1px solid #e4e4e7",
                      background: "#ffffff",
                      borderRadius: "8px",
                      boxShadow: "0 1px 2px rgba(0,0,0,.05)",
                    }}
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                  />
                  <Bar dataKey="receitas" fill="#059669" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="despesas" fill="#e11d48" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-zinc-500">
              Nenhuma movimentação financeira registrada para este período.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximos Vencimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-zinc-200">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">Data</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">Descrição</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">Tipo</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.length === 0 ? (
                    <tr>
                      <td className="px-3 py-8 text-center text-zinc-500" colSpan={4}>
                        Sem lançamentos pendentes no momento.
                      </td>
                    </tr>
                  ) : (
                    upcoming.map((item) => (
                      <tr key={item.id} className="border-b border-zinc-200 last:border-b-0">
                        <td className="px-3 py-2 text-zinc-700">
                          {dateFormatter.format(new Date(`${item.occurredOn}T00:00:00`))}
                        </td>
                        <td className="px-3 py-2 text-zinc-700">{item.description}</td>
                        <td className="px-3 py-2 text-zinc-700">
                          {item.kind === "receber" ? (
                            <Badge
                              className="border-emerald-200 bg-emerald-50 text-emerald-700"
                            >
                              Receita
                            </Badge>
                          ) : (
                            <Badge
                              className="border-rose-200 bg-rose-50 text-rose-700"
                            >
                              Despesa
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-zinc-700">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  valueClassName,
  iconClassName,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  valueClassName: string;
  iconClassName: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500">{title}</CardTitle>
        <div className={iconClassName}>{icon}</div>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-semibold ${valueClassName}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-80 w-full" />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}
