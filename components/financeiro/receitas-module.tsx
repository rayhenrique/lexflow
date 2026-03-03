"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { AlertCircle, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { FormularioReceita } from "@/components/financeiro/formulario-receita";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  conciliateRevenueStatus,
  createRevenueRecord,
  fetchClients,
  fetchRevenueClassifications,
  fetchRevenues,
} from "@/lib/modules/cadastros-financeiro-service";
import type { RevenueRecord } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function ReceitasModule() {
  const supabase = createSupabaseBrowserClient();
  const { selectedWorkspaceId, workspaces } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"todos" | "pago" | "pendente" | "cancelado">(
    "todos",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingRevenue, setEditingRevenue] = useState<RevenueRecord | null>(null);
  const [deleteRevenue, setDeleteRevenue] = useState<RevenueRecord | null>(null);
  const [conciliateRevenue, setConciliateRevenue] = useState<RevenueRecord | null>(null);
  const [conciliateStatus, setConciliateStatus] = useState<"pendente" | "pago" | "cancelado">("pendente");
  const [conciliatePaidOn, setConciliatePaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [conciliateReason, setConciliateReason] = useState("");
  const [conciliating, setConciliating] = useState(false);
  const itemsPerPage = 10;

  const revenueClassifications = useSWR(
    ["revenue-classifications-fin", selectedWorkspaceId],
    ([, workspaceScope]) => fetchRevenueClassifications(supabase, workspaceScope),
  );
  const revenues = useSWR(["revenues", selectedWorkspaceId], ([, workspaceScope]) =>
    fetchRevenues(supabase, workspaceScope),
  );
  const clients = useSWR(["clients-fin", selectedWorkspaceId], ([, workspaceScope]) =>
    fetchClients(supabase, workspaceScope),
  );

  const hasLoading =
    revenueClassifications.isLoading || revenues.isLoading || clients.isLoading;
  const hasFetchError = revenueClassifications.error || revenues.error || clients.error;
  const classMap = useMemo(
    () =>
      new Map((revenueClassifications.data ?? []).map((item) => [item.id, item.name])),
    [revenueClassifications.data],
  );
  const clientsMap = useMemo(
    () => new Map((clients.data ?? []).map((item) => [item.id, item.name])),
    [clients.data],
  );

  async function handleSubmit(payload: {
    workspaceId: string;
    clientId: string | null;
    description: string;
    amount: number;
    occurredOn: string;
      classificationId: string;
      status: "pendente" | "pago" | "cancelado";
      notes?: string;
  }) {
    setSaving(true);
    setFormError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Sessão inválida.");
      }

      if (editingRevenue) {
        const { error } = await supabase
          .from("revenues")
          .update({
            workspace_id: payload.workspaceId,
            client_id: payload.clientId ?? null,
            description: payload.description,
            amount: payload.amount,
            occurred_on: payload.occurredOn,
            classification_id: payload.classificationId,
            notes: payload.notes || null,
          })
          .eq("id", editingRevenue.id);
        if (error) throw new Error(error.message);
        toast.success("Receita atualizada com sucesso.");
      } else {
        await createRevenueRecord(supabase, {
          ...payload,
          userId: user.id,
        });
        toast.success("Receita criada com sucesso.");
      }

      await revenues.mutate();
      setOpen(false);
      setEditingRevenue(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Erro ao salvar receita.");
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteRevenue) {
      return;
    }

    try {
      const { error } = await supabase.from("revenues").delete().eq("id", deleteRevenue.id);
      if (error) throw new Error(error.message);
      toast.success("Receita excluída com sucesso.");
      await revenues.mutate();
      setDeleteRevenue(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir receita.");
    }
  }

  async function handleConciliationSubmit() {
    if (!conciliateRevenue) return;

    try {
      setConciliating(true);
      await conciliateRevenueStatus(conciliateRevenue.id, {
        targetStatus: conciliateStatus,
        paidOn: conciliateStatus === "pago" ? conciliatePaidOn : undefined,
        canceledReason: conciliateStatus === "cancelado" ? conciliateReason : undefined,
      });
      toast.success("Status conciliado com sucesso.");
      await revenues.mutate();
      setConciliateRevenue(null);
      setConciliateReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao conciliar status.");
    } finally {
      setConciliating(false);
    }
  }

  const statusFilteredRows =
    statusFilter === "todos"
      ? revenues.data ?? []
      : (revenues.data ?? []).filter((item) => item.status === statusFilter);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredRows = statusFilteredRows.filter((item) => {
    if (!normalizedSearch) {
      return true;
    }

    const clientName = clientsMap.get(item.client_id ?? "") ?? "";
    const classificationName = classMap.get(item.classification_id) ?? "";

    return (
      item.description.toLowerCase().includes(normalizedSearch) ||
      clientName.toLowerCase().includes(normalizedSearch) ||
      classificationName.toLowerCase().includes(normalizedSearch)
    );
  });
  const totalAmount = filteredRows.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalResults = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, endIndex);
  const showingFrom = totalResults === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalResults);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, selectedWorkspaceId]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (hasLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (hasFetchError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar receitas</AlertTitle>
        <AlertDescription>
          {(revenueClassifications.error || revenues.error || clients.error)?.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={statusFilter}
        onValueChange={(value) =>
          setStatusFilter(value as "todos" | "pago" | "pendente" | "cancelado")
        }
      >
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="pago">Realizado</TabsTrigger>
          <TabsTrigger value="pendente">Previsto</TabsTrigger>
          <TabsTrigger value="cancelado">Cancelado</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por descrição..."
            className="pl-9"
          />
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setEditingRevenue(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Receita
        </Button>
      </div>

      <div className="flex items-center justify-end">
        <p className="text-sm text-zinc-500">
          Total da seleção:{" "}
          <span className="font-semibold text-zinc-900">
            {currencyFormatter.format(totalAmount)}
          </span>
        </p>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Data</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Descrição</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Cliente</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Classificação</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Status</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">Valor</th>
                <th className="px-3 py-2 text-right font-medium text-zinc-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-zinc-500">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-200 last:border-b-0">
                    <td className="px-3 py-2 text-zinc-700">{item.occurred_on}</td>
                    <td className="px-3 py-2 text-zinc-700">{item.description}</td>
                    <td className="px-3 py-2 text-zinc-700">
                      {clientsMap.get(item.client_id ?? "") ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-zinc-700">
                      {classMap.get(item.classification_id) ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-zinc-700">
                      <Badge variant={item.status}>{item.status}</Badge>
                    </td>
                    <td className="px-3 py-2 text-zinc-700">
                      {currencyFormatter.format(item.amount)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setConciliateRevenue(item);
                              setConciliateStatus(item.status);
                              setConciliatePaidOn(item.paid_on ?? new Date().toISOString().slice(0, 10));
                              setConciliateReason(item.canceled_reason ?? "");
                            }}
                          >
                            Conciliar status
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingRevenue(item);
                              setOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeleteRevenue(item)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      <Sheet
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) {
            setEditingRevenue(null);
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingRevenue ? "Editar Receita" : "Nova Receita"}</SheetTitle>
            <SheetDescription>
              {editingRevenue
                ? "Atualize os dados da receita selecionada."
                : "Cadastre uma receita sem sair do contexto da tabela."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-5">
            <FormularioReceita
              selectedWorkspaceId={selectedWorkspaceId}
              workspaces={workspaces}
              classifications={revenueClassifications.data ?? []}
              clients={clients.data ?? []}
              loading={saving}
              initialData={editingRevenue}
              statusReadonly={Boolean(editingRevenue)}
              onSubmit={handleSubmit}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={Boolean(conciliateRevenue)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setConciliateRevenue(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conciliar status da receita</DialogTitle>
            <DialogDescription>
              Atualize o status com rastreabilidade de pagamento e cancelamento.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Status de destino</Label>
              <Select
                value={conciliateStatus}
                onValueChange={(value) =>
                  setConciliateStatus(value as "pendente" | "pago" | "cancelado")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {conciliateStatus === "pago" ? (
              <div className="space-y-2">
                <Label>Data de pagamento</Label>
                <Input
                  type="date"
                  value={conciliatePaidOn}
                  onChange={(event) => setConciliatePaidOn(event.target.value)}
                />
              </div>
            ) : null}

            {conciliateStatus === "cancelado" ? (
              <div className="space-y-2">
                <Label>Motivo do cancelamento (opcional)</Label>
                <Textarea
                  value={conciliateReason}
                  onChange={(event) => setConciliateReason(event.target.value)}
                />
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConciliateRevenue(null)}
                disabled={conciliating}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={handleConciliationSubmit} disabled={conciliating}>
                {conciliating ? "Salvando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteRevenue)}
        onOpenChange={(open) => !open && setDeleteRevenue(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absolutamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso excluirá permanentemente este registro do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
