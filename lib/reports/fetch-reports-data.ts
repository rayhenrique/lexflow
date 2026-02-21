import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkspaceScope } from "@/lib/types";

interface RevenueRow {
  id: string;
  client_id: string | null;
  description: string;
  amount: number;
  occurred_on: string;
  status: "pendente" | "pago" | "cancelado";
}

interface ExpenseRow {
  id: string;
  classification_id: string;
  description: string;
  amount: number;
  occurred_on: string;
  status: "pendente" | "pago" | "cancelado";
}

interface ClientRow {
  id: string;
  name: string;
}

interface ExpenseClassificationRow {
  id: string;
  name: string;
}

export interface ReportsData {
  revenues: RevenueRow[];
  expenses: ExpenseRow[];
  clientsMap: Record<string, string>;
  expenseClassificationsMap: Record<string, string>;
}

export async function fetchReportsData(
  supabase: SupabaseClient,
  workspaceId: WorkspaceScope,
): Promise<ReportsData> {
  let revenuesQuery = supabase
    .from("revenues")
    .select("id, client_id, description, amount, occurred_on, status");
  let expensesQuery = supabase
    .from("expenses")
    .select("id, classification_id, description, amount, occurred_on, status");
  let clientsQuery = supabase.from("clients").select("id, name");
  let expenseClassificationsQuery = supabase
    .from("expense_classifications")
    .select("id, name");

  if (workspaceId !== "all") {
    revenuesQuery = revenuesQuery.eq("workspace_id", workspaceId);
    expensesQuery = expensesQuery.eq("workspace_id", workspaceId);
    clientsQuery = clientsQuery.eq("workspace_id", workspaceId);
    expenseClassificationsQuery = expenseClassificationsQuery.eq("workspace_id", workspaceId);
  }

  const [revenuesResult, expensesResult, clientsResult, expenseClassificationsResult] =
    await Promise.all([
      revenuesQuery,
      expensesQuery,
      clientsQuery,
      expenseClassificationsQuery,
    ]);

  const error =
    revenuesResult.error ||
    expensesResult.error ||
    clientsResult.error ||
    expenseClassificationsResult.error;

  if (error) {
    throw new Error(error.message);
  }

  const clientsMap = Object.fromEntries(
    ((clientsResult.data ?? []) as ClientRow[]).map((item) => [item.id, item.name]),
  );
  const expenseClassificationsMap = Object.fromEntries(
    ((expenseClassificationsResult.data ?? []) as ExpenseClassificationRow[]).map((item) => [
      item.id,
      item.name,
    ]),
  );

  return {
    revenues: (revenuesResult.data ?? []) as RevenueRow[],
    expenses: (expensesResult.data ?? []) as ExpenseRow[],
    clientsMap,
    expenseClassificationsMap,
  };
}

