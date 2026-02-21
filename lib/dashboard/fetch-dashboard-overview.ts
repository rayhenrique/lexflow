import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkspaceScope } from "@/lib/types";

interface RevenueRow {
  id: string;
  description: string;
  amount: number | string;
  occurred_on: string;
  status: "pendente" | "pago" | "cancelado";
}

interface ExpenseRow {
  id: string;
  description: string;
  amount: number | string;
  occurred_on: string;
  status: "pendente" | "pago" | "cancelado";
}

export type DashboardPeriodicity =
  | "mensal"
  | "bimestral"
  | "trimestral"
  | "quadrimestral"
  | "semestral"
  | "anual";

const PERIODICITY_MONTHS: Record<DashboardPeriodicity, number> = {
  mensal: 1,
  bimestral: 2,
  trimestral: 3,
  quadrimestral: 4,
  semestral: 6,
  anual: 12,
};

export interface DashboardOverviewData {
  kpis: {
    saldoAtual: number;
    receitasPagas: number;
    despesasPagas: number;
    aReceber: number;
  };
  monthlyFlow: Array<{
    periodKey: string;
    periodLabel: string;
    receitas: number;
    despesas: number;
  }>;
  upcoming: Array<{
    id: string;
    kind: "receber" | "pagar";
    description: string;
    amount: number;
    occurredOn: string;
    status: "pendente" | "pago" | "cancelado";
  }>;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthShortLabel(year: number, monthIndex: number) {
  const label = new Date(year, monthIndex, 1)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

interface PeriodRange {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

function buildPeriods(year: number, periodicity: DashboardPeriodicity): PeriodRange[] {
  const size = PERIODICITY_MONTHS[periodicity];
  const periods: PeriodRange[] = [];

  for (let startMonth = 0; startMonth < 12; startMonth += size) {
    const endMonth = Math.min(startMonth + size - 1, 11);
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, endMonth + 1, 0);
    const startLabel = monthShortLabel(year, startMonth);
    const endLabel = monthShortLabel(year, endMonth);
    const label =
      size === 12
        ? `${year}`
        : startMonth === endMonth
          ? startLabel
          : `${startLabel}-${endLabel}`;

    periods.push({
      key: `${year}-${String(startMonth + 1).padStart(2, "0")}`,
      label,
      start,
      end,
    });
  }

  return periods;
}

function getCurrentPeriod(year: number, periodicity: DashboardPeriodicity, now: Date) {
  const periods = buildPeriods(year, periodicity);
  const step = PERIODICITY_MONTHS[periodicity];
  const periodIndex =
    year === now.getFullYear()
      ? Math.min(Math.floor(now.getMonth() / step), periods.length - 1)
      : periods.length - 1;
  return {
    periods,
    currentPeriod: periods[periodIndex],
  };
}

function sumValues(rows: Array<{ amount: number | string }>) {
  return rows.reduce((acc, row) => acc + Number(row.amount || 0), 0);
}

export async function fetchDashboardOverview(
  supabase: SupabaseClient,
  workspaceId: WorkspaceScope,
  year: number,
  periodicity: DashboardPeriodicity,
): Promise<DashboardOverviewData> {
  const now = new Date();
  const { periods, currentPeriod } = getCurrentPeriod(year, periodicity, now);
  const periodStartIso = toIsoDate(currentPeriod.start);
  const periodEndIso = toIsoDate(currentPeriod.end);
  const yearStartIso = toIsoDate(new Date(year, 0, 1));
  const yearEndIso = toIsoDate(new Date(year, 11, 31));

  let paidRevenuesMonthQuery = supabase
    .from("revenues")
    .select("id, description, amount, occurred_on, status")
    .eq("status", "pago")
    .gte("occurred_on", periodStartIso)
    .lte("occurred_on", periodEndIso);

  let paidExpensesMonthQuery = supabase
    .from("expenses")
    .select("id, description, amount, occurred_on, status")
    .eq("status", "pago")
    .gte("occurred_on", periodStartIso)
    .lte("occurred_on", periodEndIso);

  let pendingReceivablesQuery = supabase
    .from("revenues")
    .select("id, description, amount, occurred_on, status")
    .eq("status", "pendente")
    .lte("occurred_on", periodEndIso);

  let revenuesSixMonthsQuery = supabase
    .from("revenues")
    .select("id, description, amount, occurred_on, status")
    .eq("status", "pago")
    .gte("occurred_on", yearStartIso)
    .lte("occurred_on", yearEndIso);

  let expensesSixMonthsQuery = supabase
    .from("expenses")
    .select("id, description, amount, occurred_on, status")
    .eq("status", "pago")
    .gte("occurred_on", yearStartIso)
    .lte("occurred_on", yearEndIso);

  let pendingRevenuesQuery = supabase
    .from("revenues")
    .select("id, description, amount, occurred_on, status")
    .eq("status", "pendente")
    .lte("occurred_on", periodEndIso)
    .order("occurred_on", { ascending: true })
    .limit(20);

  let pendingExpensesQuery = supabase
    .from("expenses")
    .select("id, description, amount, occurred_on, status")
    .eq("status", "pendente")
    .lte("occurred_on", periodEndIso)
    .order("occurred_on", { ascending: true })
    .limit(20);

  if (workspaceId !== "all") {
    paidRevenuesMonthQuery = paidRevenuesMonthQuery.eq("workspace_id", workspaceId);
    paidExpensesMonthQuery = paidExpensesMonthQuery.eq("workspace_id", workspaceId);
    pendingReceivablesQuery = pendingReceivablesQuery.eq("workspace_id", workspaceId);
    revenuesSixMonthsQuery = revenuesSixMonthsQuery.eq("workspace_id", workspaceId);
    expensesSixMonthsQuery = expensesSixMonthsQuery.eq("workspace_id", workspaceId);
    pendingRevenuesQuery = pendingRevenuesQuery.eq("workspace_id", workspaceId);
    pendingExpensesQuery = pendingExpensesQuery.eq("workspace_id", workspaceId);
  }

  const [
    paidRevenuesMonthResult,
    paidExpensesMonthResult,
    pendingReceivablesResult,
    revenuesSixMonthsResult,
    expensesSixMonthsResult,
    pendingRevenuesResult,
    pendingExpensesResult,
  ] = await Promise.all([
    paidRevenuesMonthQuery,
    paidExpensesMonthQuery,
    pendingReceivablesQuery,
    revenuesSixMonthsQuery,
    expensesSixMonthsQuery,
    pendingRevenuesQuery,
    pendingExpensesQuery,
  ]);

  const errors = [
    paidRevenuesMonthResult.error,
    paidExpensesMonthResult.error,
    pendingReceivablesResult.error,
    revenuesSixMonthsResult.error,
    expensesSixMonthsResult.error,
    pendingRevenuesResult.error,
    pendingExpensesResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors[0]?.message ?? "Erro ao carregar dashboard.");
  }

  const paidRevenuesMonth = (paidRevenuesMonthResult.data ?? []) as RevenueRow[];
  const paidExpensesMonth = (paidExpensesMonthResult.data ?? []) as ExpenseRow[];
  const pendingReceivables = (pendingReceivablesResult.data ?? []) as RevenueRow[];
  const revenuesSixMonths = (revenuesSixMonthsResult.data ?? []) as RevenueRow[];
  const expensesSixMonths = (expensesSixMonthsResult.data ?? []) as ExpenseRow[];
  const pendingRevenues = (pendingRevenuesResult.data ?? []) as RevenueRow[];
  const pendingExpenses = (pendingExpensesResult.data ?? []) as ExpenseRow[];

  const receitasPagas = sumValues(paidRevenuesMonth);
  const despesasPagas = sumValues(paidExpensesMonth);
  const saldoAtual = receitasPagas - despesasPagas;
  const aReceber = sumValues(pendingReceivables);

  const monthlyFlow = periods.map((period) => {
    const startIso = toIsoDate(period.start);
    const endIso = toIsoDate(period.end);

    const receitas = revenuesSixMonths
      .filter((row) => row.occurred_on >= startIso && row.occurred_on <= endIso)
      .reduce((acc, row) => acc + Number(row.amount), 0);
    const despesas = expensesSixMonths
      .filter((row) => row.occurred_on >= startIso && row.occurred_on <= endIso)
      .reduce((acc, row) => acc + Number(row.amount), 0);

    return {
      periodKey: period.key,
      periodLabel: period.label,
      receitas,
      despesas,
    };
  });

  const upcoming = [
    ...pendingRevenues.map((item) => ({
      id: `r-${item.id}`,
      kind: "receber" as const,
      description: item.description,
      amount: Number(item.amount),
      occurredOn: item.occurred_on,
      status: item.status,
    })),
    ...pendingExpenses.map((item) => ({
      id: `d-${item.id}`,
      kind: "pagar" as const,
      description: item.description,
      amount: Number(item.amount),
      occurredOn: item.occurred_on,
      status: item.status,
    })),
  ]
    .sort((a, b) => a.occurredOn.localeCompare(b.occurredOn))
    .slice(0, 10);

  return {
    kpis: {
      saldoAtual,
      receitasPagas,
      despesasPagas,
      aReceber,
    },
    monthlyFlow,
    upcoming,
  };
}
