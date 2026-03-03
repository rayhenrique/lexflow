import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/users/api-helpers";
import {
  buildStatusTransitionPatch,
  validateStatusTransition,
} from "@/lib/financeiro/status-transition";
import type { TransactionStatus } from "@/lib/types";

interface TransitionBody {
  targetStatus: TransactionStatus;
  paidOn?: string;
  canceledReason?: string;
}

interface CurrentRow {
  id: string;
  status: TransactionStatus;
}

const TABLES = ["revenues", "expenses"] as const;
type SupportedTable = (typeof TABLES)[number];

function isSupportedTable(table: string): table is SupportedTable {
  return TABLES.includes(table as SupportedTable);
}

export async function handleStatusTransition(
  table: string,
  id: string,
  request: Request,
) {
  if (!isSupportedTable(table)) {
    return NextResponse.json({ message: "Tabela não suportada." }, { status: 400 });
  }

  const auth = await requireAuthenticatedUser();

  if ("error" in auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: TransitionBody;
  try {
    body = (await request.json()) as TransitionBody;
  } catch {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  if (!body.targetStatus) {
    return NextResponse.json({ message: "targetStatus é obrigatório." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data: current, error: currentError } = await supabase
      .from(table)
      .select("id, status")
      .eq("id", id)
      .maybeSingle<CurrentRow>();

    if (currentError) {
      return NextResponse.json({ message: currentError.message }, { status: 400 });
    }

    if (!current) {
      return NextResponse.json({ message: "Registro não encontrado." }, { status: 404 });
    }

    const validation = validateStatusTransition({
      currentStatus: current.status,
      targetStatus: body.targetStatus,
      paidOn: body.paidOn,
      canceledReason: body.canceledReason,
    });

    if (!validation.ok) {
      return NextResponse.json(
        { message: validation.message ?? "Transição inválida." },
        { status: 400 },
      );
    }

    const patch = buildStatusTransitionPatch(
      {
        currentStatus: current.status,
        targetStatus: body.targetStatus,
        paidOn: body.paidOn,
        canceledReason: body.canceledReason,
      },
      new Date().toISOString(),
    );

    const { data: updated, error: updateError } = await supabase
      .from(table)
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (updateError) {
      const status = updateError.code === "42501" ? 403 : 400;
      return NextResponse.json({ message: updateError.message }, { status });
    }

    if (!updated) {
      return NextResponse.json({ message: "Registro não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, record: updated }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno ao conciliar status.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
