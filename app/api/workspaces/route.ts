import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireGestor } from "@/lib/users/api-helpers";

interface CreateWorkspaceBody {
  name: string;
  slug?: string;
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

export async function GET() {
  const auth = await requireGestor();

  if ("error" in auth) {
    if (auth.error === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("workspaces")
      .select("id, name, slug, is_matrix, created_at")
      .order("is_matrix", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ items: data ?? [] }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno ao listar áreas.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireGestor();

  if ("error" in auth) {
    if (auth.error === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  let body: CreateWorkspaceBody;
  try {
    body = (await request.json()) as CreateWorkspaceBody;
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
    const { data, error } = await admin
      .from("workspaces")
      .insert({
        name,
        slug,
        is_matrix: false,
      })
      .select("id, name, slug, is_matrix, created_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, item: data }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno ao criar área.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
