"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Eye, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  type AuditAction,
  type AuditLogItem,
  fetchAuditLogs,
} from "@/lib/admin/fetch-audit-logs";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "medium",
});

function renderActionBadge(action: AuditAction) {
  if (action === "INSERT") {
    return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">INSERT</Badge>;
  }

  if (action === "UPDATE") {
    return <Badge className="border-blue-200 bg-blue-50 text-blue-700">UPDATE</Badge>;
  }

  return <Badge className="border-rose-200 bg-rose-50 text-rose-700">DELETE</Badge>;
}

function JsonBlock({ value }: { value: Record<string, unknown> | null }) {
  if (!value) {
    return <p className="text-sm text-zinc-500">Sem dados.</p>;
  }

  return (
    <pre className="max-h-72 overflow-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
      <code>{JSON.stringify(value, null, 2)}</code>
    </pre>
  );
}

export function AuditoriaModule() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { selectedWorkspaceId } = useWorkspace();
  const [tableFilter, setTableFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState<"all" | AuditAction>("all");
  const [isCleaning, setIsCleaning] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const pageSize = 15;

  const { data, error, isLoading, mutate } = useSWR(
    ["audit-logs", selectedWorkspaceId, tableFilter, actionFilter, page, pageSize],
    async ([, workspaceId, tableName, action, currentPage, currentPageSize]) =>
      fetchAuditLogs(supabase, {
        workspaceId,
        tableName,
        action,
        page: currentPage,
        pageSize: currentPageSize,
      }),
  );

  async function handleCleanupOldLogs() {
    setIsCleaning(true);
    try {
      const limite = new Date();
      limite.setDate(limite.getDate() - 30);

      let cleanupQuery = supabase.from("audit_logs").delete().lt("created_at", limite.toISOString());

      if (selectedWorkspaceId !== "all") {
        cleanupQuery = cleanupQuery.eq("workspace_id", selectedWorkspaceId);
      }

      const { error: cleanupError } = await cleanupQuery;

      if (cleanupError) {
        throw new Error(cleanupError.message);
      }

      toast.success("Limpeza concluída com sucesso");
      setPage(1);
      await mutate();
    } catch (cleanupError) {
      toast.error(
        cleanupError instanceof Error
          ? cleanupError.message
          : "Não foi possível concluir a limpeza dos logs.",
      );
    } finally {
      setIsCleaning(false);
    }
  }

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  const tableOptions = [
    { value: "all", label: "Todas as tabelas" },
    { value: "clients", label: "clients" },
    { value: "revenues", label: "revenues" },
    { value: "expenses", label: "expenses" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro ao carregar auditoria</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-64">
            <Select
              value={tableFilter}
              onValueChange={(value) => {
                setPage(1);
                setTableFilter(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar tabela" />
              </SelectTrigger>
              <SelectContent>
                {tableOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-56">
            <Select
              value={actionFilter}
              onValueChange={(value: "all" | AuditAction) => {
                setPage(1);
                setActionFilter(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="INSERT">INSERT</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-2 lg:w-auto lg:items-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full border-zinc-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 lg:w-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Logs Antigos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar logs antigos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação apagará os registros com mais de 30 dias de idade que ainda não foram
                  excluídos pela limpeza automática de 90 dias. Deseja continuar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCleanupOldLogs} disabled={isCleaning}>
                  {isCleaning ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <p
            className="text-xs text-zinc-500"
            title="O sistema retém automaticamente 90 dias. Logs dos últimos 30 dias são imutáveis."
          >
            O sistema retém automaticamente 90 dias. Logs dos últimos 30 dias são imutáveis.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Data/Hora</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Usuário</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Tabela</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Ação</th>
                <th className="px-3 py-2 text-right font-medium text-zinc-600">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-8 text-center text-zinc-500" colSpan={5}>
                    Nenhum log encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-200 last:border-b-0">
                    <td className="px-3 py-2 text-zinc-700">
                      {dateTimeFormatter.format(new Date(row.created_at))}
                    </td>
                    <td className="px-3 py-2 text-zinc-700">{row.user_display}</td>
                    <td className="px-3 py-2 text-zinc-700">{row.table_name}</td>
                    <td className="px-3 py-2 text-zinc-700">{renderActionBadge(row.action)}</td>
                    <td className="px-3 py-2 text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedLog(row)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col items-stretch justify-between gap-3 px-2 py-1 sm:flex-row sm:items-center">
        <p className="text-sm text-zinc-500">
          Mostrando {start} a {end} de {total} resultados
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={safePage <= 1}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={safePage >= totalPages}
          >
            Próximo
          </Button>
        </div>
      </div>

      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Auditoria</DialogTitle>
            <DialogDescription>
              Registro {selectedLog?.table_name} ({selectedLog?.action})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-900">old_data</p>
              <JsonBlock value={selectedLog?.old_data ?? null} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-900">new_data</p>
              <JsonBlock value={selectedLog?.new_data ?? null} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
