"use client";

import useSWR from "swr";
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Scale } from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { fetchDashboardMetrics } from "@/lib/dashboard/fetch-dashboard-metrics";
import type { DashboardMetrics } from "@/lib/types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const defaultMetrics: DashboardMetrics = {
  receitas: 0,
  despesas: 0,
  saldo: 0,
  inadimplencia: 0,
};

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function DashboardMetricsCards() {
  const supabase = createSupabaseBrowserClient();
  const { selectedWorkspaceId } = useWorkspace();

  const { data, error, isLoading } = useSWR(
    ["dashboard-metrics", selectedWorkspaceId],
    async ([, workspaceId]) => fetchDashboardMetrics(supabase, workspaceId),
    {
      revalidateOnFocus: true,
      dedupingInterval: 1000,
    },
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro ao carregar métricas</AlertTitle>
        <AlertDescription>
          {error.message ||
            "Não foi possível buscar os dados financeiros. Verifique RLS e tabelas no Supabase."}
        </AlertDescription>
      </Alert>
    );
  }

  const metrics = data ?? defaultMetrics;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="Receitas"
        value={formatCurrency(metrics.receitas)}
        icon={<ArrowUpCircle className="h-5 w-5" />}
        accentClassName="text-emerald-600"
      />
      <MetricCard
        title="Despesas"
        value={formatCurrency(metrics.despesas)}
        icon={<ArrowDownCircle className="h-5 w-5" />}
        accentClassName="text-rose-600"
      />
      <MetricCard
        title="Saldo"
        value={formatCurrency(metrics.saldo)}
        icon={<Scale className="h-5 w-5" />}
      />
      <MetricCard
        title="Inadimplência"
        value={formatCurrency(metrics.inadimplencia)}
        icon={<AlertTriangle className="h-5 w-5" />}
        accentClassName="text-amber-500"
      />
    </div>
  );
}
