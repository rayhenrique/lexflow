"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { AlertCircle, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { FormularioDespesa } from "@/components/financeiro/formulario-despesa";
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
  createExpenseRecord,
  fetchClients,
  fetchExpenseClassifications,
  fetchExpenses,
} from "@/lib/modules/cadastros-financeiro-service";
import type { ExpenseRecord } from "@/lib/types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function DespesasModule() {
  const supabase = createSupabaseBrowserClient();
  const { selectedWorkspaceId, workspaces } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"todos" | "pago" | "pendente">(
    "todos",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<ExpenseRecord | null>(null);
  const itemsPerPage = 10;

  const expenseClassifications = useSWR(
    ["expense-classifications-fin", selectedWorkspaceId],
    ([, workspaceScope]) => fetchExpenseClassifications(supabase, workspaceScope),
  );
  const expenses = useSWR(["expenses", selectedWorkspaceId], ([, workspaceScope]) =>
    fetchExpenses(supabase, workspaceScope),
  );
  const clients = useSWR(["clients-fin", selectedWorkspaceId], ([, workspaceScope]) =>
    fetchClients(supabase, workspaceScope),
  );

  const hasLoading =
    expenseClassifications.isLoading || expenses.isLoading || clients.isLoading;
  const hasFetchError = expenseClassifications.error || expenses.error || clients.error;
  const classMap = useMemo(
    () =>
      new Map((expenseClassifications.data ?? []).map((item) => [item.id, item.name])),
    [expenseClassifications.data],
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

      if (editingExpense) {
        const { error } = await supabase
          .from("expenses")
          .update({
            workspace_id: payload.workspaceId,
            client_id: payload.clientId ?? null,
            description: payload.description,
            amount: payload.amount,
            occurred_on: payload.occurredOn,
            status: payload.status,
            classification_id: payload.classificationId,
            notes: payload.notes || null,
          })
          .eq("id", editingExpense.id);
        if (error) throw new Error(error.message);
        toast.success("Despesa atualizada com sucesso.");
      } else {
        await createExpenseRecord(supabase, {
          ...payload,
          userId: user.id,
        });
        toast.success("Despesa criada com sucesso.");
      }

      await expenses.mutate();
      setOpen(false);
      setEditingExpense(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Erro ao salvar despesa.");
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteExpense) {
      return;
    }

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", deleteExpense.id);
      if (error) throw new Error(error.message);
      toast.success("Despesa excluída com sucesso.");
      await expenses.mutate();
      setDeleteExpense(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir despesa.");
    }
  }

  const statusFilteredRows =
    statusFilter === "todos"
      ? expenses.data ?? []
      : (expenses.data ?? []).filter((item) => item.status === statusFilter);
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
        <AlertTitle>Erro ao carregar despesas</AlertTitle>
        <AlertDescription>
          {(expenseClassifications.error || expenses.error || clients.error)?.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={statusFilter}
        onValueChange={(value) =>
          setStatusFilter(value as "todos" | "pago" | "pendente")
        }
      >
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="pago">Realizado</TabsTrigger>
          <TabsTrigger value="pendente">Previsto</TabsTrigger>
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
            setEditingExpense(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Despesa
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
                              setEditingExpense(item);
                              setOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeleteExpense(item)}
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
            setEditingExpense(null);
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingExpense ? "Editar Despesa" : "Nova Despesa"}</SheetTitle>
            <SheetDescription>
              {editingExpense
                ? "Atualize os dados da despesa selecionada."
                : "Cadastre uma despesa sem sair do contexto da tabela."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-5">
            <FormularioDespesa
              selectedWorkspaceId={selectedWorkspaceId}
              workspaces={workspaces}
              classifications={expenseClassifications.data ?? []}
              clients={clients.data ?? []}
              loading={saving}
              initialData={editingExpense}
              onSubmit={handleSubmit}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(deleteExpense)}
        onOpenChange={(open) => !open && setDeleteExpense(null)}
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
