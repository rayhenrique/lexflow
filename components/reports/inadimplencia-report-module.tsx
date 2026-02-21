"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { exportJsonToCsv } from "@/lib/reports/export-utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { fetchClients } from "@/lib/modules/cadastros-financeiro-service";
import { cn } from "@/lib/utils";

interface OverdueRow {
  id: string;
  occurred_on: string;
  description: string;
  amount: number;
  client_id: string | null;
  clients: Array<{ name: string }> | null;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR");

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function diffDays(dateIso: string) {
  const dueDate = new Date(`${dateIso}T00:00:00`);
  const diff = startOfToday().getTime() - dueDate.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
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

export function InadimplenciaReportModule() {
  const supabase = createSupabaseBrowserClient();
  const { selectedWorkspaceId } = useWorkspace();
  const [clientOpen, setClientOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [didPreview, setDidPreview] = useState(false);
  const [rows, setRows] = useState<OverdueRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    clientId: "all",
  });

  const clientsQuery = useMemo(
    () => ["report-inadimplencia-clients", selectedWorkspaceId] as const,
    [selectedWorkspaceId],
  );

  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingBase, setLoadingBase] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingBase(true);
    fetchClients(supabase, clientsQuery[1])
      .then((clientsData) => {
        if (!active) return;
        setClients(clientsData.map((item) => ({ id: item.id, name: item.name })));
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Erro ao carregar filtros.");
      })
      .finally(() => {
        if (active) setLoadingBase(false);
      });

    return () => {
      active = false;
    };
  }, [supabase, clientsQuery]);

  const selectedClient = clients.find((item) => item.id === filters.clientId);
  const totalResults = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRows = rows.slice(startIndex, endIndex);
  const showingFrom = totalResults === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalResults);

  useEffect(() => {
    setCurrentPage(1);
  }, [rows]);

  function applyQuickRange(type: "today" | "thisMonth" | "lastMonth" | "thisYear") {
    if (type === "today") {
      const today = toIsoDate(new Date());
      setFilters((prev) => ({ ...prev, startDate: today, endDate: today }));
      return;
    }
    if (type === "thisMonth") {
      const range = currentMonthRange();
      setFilters((prev) => ({ ...prev, startDate: range.start, endDate: range.end }));
      return;
    }
    if (type === "lastMonth") {
      const range = previousMonthRange();
      setFilters((prev) => ({ ...prev, startDate: range.start, endDate: range.end }));
      return;
    }
    const range = currentYearRange();
    setFilters((prev) => ({ ...prev, startDate: range.start, endDate: range.end }));
  }

  function clearFilters() {
    setFilters({ startDate: "", endDate: "", clientId: "all" });
    setRows([]);
    setDidPreview(false);
  }

  async function runPreview() {
    setLoadingPreview(true);
    try {
      const today = toIsoDate(startOfToday());
      let query = supabase
        .from("revenues")
        .select("id, occurred_on, description, amount, client_id, clients(name)")
        .eq("status", "pendente")
        .lt("occurred_on", today)
        .order("occurred_on", { ascending: true });

      if (selectedWorkspaceId !== "all") {
        query = query.eq("workspace_id", selectedWorkspaceId);
      }
      if (filters.startDate) query = query.gte("occurred_on", filters.startDate);
      if (filters.endDate) query = query.lte("occurred_on", filters.endDate);
      if (filters.clientId !== "all") query = query.eq("client_id", filters.clientId);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      setRows((data ?? []) as OverdueRow[]);
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
      Vencimento: dateFormatter.format(new Date(`${row.occurred_on}T00:00:00`)),
      Descricao: row.description,
      Cliente: row.clients?.[0]?.name ?? "-",
      Valor: Number(row.amount),
      DiasAtraso: diffDays(row.occurred_on),
    }));

    exportJsonToCsv(exportRows, "relatorio_inadimplencia_lexflow.csv");
  }

  if (loadingBase) {
    return <Skeleton className="h-72 w-full" />;
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

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Popover open={clientOpen} onOpenChange={setClientOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between font-normal">
                    {filters.clientId === "all"
                      ? "Selecione um cliente..."
                      : (selectedClient?.name ?? "Selecione um cliente...")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="Todos os clientes"
                          onSelect={() => {
                            setFilters((prev) => ({ ...prev, clientId: "all" }));
                            setClientOpen(false);
                          }}
                        >
                          <Check
                            className={cn("mr-2 h-4 w-4", filters.clientId === "all" ? "opacity-100" : "opacity-0")}
                          />
                          Todos
                        </CommandItem>
                        {clients.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={client.name}
                            onSelect={() => {
                              setFilters((prev) => ({ ...prev, clientId: client.id }));
                              setClientOpen(false);
                            }}
                          >
                            <Check
                              className={cn("mr-2 h-4 w-4", filters.clientId === client.id ? "opacity-100" : "opacity-0")}
                            />
                            {client.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">Vencimento</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">Descrição</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">Cliente</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">Valor</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">Atraso</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPreview ? (
                    <tr>
                      <td className="px-3 py-8 text-center text-zinc-500" colSpan={5}>
                        Carregando pré-visualização...
                      </td>
                    </tr>
                  ) : paginatedRows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-8 text-center text-zinc-500" colSpan={5}>
                        Nenhum registro encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => (
                      <tr key={row.id} className="border-b border-zinc-200 last:border-b-0">
                        <td className="px-3 py-2 text-zinc-700">
                          {dateFormatter.format(new Date(`${row.occurred_on}T00:00:00`))}
                        </td>
                        <td className="px-3 py-2 text-zinc-700">{row.description}</td>
                        <td className="px-3 py-2 text-zinc-700">{row.clients?.[0]?.name ?? "-"}</td>
                        <td className="px-3 py-2 text-zinc-700">{currencyFormatter.format(Number(row.amount))}</td>
                        <td className="px-3 py-2 text-zinc-700">
                          <Badge className="border-rose-200 bg-rose-50 text-rose-700">
                            {diffDays(row.occurred_on)} dia(s)
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col items-stretch justify-between gap-3 px-2 py-1 sm:flex-row sm:items-center print:hidden">
            <p className="text-sm text-zinc-500">
              Mostrando {showingFrom} a {showingTo} de {totalResults} resultados
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safeCurrentPage <= 1}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safeCurrentPage >= totalPages}
              >
                Próximo
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
