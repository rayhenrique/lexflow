import type { SupabaseClient } from "@supabase/supabase-js";
import { buildStatusFieldsForCreate } from "@/lib/financeiro/status-transition";
import type {
  ClassificationRecord,
  ClientRecord,
  ExpenseRecord,
  RevenueRecord,
  TransactionStatus,
  WorkspaceScope,
} from "@/lib/types";

export async function fetchClients(
  supabase: SupabaseClient,
  workspaceId: WorkspaceScope,
) {
  let query = supabase
    .from("clients")
    .select("id, workspace_id, name, cpf, phone, address, process_number, notes, created_at")
    .order("created_at", { ascending: false });

  if (workspaceId !== "all") {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientRecord[];
}

export async function createClientRecord(
  supabase: SupabaseClient,
  payload: {
    workspaceId: string;
    name: string;
    cpf?: string;
    phone?: string;
    address?: string;
    processNumber?: string;
    notes?: string;
    userId: string;
  },
) {
  const { error } = await supabase.from("clients").insert({
    workspace_id: payload.workspaceId,
    name: payload.name,
    cpf: payload.cpf || null,
    phone: payload.phone || null,
    address: payload.address || null,
    process_number: payload.processNumber || null,
    notes: payload.notes || null,
    created_by: payload.userId,
  });
  if (error) throw new Error(error.message);
}

export async function fetchRevenueClassifications(
  supabase: SupabaseClient,
  workspaceId: WorkspaceScope,
) {
  let query = supabase
    .from("revenue_classifications")
    .select("id, workspace_id, name, code, description, active, created_at")
    .order("created_at", { ascending: false });

  if (workspaceId !== "all") {
    query = query.eq("workspace_id", workspaceId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ClassificationRecord[];
}

export async function createRevenueClassification(
  supabase: SupabaseClient,
  payload: {
    workspaceId: string;
    name: string;
    description?: string;
    active: boolean;
    userId: string;
  },
) {
  const { error } = await supabase.from("revenue_classifications").insert({
    workspace_id: payload.workspaceId,
    name: payload.name,
    description: payload.description || null,
    active: payload.active,
    code: "",
    created_by: payload.userId,
  });
  if (error) throw new Error(error.message);
}

export async function fetchExpenseClassifications(
  supabase: SupabaseClient,
  workspaceId: WorkspaceScope,
) {
  let query = supabase
    .from("expense_classifications")
    .select("id, workspace_id, name, code, description, active, created_at")
    .order("created_at", { ascending: false });

  if (workspaceId !== "all") {
    query = query.eq("workspace_id", workspaceId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ClassificationRecord[];
}

export async function createExpenseClassification(
  supabase: SupabaseClient,
  payload: {
    workspaceId: string;
    name: string;
    description?: string;
    active: boolean;
    userId: string;
  },
) {
  const { error } = await supabase.from("expense_classifications").insert({
    workspace_id: payload.workspaceId,
    name: payload.name,
    description: payload.description || null,
    active: payload.active,
    code: "",
    created_by: payload.userId,
  });
  if (error) throw new Error(error.message);
}

export async function fetchRevenues(
  supabase: SupabaseClient,
  workspaceId: WorkspaceScope,
) {
  let query = supabase
    .from("revenues")
    .select("id, workspace_id, client_id, description, amount, occurred_on, status, paid_on, canceled_at, canceled_reason, classification_id, notes, created_at")
    .order("occurred_on", { ascending: false });

  if (workspaceId !== "all") {
    query = query.eq("workspace_id", workspaceId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as RevenueRecord[];
}

export async function createRevenueRecord(
  supabase: SupabaseClient,
  payload: {
    workspaceId: string;
    clientId?: string | null;
    description: string;
    amount: number;
    occurredOn: string;
    status: TransactionStatus;
    classificationId: string;
    notes?: string;
    userId: string;
  },
) {
  const statusFields = buildStatusFieldsForCreate({
    status: payload.status,
    occurredOn: payload.occurredOn,
  });

  const { error } = await supabase.from("revenues").insert({
    workspace_id: payload.workspaceId,
    client_id: payload.clientId ?? null,
    description: payload.description,
    amount: payload.amount,
    occurred_on: payload.occurredOn,
    status: payload.status,
    classification_id: payload.classificationId,
    notes: payload.notes || null,
    created_by: payload.userId,
    paid_on: statusFields.paid_on,
    canceled_at: statusFields.canceled_at,
    canceled_reason: statusFields.canceled_reason,
  });
  if (error) throw new Error(error.message);
}

export async function fetchExpenses(
  supabase: SupabaseClient,
  workspaceId: WorkspaceScope,
) {
  let query = supabase
    .from("expenses")
    .select("id, workspace_id, client_id, description, amount, occurred_on, status, paid_on, canceled_at, canceled_reason, classification_id, notes, created_at")
    .order("occurred_on", { ascending: false });

  if (workspaceId !== "all") {
    query = query.eq("workspace_id", workspaceId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ExpenseRecord[];
}

export async function createExpenseRecord(
  supabase: SupabaseClient,
  payload: {
    workspaceId: string;
    clientId?: string | null;
    description: string;
    amount: number;
    occurredOn: string;
    status: TransactionStatus;
    classificationId: string;
    notes?: string;
    userId: string;
  },
) {
  const statusFields = buildStatusFieldsForCreate({
    status: payload.status,
    occurredOn: payload.occurredOn,
  });

  const { error } = await supabase.from("expenses").insert({
    workspace_id: payload.workspaceId,
    client_id: payload.clientId ?? null,
    description: payload.description,
    amount: payload.amount,
    occurred_on: payload.occurredOn,
    status: payload.status,
    classification_id: payload.classificationId,
    notes: payload.notes || null,
    created_by: payload.userId,
    paid_on: statusFields.paid_on,
    canceled_at: statusFields.canceled_at,
    canceled_reason: statusFields.canceled_reason,
  });
  if (error) throw new Error(error.message);
}

async function parseJsonResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? "Operação não concluída.");
  }
}

export async function conciliateRevenueStatus(
  revenueId: string,
  payload: {
    targetStatus: TransactionStatus;
    paidOn?: string;
    canceledReason?: string;
  },
) {
  const response = await fetch(`/api/financeiro/revenues/${revenueId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  await parseJsonResponse(response);
}

export async function conciliateExpenseStatus(
  expenseId: string,
  payload: {
    targetStatus: TransactionStatus;
    paidOn?: string;
    canceledReason?: string;
  },
) {
  const response = await fetch(`/api/financeiro/expenses/${expenseId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  await parseJsonResponse(response);
}
