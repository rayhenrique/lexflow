import { handleStatusTransition } from "@/lib/financeiro/status-api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleStatusTransition("expenses", id, request);
}
