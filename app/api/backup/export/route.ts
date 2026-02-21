import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireGestor } from "@/lib/users/api-helpers";

interface WorkspaceRow {
  id: string;
  name: string;
  slug: string;
  is_matrix: boolean;
  created_at: string;
}

interface ClientRow {
  id: string;
  workspace_id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  address: string | null;
  process_number: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

interface RevenueRow {
  id: string;
  workspace_id: string;
  client_id: string | null;
  classification_id: string;
  description: string;
  amount: number;
  occurred_on: string;
  status: "pendente" | "pago" | "cancelado";
  notes: string | null;
  created_by: string;
  created_at: string;
}

interface ExpenseRow {
  id: string;
  workspace_id: string;
  client_id: string | null;
  classification_id: string;
  description: string;
  amount: number;
  occurred_on: string;
  status: "pendente" | "pago" | "cancelado";
  notes: string | null;
  created_by: string;
  created_at: string;
}

function nowFileStamp() {
  return new Date().toISOString().replaceAll(":", "-");
}

export async function GET(request: Request) {
  const auth = await requireGestor();

  if ("error" in auth) {
    if (auth.error === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    let workspacesQuery = admin
      .from("workspaces")
      .select("id, name, slug, is_matrix, created_at")
      .order("name", { ascending: true });

    if (workspaceId && workspaceId !== "all") {
      workspacesQuery = workspacesQuery.eq("id", workspaceId);
    }

    const { data: workspaces, error: workspacesError } =
      await workspacesQuery.returns<WorkspaceRow[]>();

    if (workspacesError) {
      return NextResponse.json({ message: workspacesError.message }, { status: 400 });
    }

    const workspaceIds = (workspaces ?? []).map((workspace) => workspace.id);

    if (workspaceIds.length === 0) {
      return NextResponse.json(
        { message: "Nenhum workspace encontrado para exportação." },
        { status: 400 },
      );
    }

    const [clientsResult, revenuesResult, expensesResult] = await Promise.all([
      admin
        .from("clients")
        .select("*")
        .in("workspace_id", workspaceIds)
        .order("created_at", { ascending: true })
        .returns<ClientRow[]>(),
      admin
        .from("revenues")
        .select("*")
        .in("workspace_id", workspaceIds)
        .order("created_at", { ascending: true })
        .returns<RevenueRow[]>(),
      admin
        .from("expenses")
        .select("*")
        .in("workspace_id", workspaceIds)
        .order("created_at", { ascending: true })
        .returns<ExpenseRow[]>(),
    ]);

    if (clientsResult.error) {
      return NextResponse.json({ message: clientsResult.error.message }, { status: 400 });
    }

    if (revenuesResult.error) {
      return NextResponse.json({ message: revenuesResult.error.message }, { status: 400 });
    }

    if (expensesResult.error) {
      return NextResponse.json({ message: expensesResult.error.message }, { status: 400 });
    }

    const backupPayload = {
      generated_at: new Date().toISOString(),
      generated_by: auth.userId,
      workspace_scope: workspaceId && workspaceId !== "all" ? workspaceId : "all",
      data: {
        workspaces: workspaces ?? [],
        clients: clientsResult.data ?? [],
        revenues: revenuesResult.data ?? [],
        expenses: expensesResult.data ?? [],
      },
    };

    return new NextResponse(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="lexflow-backup-${nowFileStamp()}.json"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno ao exportar backup.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
