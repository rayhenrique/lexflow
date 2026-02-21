import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireGestor } from "@/lib/users/api-helpers";
import type { AppRole } from "@/lib/types";

interface CreateUserBody {
  email: string;
  password: string;
  name: string;
  role: AppRole;
  defaultWorkspaceId: string | null;
  workspaceIds: string[];
}

export async function POST(request: Request) {
  const auth = await requireGestor();

  if ("error" in auth) {
    if (auth.error === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  let body: CreateUserBody;
  try {
    body = (await request.json()) as CreateUserBody;
  } catch {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();
  const name = body.name?.trim();
  const role = body.role;
  const workspaceIds = body.workspaceIds ?? [];
  const defaultWorkspaceId = body.defaultWorkspaceId;

  if (!email || !password || !name || !role) {
    return NextResponse.json({ message: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ message: "Senha deve ter pelo menos 8 caracteres." }, { status: 400 });
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

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { message: error?.message ?? "Não foi possível criar usuário." },
        { status: 400 },
      );
    }

    const userId = data.user.id;

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        user_id: userId,
        email,
        name,
        role,
        default_workspace_id: defaultWorkspaceId,
      },
      { onConflict: "user_id" },
    );

    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ message: profileError.message }, { status: 400 });
    }

    if (workspaceIds.length > 0) {
      const { error: membershipsError } = await admin
        .from("workspace_memberships")
        .insert(
          workspaceIds.map((workspaceId) => ({
            user_id: userId,
            workspace_id: workspaceId,
          })),
        );

      if (membershipsError) {
        await admin.auth.admin.deleteUser(userId);
        return NextResponse.json({ message: membershipsError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true, userId }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno ao criar usuário.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
