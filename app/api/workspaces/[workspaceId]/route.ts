import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireGestor } from "@/lib/users/api-helpers";

interface UpdateWorkspaceBody {
  name: string;
  slug?: string;
}

interface WorkspaceRow {
  id: string;
  is_matrix: boolean;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function loadWorkspace(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  workspaceId: string,
) {
  const { data, error } = await admin
    .from("workspaces")
    .select("id, is_matrix")
    .eq("id", workspaceId)
    .maybeSingle<WorkspaceRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const auth = await requireGestor();

  if ("error" in auth) {
    if (auth.error === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { workspaceId } = await params;

  let body: UpdateWorkspaceBody;
  try {
    body = (await request.json()) as UpdateWorkspaceBody;
  } catch {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  const name = body.name?.trim();
  const slugInput = body.slug?.trim() ?? "";
  const slug = slugify(slugInput || name || "");

  if (!name) {
    return NextResponse.json({ message: "Nome é obrigatório." }, { status: 400 });
  }

  if (!slug) {
    return NextResponse.json(
      { message: "Slug inválido. Use letras, números e hífen." },
      { status: 400 },
    );
  }

  try {
    const admin = createSupabaseAdminClient();
    const current = await loadWorkspace(admin, workspaceId);

    if (!current) {
      return NextResponse.json({ message: "Área não encontrada." }, { status: 404 });
    }

    if (current.is_matrix) {
      return NextResponse.json(
        { message: "A área Matriz não pode ser editada por este módulo." },
        { status: 400 },
      );
    }

    const { data, error } = await admin
      .from("workspaces")
      .update({ name, slug })
      .eq("id", workspaceId)
      .select("id, name, slug, is_matrix, created_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, item: data }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno ao atualizar área.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const auth = await requireGestor();

  if ("error" in auth) {
    if (auth.error === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { workspaceId } = await params;

  try {
    const admin = createSupabaseAdminClient();
    const current = await loadWorkspace(admin, workspaceId);

    if (!current) {
      return NextResponse.json({ message: "Área não encontrada." }, { status: 404 });
    }

    if (current.is_matrix) {
      return NextResponse.json(
        { message: "A área Matriz não pode ser excluída." },
        { status: 400 },
      );
    }

    const countTables = [
      "workspace_memberships",
      "clients",
      "revenues",
      "expenses",
      "revenue_classifications",
      "expense_classifications",
      "transactions",
    ] as const;

    for (const table of countTables) {
      const { count, error } = await admin
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId);

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }

      if ((count ?? 0) > 0) {
        return NextResponse.json(
          {
            message:
              "Esta área possui vínculos/dados e não pode ser excluída. Remova os vínculos antes.",
          },
          { status: 400 },
        );
      }
    }

    const { error } = await admin.from("workspaces").delete().eq("id", workspaceId);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno ao excluir área.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
