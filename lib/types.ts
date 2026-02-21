export type AppRole = "gestor" | "associado";
export type TransactionStatus = "pendente" | "pago" | "cancelado";

export type WorkspaceScope = string | "all";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  is_matrix: boolean;
}

export interface Profile {
  user_id: string;
  name?: string | null;
  email?: string | null;
  role: AppRole;
  default_workspace_id: string | null;
}

export interface DashboardMetrics {
  receitas: number;
  despesas: number;
  saldo: number;
  inadimplencia: number;
}

export interface UserRecord {
  user_id: string;
  name: string | null;
  email: string | null;
  role: AppRole;
  default_workspace_id: string | null;
  workspace_ids: string[];
  created_at: string;
}

export interface ClientRecord {
  id: string;
  workspace_id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  address: string | null;
  process_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface ClassificationRecord {
  id: string;
  workspace_id: string;
  name: string;
  code: string;
  description: string | null;
  active: boolean;
  created_at: string;
}

export interface RevenueRecord {
  id: string;
  workspace_id: string;
  client_id: string | null;
  description: string;
  amount: number;
  occurred_on: string;
  status: TransactionStatus;
  classification_id: string;
  notes: string | null;
  created_at: string;
}

export interface ExpenseRecord {
  id: string;
  workspace_id: string;
  client_id: string | null;
  description: string;
  amount: number;
  occurred_on: string;
  status: TransactionStatus;
  classification_id: string;
  notes: string | null;
  created_at: string;
}
