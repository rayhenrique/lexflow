import { describe, expect, it } from "vitest";
import {
  buildStatusTransitionPatch,
  validateStatusTransition,
} from "@/lib/financeiro/status-transition";

describe("status-transition", () => {
  it("valida que pendente -> pago exige paidOn", () => {
    const result = validateStatusTransition({
      currentStatus: "pendente",
      targetStatus: "pago",
    });

    expect(result.ok).toBe(false);
    expect(result.message).toContain("Data de pagamento");
  });

  it("aceita cancelamento de qualquer status e seta canceled_at", () => {
    const patch = buildStatusTransitionPatch(
      {
        currentStatus: "pago",
        targetStatus: "cancelado",
        canceledReason: "Estorno",
      },
      "2026-03-02T10:00:00.000Z",
    );

    expect(patch).toEqual({
      status: "cancelado",
      paid_on: null,
      canceled_at: "2026-03-02T10:00:00.000Z",
      canceled_reason: "Estorno",
    });
  });

  it("permite cancelado -> pago com paidOn e limpa campos de cancelamento", () => {
    const patch = buildStatusTransitionPatch(
      {
        currentStatus: "cancelado",
        targetStatus: "pago",
        paidOn: "2026-03-01",
      },
      "2026-03-02T10:00:00.000Z",
    );

    expect(patch).toEqual({
      status: "pago",
      paid_on: "2026-03-01",
      canceled_at: null,
      canceled_reason: null,
    });
  });

  it("bloqueia transicao nao permitida", () => {
    const result = validateStatusTransition({
      currentStatus: "pago",
      targetStatus: "cancelado",
    });

    expect(result.ok).toBe(true);

    const blocked = validateStatusTransition({
      currentStatus: "pago",
      targetStatus: "pago",
    });
    expect(blocked.ok).toBe(false);
  });
});
