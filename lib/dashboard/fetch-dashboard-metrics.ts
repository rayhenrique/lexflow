import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardMetrics, WorkspaceScope } from "@/lib/types";

interface TransactionSummaryRow {
  type: "receita" | "despesa";
  amount: number | string;
  status: "pago" | "pendente" | "atrasado";
  workspace_id: string;
}

const emptyMetrics: DashboardMetrics = {
  receitas: 0,
  despesas: 0,
  saldo: 0,
  inadimplencia: 0,
};

export async function fetchDashboardMetrics(
  supabase: SupabaseClient,
  workspaceId: WorkspaceScope,
) {
  let query = supabase
    .from("transactions")
    .select("type, amount, status, workspace_id");

  if (workspaceId !== "all") {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as TransactionSummaryRow[];

  if (!rows.length) {
    return emptyMetrics;
  }

  const metrics = rows.reduce<DashboardMetrics>((acc, row) => {
    const amount = Number(row.amount);

    if (row.type === "receita") {
      acc.receitas += amount;
    }

    if (row.type === "despesa") {
      acc.despesas += amount;
    }

    if (row.status === "atrasado") {
      acc.inadimplencia += amount;
    }

    return acc;
  }, { ...emptyMetrics });

  metrics.saldo = metrics.receitas - metrics.despesas;
  return metrics;
}
