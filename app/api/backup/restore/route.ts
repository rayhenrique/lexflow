import { NextResponse } from "next/server";
import { requireGestor } from "@/lib/users/api-helpers";

interface BackupPayload {
  data?: {
    workspaces?: unknown[];
    clients?: unknown[];
    revenues?: unknown[];
    expenses?: unknown[];
  };
}

async function parsePayload(request: Request): Promise<BackupPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { payload?: BackupPayload };
    return body.payload ?? {};
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return {};
  }

  const text = await file.text();
  return JSON.parse(text) as BackupPayload;
}

export async function POST(request: Request) {
  const auth = await requireGestor();

  if ("error" in auth) {
    if (auth.error === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const payload = await parsePayload(request);

    return NextResponse.json(
      {
        ok: true,
        message:
          "Restauração recebida. A restauração completa será processada em background (MVP).",
        summary: {
          workspaces: payload.data?.workspaces?.length ?? 0,
          clients: payload.data?.clients?.length ?? 0,
          revenues: payload.data?.revenues?.length ?? 0,
          expenses: payload.data?.expenses?.length ?? 0,
        },
      },
      { status: 202 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Arquivo de backup inválido.";

    return NextResponse.json({ message }, { status: 400 });
  }
}
