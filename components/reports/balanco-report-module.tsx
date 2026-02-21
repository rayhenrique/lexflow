"use client";

import { useEffect, useState } from "react";
import { Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exportJsonToCsv } from "@/lib/reports/export-utils";
import { ReportHeader } from "@/components/reports/report-header";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface RevenueBalanceRow {
  amount: number;
  occurred_on: string;
  status: "pendente" | "pago" | "cancelado";
}

interface ExpenseBalanceRow {
  amount: number;
  occurred_on: string;
  status: "pendente" | "pago" | "cancelado";
}

interface BalanceMonthRow {
  monthKey: string;
  monthLabel: string;
  totalRecebido: number;
  totalPago: number;
  saldo: number;
}

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function currentMonthRange() {
  const now = new Date();
  return {
    start: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: toIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

function previousMonthRange() {
  const now = new Date();
  return {
    start: toIsoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    end: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
  };
}

function currentYearRange() {
  const now = new Date();
  return {
    start: toIsoDate(new Date(now.getFullYear(), 0, 1)),
    end: toIsoDate(new Date(now.getFullYear(), 11, 31)),
  };
}

export function BalancoReportModule() {
  const supabase = createSupabaseBrowserClient();
  const { selectedWorkspaceId } = useWorkspace();
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [didPreview, setDidPreview] = useState(false);
  const [rows, setRows] = useState<BalanceMonthRow[]>([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
  });

  const saldoPeriodo = rows.reduce((acc, item) => acc + item.saldo, 0);

  useEffect(() => {
    setRows([]);
    setDidPreview(false);
  }, [selectedWorkspaceId]);

  function applyQuickRange(type: "today" | "thisMonth" | "lastMonth" | "thisYear") {
    if (type === "today") {
      const today = toIsoDate(new Date());
      setFilters({ startDate: today, endDate: today });
      return;
    }
    if (type === "thisMonth") {
      const range = currentMonthRange();
      setFilters({ startDate: range.start, endDate: range.end });
      return;
    }
    if (type === "lastMonth") {
      const range = previousMonthRange();
      setFilters({ startDate: range.start, endDate: range.end });
      return;
    }
    const range = currentYearRange();
    setFilters({ startDate: range.start, endDate: range.end });
  }

  function clearFilters() {
    setFilters({ startDate: "", endDate: "" });
    setRows([]);
    setDidPreview(false);
  }

  async function runPreview() {
    setLoadingPreview(true);
    try {
      let revenuesQuery = supabase
        .from("revenues")
        .select("amount, occurred_on, status")
        .eq("status", "pago");
      let expensesQuery = supabase
        .from("expenses")
        .select("amount, occurred_on, status")
        .eq("status", "pago");

      if (selectedWorkspaceId !== "all") {
        revenuesQuery = revenuesQuery.eq("workspace_id", selectedWorkspaceId);
        expensesQuery = expensesQuery.eq("workspace_id", selectedWorkspaceId);
      }
      if (filters.startDate) {
        revenuesQuery = revenuesQuery.gte("occurred_on", filters.startDate);
        expensesQuery = expensesQuery.gte("occurred_on", filters.startDate);
      }
      if (filters.endDate) {
        revenuesQuery = revenuesQuery.lte("occurred_on", filters.endDate);
        expensesQuery = expensesQuery.lte("occurred_on", filters.endDate);
      }

      const [{ data: revenues, error: revenuesError }, { data: expenses, error: expensesError }] =
        await Promise.all([revenuesQuery, expensesQuery]);

      if (revenuesError || expensesError) {
        throw new Error(revenuesError?.message ?? expensesError?.message ?? "Erro ao buscar dados.");
      }

      const monthMap = new Map<string, BalanceMonthRow>();
      for (const row of (revenues ?? []) as RevenueBalanceRow[]) {
        const date = new Date(`${row.occurred_on}T00:00:00`);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const entry = monthMap.get(key) ?? {
          monthKey: key,
          monthLabel: monthFormatter.format(new Date(date.getFullYear(), date.getMonth(), 1)),
          totalRecebido: 0,
          totalPago: 0,
          saldo: 0,
        };
        entry.totalRecebido += Number(row.amount);
        entry.saldo = entry.totalRecebido - entry.totalPago;
        monthMap.set(key, entry);
      }

      for (const row of (expenses ?? []) as ExpenseBalanceRow[]) {
        const date = new Date(`${row.occurred_on}T00:00:00`);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const entry = monthMap.get(key) ?? {
          monthKey: key,
          monthLabel: monthFormatter.format(new Date(date.getFullYear(), date.getMonth(), 1)),
          totalRecebido: 0,
          totalPago: 0,
          saldo: 0,
        };
        entry.totalPago += Number(row.amount);
        entry.saldo = entry.totalRecebido - entry.totalPago;
        monthMap.set(key, entry);
      }

      const grouped = Array.from(monthMap.values()).sort((a, b) =>
        b.monthKey.localeCompare(a.monthKey),
      );

      setRows(grouped);
      setDidPreview(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar pré-visualização.");
    } finally {
      setLoadingPreview(false);
    }
  }

  function handleExportPdf() {
    if (!didPreview) {
      toast.info("Gere a pré-visualização antes de exportar.");
      return;
    }

    window.print();
  }

  function handleExportExcel() {
    if (!didPreview || rows.length === 0) {
      toast.info("Não há dados para exportar.");
      return;
    }

    const exportRows = rows.map((row) => ({
      Mes: row.monthLabel,
      TotalRecebido: Number(row.totalRecebido),
      TotalPago: Number(row.totalPago),
      SaldoLiquido: Number(row.saldo),
    }));

    exportJsonToCsv(exportRows, "relatorio_balanco_lexflow.csv");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 print:hidden">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => applyQuickRange("today")}>
              Hoje
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => applyQuickRange("thisMonth")}>
              Este Mês
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => applyQuickRange("lastMonth")}>
              Mês Passado
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => applyQuickRange("thisYear")}>
              Este Ano
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <Button type="button" variant="ghost" onClick={clearFilters}>
            Limpar Filtros
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={runPreview} disabled={loadingPreview}>
              <Eye className="mr-2 h-4 w-4" />
              Pré-visualizar na Tela
            </Button>
            <Button type="button" onClick={handleExportPdf}>
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
            <Button type="button" onClick={handleExportExcel}>
              <Download className="mr-2 h-4 w-4" />
              Baixar CSV
            </Button>
          </div>
        </div>
      </div>

      {didPreview ? (
        <div className="space-y-3 print:space-y-2">
          <ReportHeader />
          <h2 className="hidden text-lg font-semibold text-zinc-900 print:block">
            Relatório de Balanço
          </h2>
          <p className="text-sm text-zinc-500">
            Saldo do Período:{" "}
            <span className={`font-semibold ${saldoPeriodo >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {currencyFormatter.format(saldoPeriodo)}
            </span>
          </p>

          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">Mês</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">Total Recebido</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">Total Pago</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">Saldo Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPreview ? (
                    <tr>
                      <td className="px-3 py-8 text-center text-zinc-500" colSpan={4}>
                        Carregando pré-visualização...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-8 text-center text-zinc-500" colSpan={4}>
                        Nenhum registro encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.monthKey} className="border-b border-zinc-200 last:border-b-0">
                        <td className="px-3 py-2 text-zinc-700 capitalize">{row.monthLabel}</td>
                        <td className="px-3 py-2 text-zinc-700">{currencyFormatter.format(row.totalRecebido)}</td>
                        <td className="px-3 py-2 text-zinc-700">{currencyFormatter.format(row.totalPago)}</td>
                        <td className={`px-3 py-2 font-medium ${row.saldo >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {currencyFormatter.format(row.saldo)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
