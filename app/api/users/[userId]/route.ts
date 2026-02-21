import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireGestor } from "@/lib/users/api-helpers";
import type { AppRole } from "@/lib/types";

interface UpdateUserBody {
  email: string;
  name: string;
  role: AppRole;
  defaultWorkspaceId: string | null;
  workspaceIds: string[];
  password?: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireGestor();

  if ("error" in auth) {
    if (auth.error === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;

  let body: UpdateUserBody;
  try {
    body = (await request.json()) as UpdateUserBody;
  } catch {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim();
  const role = body.role;
  const defaultWorkspaceId = body.defaultWorkspaceId;
  const workspaceIds = body.workspaceIds ?? [];
  const password = body.password?.trim();

  if (!email || !name || !role) {
    return NextResponse.json({ message: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  if (role === "associado" && workspaceIds.length === 0) {
    return NextResponse.json(
      { message: "Associado precisa ter ao menos uma área vinculada." },
      { status: 400 },
    );
  }

  if (defaultWorkspaceId && !workspaceIds.includes(defaultWorkspaceId)) {
    return NextResponse.json(
      { message: "Área padrão deve existir nas áreas vinculadas." },
      { status: 400 },
    );
  }

  if (password && password.length < 8) {
    return NextResponse.json({ message: "Senha deve ter ao menos 8 caracteres." }, { status: 400 });
  }

  try {
    const admin = createSupabaseAdminClient();

    const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, {
      email,
      ...(password ? { password } : {}),
      user_metadata: { name },
    });

    if (authUpdateError) {
      return NextResponse.json({ message: authUpdateError.message }, { status: 400 });
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        email,
        name,
        role,
        default_workspace_id: defaultWorkspaceId,
      })
      .eq("user_id", userId);

    if (profileError) {
      return NextResponse.json({ message: profileError.message }, { status: 400 });
    }

    const { data: currentMemberships, error: currentMembershipsError } = await admin
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("user_id", userId);

    if (currentMembershipsError) {
      return NextResponse.json({ message: currentMembershipsError.message }, { status: 400 });
    }

    const currentIds = (currentMemberships ?? []).map((membership) => membership.workspace_id);
    const idsToInsert = workspaceIds.filter((workspaceId) => !currentIds.includes(workspaceId));
    const idsToDelete = currentIds.filter((workspaceId) => !workspaceIds.includes(workspaceId));

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await admin
        .from("workspace_memberships")
        .delete()
        .eq("user_id", userId)
        .in("workspace_id", idsToDelete);

      if (deleteError) {
        return NextResponse.json({ message: deleteError.message }, { status: 400 });
      }
    }

    if (idsToInsert.length > 0) {
      const { error: insertError } = await admin
        .from("workspace_memberships")
        .insert(
          idsToInsert.map((workspaceId) => ({
            user_id: userId,
            workspace_id: workspaceId,
          })),
        );

      if (insertError) {
        return NextResponse.json({ message: insertError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno ao atualizar usuário.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireGestor();

  if ("error" in auth) {
    if (auth.error === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;

  if (auth.userId === userId) {
    return NextResponse.json(
      { message: "Não é permitido excluir o próprio usuário gestor." },
      { status: 400 },
    );
  }

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno ao excluir usuário.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
