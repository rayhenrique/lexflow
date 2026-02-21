"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { AlertCircle, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { FormularioCategoria } from "@/components/cadastros/formulario-categoria";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  createExpenseClassification,
  createRevenueClassification,
  fetchExpenseClassifications,
  fetchRevenueClassifications,
} from "@/lib/modules/cadastros-financeiro-service";
import type { ClassificationRecord } from "@/lib/types";

interface CategoriaRow extends ClassificationRecord {
  tipo: "receita" | "despesa";
}

export function CategoriasModule() {
  const supabase = createSupabaseBrowserClient();
  const { selectedWorkspaceId, workspaces } = useWorkspace();
  const [tab, setTab] = useState<"receitas" | "despesas">("receitas");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaRow | null>(null);
  const [deleteCategoria, setDeleteCategoria] = useState<CategoriaRow | null>(null);
  const itemsPerPage = 10;

  const receitas = useSWR(["cats-receitas", selectedWorkspaceId], ([, workspaceScope]) =>
    fetchRevenueClassifications(supabase, workspaceScope),
  );
  const despesas = useSWR(["cats-despesas", selectedWorkspaceId], ([, workspaceScope]) =>
    fetchExpenseClassifications(supabase, workspaceScope),
  );

  async function handleSubmit(payload: {
    workspaceId: string;
    name: string;
    description?: string;
    active: boolean;
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

      const currentType = editingCategoria?.tipo ?? (tab === "receitas" ? "receita" : "despesa");

      if (currentType === "receita") {
        if (editingCategoria) {
          const { error } = await supabase
            .from("revenue_classifications")
            .update({
              workspace_id: payload.workspaceId,
              name: payload.name,
              description: payload.description || null,
              active: payload.active,
            })
            .eq("id", editingCategoria.id);
          if (error) throw new Error(error.message);
          toast.success("Categoria de receita atualizada com sucesso.");
        } else {
          await createRevenueClassification(supabase, {
            ...payload,
            userId: user.id,
          });
          toast.success("Categoria de receita criada com sucesso.");
        }
      } else {
        if (editingCategoria) {
          const { error } = await supabase
            .from("expense_classifications")
            .update({
              workspace_id: payload.workspaceId,
              name: payload.name,
              description: payload.description || null,
              active: payload.active,
            })
            .eq("id", editingCategoria.id);
          if (error) throw new Error(error.message);
          toast.success("Categoria de despesa atualizada com sucesso.");
        } else {
          await createExpenseClassification(supabase, {
            ...payload,
            userId: user.id,
          });
          toast.success("Categoria de despesa criada com sucesso.");
        }
      }

      await receitas.mutate();
      await despesas.mutate();
      setOpen(false);
      setEditingCategoria(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Erro ao salvar categoria.");
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteCategoria) {
      return;
    }

    try {
      const tableName =
        deleteCategoria.tipo === "receita"
          ? "revenue_classifications"
          : "expense_classifications";
      const { error } = await supabase.from(tableName).delete().eq("id", deleteCategoria.id);
      if (error) throw new Error(error.message);

      toast.success("Categoria excluída com sucesso.");
      await receitas.mutate();
      await despesas.mutate();
      setDeleteCategoria(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir categoria.");
    }
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredReceitas: CategoriaRow[] = (receitas.data ?? [])
    .filter((item) => {
      if (!normalizedSearch) {
        return true;
      }
      return (
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.code.toLowerCase().includes(normalizedSearch)
      );
    })
    .map((item) => ({ ...item, tipo: "receita" }));
  const filteredDespesas: CategoriaRow[] = (despesas.data ?? [])
    .filter((item) => {
      if (!normalizedSearch) {
        return true;
      }
      return (
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.code.toLowerCase().includes(normalizedSearch)
      );
    })
    .map((item) => ({ ...item, tipo: "despesa" }));
  const activeRows = tab === "receitas" ? filteredReceitas : filteredDespesas;
  const totalResults = activeRows.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRows = activeRows.slice(startIndex, endIndex);
  const showingFrom = totalResults === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalResults);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, searchTerm, selectedWorkspaceId]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (receitas.isLoading || despesas.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (receitas.error || despesas.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar categorias</AlertTitle>
        <AlertDescription>{(receitas.error || despesas.error)?.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-start">
        <Tabs value={tab} onValueChange={(value) => setTab(value as "receitas" | "despesas")}>
          <TabsList>
            <TabsTrigger value="receitas">Receitas</TabsTrigger>
            <TabsTrigger value="despesas">Despesas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nome ou código..."
            className="pl-9"
          />
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setEditingCategoria(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs value={tab} onValueChange={(value) => setTab(value as "receitas" | "despesas")}>
        <TabsContent value="receitas">
          <TableCategorias
            rows={tab === "receitas" ? paginatedRows : []}
            onEdit={(row) => {
              setEditingCategoria(row);
              setTab(row.tipo === "receita" ? "receitas" : "despesas");
              setOpen(true);
            }}
            onDelete={setDeleteCategoria}
          />
        </TabsContent>
        <TabsContent value="despesas">
          <TableCategorias
            rows={tab === "despesas" ? paginatedRows : []}
            onEdit={(row) => {
              setEditingCategoria(row);
              setTab(row.tipo === "receita" ? "receitas" : "despesas");
              setOpen(true);
            }}
            onDelete={setDeleteCategoria}
          />
        </TabsContent>
      </Tabs>

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

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) {
            setEditingCategoria(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategoria
                ? `Editar Categoria de ${editingCategoria.tipo === "receita" ? "Receita" : "Despesa"}`
                : `Nova Categoria de ${tab === "receitas" ? "Receita" : "Despesa"}`}
            </DialogTitle>
            <DialogDescription>
              {editingCategoria
                ? "Atualize os dados da categoria selecionada."
                : "Cadastre uma categoria para classificar os lançamentos financeiros."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <FormularioCategoria
              tipo={editingCategoria?.tipo ?? (tab === "receitas" ? "receita" : "despesa")}
              selectedWorkspaceId={selectedWorkspaceId}
              workspaces={workspaces}
              loading={saving}
              initialData={editingCategoria}
              onSubmit={handleSubmit}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteCategoria)}
        onOpenChange={(open) => !open && setDeleteCategoria(null)}
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

function TableCategorias({
  rows,
  onEdit,
  onDelete,
}: {
  rows: CategoriaRow[];
  onEdit: (row: CategoriaRow) => void;
  onDelete: (row: CategoriaRow) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-zinc-600">Código</th>
              <th className="px-3 py-2 text-left font-medium text-zinc-600">Nome</th>
              <th className="px-3 py-2 text-left font-medium text-zinc-600">Ativo</th>
              <th className="px-3 py-2 text-right font-medium text-zinc-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-zinc-500">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-200 last:border-b-0">
                  <td className="px-3 py-2 text-zinc-700">{row.code}</td>
                  <td className="px-3 py-2 text-zinc-700">{row.name}</td>
                  <td className="px-3 py-2 text-zinc-700">{row.active ? "Sim" : "Não"}</td>
                  <td className="px-3 py-2 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onEdit(row)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => onDelete(row)}
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
  );
}
