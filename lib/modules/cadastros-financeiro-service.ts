import type { SupabaseClient } from "@supabase/supabase-js";
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
    .select("id, workspace_id, client_id, description, amount, occurred_on, status, classification_id, notes, created_at")
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
  });
  if (error) throw new Error(error.message);
}

export async function fetchExpenses(
  supabase: SupabaseClient,
  workspaceId: WorkspaceScope,
) {
  let query = supabase
    .from("expenses")
    .select("id, workspace_id, client_id, description, amount, occurred_on, status, classification_id, notes, created_at")
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
  });
  if (error) throw new Error(error.message);
}
