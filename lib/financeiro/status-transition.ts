import type { TransactionStatus } from "@/lib/types";

export interface StatusTransitionInput {
  currentStatus: TransactionStatus;
  targetStatus: TransactionStatus;
  paidOn?: string | null;
  canceledReason?: string | null;
}

export interface StatusTransitionPatch {
  status: TransactionStatus;
  paid_on: string | null;
  canceled_at: string | null;
  canceled_reason: string | null;
}

export interface StatusTransitionValidation {
  ok: boolean;
  message?: string;
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function validateStatusTransition(
  input: StatusTransitionInput,
): StatusTransitionValidation {
  const { currentStatus, targetStatus, paidOn } = input;

  if (currentStatus === targetStatus) {
    return { ok: false, message: "Transição inválida: status de origem e destino são iguais." };
  }

  if (targetStatus === "cancelado") {
    return { ok: true };
  }

  if (currentStatus === "cancelado" && targetStatus === "pendente") {
    return { ok: true };
  }

  if (currentStatus === "cancelado" && targetStatus === "pago") {
    if (!paidOn?.trim()) {
      return { ok: false, message: "Data de pagamento é obrigatória para status pago." };
    }
    if (!isIsoDate(paidOn.trim())) {
      return { ok: false, message: "Data de pagamento deve estar no formato YYYY-MM-DD." };
    }
    return { ok: true };
  }

  if (currentStatus === "pendente" && targetStatus === "pago") {
    if (!paidOn?.trim()) {
      return { ok: false, message: "Data de pagamento é obrigatória para status pago." };
    }
    if (!isIsoDate(paidOn.trim())) {
      return { ok: false, message: "Data de pagamento deve estar no formato YYYY-MM-DD." };
    }
    return { ok: true };
  }

  if (currentStatus === "pago" && targetStatus === "pendente") {
    return { ok: true };
  }

  return { ok: false, message: "Transição de status não permitida." };
}

export function buildStatusTransitionPatch(
  input: StatusTransitionInput,
  nowIso: string,
): StatusTransitionPatch {
  const validation = validateStatusTransition(input);

  if (!validation.ok) {
    throw new Error(validation.message ?? "Transição inválida.");
  }

  if (input.targetStatus === "pago") {
    return {
      status: "pago",
      paid_on: input.paidOn?.trim() ?? null,
      canceled_at: null,
      canceled_reason: null,
    };
  }

  if (input.targetStatus === "pendente") {
    return {
      status: "pendente",
      paid_on: null,
      canceled_at: null,
      canceled_reason: null,
    };
  }

  return {
    status: "cancelado",
    paid_on: null,
    canceled_at: nowIso,
    canceled_reason: input.canceledReason?.trim() || null,
  };
}

export function buildStatusFieldsForCreate(payload: {
  status: TransactionStatus;
  occurredOn: string;
}) {
  if (payload.status === "pago") {
    return {
      paid_on: payload.occurredOn,
      canceled_at: null,
      canceled_reason: null,
    };
  }

  if (payload.status === "cancelado") {
    return {
      paid_on: null,
      canceled_at: new Date().toISOString(),
      canceled_reason: null,
    };
  }

  return {
    paid_on: null,
    canceled_at: null,
    canceled_reason: null,
  };
}
