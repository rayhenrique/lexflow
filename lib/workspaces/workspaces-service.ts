import type { Workspace } from "@/lib/types";

interface WorkspaceApiRow extends Workspace {
  created_at: string;
}

async function parseJsonResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? "Operação não concluída.");
  }

  return payload;
}

export async function fetchWorkspacesForAdmin() {
  const response = await fetch("/api/workspaces", { method: "GET" });
  const payload = (await parseJsonResponse(response)) as { items?: WorkspaceApiRow[] };
  return payload.items ?? [];
}

export async function createWorkspace(payload: { name: string; slug?: string }) {
  const response = await fetch("/api/workspaces", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  await parseJsonResponse(response);
}

export async function updateWorkspace(
  workspaceId: string,
  payload: { name: string; slug?: string },
) {
  const response = await fetch(`/api/workspaces/${workspaceId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  await parseJsonResponse(response);
}

export async function deleteWorkspace(workspaceId: string) {
  const response = await fetch(`/api/workspaces/${workspaceId}`, {
    method: "DELETE",
  });

  await parseJsonResponse(response);
}
