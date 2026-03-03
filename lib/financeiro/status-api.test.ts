import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleStatusTransition } from "@/lib/financeiro/status-api";

vi.mock("@/lib/users/api-helpers", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

describe("status-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 quando nao autenticado", async () => {
    const { requireAuthenticatedUser } = await import("@/lib/users/api-helpers");
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({ error: "unauthorized" });

    const request = new Request("http://localhost/api", {
      method: "PATCH",
      body: JSON.stringify({ targetStatus: "pago", paidOn: "2026-03-02" }),
    });

    const response = await handleStatusTransition("revenues", "abc", request);
    expect(response.status).toBe(401);
  });

  it("retorna 400 para transicao invalida", async () => {
    const { requireAuthenticatedUser } = await import("@/lib/users/api-helpers");
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");

    vi.mocked(requireAuthenticatedUser).mockResolvedValue({ userId: "user-1" });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi
        .fn()
        .mockReturnValueOnce({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: "rev-1", status: "pendente" },
                error: null,
              }),
            }),
          }),
        }),
    } as never);

    const request = new Request("http://localhost/api", {
      method: "PATCH",
      body: JSON.stringify({ targetStatus: "pago" }),
    });

    const response = await handleStatusTransition("revenues", "rev-1", request);
    expect(response.status).toBe(400);
    const body = (await response.json()) as { message: string };
    expect(body.message).toContain("Data de pagamento");
  });

  it("retorna 200 quando aplica transicao", async () => {
    const { requireAuthenticatedUser } = await import("@/lib/users/api-helpers");
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");

    vi.mocked(requireAuthenticatedUser).mockResolvedValue({ userId: "user-1" });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi
        .fn()
        .mockReturnValueOnce({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: "rev-1", status: "pendente" },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: () => ({
            eq: () => ({
              select: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "rev-1",
                    status: "pago",
                    paid_on: "2026-03-02",
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
    } as never);

    const request = new Request("http://localhost/api", {
      method: "PATCH",
      body: JSON.stringify({ targetStatus: "pago", paidOn: "2026-03-02" }),
    });

    const response = await handleStatusTransition("revenues", "rev-1", request);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; record: { status: string } };
    expect(body.ok).toBe(true);
    expect(body.record.status).toBe("pago");
  });
});
